import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10);
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Admin User",
      email: "admin@example.com",
    },
  });
  console.log({ admin });

  // Create sample election
  const election = await prisma.election.upsert({
    where: { id: "e1" },
    update: {},
    create: {
      id: "e1",
      title: "Presidential Election 2024",
      description: "National election for the office of President",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2024-04-30"),
      isActive: true,
    },
  });
  console.log({ election });

  // Create sample candidates
  const candidates = await Promise.all([
    prisma.candidate.upsert({
      where: { id: "c1" },
      update: {},
      create: {
        id: "c1",
        name: "Alex Morgan",
        party: "Progressive Party",
        position: "President",
        bio: "Experienced leader with a focus on economic growth and social justice.",
        electionId: election.id,
      },
    }),
    prisma.candidate.upsert({
      where: { id: "c2" },
      update: {},
      create: {
        id: "c2",
        name: "Taylor Reed",
        party: "Conservative Union",
        position: "President",
        bio: "Dedicated to traditional values and fiscal responsibility.",
        electionId: election.id,
      },
    }),
    prisma.candidate.upsert({
      where: { id: "c3" },
      update: {},
      create: {
        id: "c3",
        name: "Jordan Casey",
        party: "Liberty Alliance",
        position: "President",
        bio: "Committed to individual freedom and limited government.",
        electionId: election.id,
      },
    }),
  ]);
  console.log({ candidates });

  // Create sample voters
  const voters = await Promise.all([
    prisma.voter.upsert({
      where: { fingerprintId: "fp_001" },
      update: {},
      create: {
        id: "v1",
        name: "John Doe",
        fingerprintId: "fp_001",
        hasVoted: false,
        approved: true,
      },
    }),
    prisma.voter.upsert({
      where: { fingerprintId: "fp_002" },
      update: {},
      create: {
        id: "v2",
        name: "Jane Smith",
        fingerprintId: "fp_002",
        hasVoted: false,
        approved: false,
      },
    }),
    prisma.voter.upsert({
      where: { fingerprintId: "fp_003" },
      update: {},
      create: {
        id: "v3",
        name: "Bob Johnson",
        fingerprintId: "fp_003",
        hasVoted: true,
        approved: false,
      },
    }),
    prisma.voter.upsert({
      where: { fingerprintId: "fp_004" },
      update: {},
      create: {
        id: "v4",
        name: "Alice Brown",
        fingerprintId: "fp_004",
        hasVoted: false,
        approved: false,
      },
    }),
    prisma.voter.upsert({
      where: { fingerprintId: "fp_005" },
      update: {},
      create: {
        id: "v5",
        name: "Charlie Davis",
        fingerprintId: "fp_005",
        hasVoted: false,
        approved: true,
      },
    }),
  ]);

  // Create sample vote
  const vote = await prisma.vote.upsert({
    where: { id: "vote1" },
    update: {},
    create: {
      id: "vote1",
      voterId: "v3",
      candidateId: "c1",
      electionId: election.id,
      timestamp: new Date("2024-04-15T10:30:00"),
    },
  });
  console.log({ vote });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
