import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWebAuthnRegistrationOptions } from "@/lib/webauthn";

export async function POST(request: NextRequest) {
  try {
    const { voterId } = await request.json();

    if (!voterId) {
      return NextResponse.json(
        { error: "Voter ID is required" },
        { status: 400 },
      );
    }

    // Find the voter
    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      include: {
        authenticators: true,
      },
    });

    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Get existing authenticators
    const existingAuthenticators = voter.authenticators.map((auth) => ({
      id: auth.id,
      credentialID: auth.credentialID,
      credentialPublicKey: new Uint8Array(auth.credentialPublicKey),
      counter: auth.counter,
      transports: auth.transports,
    }));

    // Generate registration options
    const options = await generateWebAuthnRegistrationOptions(
      {
        id: voter.id,
        name: voter.name,
        displayName: voter.name,
      },
      existingAuthenticators,
    );

    // Store challenge in database
    await prisma.webAuthnChallenge.create({
      data: {
        challenge: options.challenge,
        userID: voter.id,
        type: "registration",
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("WebAuthn registration begin error:", error);
    return NextResponse.json(
      { error: "Failed to begin registration" },
      { status: 500 },
    );
  }
}
