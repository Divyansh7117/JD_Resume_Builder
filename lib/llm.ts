import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let globalCallCount = 0;
const callTimestamps: number[] = [];

export async function callLLM(prompt: string, temperature: number = 0.2, retries = 8): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM call failed: GEMINI_API_KEY is not defined in environment variables");
  }

  // Rate limiter / throttle to stay under Gemini free tier (12 RPM)
  const now = Date.now();
  while (callTimestamps.length > 0 && callTimestamps[0] <= now - 60000) {
    callTimestamps.shift();
  }

  if (callTimestamps.length >= 10) {
    const oldestTimestamp = callTimestamps[0];
    const waitTime = Math.max(0, oldestTimestamp + 60000 - Date.now() + 100);
    if (waitTime > 0) {
      console.log(`[RATE LIMIT] Throttling: waiting ${(waitTime / 1000).toFixed(1)}s before next call to respect RPM quota...`);
      await sleep(waitTime);
    }
    const postWaitNow = Date.now();
    while (callTimestamps.length > 0 && callTimestamps[0] <= postWaitNow - 60000) {
      callTimestamps.shift();
    }
  }

  callTimestamps.push(Date.now());
  const callNum = ++globalCallCount;
  console.log(`[LLM call #${callNum}] Invoking Gemini API...`);

  const verifiedModels = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-3.7-flash",
    "gemini-flash-lite-latest",
  ];

  for (let attempt = 1; attempt <= retries; attempt++) {
    const modelName = verifiedModels[(attempt - 1) % verifiedModels.length];
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { temperature, maxOutputTokens: 8192 },
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuota429 =
        errMessage.includes("429") ||
        errMessage.includes("Quota exceeded") ||
        errMessage.includes("Resource has been exhausted") ||
        errMessage.includes("Too Many Requests");

      const isRetryable =
        isQuota429 ||
        errMessage.includes("502") ||
        errMessage.includes("503") ||
        errMessage.includes("high demand") ||
        errMessage.includes("Bad Gateway") ||
        errMessage.includes("Service Unavailable") ||
        errMessage.includes("fetch failed") ||
        errMessage.includes("ECONNRESET") ||
        errMessage.includes("ETIMEDOUT") ||
        errMessage.includes("ENOTFOUND");

      if (isRetryable && attempt < retries) {
        const backoffMs = isQuota429 ? 15000 + attempt * 2000 : attempt * 2000 + 1500;
        console.warn(`[GEMINI RETRY] API limit/busy on ${modelName} (attempt ${attempt}). Retrying with next model in ${(backoffMs / 1000).toFixed(1)}s...`);
        await sleep(backoffMs);
        continue;
      }

      console.error("Gemini API Error:", error);
      throw new Error(`LLM call failed: ${errMessage}`);
    }
  }

  throw new Error("LLM call failed after retries.");
}

/**
 * Generates a dense 3072-dimensional semantic vector embedding using Gemini's gemini-embedding-001 model.
 */
export async function getSemanticEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await model.embedContent(text.substring(0, 2048));
    return result.embedding.values;
  } catch (err) {
    console.warn("[EMBEDDING WARNING] Failed to retrieve Gemini embedding; falling back to lexical vector:", err);
    return [];
  }
}
