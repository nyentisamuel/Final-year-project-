import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET() {
  try {
    const session = await getServerSession();

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voterId = session.user.id;

    // Get voter status
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: {
        id: true,
        name: true,
        hasVoted: true,
        votes: {
          select: {
            electionId: true,
            timestamp: true,
            candidate: {
              select: {
                name: true,
                party: true,
              },
            },
            election: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Get active election
    const activeElection = await prisma.election.findFirst({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
      },
    });

    // Check if voter has voted in active election
    const hasVotedInActiveElection = activeElection
      ? voter.votes.some((vote) => vote.electionId === activeElection.id)
      : false;

    return NextResponse.json({
      voter: {
        id: voter.id,
        name: voter.name,
        hasVoted: voter.hasVoted,
      },
      activeElection,
      hasVotedInActiveElection,
      voteHistory: voter.votes.map((vote) => ({
        electionTitle: vote.election.title,
        candidateName: vote.candidate.name,
        candidateParty: vote.candidate.party,
        timestamp: vote.timestamp,
      })),
    });
  } catch (error) {
    console.error("Error fetching voter status:", error);
    return NextResponse.json(
      { error: "Failed to fetch voter status" },
      { status: 500 },
    );
  }
}
