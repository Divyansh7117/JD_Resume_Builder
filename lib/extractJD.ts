import { JDRequirements, JDRequirement, RequirementCriticality } from "../types";
import { callLLM } from "./llm";

export async function extractJDRequirements(jdText: string): Promise<JDRequirements> {
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
   - "id": Unique string id (e.g. "req_1", "req_2", "req_3").
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
      "id": "req_1",
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

  const responseText = await callLLM(prompt, 0.1);

  try {
    const rawParsed = parseCleanJSON<{
      role_title: string;
      seniority_signal: string;
      requirements: (JDRequirement & { criticality?: RequirementCriticality })[];
      summary_keywords?: string[];
    }>(responseText);

    const requirements: JDRequirement[] = (rawParsed.requirements || []).map((req, idx) => {
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

      return {
        id: req.id || `req_${idx + 1}`,
        name: req.name || "Requirement",
        description: req.description || "",
        category: req.category || (isEligibility ? "experience_tenure" : "core_competency"),
        requirement_type: isEligibility ? "eligibility_constraint" : "skill_capability",
        importance: (["required", "high", "medium", "low", "preferred"].includes(req.importance)
          ? req.importance
          : "required") as JDRequirement["importance"],
        criticality,
        logical_operator: req.logical_operator || "SINGLE",
        sub_requirements: req.sub_requirements || [],
      };
    });

    const mustHave = requirements
      .filter((r) => r.criticality === "hard" || r.importance === "required" || r.importance === "high")
      .map((r) => r.name);

    const niceToHave = requirements
      .filter((r) => r.criticality === "preferred" || r.importance === "preferred" || r.importance === "low")
      .map((r) => r.name);

    const keywords = Array.from(
      new Set([...(rawParsed.summary_keywords || []), ...requirements.map((r) => r.name)])
    );

    return {
      role_title: rawParsed.role_title || "Target Role",
      seniority_signal: rawParsed.seniority_signal || "General",
      requirements,
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
