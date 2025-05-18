import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { electionId } = await req.json();

    if (!electionId) {
      return NextResponse.json(
        { error: "Election ID is required" },
        { status: 400 },
      );
    }

    // Check if election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 },
      );
    }

    // Deactivate all elections
    await prisma.election.updateMany({
      data: { isActive: false },
    });

    // Set the specified election as active
    await prisma.election.update({
      where: { id: electionId },
      data: { isActive: true },
    });

    return NextResponse.json({
      message: "Election set as active successfully",
    });
  } catch (error) {
    console.error("Error setting active election:", error);
    return NextResponse.json(
      { error: "Failed to set active election" },
      { status: 500 },
    );
  }
}
