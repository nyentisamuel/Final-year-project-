import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Define validation schema
const voterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fingerprintId: z
    .string()
    .min(5, "Fingerprint ID must be at least 5 characters"),
  email: z.string().email("Invalid email").optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = voterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // Check if fingerprint already exists
    const existingVoter = await prisma.voter.findUnique({
      where: { fingerprintId: body.fingerprintId },
    });

    if (existingVoter) {
      return NextResponse.json(
        { error: "Fingerprint already registered" },
        { status: 409 },
      );
    }

    // Create new voter
    const voter = await prisma.voter.create({
      data: {
        name: body.name,
        fingerprintId: body.fingerprintId,
        email: body.email || null,
      },
    });

    // Return the created voter without sensitive information
    return NextResponse.json(
      {
        id: voter.id,
        name: voter.name,
        fingerprintId: voter.fingerprintId,
        hasVoted: voter.hasVoted,
        createdAt: voter.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error registering voter:", error);
    return NextResponse.json(
      { error: "Failed to register voter" },
      { status: 500 },
    );
  }
}
