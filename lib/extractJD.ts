import crypto from "crypto";
import { JDRequirements, JDRequirement, RequirementCriticality, RequirementImportance } from "../types";
import { callLLM } from "./llm";
import { getCachedJDRequirements } from "./cache";

export const IMPORTANCE_WEIGHTS: Record<RequirementImportance, number> = {
  required: 3.0,
  high: 2.0,
  medium: 1.5,
  low: 1.0,
  preferred: 1.0,
};

export const CRITICALITY_WEIGHT_MULTIPLIER: Record<RequirementCriticality, number> = {
  hard: 1.5,
  soft: 1.0,
  preferred: 0.8,
};

export function computeRequirementWeight(importance: RequirementImportance, criticality: RequirementCriticality): number {
  const baseW = IMPORTANCE_WEIGHTS[importance] || 1.0;
  const critMult = CRITICALITY_WEIGHT_MULTIPLIER[criticality] || 1.0;
  return Number((baseW * critMult).toFixed(2));
}

function generateDeterministicReqId(name: string, category: string): string {
  const canonical = `${category.trim().toLowerCase()}::${name.trim().toLowerCase()}`;
  return "req_" + crypto.createHash("sha256").update(canonical).digest("hex").substring(0, 8);
}

/**
 * Extracts and canonicalizes JD requirements with deterministic weight freezing.
 * Uses content-addressed caching to avoid duplicate Gemini API calls on identical inputs.
 */
export async function extractJDRequirements(
  jdText: string,
  bypassCache: boolean = false
): Promise<JDRequirements> {
  return getCachedJDRequirements(
    jdText,
    async () => {
      return executeDirectJDExtraction(jdText);
    },
    bypassCache
  );
}

async function executeDirectJDExtraction(jdText: string): Promise<JDRequirements> {
  const prompt = `You are an expert HR Analyst & Talent Architect. Analyze the following Job Description (JD) and extract all structured, dynamic atomic job requirements.

CRITICAL EXTRACTION & CLASSIFICATION RULES:
1. FULL ATOMIC REQUIREMENT COVERAGE:
   - Extract every materially distinct capability, skill, and expectation expressed in the JD.
   - Do NOT collapse materially different capabilities into one combined requirement.
   - Ensure distinct atomic requirements are extracted for:
     * Core domain/product management and 0-to-1 launches
     * Specific technology stacks (e.g. Flutter, Supabase, Firebase, React, PostgreSQL, REST APIs, Git/GitHub)
     * Growth, activation & conversion funnels
     * Retention, engagement & cohort analysis
     * Experimentation, hypothesis validation & rapid A/B testing
     * Product analytics, metrics & KPI dashboards
     * Deep consumer empathy & understanding user motivations / UX delight
     * AI-powered products & LLM workflows
     * AI personalization & recommendation systems
     * Cross-functional leadership & engineering collaboration
     * Storytelling & executive stakeholder communication

2. REQUIREMENT CRITICALITY CLASSIFICATION ("criticality"):
   - "hard": Mandatory criteria essential for consideration.
     * Core mandatory technologies explicitly required (e.g. Flutter, Supabase, Python, PostgreSQL when required)
     * Minimum years of experience / tenure constraints
     * Required degrees or mandatory certifications
     * Mandatory on-site location / work authorization
     * Core non-negotiable domain responsibilities
   - "soft": Standard expected competencies, secondary skills, or methodologies.
   - "preferred": Explicitly qualified as "nice to have", "preferred", "bonus", "familiarity with", or "plus".

3. SEPARATE SKILL CAPABILITIES FROM ELIGIBILITY CONSTRAINTS:
   - "skill_capability": Product competencies, technical skills, analytics, domain knowledge, methodologies.
   - "eligibility_constraint": Hard qualification criteria such as minimum years of PM experience, domain-specific tenure, location/on-site expectations.

4. FOR EACH REQUIREMENT, EXTRACT:
   - "name": Concise, descriptive title of the requirement.
   - "description": Clear description of what the JD specifies.
   - "category": Dynamic capability dimension (e.g. "engineering", "consumer_product_and_growth", "data_and_experimentation", "consumer_understanding", "ai_technology", "leadership_and_communication", "experience_tenure", "education", "location").
   - "requirement_type": "skill_capability" or "eligibility_constraint".
   - "importance": "required", "high", "medium", "low", or "preferred".
   - "criticality": "hard", "soft", or "preferred".
   - "logical_operator": "AND", "OR" / "AT_LEAST_ONE", or "SINGLE".
   - "sub_requirements": List of granular sub-concepts if applicable.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "role_title": "string",
  "seniority_signal": "string",
  "requirements": [
    {
      "name": "string",
      "description": "string",
      "category": "string",
      "requirement_type": "skill_capability",
      "importance": "required",
      "criticality": "hard",
      "logical_operator": "SINGLE",
      "sub_requirements": []
    }
  ],
  "summary_keywords": ["string"]
}

Job Description:
${jdText}`;

  const responseText = await callLLM(prompt, 0.0);

  try {
    const rawParsed = parseCleanJSON<{
      role_title: string;
      seniority_signal: string;
      requirements: (JDRequirement & { criticality?: RequirementCriticality })[];
      summary_keywords?: string[];
    }>(responseText);

    const rawReqs = rawParsed.requirements || [];

    // Map and canonicalize requirements with frozen weights
    const requirements: JDRequirement[] = rawReqs.map((req) => {
      const isEligibility =
        req.requirement_type === "eligibility_constraint" ||
        req.category === "experience_tenure" ||
        req.category === "education" ||
        req.category === "location" ||
        req.name.toLowerCase().includes("minimum") ||
        req.name.toLowerCase().includes("years of experience") ||
        req.name.toLowerCase().includes("tenure") ||
        req.name.toLowerCase().includes("location");

      let criticality: RequirementCriticality = req.criticality || "soft";
      if (
        isEligibility ||
        req.importance === "required" ||
        req.description.toLowerCase().includes("must have") ||
        req.description.toLowerCase().includes("required") ||
        req.description.toLowerCase().includes("minimum")
      ) {
        criticality = "hard";
      } else if (
        req.importance === "preferred" ||
        req.description.toLowerCase().includes("preferred") ||
        req.description.toLowerCase().includes("nice to have") ||
        req.description.toLowerCase().includes("bonus") ||
        req.description.toLowerCase().includes("plus")
      ) {
        criticality = "preferred";
      }

      const importance = (["required", "high", "medium", "low", "preferred"].includes(req.importance)
        ? req.importance
        : "required") as RequirementImportance;

      const category = req.category || (isEligibility ? "experience_tenure" : "core_competency");
      const id = generateDeterministicReqId(req.name, category);
      const weight = computeRequirementWeight(importance, criticality);

      return {
        id,
        name: req.name || "Requirement",
        description: req.description || "",
        category,
        requirement_type: isEligibility ? "eligibility_constraint" : "skill_capability",
        importance,
        criticality,
        weight,
        logical_operator: req.logical_operator || "SINGLE",
        sub_requirements: req.sub_requirements || [],
      };
    });

    // Deduplicate any accidental duplicate requirement IDs and sort canonically
    const seenIds = new Set<string>();
    const deduplicatedRequirements: JDRequirement[] = [];

    for (const r of requirements) {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        deduplicatedRequirements.push(r);
      }
    }

    // Sort canonically by category then name for 100% deterministic graph ordering
    deduplicatedRequirements.sort((a, b) => {
      const catComp = a.category.localeCompare(b.category);
      if (catComp !== 0) return catComp;
      return a.name.localeCompare(b.name);
    });

    const mustHave = deduplicatedRequirements
      .filter((r) => r.criticality === "hard" || r.importance === "required" || r.importance === "high")
      .map((r) => r.name);

    const niceToHave = deduplicatedRequirements
      .filter((r) => r.criticality === "preferred" || r.importance === "preferred" || r.importance === "low")
      .map((r) => r.name);

    const keywords = Array.from(
      new Set([...(rawParsed.summary_keywords || []), ...deduplicatedRequirements.map((r) => r.name)])
    );

    return {
      role_title: rawParsed.role_title || "Target Role",
      seniority_signal: rawParsed.seniority_signal || "General",
      requirements: deduplicatedRequirements,
      summary_keywords: rawParsed.summary_keywords || [],
      must_have_skills: mustHave,
      nice_to_have_skills: niceToHave,
      keywords,
    };
  } catch (error) {
    console.error("Failed to parse extracted JD JSON:", responseText, error);
    throw new Error(`Failed to parse extracted JD requirements: ${error}`);
  }
}

function parseCleanJSON<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  }
}
