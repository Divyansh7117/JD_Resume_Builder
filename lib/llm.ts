import { GoogleGenerativeAI } from "@google/generative-ai";

export async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM call failed: GEMINI_API_KEY is not defined in environment variables");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let modelName = "gemini-2.5-flash";
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: unknown) {
      const errStr = String(err);
      if (errStr.includes("404") || errStr.includes("not found") || errStr.includes("no longer available")) {
        modelName = "gemini-3.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
      throw err;
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini API Error:", error);
    throw new Error(`LLM call failed: ${errMessage}`);
  }
}
