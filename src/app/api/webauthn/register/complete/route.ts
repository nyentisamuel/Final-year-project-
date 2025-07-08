import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebAuthnRegistration } from "@/lib/webauthn";
import { verifyBiometricAuthenticity } from "@/lib/ai-verification";

export async function POST(request: NextRequest) {
  try {
    const { voterId, response } = await request.json();

    if (!voterId || !response) {
      return NextResponse.json(
        { error: "Voter ID and response are required" },
        { status: 400 },
      );
    }

    // Find the voter and challenge
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Get the challenge
    const challenge = await prisma.webAuthnChallenge.findFirst({
      where: {
        userID: voter.id,
        type: "registration",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "No valid challenge found" },
        { status: 400 },
      );
    }

    // Verify the registration response
    const verification = await verifyWebAuthnRegistration(
      response,
      challenge.challenge,
    );

    if (!verification.verified || !verification.registrationInfo) {
      // Log failed verification
      await prisma.verificationLog.create({
        data: {
          userID: voter.id,
          method: "webauthn_registration",
          success: false,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(
        { error: "Registration verification failed" },
        { status: 400 },
      );
    }

    // AI verification of biometric authenticity
    const aiVerification = await verifyBiometricAuthenticity({
      method: "webauthn_registration",
      userAgent: request.headers.get("user-agent") || "unknown",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      timestamp: new Date().toISOString(),
      credentialData: {
        credentialID: verification.registrationInfo.credentialID,
        counter: verification.registrationInfo.counter,
        deviceType: "platform",
      },
    });

    // Store the authenticator
    const { credentialID, credentialPublicKey, counter } =
      verification.registrationInfo;

    await prisma.authenticator.create({
      data: {
        userID: voter.id,
        credentialID: Buffer.from(credentialID).toString("base64url"),
        credentialPublicKey: Buffer.from(credentialPublicKey),
        counter: counter,
        transports: response.response.transports || ["internal"],
      },
    });

    // Clean up challenge
    await prisma.webAuthnChallenge.delete({
      where: { id: challenge.id },
    });

    // Log successful verification
    await prisma.verificationLog.create({
      data: {
        userID: voter.id,
        method: "webauthn_registration",
        success: true,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || "unknown",
        aiVerification: aiVerification,
      },
    });

    // Create security alert if AI detected risks
    if (
      aiVerification.riskLevel === "high" ||
      aiVerification.riskLevel === "critical"
    ) {
      await prisma.securityAlert.create({
        data: {
          userID: voter.id,
          type: "suspicious_registration",
          severity: aiVerification.riskLevel,
          description: `High-risk WebAuthn registration detected: ${aiVerification.recommendation}`,
          metadata: {
            confidence: aiVerification.confidence,
            riskFactors: aiVerification.riskFactors,
            aiAnalysis: aiVerification.aiAnalysis,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      verified: verification.verified,
      aiVerification,
    });
  } catch (error) {
    console.error("WebAuthn registration complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete registration" },
      { status: 500 },
    );
  }
}
