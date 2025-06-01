import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyFingerprint } from "@/lib/ai-verification";

export async function POST(req: Request) {
  try {
    const { fingerprintId } = await req.json();

    if (!fingerprintId) {
      return NextResponse.json(
        { error: "Fingerprint ID is required" },
        { status: 400 },
      );
    }

    // Find voter in database
    const voter = await prisma.voter.findUnique({
      where: { fingerprintId },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Perform AI-based verification
    const verificationResult = await verifyFingerprint(
      fingerprintId,
      voter.fingerprintId,
      {
        name: voter.name,
        lastUsed: voter.updatedAt,
      },
    );

    if (!verificationResult.isVerified) {
      return NextResponse.json(
        {
          error: "Fingerprint verification failed",
          message: verificationResult.message,
          confidence: verificationResult.confidence,
        },
        { status: 401 },
      );
    }

    // Update last verification time
    await prisma.voter.update({
      where: { id: voter.id },
      data: { updatedAt: new Date() },
    });

    // Return verification result with voter info
    return NextResponse.json({
      verification: verificationResult,
      voter: {
        id: voter.id,
        name: voter.name,
        hasVoted: voter.hasVoted,
      },
    });
  } catch (error) {
    console.error("Error verifying voter:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
