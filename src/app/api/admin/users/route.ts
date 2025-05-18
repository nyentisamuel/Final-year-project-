import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { hash } from "bcrypt";
import { z } from "zod";

// Define validation schema
const adminSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
});

// GET all admin users (admin only)
export async function GET() {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin users" },
      { status: 500 },
    );
  }
}

// POST new admin user (admin only)
export async function POST(req: Request) {
  try {
    const session = await getServerSession();

    // Check if user is admin
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    const validation = adminSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.format() },
        { status: 400 },
      );
    }

    // Check if username or email already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: body.username }, { email: body.email }],
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hash(body.password, 10);

    // Create new admin
    const admin = await prisma.admin.create({
      data: {
        username: body.username,
        password: hashedPassword,
        name: body.name,
        email: body.email,
      },
    });

    // Return the created admin without password
    return NextResponse.json(
      {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        createdAt: admin.createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 },
    );
  }
}
