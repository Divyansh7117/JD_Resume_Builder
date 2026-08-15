import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { PIPELINE_VERSION } from "./cache";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const CANONICAL_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
export const CANONICAL_EMBEDDING_MODEL = "gemini-embedding-001";
export const MAX_OUTPUT_TOKENS = 8192;

// ══════════════════════════════════════════════════════════════════════════════
// TYPED LLM ERRORS
// ══════════════════════════════════════════════════════════════════════════════

export class LLMRateLimitError extends Error {
  constructor(model: string, attempts: number) {
    super(`LLM_RATE_LIMIT: Model '${model}' unavailable after ${attempts} attempts due to quota exhaustion. No model fallback allowed.`);
    this.name = "LLMRateLimitError";
  }
}

export class LLMUnavailableError extends Error {
  constructor(model: string, reason: string) {
    super(`LLM_UNAVAILABLE: Model '${model}' is unavailable: ${reason}`);
    this.name = "LLMUnavailableError";
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LLM CACHE MODE
// ══════════════════════════════════════════════════════════════════════════════
// Controlled via environment variable LLM_CACHE_MODE:
//   "read-write" (default) — read from cache, write to cache
//   "read-only"            — read from cache, do NOT write new entries
//   "bypass"               — skip cache entirely, always call Gemini fresh
//
// This is NOT exposed to end users. It is for development/testing only.
// ══════════════════════════════════════════════════════════════════════════════

export type LLMCacheMode = "read-write" | "read-only" | "bypass";

export function getLLMCacheMode(): LLMCacheMode {
  const mode = process.env.LLM_CACHE_MODE;
  if (mode === "read-only" || mode === "bypass") return mode;
  return "read-write";
}

// ══════════════════════════════════════════════════════════════════════════════
// PROMPT-LEVEL LLM RESPONSE CACHE
// ══════════════════════════════════════════════════════════════════════════════
//
// Cache key includes EVERY input that can affect the LLM response:
//   - model name
//   - temperature
//   - maxOutputTokens
//   - pipeline version (changes when evaluator logic changes)
//   - the full prompt text (changes when prompt templates change)
//
// Changing ANY of these automatically invalidates the cache because the
// SHA-256 hash changes. No stale responses from older versions are reused.
//
// The cache is 100% generic and content-addressed — it works for any JD,
// any resume, any requirement, with zero candidate/JD-specific exceptions.
// ══════════════════════════════════════════════════════════════════════════════

const llmResponseCache = new Map<string, string>();
const LLM_CACHE_MAX_ENTRIES = 200;

let llmCacheHitCount = 0;
let llmCacheMissCount = 0;

export function getLLMCacheStats(): { hits: number; misses: number; size: number } {
  return { hits: llmCacheHitCount, misses: llmCacheMissCount, size: llmResponseCache.size };
}

function computePromptCacheKey(prompt: string, model: string, temperature: number): string {
  const canonical = [
    `pipeline_version=${PIPELINE_VERSION}`,
    `model=${model}`,
    `temp=${temperature}`,
    `max_tokens=${MAX_OUTPUT_TOKENS}`,
    `prompt=${prompt}`,
  ].join("::");
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

function pruneLLMCacheIfNeeded() {
  if (llmResponseCache.size > LLM_CACHE_MAX_ENTRIES) {
    const oldestKey = llmResponseCache.keys().next().value;
    if (oldestKey) llmResponseCache.delete(oldestKey);
  }
}

/**
 * Clears the LLM response cache and resets stats.
 */
export function clearLLMResponseCache(): void {
  llmResponseCache.clear();
  llmCacheHitCount = 0;
  llmCacheMissCount = 0;
}

let globalCallCount = 0;
const callTimestamps: number[] = [];

export async function callLLM(prompt: string, temperature: number = 0.0, retries = 8): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM call failed: GEMINI_API_KEY is not defined in environment variables");
  }

  const cacheMode = getLLMCacheMode();
  const cacheKey = computePromptCacheKey(prompt, CANONICAL_MODEL, temperature);

  // ── Check prompt-level cache (unless bypass mode) ──
  if (cacheMode !== "bypass" && llmResponseCache.has(cacheKey)) {
    llmCacheHitCount++;
    console.log(`[LLM_CACHE_HIT] key: ${cacheKey.substring(0, 16)}... (model=${CANONICAL_MODEL}, temp=${temperature}, pipeline=${PIPELINE_VERSION})`);
    return llmResponseCache.get(cacheKey)!;
  }

  if (cacheMode === "bypass") {
    console.log(`[LLM_CACHE_BYPASS] key: ${cacheKey.substring(0, 16)}... — cache bypassed, calling Gemini fresh`);
  }

  llmCacheMissCount++;

  // ── Rate limiter / throttle to stay under Gemini free tier ──
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

  console.log(`[LLM_CACHE_MISS] key: ${cacheKey.substring(0, 16)}... — calling Gemini (model=${CANONICAL_MODEL}, temp=${temperature}, pipeline=${PIPELINE_VERSION})`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`[LLM call #${callNum}] Invoking Gemini API (${CANONICAL_MODEL}) | temp=${temperature} | attempt=${attempt}/${retries}...`);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: CANONICAL_MODEL,
        generationConfig: { temperature, maxOutputTokens: MAX_OUTPUT_TOKENS },
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();

      // ── Cache the successful response (unless read-only or bypass) ──
      if (cacheMode === "read-write") {
        pruneLLMCacheIfNeeded();
        llmResponseCache.set(cacheKey, responseText);
      }

      return responseText;
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
        let backoffMs = isQuota429 ? 16000 + attempt * 2000 : attempt * 2000 + 1500;
        const retryMatch = errMessage.match(/retry in ([\d\.]+)s/i) || errMessage.match(/"retryDelay":\s*"(\d+)s"/i);
        if (retryMatch && retryMatch[1]) {
          backoffMs = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000;
        }

        console.warn(`[GEMINI RETRY] Quota/busy on ${CANONICAL_MODEL} (attempt ${attempt}). Retrying in ${(backoffMs / 1000).toFixed(1)}s...`);
        await sleep(backoffMs);
        continue;
      }

      // ── Typed errors: NO silent model fallback ──
      if (isQuota429) {
        throw new LLMRateLimitError(CANONICAL_MODEL, attempt);
      }

      console.error("Gemini API Error:", error);
      throw new LLMUnavailableError(CANONICAL_MODEL, errMessage);
    }
  }

  throw new LLMRateLimitError(CANONICAL_MODEL, retries);
}

/**
 * Generates a dense semantic vector embedding using Gemini's embedding model.
 */
export async function getSemanticEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: CANONICAL_EMBEDDING_MODEL });
    const result = await model.embedContent(text.substring(0, 2048));
    return result.embedding.values;
  } catch (err) {
    console.warn("[EMBEDDING WARNING] Failed to retrieve Gemini embedding; falling back to lexical vector:", err);
    return [];
  }
}
