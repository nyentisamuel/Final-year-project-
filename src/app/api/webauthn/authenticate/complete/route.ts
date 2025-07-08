import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebAuthnAuthentication } from "@/lib/webauthn";
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
      include: {
        authenticators: true,
      },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Get the challenge
    const challenge = await prisma.webAuthnChallenge.findFirst({
      where: {
        userID: voter.id,
        type: "authentication",
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

    // Find the authenticator used
    const credentialID = response.id;
    const authenticator = voter.authenticators.find(
      (auth) => auth.credentialID === credentialID,
    );

    if (!authenticator) {
      return NextResponse.json(
        { error: "Authenticator not found" },
        { status: 400 },
      );
    }

    // Convert to expected format
    const storedAuthenticator = {
      id: authenticator.id,
      credentialID: authenticator.credentialID,
      credentialPublicKey: new Uint8Array(authenticator.credentialPublicKey),
      counter: authenticator.counter,
      transports: authenticator.transports,
    };

    // Verify the authentication response
    const verification = await verifyWebAuthnAuthentication(
      response,
      challenge.challenge,
      storedAuthenticator,
    );

    if (!verification.verified || !verification.authenticationInfo) {
      // Log failed verification
      await prisma.verificationLog.create({
        data: {
          userID: voter.id,
          method: "webauthn_authentication",
          success: false,
          ipAddress: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        },
      });

      return NextResponse.json(
        { error: "Authentication verification failed" },
        { status: 400 },
      );
    }

    // AI verification of biometric authenticity
    const aiVerification = await verifyBiometricAuthenticity({
      method: "webauthn_authentication",
      userAgent: request.headers.get("user-agent") || "unknown",
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      timestamp: new Date().toISOString(),
      credentialData: {
        credentialID: authenticator.credentialID,
        counter: verification.authenticationInfo.newCounter,
        deviceType: "platform",
      },
      previousAuthentications: await prisma.verificationLog.findMany({
        where: {
          userID: voter.id,
          method: "webauthn_authentication",
          success: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    });

    // Update authenticator counter
    await prisma.authenticator.update({
      where: { id: authenticator.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        updatedAt: new Date(),
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
        method: "webauthn_authentication",
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
          type: "suspicious_authentication",
          severity: aiVerification.riskLevel,
          description: `High-risk WebAuthn authentication detected: ${aiVerification.recommendation}`,
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
      voter: {
        id: voter.id,
        name: voter.name,
        hasVoted: voter.hasVoted,
      },
      aiVerification,
    });
  } catch (error) {
    console.error("WebAuthn authentication complete error:", error);
    return NextResponse.json(
      { error: "Failed to complete authentication" },
      { status: 500 },
    );
  }
}
