import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

// Define validation schema for updates
const candidateUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  party: z.string().min(2, "Party must be at least 2 characters").optional(),
  position: z
    .string()
    .min(2, "Position must be at least 2 characters")
    .optional(),
  bio: z.string().optional(),
  imageUrl: z.string().url().optional(),
  electionId: z.string().optional(),
});

// GET specific candidate
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
      include: {
        election: true,
        _count: { select: { votes: true } },
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(candidate);
  } catch (error) {
    console.error(`Error fetching candidate ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 },
    );
  }
}

// PUT update candidate (admin only)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = candidateUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: params.id },
    });

    if (!existingCandidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // If election ID is provided, check if it exists
    if (body.electionId) {
      const election = await prisma.election.findUnique({
        where: { id: body.electionId },
      });

      if (!election) {
        return NextResponse.json(
          { error: "Election not found" },
          { status: 404 },
        );
      }
    }

    // Update candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: params.id },
      data: {
        name: body.name,
        party: body.party,
        position: body.position,
        bio: body.bio,
        imageUrl: body.imageUrl,
        electionId: body.electionId,
      },
    });

    return NextResponse.json(updatedCandidate);
  } catch (error) {
    console.error(`Error updating candidate ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 },
    );
  }
}

// DELETE candidate (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if candidate exists
    const existingCandidate = await prisma.candidate.findUnique({
      where: { id: params.id },
    });

    if (!existingCandidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 },
      );
    }

    // Delete candidate
    await prisma.candidate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error(`Error deleting candidate ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 },
    );
  }
}
