import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

// Define validation schema
const electionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional(),
});

// GET all elections
export async function GET() {
  try {
    const elections = await prisma.election.findMany({
      include: {
        _count: {
          select: { votes: true, candidates: true },
        },
      },
      orderBy: { startDate: "desc" },
    });

    console.log(elections);
    return NextResponse.json(elections);
  } catch (error) {
    console.error("Error fetching elections:", error);
    return NextResponse.json(
      { error: "Failed to fetch elections" },
      { status: 500 },
    );
  }
}

// POST new election (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = electionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // If setting this election as active, deactivate all others
    if (body.isActive) {
      await prisma.election.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Create new election
    const election = await prisma.election.create({
      data: {
        title: body.title,
        description: body.description,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        isActive: body.isActive ?? false,
      },
    });

    return NextResponse.json(election, { status: 201 });
  } catch (error) {
    console.error("Error creating election:", error);
    return NextResponse.json(
      { error: "Failed to create election" },
      { status: 500 },
    );
  }
}
