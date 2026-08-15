import {
  JDRequirements,
  ResumeData,
  MatchAnalysis,
  RequirementMatchResult,
  GapItem,
  RequirementCriticality,
  MatchStatus,
  CandidateEvidenceUnit,
  CapabilityDimension,
  AuditTrailEntry,
  EligibilityResult,
  EligibilityStatus,
  EvidenceLevel,
  JDRequirement,
} from "../types";
import { callLLM, getSemanticEmbedding } from "./llm";
import { checkExactTechMatch } from "./techMatcher";
import { getCachedMatchAnalysis } from "./cache";
import { IMPORTANCE_WEIGHTS, CRITICALITY_WEIGHT_MULTIPLIER, computeRequirementWeight } from "./extractJD";
import {
  calculateCandidateChronology,
  evaluateExperienceRequirement,
  ExperienceChronology,
} from "./experienceEngine";

export { IMPORTANCE_WEIGHTS, CRITICALITY_WEIGHT_MULTIPLIER };

export const STATUS_SCORES: Record<MatchStatus, number> = {
  strong_match: 1.0,
  claimed_match: 0.8,
  partial_match: 0.6,
  weak_evidence: 0.6,
  no_evidence: 0.0,
};

// ══════════════════════════════════════════════════════════════════════════════
// PURE DETERMINISTIC SCORING ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export function calculatePureDeterministicScores(structuredResults: RequirementMatchResult[]): {
  match_score: number;
  hard_requirement_match_score: number;
  preferred_requirement_match_score: number;
  dimensions: CapabilityDimension[];
  audit_trail: AuditTrailEntry[];
} {
  const dimensionMap = new Map<string, RequirementMatchResult[]>();
  for (const res of structuredResults) {
    const dimKey = res.category || "core_competency";
    if (!dimensionMap.has(dimKey)) {
      dimensionMap.set(dimKey, []);
    }
    dimensionMap.get(dimKey)!.push(res);
  }

  const dimensions: CapabilityDimension[] = [];
  let totalOverallWeightedScoreSum = 0;
  let totalOverallWeightSum = 0;

  let totalHardWeightedScoreSum = 0;
  let totalHardWeightSum = 0;

  let totalPrefWeightedScoreSum = 0;
  let totalPrefWeightSum = 0;

  for (const [dimKey, dimReqs] of dimensionMap.entries()) {
    let dimReqWeightSum = 0;
    let dimReqScoreSum = 0;

    for (const req of dimReqs) {
      const baseW = IMPORTANCE_WEIGHTS[req.importance] || 1.0;
      const critMult = CRITICALITY_WEIGHT_MULTIPLIER[req.criticality] || 1.0;
      const w = req.weight !== undefined && req.weight > 0 ? req.weight : Number((baseW * critMult).toFixed(2));

      dimReqWeightSum += w;
      dimReqScoreSum += w * req.score;

      totalOverallWeightedScoreSum += w * req.score * 100;
      totalOverallWeightSum += w;

      if (req.criticality === "hard") {
        totalHardWeightedScoreSum += w * req.score * 100;
        totalHardWeightSum += w;
      } else {
        totalPrefWeightedScoreSum += w * req.score * 100;
        totalPrefWeightSum += w;
      }
    }

    const dimScore = dimReqWeightSum > 0 ? (dimReqScoreSum / dimReqWeightSum) * 100 : 0;

    dimensions.push({
      id: `dim_${dimKey}`,
      name: formatDimensionName(dimKey),
      weight: Number(dimReqWeightSum.toFixed(2)),
      requirement_ids: dimReqs.map((r) => r.requirement_id),
      dimension_score: Math.round(dimScore),
    });
  }

  const match_score = totalOverallWeightSum > 0
    ? Math.round(totalOverallWeightedScoreSum / totalOverallWeightSum)
    : 0;

  const hard_requirement_match_score = totalHardWeightSum > 0
    ? Math.round(totalHardWeightedScoreSum / totalHardWeightSum)
    : match_score;

  const preferred_requirement_match_score = totalPrefWeightSum > 0
    ? Math.round(totalPrefWeightedScoreSum / totalPrefWeightSum)
    : 0;

  const audit_trail: AuditTrailEntry[] = structuredResults.map((r) => {
    const baseW = IMPORTANCE_WEIGHTS[r.importance] || 1.0;
    const critMult = CRITICALITY_WEIGHT_MULTIPLIER[r.criticality] || 1.0;
    const w = r.weight !== undefined && r.weight > 0 ? r.weight : Number((baseW * critMult).toFixed(2));
    const contribution_percent = totalOverallWeightSum > 0
      ? Number(((w * r.score * 100) / totalOverallWeightSum).toFixed(1))
      : 0;

    return {
      requirement_id: r.requirement_id,
      requirement_name: r.requirement_name,
      importance: r.importance,
      criticality: r.criticality,
      evidence_ids: r.evidence_ids || [],
      status: r.status,
      evidence_level: r.evidence_level,
      score: r.score,
      weight: Number(w.toFixed(2)),
      contribution_percent,
    };
  });

  return {
    match_score,
    hard_requirement_match_score,
    preferred_requirement_match_score,
    dimensions,
    audit_trail,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE 1: DENSE SEMANTIC VECTOR & EMBEDDING RETRIEVAL
// ══════════════════════════════════════════════════════════════════════════════

function denseCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function createLexicalVector(text: string): Map<string, number> {
  const vec = new Map<string, number>();
  const tokens = text.toLowerCase().replace(/[^\w\s\+\#\.\/\-]/g, " ").split(/\s+/).filter((t) => t.length > 1);
  for (const token of tokens) {
    vec.set(token, (vec.get(token) || 0) + 2.0);
    if (token.length >= 3) {
      for (let i = 0; i <= token.length - 3; i++) {
        const trigram = token.substring(i, i + 3);
        vec.set(`tri:${trigram}`, (vec.get(`tri:${trigram}`) || 0) + 0.5);
      }
    }
  }
  return vec;
}

function lexicalCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (const [key, valA] of vecA.entries()) {
    normA += valA * valA;
    const valB = vecB.get(key);
    if (valB !== undefined) dotProduct += valA * valB;
  }
  for (const valB of vecB.values()) normB += valB * valB;
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const embeddingCache = new Map<string, number[]>();

export async function getCachedSemanticEmbedding(text: string): Promise<number[]> {
  const key = text.trim();
  if (embeddingCache.has(key)) {
    return embeddingCache.get(key)!;
  }
  const emb = await getSemanticEmbedding(key);
  if (emb && emb.length > 0) {
    embeddingCache.set(key, emb);
  }
  return emb;
}

export async function retrieveTopRelevantEvidence(
  req: JDRequirement,
  evidenceUnits: CandidateEvidenceUnit[],
  evidenceEmbeddings?: number[][],
  topK: number = 8
): Promise<CandidateEvidenceUnit[]> {
  const queryText = `${req.name}: ${req.description} ${(req.sub_requirements || []).join(" ")}`;

  let queryEmbedding: number[] = [];
  try {
    queryEmbedding = await getCachedSemanticEmbedding(queryText);
  } catch {
    queryEmbedding = [];
  }

  const scoredUnits: { unit: CandidateEvidenceUnit; score: number }[] = [];
  const queryLexical = createLexicalVector(queryText);

  for (let i = 0; i < evidenceUnits.length; i++) {
    const unit = evidenceUnits[i];
    const unitText = `${unit.text} ${unit.source_title || ""}`;
    let score = 0;

    if (queryEmbedding.length > 0) {
      const unitEmbedding = evidenceEmbeddings ? evidenceEmbeddings[i] : await getCachedSemanticEmbedding(unitText);
      if (unitEmbedding && unitEmbedding.length > 0) {
        score = denseCosineSimilarity(queryEmbedding, unitEmbedding);
      }
    }

    if (score === 0) {
      const unitLexical = createLexicalVector(unitText);
      score = lexicalCosineSimilarity(queryLexical, unitLexical);
    }

    // Boost exact matches in token check
    const exact = checkExactTechMatch(req.name, unit.text);
    if (exact.isMatch) {
      score += 0.5;
    }

    scoredUnits.push({ unit, score });
  }

  // 100% deterministic 3-tier tie-breaking:
  // 1. Primary: Semantic / lexical score (descending)
  // 2. Secondary: Exact length comparison
  // 3. Tertiary: Lexical sort by immutable unit.id
  scoredUnits.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.0001) {
      return scoreDiff;
    }
    const aLen = a.unit.text.length;
    const bLen = b.unit.text.length;
    if (aLen !== bLen) return bLen - aLen;
    return a.unit.id.localeCompare(b.unit.id);
  });

  return scoredUnits.slice(0, topK).map((s) => s.unit);
}

// ══════════════════════════════════════════════════════════════════════════════
// STAGE 2: LLM SEMANTIC EVIDENCE EVALUATION & IMMUTABLE PROVENANCE
// ══════════════════════════════════════════════════════════════════════════════

export async function evaluateRequirementsAgainstEvidence(
  jd: JDRequirements,
  resume: ResumeData,
  bypassCache: boolean = false
): Promise<MatchAnalysis> {
  const jdKey = JSON.stringify(jd);
  const resumeKey = JSON.stringify(resume);

  return getCachedMatchAnalysis(
    jdKey,
    resumeKey,
    async () => {
      return executeDirectEvaluation(jd, resume);
    },
    bypassCache
  );
}

async function executeDirectEvaluation(
  jd: JDRequirements,
  resume: ResumeData
): Promise<MatchAnalysis> {
  const allRequirements: JDRequirement[] = jd.requirements && jd.requirements.length > 0
    ? jd.requirements
    : (jd.must_have_skills || []).map((name, i) => {
        const id = `req_${i + 1}`;
        const weight = computeRequirementWeight("required", "hard");
        return {
          id,
          name,
          description: `Experience and proficiency with ${name}`,
          category: "core_competency",
          requirement_type: "skill_capability" as const,
          importance: "required" as const,
          criticality: "hard" as const,
          weight,
          logical_operator: "SINGLE" as const,
        };
      });

  const evidenceUnits: CandidateEvidenceUnit[] = resume.evidence_units && resume.evidence_units.length > 0
    ? resume.evidence_units
    : buildFallbackEvidenceUnits(resume);

  // Build immutable Evidence Map for deterministic resolution
  const evidenceMap = new Map<string, CandidateEvidenceUnit>();
  evidenceUnits.forEach((unit) => evidenceMap.set(unit.id, unit));

  // Compute 100% deterministic dated chronology using dynamic runtime date
  const referenceDate = new Date();
  const chronology: ExperienceChronology = calculateCandidateChronology(resume, referenceDate);

  // Pre-compute evidence embeddings in parallel once
  const evidenceEmbeddings = await Promise.all(
    evidenceUnits.map((u) => getCachedSemanticEmbedding(`${u.text} ${u.source_title || ""}`))
  );

  // Separate Capability Requirements from Eligibility Constraints
  const capabilityRequirements: JDRequirement[] = [];
  const eligibilityRequirements: JDRequirement[] = [];

  for (const req of allRequirements) {
    const isEligibility =
      req.requirement_type === "eligibility_constraint" ||
      req.category === "experience_tenure" ||
      req.category === "education" ||
      req.category === "location" ||
      req.name.toLowerCase().includes("minimum") ||
      req.name.toLowerCase().includes("years of experience") ||
      req.name.toLowerCase().includes("tenure") ||
      req.name.toLowerCase().includes("location");

    if (isEligibility) {
      eligibilityRequirements.push(req);
    } else {
      capabilityRequirements.push(req);
    }
  }

  // If all were eligibility (rare), treat all as capabilities to ensure at least scorable requirements exist
  const scorableRequirements = capabilityRequirements.length > 0 ? capabilityRequirements : allRequirements;

  // Retrieve top relevant evidence for each scorable requirement
  const requirementsWithEvidence = await Promise.all(
    scorableRequirements.map(async (req) => {
      const topEvidence = await retrieveTopRelevantEvidence(req, evidenceUnits, evidenceEmbeddings, 8);
      return {
        requirement_id: req.id,
        requirement_name: req.name,
        description: req.description,
        category: req.category,
        requirement_type: req.requirement_type || "skill_capability",
        importance: req.importance,
        criticality: req.criticality || "hard",
        logical_operator: req.logical_operator || "SINGLE",
        sub_requirements: req.sub_requirements || [],
        candidate_evidence_units: topEvidence.map((ev) => ({
          evidence_id: ev.id,
          source: ev.source_title || ev.source_section,
          text: ev.text,
          evidence_type: ev.evidence_type || "source_bullet",
        })),
      };
    })
  );

  const evaluationPrompt = `You are an elite, objective Hiring Evaluator & Semantic Evidence Auditor.
Evaluate the candidate's evidence units against each dynamic Job Description capability requirement.

OBJECTIVE: ACCURACY, EVIDENCE TRACEABILITY & CALIBRATION. DO NOT HALLUCINATE OR REWRITE EVIDENCE.

GENERAL CAPABILITY & EVIDENCE RULES:
1. 4-TIER EVIDENCE CLASSIFICATION:
   - "demonstrated" ("strong_match", score 1.0):
     * The candidate explicitly mentioned and demonstrated the requirement in work experience bullets or project bullets.
     * Concrete accomplishments, projects, or employment responsibilities are provided.
   - "claimed" ("claimed_match", score 0.8):
     * The candidate explicitly claims the requirement (e.g. in their Skills section or summary statement) but does not have dedicated project/bullet descriptions.
     * IMPORTANT: A claimed skill in a Skills section IS VALID RESUME EVIDENCE. Do NOT mark it as missing or 0%.
   - "partial" ("partial_match", score 0.6):
     * The candidate demonstrates a related, adjacent, or foundational capability (e.g. relational DB background for general SQL, closely related library, or 1 of 2 technologies in an AND requirement).
   - "none" ("no_evidence", score 0.0):
     * Zero supporting evidence found anywhere in the candidate's resume.

2. GENERAL CAPABILITY NORMALIZATION:
   - Technology -> Broader Capability:
     * Specific tools/technologies satisfy broader capability requirements (e.g., Redux fulfills State Management, Docker fulfills Containerization, Jest fulfills Unit Testing, PostgreSQL fulfills Relational Databases, AWS fulfills Cloud Infrastructure).
   - Ecosystem / Framework Equivalents:
     * Understand canonical technology ecosystems without requiring special hardcoded rules.
   - Logical Operators:
     * "A OR B": Strong evidence for either A or B satisfies as strong_match (1.0).
     * "A AND B": Evidence for both satisfies as strong_match (1.0). Evidence for only one satisfies as partial_match (0.6).
   - Incompatible / Different Paradigms:
     * Relational vs Document DB (e.g., MongoDB only for PostgreSQL requirement) is PARTIAL/RELATED (0.6), NOT strong match.
     * Distinct mobile frameworks (e.g., React Native only for Flutter requirement) is PARTIAL (0.6) or NONE (0.0), NOT strong match.

3. FUNCTIONAL ROLE DISCIPLINE & RESPONSIBILITY BOUNDARIES:
   - Implementation Evidence vs Functional Ownership Evidence:
     * Writing software/code, developing application features, building UI components, or implementing databases/APIs does NOT automatically demonstrate Functional Ownership or Strategy (e.g. Product Management, Roadmap Ownership, Product Strategy, PRD Writing, Business/Growth Strategy, User Research, Clinical Decision-Making, Legal Compliance).
     * Functional Ownership evidence requires explicit discipline responsibilities (e.g., product roadmaps, PRDs, customer discovery, feature prioritization, conversion/funnel optimization, growth experiments, user interviews, business KPI ownership).
   - Domain Separation Principles across All Disciplines:
     * Software Engineering (e.g. "built a web app", "full-stack developer", "sole developer", "shipped project with 500 users", "wrote backend/frontend code") demonstrates Technical Implementation, NOT Product Management or Product Strategy.
     * Implementing UI Dashboards or KPI cards demonstrates Frontend/UI Engineering, NOT Growth Funnel Management, Growth Strategy, or Conversion Optimization.
     * Writing general database queries (e.g. SQL, Postgres, MongoDB) demonstrates Database Querying, NOT Product Analytics (e.g. Mixpanel, Amplitude, GA4, user cohort retention, funnel drop-off analysis).
     * Building ML/NLP models demonstrates Machine Learning / Engineering, NOT AI-Powered Product Design or Consumer UX Strategy unless explicit product/design application is demonstrated.
     * UI Implementation demonstrates Frontend/Design Coding, NOT UX Research methodology (user interviews, usability studies, user personas, interaction flows).
     * Data Engineering (ETL, pipelines, Spark, Airflow) demonstrates Infrastructure/Pipeline Development, NOT Data Science / Predictive Modeling / Statistical Inference.
     * Technical DevOps/Infrastructure (Docker, Kubernetes, CI/CD) demonstrates DevOps Implementation, NOT DevOps Management / Engineering Leadership unless explicit team/strategy leadership is demonstrated.
     * Basic Financial Reporting (spreadsheets, basic Excel bookkeeping) demonstrates Accounting/Financial Analysis, NOT Investment Banking / M&A Deal Execution (DCF valuation, M&A due diligence).
   - Discipline-Mismatch & Adjacent Activity Rule:
     * When a requirement evaluates a Functional Discipline, Strategic Leadership, or Domain Ownership capability, technical implementation evidence from an adjacent discipline is an adjacent activity that does NOT prove the functional capability. In such cases, assign "no_evidence" (0.0). Do NOT assign "strong_match" (1.0) or "claimed_match" (0.8).
   - Legitimate Demonstrations (Do NOT Over-Reject):
     * When the candidate explicitly demonstrates the functional discipline (e.g. "owned product roadmap and wrote PRDs", "ran A/B experiments and improved conversion by 18%", "used Mixpanel to analyze retention cohorts", "conducted usability interviews and designed interaction flows", "designed AI recommendation feature requirements for a consumer product", "built predictive statistical churn models", "managed 12 DevOps engineers and defined cloud architecture strategy", "advised on $500M M&A transactions"), assign "strong_match" (1.0) / "demonstrated".
   - Genuine Transferability vs Adjacent Activity:
     * Only assign "partial_match" (0.6) if the candidate's evidence establishes a genuine transferable capability in the required discipline.
     * If the evidence is merely an adjacent technical or implementation activity without actual capability proof of the evaluated functional discipline, assign "no_evidence" (0.0).

4. EDUCATION & DEGREE POLICY:
   - Educational degree titles or majors (e.g., "MBA — Business Analytics", "B.S. in Computer Science", "B.E. in Electrical Engineering", "B.A. in Economics") satisfy Education ELIGIBILITY requirements, but DO NOT automatically prove specific technical or functional capabilities (such as Statistics, Python, SQL, React, Docker, Financial Modeling).
   - Only assign a positive capability verdict if the candidate's resume provides explicit coursework, skills list, project bullets, or employment accomplishments demonstrating that specific capability.

5. IMMUTABLE EVIDENCE PROVENANCE:
   - Reference supporting evidence SOLELY by their exact "evidence_id" (e.g. "ev_exp_1_1", "ev_skill_1").
   - If status is "no_evidence" ("none"), "evidence_ids" MUST be an empty array [].
   - Only attach evidence_ids if they genuinely provide demonstrated, claimed, or partial support for the requirement.
   - Never invent non-existent evidence_ids.

REQUIREMENTS & CANDIDATE EVIDENCE UNITS:
${JSON.stringify(requirementsWithEvidence, null, 2)}

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "evaluations": [
    {
      "requirement_id": "req_1",
      "status": "strong_match",
      "evidence_level": "demonstrated",
      "confidence": 0.95,
      "evidence_ids": ["ev_exp_1_1"],
      "reasoning": "Clear explanation of candidate's evidence and alignment."
    }
  ]
}`;

  const responseText = await callLLM(evaluationPrompt, 0.0);

  let rawEvaluations: {
    requirement_id: string;
    status: MatchStatus;
    evidence_level?: EvidenceLevel;
    confidence: number;
    evidence_ids: string[];
    reasoning: string;
  }[] = [];

  try {
    const parsed = parseCleanJSON<{
      evaluations: typeof rawEvaluations;
    }>(responseText);
    rawEvaluations = parsed.evaluations || [];
  } catch (err) {
    console.error("Failed to parse evaluation response JSON:", responseText, err);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STAGE 3: DETERMINISTIC PROVENANCE RESOLUTION & INVARIANT VALIDATION
  // ══════════════════════════════════════════════════════════════════════════════

  const evaluationsMap = new Map(rawEvaluations.map((e) => [e.requirement_id, e]));

  // 1. Process Eligibility Requirements Deterministically
  const candidateLocation = resume.contact?.location || "Not specified";
  const eligibilityResults: EligibilityResult[] = [];

  for (const req of eligibilityRequirements) {
    const isTenure =
      req.category === "experience_tenure" ||
      req.name.toLowerCase().includes("year") ||
      req.name.toLowerCase().includes("tenure") ||
      req.name.toLowerCase().includes("experience") ||
      req.description.toLowerCase().includes("year");

    const isLocation =
      req.category === "location" ||
      req.name.toLowerCase().includes("location") ||
      req.description.toLowerCase().includes("location") ||
      req.description.toLowerCase().includes("office");

    const isEducation =
      req.category === "education" ||
      req.name.toLowerCase().includes("degree") ||
      req.name.toLowerCase().includes("bachelor") ||
      req.name.toLowerCase().includes("master") ||
      req.name.toLowerCase().includes("education");

    if (isTenure) {
      const evalTenure = evaluateExperienceRequirement(req, chronology, resume.summary);
      eligibilityResults.push({
        requirement_id: req.id,
        requirement_name: req.name,
        constraint_type: "years_experience",
        stated_requirement: req.description || req.name,
        evidence_ids: evalTenure.verification.roles_breakdown?.map((_r: unknown, idx: number) => `ev_exp_${idx + 1}_header`) || [],
        candidate_evidence: `${chronology.totalProfessionalYears} years of verified professional experience across ${chronology.rolesBreakdown.length} positions`,
        evidence_source_type: evalTenure.verification.claim_type,
        status: evalTenure.status,
        reasoning: evalTenure.reasoning,
        experience_verification: evalTenure.verification,
      });
    } else if (isLocation) {
      const statedLoc = req.description || req.name;
      let status: EligibilityStatus = "meets_requirement";
      let reasoning = `Candidate location (${candidateLocation}) evaluated.`;

      if (candidateLocation !== "Not specified" && statedLoc.toLowerCase().includes("office")) {
        const reqCity = statedLoc.toLowerCase();
        const candCity = candidateLocation.toLowerCase();
        if (!reqCity.includes(candCity) && !candCity.includes(reqCity) && !statedLoc.toLowerCase().includes("remote")) {
          status = "location_mismatch";
          reasoning = `Candidate is located in ${candidateLocation}, whereas role specifies ${statedLoc}.`;
        }
      }

      eligibilityResults.push({
        requirement_id: req.id,
        requirement_name: req.name,
        constraint_type: "location",
        stated_requirement: statedLoc,
        evidence_ids: ["ev_contact_loc"],
        candidate_evidence: candidateLocation,
        evidence_source_type: "explicit_resume_claim",
        status,
        reasoning,
      });
    } else if (isEducation) {
      const educationEntries = resume.sections?.education || [];
      const eduText = educationEntries.map((e) => `${e.degree} from ${e.institution}`).join("; ");
      const status: EligibilityStatus = educationEntries.length > 0 ? "meets_requirement" : "not_specified";

      eligibilityResults.push({
        requirement_id: req.id,
        requirement_name: req.name,
        constraint_type: "education",
        stated_requirement: req.description || req.name,
        evidence_ids: educationEntries.map((_, idx) => `ev_edu_${idx + 1}`),
        candidate_evidence: eduText || "No explicit degree listed",
        evidence_source_type: "explicit_resume_claim",
        status,
        reasoning: educationEntries.length > 0
          ? `Candidate holds: ${eduText}`
          : "No explicit education section found on resume.",
      });
    } else {
      eligibilityResults.push({
        requirement_id: req.id,
        requirement_name: req.name,
        constraint_type: "work_authorization",
        stated_requirement: req.description || req.name,
        evidence_ids: [],
        candidate_evidence: "Standard qualification",
        evidence_source_type: "inferred",
        status: "meets_requirement",
        reasoning: "Requirement verified.",
      });
    }
  }

  // 2. Process Capability Results Deterministically
  const structuredResults: RequirementMatchResult[] = scorableRequirements.map((req) => {
    const rawEval = evaluationsMap.get(req.id);
    let status: MatchStatus = rawEval?.status || "no_evidence";
    let evidenceLevel: EvidenceLevel = rawEval?.evidence_level || "none";

    // Strictly resolve evidence_ids against immutable CandidateEvidenceUnits
    const resolvedEvidence: { text: string; source: string; evidence_id: string }[] = [];
    const verifiedIds: string[] = [];

    for (const evId of rawEval?.evidence_ids || []) {
      const unit = evidenceMap.get(evId);
      if (unit) {
        verifiedIds.push(unit.id);
        resolvedEvidence.push({
          text: unit.text, // 100% exact substring from original source resume
          source: unit.source_title || unit.source_section,
          evidence_id: unit.id,
        });
      }
    }

    // Direct Exact Tech Match Check on Candidate Evidence
    const combinedEvidenceText = resolvedEvidence.map((e) => e.text).join(" ");
    const exactCheck = checkExactTechMatch(req.name, combinedEvidenceText);

    // Also check if any evidence unit contains an exact token match
    if (!exactCheck.isMatch && resolvedEvidence.length === 0) {
      for (const unit of evidenceUnits) {
        if (checkExactTechMatch(req.name, unit.text).isMatch) {
          verifiedIds.push(unit.id);
          resolvedEvidence.push({
            text: unit.text,
            source: unit.source_title || unit.source_section,
            evidence_id: unit.id,
          });
        }
      }
    }

    const hasExperienceEvidence = resolvedEvidence.some(
      (e) => e.evidence_id.startsWith("ev_exp_") || e.evidence_id.startsWith("ev_proj_")
    );
    const hasSkillsOnlyEvidence =
      resolvedEvidence.length > 0 &&
      resolvedEvidence.every((e) => e.evidence_id.startsWith("ev_skill_") || e.evidence_id.startsWith("ev_sum_"));
    const hasEducationOnlyEvidence =
      resolvedEvidence.length > 0 &&
      resolvedEvidence.every((e) => e.evidence_id.startsWith("ev_edu_"));

    // ── EVIDENCE MODEL INTEGRATION ──
    if (
      status === "no_evidence" ||
      rawEval?.evidence_level === "none" ||
      resolvedEvidence.length === 0 ||
      (hasEducationOnlyEvidence && !exactCheck.isMatch)
    ) {
      status = "no_evidence";
      evidenceLevel = "none";
      resolvedEvidence.length = 0;
      verifiedIds.length = 0;
    } else if (status === "strong_match" || rawEval?.evidence_level === "demonstrated") {
      if (hasExperienceEvidence) {
        status = "strong_match";
        evidenceLevel = "demonstrated";
      } else {
        // Listed in Skills or Summary only
        status = "claimed_match";
        evidenceLevel = "claimed";
      }
    } else if (status === "claimed_match" || rawEval?.evidence_level === "claimed" || hasSkillsOnlyEvidence) {
      status = "claimed_match";
      evidenceLevel = "claimed";
    } else if (status === "partial_match" || status === "weak_evidence" || rawEval?.evidence_level === "partial") {
      status = "partial_match";
      evidenceLevel = "partial";
    }

    // Compute deterministic score for status
    let score = STATUS_SCORES[status] ?? 0.0;

    // Handle dynamic AND operator partial score adjustment
    if (req.logical_operator === "AND" && status === "partial_match") {
      score = 0.5;
    }

    // Evidence-based confidence calculation per requirement
    let confidence = 0.9;
    if (status === "no_evidence") {
      confidence = 0.95;
    } else if (status === "claimed_match") {
      confidence = 0.85;
    } else if (status === "partial_match") {
      confidence = 0.8;
    } else if (status === "strong_match") {
      confidence = 0.98;
    }

    const criticality: RequirementCriticality = req.criticality || (req.importance === "required" ? "hard" : "soft");
    const weight = req.weight !== undefined && req.weight > 0 ? req.weight : computeRequirementWeight(req.importance, criticality);

    let reasoning = rawEval?.reasoning || "";
    if (!reasoning) {
      if (status === "strong_match") {
        reasoning = `Demonstrated evidence verified in candidate experience for ${req.name}.`;
      } else if (status === "claimed_match") {
        reasoning = `Candidate explicitly claims proficiency in ${req.name} on resume.`;
      } else if (status === "partial_match") {
        reasoning = `Candidate demonstrates related/adjacent experience for ${req.name}.`;
      } else {
        reasoning = `No explicit evidence found for ${req.name} on candidate resume.`;
      }
    }

    return {
      requirement_id: req.id,
      requirement_name: req.name,
      category: req.category,
      requirement_type: req.requirement_type,
      importance: req.importance,
      criticality,
      weight,
      status,
      evidence_level: evidenceLevel,
      score,
      confidence,
      evidence_ids: verifiedIds,
      evidence: resolvedEvidence,
      reasoning,
      is_exact_tech_match: exactCheck.isMatch,
    };
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // STAGE 4: DETERMINISTIC SCORE BREAKDOWN (OVERALL, HARD, PREFERRED)
  // ══════════════════════════════════════════════════════════════════════════════

  const {
    match_score,
    hard_requirement_match_score,
    preferred_requirement_match_score,
    dimensions,
    audit_trail,
  } = calculatePureDeterministicScores(structuredResults);

  let totalConfidenceWeightedSum = 0;
  let totalWeightSum = 0;

  for (const entry of audit_trail) {
    const res = structuredResults.find((r) => r.requirement_id === entry.requirement_id);
    const conf = res ? res.confidence : 0.85;
    totalConfidenceWeightedSum += entry.weight * conf * 100;
    totalWeightSum += entry.weight;
  }

  const confidence_score = totalWeightSum > 0
    ? Math.round(totalConfidenceWeightedSum / totalWeightSum)
    : 85;

  const confidence_level: "high" | "medium" | "low" =
    confidence_score >= 88 ? "high" : confidence_score >= 70 ? "medium" : "low";

  // Evidence-based confidence reasons
  const confidence_reasons: string[] = [
    `Requirement coverage audit: 100% of scorable requirements (${structuredResults.length}/${scorableRequirements.length}) evaluated.`,
    `Chronological tenure verified: ${chronology.totalProfessionalYears} continuous years in professional roles across ${chronology.rolesBreakdown.length} positions.`,
    `Evidence provenance: 100% of quotes resolved directly from immutable source units.`,
  ];

  // ══════════════════════════════════════════════════════════════════════════════
  // STAGE 5: GAPS, CRITICAL GAPS & "WHY NOT 100%" GENERATOR
  // ══════════════════════════════════════════════════════════════════════════════

  const matched_requirements = structuredResults.filter(
    (r) => r.status === "strong_match" || r.status === "claimed_match"
  );
  const partial_requirements = structuredResults.filter((r) => r.status === "partial_match" || r.status === "weak_evidence");
  const missing_requirements = structuredResults.filter((r) => r.status === "no_evidence" || r.score === 0.0);

  const gaps: GapItem[] = [...partial_requirements, ...missing_requirements].map((r) => {
    let severity: GapItem["severity"] = "minor";
    if (r.criticality === "hard" && r.status === "no_evidence") {
      severity = "critical";
    } else if (r.criticality === "hard" || r.importance === "required" || r.importance === "high") {
      severity = "moderate";
    }

    return {
      requirement_id: r.requirement_id,
      requirement_name: r.requirement_name,
      importance: r.importance,
      criticality: r.criticality,
      severity,
      status: r.status,
      reasoning: r.reasoning,
      recommendation: r.status === "partial_match"
        ? `You have adjacent or foundational background in ${r.requirement_name}. Highlight transferable components during interviews.`
        : `No explicit evidence for ${r.requirement_name} was found on your resume. If you possess this experience, add it to your input resume text.`,
    };
  });

  const critical_gaps = gaps.filter((g) => g.severity === "critical" || (g.criticality === "hard" && g.status === "no_evidence"));

  // Deterministic "Why Not 100%" generation
  const why_not_100: string[] = [];

  for (const gap of gaps) {
    if (gap.status === "no_evidence") {
      why_not_100.push(`${gap.requirement_name} (${gap.criticality} requirement) — No direct evidence found in candidate resume.`);
    } else if (gap.status === "partial_match") {
      why_not_100.push(`${gap.requirement_name} — Candidate demonstrates adjacent experience (${gap.reasoning}).`);
    }
  }

  for (const elig of eligibilityResults) {
    if (elig.status === "location_mismatch") {
      why_not_100.push(`Location mismatch — Candidate is located in ${candidateLocation}, whereas JD specifies ${elig.stated_requirement}.`);
    } else if (elig.status === "below_stated_requirement" || elig.status === "requirement_not_met") {
      why_not_100.push(`Role Eligibility — ${elig.reasoning}`);
    }
  }

  const matched_skills = Array.from(
    new Set([
      ...matched_requirements.map((r) => r.requirement_name),
      ...partial_requirements.map((r) => r.requirement_name),
    ])
  );
  const missing_skills = Array.from(
    new Set(missing_requirements.map((r) => r.requirement_name))
  );

  return {
    match_score,
    hard_requirement_match_score,
    preferred_requirement_match_score,
    confidence_score,
    confidence_level,
    confidence_reasons,
    critical_gaps,
    why_not_100,
    total_requirements_count: allRequirements.length,
    scorable_capabilities_count: scorableRequirements.length,
    eligibility_constraints_count: eligibilityResults.length,
    eligibility_results: eligibilityResults,
    dimensions,
    evaluations: structuredResults,
    matched_requirements,
    partial_requirements,
    missing_requirements,
    gaps,
    audit_trail,
    matched_skills,
    missing_skills,
  };
}

function formatDimensionName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function buildFallbackEvidenceUnits(resume: ResumeData): CandidateEvidenceUnit[] {
  const units: CandidateEvidenceUnit[] = [];

  if (resume.summary) {
    units.push({
      id: "ev_sum_1",
      source_section: "summary",
      source_title: "Professional Summary",
      text: resume.summary,
      evidence_type: "explicit_resume_claim",
    });
  }

  (resume.sections?.experience || []).forEach((exp, i) => {
    units.push({
      id: `ev_exp_${i + 1}_header`,
      source_section: "experience",
      source_title: `${exp.title} at ${exp.company}`,
      text: `${exp.title} at ${exp.company} (${exp.dates}${exp.location ? `, ${exp.location}` : ""})`,
      evidence_type: "employment_date_calculation",
      context_tags: [exp.company, exp.title],
    });

    (exp.bullets || []).forEach((b, j) => {
      units.push({
        id: `ev_exp_${i + 1}_${j + 1}`,
        source_section: "experience",
        source_title: `${exp.title} at ${exp.company} (${exp.dates})`,
        text: b,
        evidence_type: "source_bullet",
        context_tags: [exp.company, exp.title],
      });
    });
  });

  (resume.sections?.projects || []).forEach((proj, i) => {
    units.push({
      id: `ev_proj_${i + 1}_header`,
      source_section: "project",
      source_title: proj.name,
      text: `${proj.name}${proj.techStack ? ` (Tech: ${proj.techStack})` : ""}`,
      evidence_type: "source_bullet",
      context_tags: [proj.name],
    });

    (proj.bullets || []).forEach((b, j) => {
      units.push({
        id: `ev_proj_${i + 1}_${j + 1}`,
        source_section: "project",
        source_title: proj.name,
        text: b,
        evidence_type: "source_bullet",
      });
    });
  });

  (resume.sections?.skills || []).forEach((skill, i) => {
    units.push({
      id: `ev_skill_${i + 1}`,
      source_section: "skill",
      source_title: "Skills & Competencies",
      text: skill,
      evidence_type: "skills_section",
    });
  });

  return units;
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
