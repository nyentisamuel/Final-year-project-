import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

// Define validation schema for updates
const electionUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

// GET specific election with candidates and vote counts
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const election = await prisma.election.findUnique({
      where: { id: params.id },
      include: {
        candidates: {
          include: {
            _count: { select: { votes: true } },
          },
        },
        _count: { select: { votes: true } },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(election);
  } catch (error) {
    console.error(`Error fetching election ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch election" },
      { status: 500 },
    );
  }
}

// PUT update election (admin only)
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
    const validation = electionUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // Check if election exists
    const existingElection = await prisma.election.findUnique({
      where: { id: params.id },
    });

    if (!existingElection) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    // If setting this election as active, deactivate all others
    if (body.isActive) {
      await prisma.election.updateMany({
        where: {
          isActive: true,
          id: { not: params.id },
        },
        data: { isActive: false },
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.startDate) updateData.startDate = new Date(body.startDate);
    if (body.endDate) updateData.endDate = new Date(body.endDate);
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update election
    const updatedElection = await prisma.election.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedElection);
  } catch (error) {
    console.error(`Error updating election ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update election" },
      { status: 500 },
    );
  }
}

// DELETE election (admin only)
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

    // Check if election exists
    const existingElection = await prisma.election.findUnique({
      where: { id: params.id },
    });

    if (!existingElection) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    // Delete election (will cascade delete candidates and votes)
    await prisma.election.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Election deleted successfully" });
  } catch (error) {
    console.error(`Error deleting election ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete election" },
      { status: 500 },
    );
  }
}
