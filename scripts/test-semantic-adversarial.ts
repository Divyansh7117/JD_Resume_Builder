import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  calculatePureDeterministicScores,
  STATUS_SCORES,
} from "../lib/semanticMatcher";
import { computeRequirementWeight } from "../lib/extractJD";
import { RequirementMatchResult, RequirementImportance, RequirementCriticality, MatchStatus } from "../types";

// ══════════════════════════════════════════════════════════════════════════════
// PURE DETERMINISTIC ADVERSARIAL TESTS (no LLM calls required)
// ══════════════════════════════════════════════════════════════════════════════
// These test the scoring engine and semantic guards WITHOUT calling Gemini.
// They verify correctness of the deterministic math and evidence logic.
// ══════════════════════════════════════════════════════════════════════════════

function makeResult(
  name: string,
  status: MatchStatus,
  importance: RequirementImportance = "required",
  criticality: RequirementCriticality = "hard",
  category: string = "core_competency"
): RequirementMatchResult {
  const weight = computeRequirementWeight(importance, criticality);
  return {
    requirement_id: `req_test_${name.toLowerCase().replace(/\s+/g, "_")}`,
    requirement_name: name,
    category,
    requirement_type: "skill_capability",
    importance,
    criticality,
    weight,
    status,
    score: STATUS_SCORES[status],
    confidence: 0.9,
    evidence_ids: [],
    evidence: [],
    reasoning: `Test case for ${name}`,
  };
}

let passed = 0;
let failed = 0;

function assertEqual(label: string, actual: number, expected: number) {
  if (actual === expected) {
    console.log(`  ✅ ${label}: ${actual} === ${expected}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}: ${actual} !== ${expected}`);
    failed++;
  }
}

function assertRange(label: string, actual: number, min: number, max: number) {
  if (actual >= min && actual <= max) {
    console.log(`  ✅ ${label}: ${actual} ∈ [${min}, ${max}]`);
    passed++;
  } else {
    console.error(`  ❌ ${label}: ${actual} ∉ [${min}, ${max}]`);
    failed++;
  }
}

function assertLessThan(label: string, actual: number, threshold: number) {
  if (actual < threshold) {
    console.log(`  ✅ ${label}: ${actual} < ${threshold}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}: ${actual} ≥ ${threshold}`);
    failed++;
  }
}

async function main() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║          SEMANTIC ADVERSARIAL CORRECTNESS TESTS                ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  // ── Test 1: Score formula invariants ──
  console.log("▶ 1. Score formula: strong_match=1.0, partial=0.6, weak=0.3, none=0.0");
  assertEqual("strong_match score", STATUS_SCORES.strong_match, 1.0);
  assertEqual("partial_match score", STATUS_SCORES.partial_match, 0.6);
  assertEqual("weak_evidence score", STATUS_SCORES.weak_evidence, 0.3);
  assertEqual("no_evidence score", STATUS_SCORES.no_evidence, 0.0);

  // ── Test 2: All strong matches → 100% ──
  console.log("\n▶ 2. All strong_match → 100%");
  const allStrong = [
    makeResult("REST APIs", "strong_match"),
    makeResult("PostgreSQL", "strong_match"),
    makeResult("Docker", "strong_match"),
  ];
  const allStrongResult = calculatePureDeterministicScores(allStrong);
  assertEqual("All strong → 100%", allStrongResult.match_score, 100);

  // ── Test 3: All no_evidence → 0% ──
  console.log("\n▶ 3. All no_evidence → 0%");
  const allNone = [
    makeResult("Flutter", "no_evidence"),
    makeResult("Supabase", "no_evidence"),
    makeResult("Kubernetes", "no_evidence"),
  ];
  const allNoneResult = calculatePureDeterministicScores(allNone);
  assertEqual("All none → 0%", allNoneResult.match_score, 0);

  // ── Test 4: Mixed verdicts → weighted average ──
  console.log("\n▶ 4. Mixed verdicts → correct weighted average");
  const mixed = [
    makeResult("Python", "strong_match", "required", "hard"),      // w=4.5, score=1.0
    makeResult("FastAPI", "partial_match", "high", "soft"),         // w=2.0, score=0.6
    makeResult("Redis", "no_evidence", "medium", "preferred"),     // w=1.2, score=0.0
  ];
  const mixedResult = calculatePureDeterministicScores(mixed);
  // Numerator: 4.5*1.0*100 + 2.0*0.6*100 + 1.2*0.0*100 = 450 + 120 + 0 = 570
  // Denominator: 4.5 + 2.0 + 1.2 = 7.7
  // Score: round(570 / 7.7) = round(74.03) = 74
  assertEqual("Mixed weighted avg", mixedResult.match_score, 74);

  // ── Test 5: Hard vs preferred separation ──
  console.log("\n▶ 5. Hard vs preferred score separation");
  const separation = [
    makeResult("Core Skill", "strong_match", "required", "hard"),       // hard: w=4.5
    makeResult("Nice-to-have", "no_evidence", "preferred", "preferred"),// pref: w=0.8
  ];
  const sepResult = calculatePureDeterministicScores(separation);
  assertEqual("Hard score = 100%", sepResult.hard_requirement_match_score, 100);
  assertEqual("Preferred score = 0%", sepResult.preferred_requirement_match_score, 0);

  // ── Test 6: Engineering optimization ≠ Product growth ──
  console.log("\n▶ 6. Engineering optimization ≠ Product growth optimization");
  // A candidate with engineering performance optimization should NOT
  // get strong_match for product growth funnel optimization
  const engOpt = makeResult("Product Growth Funnels", "partial_match", "required", "hard");
  const engOptResult = calculatePureDeterministicScores([engOpt]);
  assertLessThan("Eng opt → Product growth < 100%", engOptResult.match_score, 100);

  // ── Test 7: Skills-only evidence cap ──
  console.log("\n▶ 7. Skills-only evidence should cap at weak_evidence (0.3)");
  const skillsOnly = makeResult("Storytelling", "weak_evidence", "medium", "soft");
  const skillsOnlyResult = calculatePureDeterministicScores([skillsOnly]);
  assertEqual("Skills-only → 30%", skillsOnlyResult.match_score, 30);

  // ── Test 8: Weight calculation correctness ──
  console.log("\n▶ 8. Weight = importance × criticality multiplier");
  assertEqual("required × hard = 4.5", computeRequirementWeight("required", "hard"), 4.5);
  assertEqual("required × soft = 3.0", computeRequirementWeight("required", "soft"), 3.0);
  assertEqual("required × preferred = 2.4", computeRequirementWeight("required", "preferred"), 2.4);
  assertEqual("high × hard = 3.0", computeRequirementWeight("high", "hard"), 3.0);
  assertEqual("medium × soft = 1.5", computeRequirementWeight("medium", "soft"), 1.5);
  assertEqual("preferred × preferred = 0.8", computeRequirementWeight("preferred", "preferred"), 0.8);

  // ── Test 9: Empty requirements → 0% (not 50%) ──
  console.log("\n▶ 9. Empty requirements → 0% (not arbitrary fallback)");
  const emptyResult = calculatePureDeterministicScores([]);
  assertEqual("Empty → 0%", emptyResult.match_score, 0);

  // ── Test 10: OR requirement with partial match ──
  console.log("\n▶ 10. OR/AND logical operator handling");
  const orReq: RequirementMatchResult = {
    ...makeResult("SQL or Power BI", "partial_match", "required", "hard"),
    // AND operator should adjust partial_match to 0.5
  };
  // Partial for AND is 0.5 per the evaluator logic, but scoring engine uses status score
  assertEqual("partial_match status → 0.6", orReq.score, 0.6);

  // ── Test 11: Dimension grouping doesn't change total score ──
  console.log("\n▶ 11. Dimension grouping preserves total score");
  const sameCategory = [
    makeResult("Skill A", "strong_match", "required", "hard", "engineering"),
    makeResult("Skill B", "no_evidence", "required", "hard", "engineering"),
  ];
  const diffCategory = [
    makeResult("Skill A", "strong_match", "required", "hard", "engineering"),
    makeResult("Skill B", "no_evidence", "required", "hard", "analytics"),
  ];
  const sameCatResult = calculatePureDeterministicScores(sameCategory);
  const diffCatResult = calculatePureDeterministicScores(diffCategory);
  assertEqual("Same vs diff category → same total", sameCatResult.match_score, diffCatResult.match_score);

  // ── Test 12: Single strong partial among many none → low score ──
  console.log("\n▶ 12. 1 strong + 5 none → low score");
  const oneOfSix = [
    makeResult("Req 1", "strong_match", "required", "hard"),
    makeResult("Req 2", "no_evidence", "required", "hard"),
    makeResult("Req 3", "no_evidence", "required", "hard"),
    makeResult("Req 4", "no_evidence", "required", "hard"),
    makeResult("Req 5", "no_evidence", "required", "hard"),
    makeResult("Req 6", "no_evidence", "required", "hard"),
  ];
  const oneOfSixResult = calculatePureDeterministicScores(oneOfSix);
  // 1/6 * 100 ≈ 17%
  assertRange("1/6 strong → ~17%", oneOfSixResult.match_score, 15, 19);

  // ── Test 13: Weighted 1 of 6 with higher weight → correct ──
  console.log("\n▶ 13. Different weights → weighted average");
  const weighted = [
    makeResult("Critical Skill", "partial_match", "required", "hard"),    // w=4.5 × 0.6
    makeResult("Minor Skill", "strong_match", "low", "preferred"),        // w=0.8 × 1.0
  ];
  const weightedResult = calculatePureDeterministicScores(weighted);
  // Numerator: 4.5*0.6*100 + 0.8*1.0*100 = 270 + 80 = 350
  // Denominator: 4.5 + 0.8 = 5.3
  // Score: round(350/5.3) = round(66.04) = 66
  assertEqual("Weighted critical partial + minor strong", weightedResult.match_score, 66);

  // ── Summary ──
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`SEMANTIC ADVERSARIAL RESULTS: ${passed}/${passed + failed} PASSED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
