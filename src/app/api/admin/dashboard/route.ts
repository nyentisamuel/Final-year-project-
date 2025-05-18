import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET() {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get active election
    const activeElection = await prisma.election.findFirst({
      where: { isActive: true },
      include: {
        _count: { select: { votes: true, candidates: true } },
      },
    });

    // Get total voters and voters who have voted
    const totalVoters = await prisma.voter.count();
    const votersWhoVoted = await prisma.voter.count({
      where: { hasVoted: true },
    });

    // Get total elections and candidates
    const totalElections = await prisma.election.count();
    const totalCandidates = await prisma.candidate.count();

    // Get recent votes
    const recentVotes = await prisma.vote.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
      include: {
        voter: { select: { name: true } },
        candidate: { select: { name: true, party: true } },
        election: { select: { title: true } },
      },
    });

    return NextResponse.json({
      activeElection,
      stats: {
        totalVoters,
        votersWhoVoted,
        voterParticipation:
          totalVoters > 0
            ? Math.round((votersWhoVoted / totalVoters) * 100 * 10) / 10
            : 0,
        totalElections,
        totalCandidates,
      },
      recentVotes,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 },
    );
  }
}
