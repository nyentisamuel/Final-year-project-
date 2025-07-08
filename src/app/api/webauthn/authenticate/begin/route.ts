import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWebAuthnAuthenticationOptions } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  try {
    const { voterId } = await request.json();

    if (!voterId) {
      return NextResponse.json(
        { error: "Voter ID is required" },
        { status: 400 },
      );
    }

    // Find the voter and their authenticators
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      include: {
        authenticators: true,
      },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    if (voter.authenticators.length === 0) {
      return NextResponse.json(
        { error: "No authenticators registered for this voter" },
        { status: 400 },
      );
    }

    // Convert authenticators to the expected format
    const allowCredentials = voter.authenticators.map((auth) => ({
      id: auth.id,
      credentialID: auth.credentialID,
      credentialPublicKey: new Uint8Array(auth.credentialPublicKey),
      counter: auth.counter,
      transports: auth.transports,
    }));

    // Generate authentication options
    const options =
      await generateWebAuthnAuthenticationOptions(allowCredentials);

    // Store challenge in database
    await prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        userID: voter.id,
        type: "authentication",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("WebAuthn authentication begin error:", error);
    return NextResponse.json(
      { error: "Failed to begin authentication" },
      { status: 500 },
    );
  }
}
