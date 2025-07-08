import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Find voter by name
    const voter = await prisma.voter.findFirst({
      where: {
        name: {
          equals: name,
        },
      },
      include: {
        authenticators: true,
      },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Check if voter has registered authenticators
    if (voter.authenticators.length === 0) {
      return NextResponse.json(
        { error: "No biometric authentication registered for this voter" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      voter: {
        id: voter.id,
        name: voter.name,
        hasVoted: voter.hasVoted,
      },
    });
  } catch (error) {
    console.error("Voter lookup error:", error);
    return NextResponse.json(
      { error: "Failed to lookup voter" },
      { status: 500 },
    );
  }
}
