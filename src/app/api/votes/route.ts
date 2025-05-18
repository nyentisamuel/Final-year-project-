import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { z } from "zod";

// Define validation schema
const voteSchema = z.object({
  candidateId: z.string().min(1, "Candidate ID is required"),
  electionId: z.string().min(1, "Election ID is required"),
});

// POST new vote
export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = voteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    const voterId = session.user.id;

    // Check if voter exists
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Check if voter has already voted in this election
    const existingVote = await prisma.vote.findFirst({
      where: {
        voterId,
        electionId: body.electionId,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted in this election" },
        { status: 409 },
      );
    }

    // Check if candidate exists and belongs to the specified election
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: body.candidateId,
        electionId: body.electionId,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        {
          error:
            "Candidate not found or does not belong to the specified election",
        },
        { status: 404 },
      );
    }

    // Check if election is active
    const election = await prisma.election.findUnique({
      where: { id: body.electionId },
    });

    if (!election || !election.isActive) {
      return NextResponse.json(
        { error: "Election is not active" },
        { status: 400 },
      );
    }

    // Create vote and update voter status in a transaction
    const result = await prisma.$transaction([
      prisma.vote.create({
        data: {
          voterId,
          candidateId: body.candidateId,
          electionId: body.electionId,
        },
      }),
      prisma.voter.update({
        where: { id: voterId },
        data: { hasVoted: true },
      }),
    ]);

    return NextResponse.json(
      {
        message: "Vote cast successfully",
        vote: result[0],
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error casting vote:", error);
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 });
  }
}

// GET vote results (admin only)
export async function GET(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    // if (!session || session.user.role !== "admin") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const electionId = searchParams.get("electionId");

    if (!electionId) {
      return NextResponse.json(
        { error: "Election ID is required" },
        { status: 400 },
      );
    }

    // Get vote counts by candidate
    const voteResults = await prisma.candidate.findMany({
      where: { electionId },
      select: {
        id: true,
        name: true,
        party: true,
        _count: { select: { votes: true } },
      },
    });

    // Get total votes for the election
    const totalVotes = await prisma.vote.count({
      where: { electionId },
    });

    // Calculate percentages
    const resultsWithPercentages = voteResults.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      party: candidate.party,
      votes: candidate._count.votes,
      percentage:
        totalVotes > 0
          ? Math.round((candidate._count.votes / totalVotes) * 100 * 10) / 10
          : 0,
    }));

    return NextResponse.json({
      totalVotes,
      candidates: resultsWithPercentages,
    });
  } catch (error) {
    console.error("Error fetching vote results:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote results" },
      { status: 500 },
    );
  }
}
