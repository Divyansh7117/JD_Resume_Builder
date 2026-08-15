import crypto from "crypto";
import { JDRequirements, MatchAnalysis, TailoredOutput, ResumeData } from "../types";

export const PIPELINE_VERSION = "v2.1-calibrated";

/**
 * Canonical text normalizer: strips carriage returns, collapses multiple spaces/tabs,
 * trims leading/trailing whitespace, and standardizes casing for hashing.
 */
export function normalizeTextForHashing(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim()
    .toLowerCase();
}

/**
 * Computes a SHA-256 hex digest for normalized text.
 */
export function computeContentHash(text: string): string {
  const normalized = normalizeTextForHashing(text);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Computes a composite cache key from multiple text inputs and the pipeline version.
 */
export function computeCompositeCacheKey(...parts: string[]): string {
  const combined = parts.map(normalizeTextForHashing).join("::||::") + `::v=${PIPELINE_VERSION}`;
  return crypto.createHash("sha256").update(combined).digest("hex");
}

// In-Memory Content-Addressed Caches
const parsedResumeCache = new Map<string, { data: ResumeData; timestamp: number }>();
const jdRequirementsCache = new Map<string, { data: JDRequirements; timestamp: number }>();
const matchAnalysisCache = new Map<string, { data: MatchAnalysis; timestamp: number }>();
const tailoredOutputCache = new Map<string, { data: TailoredOutput; timestamp: number }>();

const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function pruneCacheIfNeeded<T>(cache: Map<string, { data: T; timestamp: number }>) {
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
}

/**
 * Retrieves or computes cached Parsed Resume based on content hash.
 */
export async function getCachedParsedResume(
  resumeText: string,
  generator: () => Promise<ResumeData>,
  bypassCache: boolean = false
): Promise<ResumeData> {
  const key = computeCompositeCacheKey("parsed_resume", resumeText);

  if (!bypassCache && parsedResumeCache.has(key)) {
    const entry = parsedResumeCache.get(key)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      console.log(`[CACHE_HIT] Parsed Resume key: ${key.substring(0, 12)}...`);
      return JSON.parse(JSON.stringify(entry.data));
    }
    parsedResumeCache.delete(key);
  }

  console.log(`[CACHE_MISS] Parsed Resume key: ${key.substring(0, 12)}...`);
  const result = await generator();
  pruneCacheIfNeeded(parsedResumeCache);
  parsedResumeCache.set(key, { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() });
  return result;
}

/**
 * Retrieves or computes cached JD requirements based on content hash.
 */
export async function getCachedJDRequirements(
  jdText: string,
  generator: () => Promise<JDRequirements>,
  bypassCache: boolean = false
): Promise<JDRequirements> {
  const key = computeCompositeCacheKey("jd_reqs", jdText);

  if (!bypassCache && jdRequirementsCache.has(key)) {
    const entry = jdRequirementsCache.get(key)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      console.log(`[CACHE_HIT] JD Requirements key: ${key.substring(0, 12)}...`);
      return JSON.parse(JSON.stringify(entry.data));
    }
    jdRequirementsCache.delete(key);
  }

  console.log(`[CACHE_MISS] JD Requirements key: ${key.substring(0, 12)}...`);
  const result = await generator();
  pruneCacheIfNeeded(jdRequirementsCache);
  jdRequirementsCache.set(key, { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() });
  return result;
}

/**
 * Retrieves or computes cached Match Analysis based on content hash of JD + Resume.
 */
export async function getCachedMatchAnalysis(
  jdText: string,
  resumeText: string,
  generator: () => Promise<MatchAnalysis>,
  bypassCache: boolean = false
): Promise<MatchAnalysis> {
  const key = computeCompositeCacheKey("match_analysis", jdText, resumeText);

  if (!bypassCache && matchAnalysisCache.has(key)) {
    const entry = matchAnalysisCache.get(key)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      console.log(`[CACHE_HIT] Match Analysis key: ${key.substring(0, 12)}...`);
      return JSON.parse(JSON.stringify(entry.data));
    }
    matchAnalysisCache.delete(key);
  }

  console.log(`[CACHE_MISS] Match Analysis key: ${key.substring(0, 12)}...`);
  const result = await generator();
  pruneCacheIfNeeded(matchAnalysisCache);
  matchAnalysisCache.set(key, { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() });
  return result;
}

/**
 * Retrieves or computes cached Tailored Output based on content hash of JD + Resume.
 */
export async function getCachedTailoredOutput(
  jdText: string,
  resumeText: string,
  generator: () => Promise<TailoredOutput>,
  bypassCache: boolean = false
): Promise<TailoredOutput> {
  const key = computeCompositeCacheKey("tailored_output", jdText, resumeText);

  if (!bypassCache && tailoredOutputCache.has(key)) {
    const entry = tailoredOutputCache.get(key)!;
    if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
      console.log(`[CACHE_HIT] Tailored Output key: ${key.substring(0, 12)}...`);
      return JSON.parse(JSON.stringify(entry.data));
    }
    tailoredOutputCache.delete(key);
  }

  console.log(`[CACHE_MISS] Tailored Output key: ${key.substring(0, 12)}...`);
  const result = await generator();
  pruneCacheIfNeeded(tailoredOutputCache);
  tailoredOutputCache.set(key, { data: JSON.parse(JSON.stringify(result)), timestamp: Date.now() });
  return result;
}

import { clearLLMResponseCache } from "./llm";

/**
 * Clears ALL in-memory caches including LLM response cache (used during testing).
 */
export function clearPipelineCache(): void {
  parsedResumeCache.clear();
  jdRequirementsCache.clear();
  matchAnalysisCache.clear();
  tailoredOutputCache.clear();
  clearLLMResponseCache();
}
