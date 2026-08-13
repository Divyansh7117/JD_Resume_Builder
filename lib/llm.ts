import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM call failed: GEMINI_API_KEY is not defined in environment variables");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini API Error:", error);
    throw new Error(`LLM call failed: ${errMessage}`);
  }
}
