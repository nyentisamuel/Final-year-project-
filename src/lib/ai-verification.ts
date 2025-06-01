import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

interface VerificationResult {
  isVerified: boolean;
  confidence: number;
  message: string;
}

export async function verifyFingerprint(
  fingerprintId: string,
  registeredId: string,
  metadata?: { name?: string; lastUsed?: Date },
): Promise<VerificationResult> {
  try {
    // In a real system, we would compare actual fingerprint data
    // Here we're using AI to simulate a verification process

    // Create a prompt for the AI to analyze
    const prompt = `
      Analyze the following fingerprint verification attempt:
      - Registered fingerprint ID: ${registeredId}
      - Provided fingerprint ID: ${fingerprintId}
      - User name: ${metadata?.name || "Unknown"}
      - Last authentication: ${metadata?.lastUsed ? metadata.lastUsed.toISOString() : "Never"}
      - Current time: ${new Date().toISOString()}
      
      Based on this information, determine if this is likely a legitimate authentication attempt.
      Consider factors like:
      - Do the fingerprint IDs match exactly?
      - Is this the first time this fingerprint is being used?
      - Is the time between authentications reasonable?
      
      Return a JSON object with the following structure:
      {
        "isVerified": boolean,
        "confidence": number (0-100),
        "message": string (explanation),
        "riskFactors": string[] (if any)
      }
    `;

    // In a real production system, we would use actual fingerprint comparison algorithms
    // For this demo, we'll simulate the verification with AI

    // If the IDs match exactly, we'll consider it verified
    if (fingerprintId === registeredId) {
      // Use AI to analyze for potential fraud patterns
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        temperature: 0.2,
      });

      try {
        const result = JSON.parse(text);
        return {
          isVerified: result.isVerified,
          confidence: result.confidence,
          message: result.message,
        };
      } catch (e) {
        // Fallback if AI response parsing fails
        return {
          isVerified: true,
          confidence: 95,
          message: "Verification successful. Fingerprint matched.",
        };
      }
    } else {
      return {
        isVerified: false,
        confidence: 100,
        message:
          "Verification failed. Fingerprint does not match registered ID.",
      };
    }
  } catch (error) {
    console.error("Error in fingerprint verification:", error);
    return {
      isVerified: false,
      confidence: 0,
      message: "Verification error. Please try again.",
    };
  }
}
