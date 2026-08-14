import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { calculatePureDeterministicScores, evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";
import { JDRequirements, RequirementMatchResult, ResumeData } from "../types";

async function runConsistencyAndDeterminismAudit() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║           FINAL SCORING CONSISTENCY & DETERMINISM AUDIT         ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let total = 0;

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1 — DETERMINISTIC SCORING LAYER (10/10 Identical Invariant)
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("▶ 1. Pure Deterministic Scoring Test (10 repeated identical calculations)...");

  const mockEvaluations: RequirementMatchResult[] = [
    {
      requirement_id: "req_1",
      requirement_name: "Mobile App Development with Flutter",
      category: "engineering",
      importance: "required",
      criticality: "hard",
      status: "weak_evidence",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: [],
      evidence: [],
      reasoning: "No Flutter evidence found.",
    },
    {
      requirement_id: "req_2",
      requirement_name: "Backend & Database with Supabase / PostgreSQL",
      category: "engineering",
      importance: "required",
      criticality: "hard",
      status: "weak_evidence",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: ["ev_skill_1"],
      evidence: [{ text: "SQL", source: "skills", evidence_id: "ev_skill_1" }],
      reasoning: "SQL in skills only; no PostgreSQL backend engineering.",
    },
    {
      requirement_id: "req_3",
      requirement_name: "Firebase Cloud Services",
      category: "engineering",
      importance: "required",
      criticality: "hard",
      status: "no_evidence",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: [],
      evidence: [],
      reasoning: "No Firebase evidence.",
    },
    {
      requirement_id: "req_4",
      requirement_name: "REST APIs",
      category: "engineering",
      importance: "required",
      criticality: "hard",
      status: "no_evidence",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: [],
      evidence: [],
      reasoning: "No REST API engineering evidence.",
    },
    {
      requirement_id: "req_5",
      requirement_name: "Git & Version Control",
      category: "engineering",
      importance: "required",
      criticality: "hard",
      status: "no_evidence",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: [],
      evidence: [],
      reasoning: "No Git evidence.",
    },
    {
      requirement_id: "req_6",
      requirement_name: "Startup Execution & Product Shipping",
      category: "consumer_product_and_growth",
      importance: "required",
      criticality: "hard",
      status: "strong_match",
      score: 1.0,
      confidence: 0.95,
      evidence_ids: ["ev_exp_1"],
      evidence: [{ text: "Built PW Store to ₹200Cr+ revenue", source: "experience", evidence_id: "ev_exp_1" }],
      reasoning: "Demonstrated 0-to-1 scaling.",
    },
    {
      requirement_id: "req_7",
      requirement_name: "AI Integrations & LLM Workflows",
      category: "ai_technology",
      importance: "preferred",
      criticality: "preferred",
      status: "strong_match",
      score: 1.0,
      confidence: 0.95,
      evidence_ids: ["ev_exp_2"],
      evidence: [{ text: "Agentic AI/LLM workflows", source: "experience", evidence_id: "ev_exp_2" }],
      reasoning: "Central AI lead.",
    },
    {
      requirement_id: "req_8",
      requirement_name: "0-to-1 Ownership",
      category: "consumer_product_and_growth",
      importance: "preferred",
      criticality: "preferred",
      status: "strong_match",
      score: 1.0,
      confidence: 0.95,
      evidence_ids: ["ev_exp_1"],
      evidence: [{ text: "Built product from zero", source: "experience", evidence_id: "ev_exp_1" }],
      reasoning: "0-to-1 launch track record.",
    },
  ];

  const scores: number[] = [];
  const hardScores: number[] = [];
  const prefScores: number[] = [];

  for (let i = 0; i < 10; i++) {
    const res = calculatePureDeterministicScores(mockEvaluations);
    scores.push(res.match_score);
    hardScores.push(res.hard_requirement_match_score);
    prefScores.push(res.preferred_requirement_match_score);
  }

  const allScoresEqual = scores.every((s) => s === scores[0]);
  const allHardEqual = hardScores.every((s) => s === hardScores[0]);
  const allPrefEqual = prefScores.every((s) => s === prefScores[0]);

  if (allScoresEqual && allHardEqual && allPrefEqual && scores[0] === 21) {
    console.log(`  ✅ [PASS] 10/10 repeated identical scores: Overall=${scores[0]}%, Hard=${hardScores[0]}%, Preferred=${prefScores[0]}%.`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Non-deterministic scores detected:`, scores);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2 — RELATED-SKILL TEST (SQL vs PostgreSQL)
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ 2. Related-Skill Test: SQL in skills only vs Explicit PostgreSQL backend evidence...");

  const postgresJD: JDRequirements = {
    role_title: "Database Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["PostgreSQL Backend Development"],
    nice_to_have_skills: [],
    keywords: ["PostgreSQL"],
    summary_keywords: ["PostgreSQL"],
    requirements: [
      {
        id: "req_pg",
        name: "PostgreSQL Backend Development",
        description: "Designing PostgreSQL relational schemas and backend database services",
        category: "database",
        requirement_type: "skill_capability",
        importance: "required",
        criticality: "hard",
        logical_operator: "SINGLE",
      },
    ],
  };

  // Case A: Resume with only generic "SQL" in skills
  const resumeWithGenericSql: ResumeData = {
    contact: { name: "Analyst", email: "a@test.com", phone: "123", location: "Remote", links: [] },
    summary: "Business analyst.",
    sections: {
      experience: [
        {
          company: "Corp",
          title: "Analyst",
          dates: "2022 – Present",
          bullets: ["Ran basic data queries."],
        },
      ],
      projects: [],
      skills: ["SQL", "Excel", "Power BI"],
      education: [],
      certifications: [],
    },
  };

  // Case B: Resume with explicit PostgreSQL backend engineering
  const resumeWithPostgres: ResumeData = {
    contact: { name: "DB Eng", email: "db@test.com", phone: "123", location: "Remote", links: [] },
    summary: "Backend engineer specializing in PostgreSQL.",
    sections: {
      experience: [
        {
          company: "Data Core",
          title: "Database Engineer",
          dates: "2022 – Present",
          bullets: [
            "Built backend services using PostgreSQL and designed relational schemas with partitioned tables.",
          ],
        },
      ],
      projects: [],
      skills: ["PostgreSQL", "SQL"],
      education: [],
      certifications: [],
    },
  };

  const resGeneric = await evaluateRequirementsAgainstEvidence(postgresJD, resumeWithGenericSql);
  const resExplicit = await evaluateRequirementsAgainstEvidence(postgresJD, resumeWithPostgres);

  const genericScore = resGeneric.evaluations[0]?.score;
  const explicitScore = resExplicit.evaluations[0]?.score;

  console.log(`  • SQL in skills only score: ${genericScore} (Match: ${resGeneric.evaluations[0]?.status})`);
  console.log(`  • Explicit PostgreSQL score: ${explicitScore} (Match: ${resExplicit.evaluations[0]?.status})`);

  if (genericScore === 0.0 && explicitScore === 1.0) {
    console.log("  ✅ [PASS] Related-skill guard verified: generic SQL receives 0.0; explicit PostgreSQL receives 1.0.");
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Related-skill test failed: Generic score = ${genericScore}, Explicit score = ${explicitScore}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3 — SCORABLE VS ELIGIBILITY SEPARATION TEST
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ 3. Scorable Capabilities vs Eligibility Constraints Separation Test...");

  const compoundJD: JDRequirements = {
    role_title: "Software Engineering Intern",
    seniority_signal: "Intern",
    must_have_skills: ["Flutter"],
    nice_to_have_skills: [],
    keywords: ["Flutter"],
    summary_keywords: ["Flutter"],
    requirements: [
      { id: "r1", name: "Flutter", description: "Flutter development", category: "engineering", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r2", name: "Location", description: "Bangalore on-site", category: "location", requirement_type: "eligibility_constraint", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r3", name: "Education", description: "Current student or recent graduate", category: "education", requirement_type: "eligibility_constraint", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const testResume: ResumeData = {
    contact: { name: "Alex Senior", email: "alex@example.com", phone: "123", location: "New Delhi", links: [] },
    summary: "Senior manager with 10 years experience.",
    sections: {
      experience: [{ company: "Tech", title: "Manager", dates: "2016 – Present", bullets: ["Led engineering teams."] }],
      projects: [],
      skills: ["Leadership"],
      education: [],
      certifications: [],
    },
  };

  const resSeparation = await evaluateRequirementsAgainstEvidence(compoundJD, testResume);

  const scorableCount = resSeparation.scorable_capabilities_count;
  const eligCount = resSeparation.eligibility_constraints_count;
  const totalCount = resSeparation.total_requirements_count;

  console.log(`  • Total Requirements Extracted  : ${totalCount}`);
  console.log(`  • Scorable Capability Count     : ${scorableCount}`);
  console.log(`  • Eligibility Constraints Count : ${eligCount}`);

  const eligLocation = resSeparation.eligibility_results?.find((e) => e.stated_requirement.includes("Bangalore"));
  const eligEducation = resSeparation.eligibility_results?.find((e) => e.stated_requirement.includes("student") || e.stated_requirement.includes("graduate"));

  const isLocationMismatch = eligLocation?.status === "location_mismatch";
  const isTargetSeniorityNotMet = eligEducation?.status === "requirement_not_met" || eligEducation?.status === "below_stated_requirement";

  if (
    scorableCount === 1 &&
    eligCount === 2 &&
    totalCount === 3 &&
    isLocationMismatch &&
    isTargetSeniorityNotMet &&
    resSeparation.evaluations.length === 1
  ) {
    console.log("  ✅ [PASS] Eligibility constraints are strictly separated from technical capability denominator!");
    passed++;
  } else {
    console.error("  ❌ [FAIL] Scorable vs Eligibility separation failed:", { scorableCount, eligCount, totalCount, isLocationMismatch, isTargetSeniorityNotMet });
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`  SCORING CONSISTENCY RESULTS: ${passed}/${total} PASSED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runConsistencyAndDeterminismAudit().catch((err) => {
  console.error("Consistency audit error:", err);
  process.exit(1);
});
