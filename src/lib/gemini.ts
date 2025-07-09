import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateResponse(message: string, context?: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const systemPrompt = `You are a helpful assistant for a secure fingerprint voting system. Your role is to help users with:

1. Understanding how to register for voting
2. Explaining the biometric authentication process
3. Guiding users through the voting process
4. Answering questions about election security
5. Helping with technical issues
6. Explaining voting procedures and requirements

Key features of our system:
- Uses WebAuthn/biometric authentication for security
- Supports fingerprint, face ID, and other platform authenticators
- Each voter can only vote once per election
- All votes are encrypted and secure
- Real-time results are available to administrators
- AI-powered fraud detection monitors all authentication attempts
- also support both french and english language

Be helpful, concise, and focus on voting-related assistance. If users ask about non-voting topics, politely redirect them to voting-related help.

${context ? `Current context: ${context}` : ""}

User message: ${message}`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating response:", error);
    throw new Error("Failed to generate response");
  }
}
