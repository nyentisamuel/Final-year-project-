import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/typescript-types";

// WebAuthn configuration
export const rpName =
  process.env.WEBAUTHN_RP_NAME || "Fingerprint Voting System";
export const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
export const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

export interface WebAuthnUser {
  id: string;
  name: string;
  displayName: string;
}

export interface StoredAuthenticator {
  id: string;
  credentialID: string;
  credentialPublicKey: Uint8Array;
  counter: number;
  transports?: string[];
}

// Generate registration options for new authenticator
export async function generateWebAuthnRegistrationOptions(
  user: WebAuthnUser,
  existingAuthenticators: StoredAuthenticator[] = [],
): Promise<any> {
  const excludeCredentials = existingAuthenticators.map((authenticator) => ({
    id: authenticator.credentialID,
    type: "public-key" as const,
    transports: authenticator.transports as AuthenticatorTransport[],
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.name,
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "discouraged",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  return options;
}

// Verify registration response
export async function verifyWebAuthnRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
  expectedOrigin: string = origin,
  expectedRPID: string = rpID,
): Promise<any> {
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: true,
  });

  return verification;
}

// Generate authentication options
export async function generateWebAuthnAuthenticationOptions(
  allowCredentials: StoredAuthenticator[] = [],
): Promise<any> {
  const allowedCredentials = allowCredentials.map((authenticator) => ({
    id: authenticator.credentialID,
    type: "public-key" as const,
    transports: authenticator.transports as AuthenticatorTransport[],
  }));

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowedCredentials,
    userVerification: "required",
  });

  return options;
}

// Verify authentication response
export async function verifyWebAuthnAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  authenticator: StoredAuthenticator,
  expectedOrigin: string = origin,
  expectedRPID: string = rpID,
): Promise<any> {
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    authenticator: {
      credentialID: authenticator.credentialID,
      credentialPublicKey: authenticator.credentialPublicKey,
      counter: authenticator.counter,
      transports: authenticator.transports as AuthenticatorTransport[],
    },
    requireUserVerification: true,
  });

  return verification;
}

// Utility functions
export function base64URLStringToBuffer(base64URLString: string): ArrayBuffer {
  const base64 = base64URLString.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

export function bufferToBase64URLString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const charCode of bytes) {
    str += String.fromCharCode(charCode);
  }
  const base64String = btoa(str);
  return base64String.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
