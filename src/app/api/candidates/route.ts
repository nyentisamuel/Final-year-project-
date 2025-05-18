import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

// Define validation schema
const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  party: z.string().min(2, "Party must be at least 2 characters"),
  position: z.string().min(2, "Position must be at least 2 characters"),
  bio: z.string().optional(),
  imageUrl: z.string().url().optional(),
  electionId: z.string().min(1, "Election ID is required"),
});

// GET all candidates or filter by election
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");

    const whereClause = electionId ? { electionId } : {};

    const candidates = await prisma.candidate.findMany({
      where: whereClause,
      include: {
        election: {
          select: {
            title: true,
            isActive: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
    });

    return NextResponse.json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 },
    );
  }
}

// POST new candidate (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = candidateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // Check if election exists
    const election = await prisma.election.findUnique({
      where: { id: body.electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    // Create new candidate
    const candidate = await prisma.candidate.create({
      data: {
        name: body.name,
        party: body.party,
        position: body.position,
        bio: body.bio,
        imageUrl: body.imageUrl,
        electionId: body.electionId,
      },
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (error) {
    console.error("Error creating candidate:", error);
    return NextResponse.json(
      { error: "Failed to create candidate" },
      { status: 500 },
    );
  }
}
