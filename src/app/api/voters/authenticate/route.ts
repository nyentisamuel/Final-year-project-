import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { fingerprintId } = await req.json();

    if (!fingerprintId) {
      return NextResponse.json(
        { error: "Fingerprint ID is required" },
        { status: 400 },
      );
    }

    const voter = await prisma.voter.findUnique({
      where: { fingerprintId },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Return voter information without sensitive data
    return NextResponse.json({
      id: voter.id,
      name: voter.name,
      hasVoted: voter.hasVoted,
    });
  } catch (error) {
    console.error("Error authenticating voter:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
