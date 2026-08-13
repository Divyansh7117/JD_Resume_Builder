import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callLLM(prompt: string, temperature: number = 0.2, retries = 6): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM call failed: GEMINI_API_KEY is not defined in environment variables");
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash-lite",
        generationConfig: { temperature, maxOutputTokens: 8192 }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isRateLimit =
        errMessage.includes("429") ||
        errMessage.includes("Quota exceeded") ||
        errMessage.includes("502") ||
        errMessage.includes("Bad Gateway");

      if (isRateLimit && attempt < retries) {
        const backoffMs = attempt * 1500 + 1000;
        console.warn(`[GEMINI RETRY] API limit/busy on attempt ${attempt}. Retrying in ${(backoffMs / 1000).toFixed(1)}s...`);
        await sleep(backoffMs);
        continue;
      }

      console.error("Gemini API Error:", error);
      throw new Error(`LLM call failed: ${errMessage}`);
    }
  }

  throw new Error("LLM call failed after retries.");
}
