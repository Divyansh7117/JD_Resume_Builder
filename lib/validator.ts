import { ResumeData, TailoredOutput, MatchAnalysis } from "../types";

/**
 * Extracts distinct factual tokens (metrics, currencies, percentages, years, dates) from text.
 */
export function extractFactualTokens(text: string): {
  metrics: string[];
  currencies: string[];
  percentages: string[];
  years: string[];
} {
  if (!text) return { metrics: [], currencies: [], percentages: [], years: [] };

  const lower = text.toLowerCase();

  // Currencies like ₹200Cr, $50M, ₹700Cr+, ₹1200Cr+
  const currencyMatches = lower.match(/(?:[₹$€£]|inr|usd)\s*\d+(?:[,\.]\d+)?(?:\s*(?:cr|crore|l|lakh|m|million|k|billion|b))?\+?/gi) || [];

  // Percentages like 1.75%, 5%, 40%, 50%
  const percentageMatches = lower.match(/\b\d+(?:\.\d+)?%/gi) || [];

  // Years like 2017, 2019, 2021, 2024, 2026
  const yearMatches = lower.match(/\b(19|20)\d{2}\b/gi) || [];

  // General metrics like 3,000+, 50K, 25L+, 1,000+, 4L+, 10,000+, 4,000+, 40+, 25+
  const generalMetricMatches = lower.match(/\b\d+(?:,\d+)*(?:\.\d+)?(?:[kKlLmMbB]|dau|sku|skus)?\+?\b/gi) || [];

  return {
    metrics: Array.from(new Set(generalMetricMatches.map((m) => m.toLowerCase()))),
    currencies: Array.from(new Set(currencyMatches.map((c) => c.replace(/\s+/g, "").toLowerCase()))),
    percentages: Array.from(new Set(percentageMatches.map((p) => p.toLowerCase()))),
    years: Array.from(new Set(yearMatches)),
  };
}

/**
 * Validates that a target claim does NOT introduce unsupported metrics, currencies, percentages, or dates.
 */
export function detectFabricatedClaims(
  sourceEvidenceText: string,
  targetClaimText: string
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const targetTokens = extractFactualTokens(targetClaimText);
  const sourceLower = sourceEvidenceText.toLowerCase();

  // 1. Currency & Revenue validation (e.g. ₹1200Cr+ vs ₹200Cr+)
  for (const curr of targetTokens.currencies) {
    const cleanedCurr = curr.replace(/[₹$€£\s]/g, "");
    if (!sourceLower.includes(curr) && !sourceLower.includes(cleanedCurr)) {
      violations.push(`Fabricated currency/revenue figure '${curr}' not found in source evidence.`);
    }
  }

  // 2. Percentage validation (e.g. 84% vs 40%)
  for (const pct of targetTokens.percentages) {
    if (!sourceLower.includes(pct)) {
      violations.push(`Fabricated percentage '${pct}' not found in source evidence.`);
    }
  }

  // 3. Year / Date validation (e.g. 2019 vs 2021)
  for (const yr of targetTokens.years) {
    if (!sourceLower.includes(yr)) {
      violations.push(`Fabricated year/date '${yr}' not found in source evidence.`);
    }
  }

  // 4. Metric & Number validation (e.g. 25+ vs 3,000+, 50K)
  for (const metric of targetTokens.metrics) {
    // Ignore trivial single-digit non-metrics unless formatted with modifier
    if (metric.length <= 1 && !metric.includes("+")) continue;
    if (!sourceLower.includes(metric)) {
      violations.push(`Fabricated metric/number '${metric}' not found in source evidence.`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

export function validateNoFabrication(
  original: ResumeData,
  output: TailoredOutput
): { valid: boolean; isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  const origExperiences = original.sections?.experience || [];
  const origSkills = original.sections?.skills || [];
  const origSkillsLower = origSkills.map((s) => s.toLowerCase());

  // Aggregate full original resume text for fallback checking
  const allSourceText = [
    original.summary || "",
    ...origExperiences.map((e) => `${e.company} ${e.title} ${e.dates} ${(e.bullets || []).join(" ")}`),
    ...(original.sections?.projects || []).map((p) => `${p.name} ${(p.bullets || []).join(" ")}`),
    ...origSkills,
    ...(original.sections?.education || []).map((e) => `${e.degree} ${e.institution} ${e.dates}`),
    ...(original.sections?.certifications || []).map((c) => `${c.name} ${c.issuer}`),
  ].join(" ");

  // Validate Summary Claims
  if (output.rewritten_summary) {
    const summaryCheck = detectFabricatedClaims(allSourceText, output.rewritten_summary);
    if (!summaryCheck.valid) {
      issues.push(...summaryCheck.violations.map((v) => `[Summary Fabrication] ${v}`));
    }
  }

  // 1-5. Validate rewritten experience entries
  for (const exp of output.rewritten_experience || []) {
    const origExp = origExperiences.find(
      (e) => e.company.toLowerCase() === exp.company.toLowerCase() &&
             e.title.toLowerCase() === exp.title.toLowerCase()
    ) || origExperiences.find(
      (e) => e.company.toLowerCase() === exp.company.toLowerCase()
    );

    // 1. Company check
    if (!origExp) {
      issues.push(`Invented company '${exp.company}' not found in original experience.`);
      continue;
    }

    // ZERO-BULLET TRIPWIRE
    if (origExp.bullets.length === 0 && exp.bullets.length > 0) {
      issues.push(
        `Entry for '${exp.company}' had 0 original bullets but the rewritten version invented ${exp.bullets.length} bullets.`
      );
    }

    // 2. Title check
    if (exp.title.toLowerCase() !== origExp.title.toLowerCase()) {
      issues.push(
        `Title '${exp.title}' for company '${exp.company}' does not match original title '${origExp.title}'.`
      );
    }

    // 3. Dates check
    if (exp.dates.toLowerCase() !== origExp.dates.toLowerCase()) {
      issues.push(
        `Dates '${exp.dates}' for company '${exp.company}' do not match original dates '${origExp.dates}'.`
      );
    }

    // 4. Bullet count check
    if (exp.bullets.length > origExp.bullets.length) {
      issues.push(
        `Experience entry for '${exp.company}' has ${exp.bullets.length} bullets, which exceeds original bullet count of ${origExp.bullets.length}.`
      );
    }

    // 5. Standalone numbers/percentages check against original bullets
    const origBulletsText = (origExp.bullets || []).join(" ").toLowerCase();

    for (const bullet of exp.bullets || []) {
      const bulletCheck = detectFabricatedClaims(origBulletsText, bullet);
      if (!bulletCheck.valid) {
        issues.push(...bulletCheck.violations.map((v) => `[${exp.company}] ${v}`));
      }
    }
  }

  // 6. Skill existence check
  for (const skill of output.rewritten_skills || []) {
    if (!origSkillsLower.includes(skill.toLowerCase())) {
      issues.push(`Invented skill '${skill}' not found in original skills list.`);
    }
  }

  return {
    valid: issues.length === 0,
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Validates internal consistency invariants of a MatchAnalysis result.
 */
export function validateMatchConsistency(
  analysis: MatchAnalysis,
  _resume?: ResumeData
): { valid: boolean; issues: string[] } {
  void _resume;
  const issues: string[] = [];

  const evaluations = analysis.evaluations || [];
  const matched = analysis.matched_requirements || [];
  const claimed = analysis.claimed_requirements || [];
  const partial = analysis.partial_requirements || [];
  const missing = analysis.missing_requirements || [];

  // Invariant 1: Matched (Direct) + Claimed + Partial + Missing === Total Evaluated
  const totalCategorized = matched.length + claimed.length + partial.length + missing.length;
  if (totalCategorized !== evaluations.length) {
    issues.push(
      `Partition mismatch: Matched (${matched.length}) + Claimed (${claimed.length}) + Partial (${partial.length}) + Missing (${missing.length}) = ${totalCategorized}, but Total Evaluations = ${evaluations.length}`
    );
  }

  // Invariant 2: Evidence vs Verdict consistency
  for (const ev of evaluations) {
    const hasEvidence = ev.evidence && ev.evidence.length > 0;

    if (hasEvidence && ev.status === "no_evidence") {
      issues.push(
        `Contradiction in requirement '${ev.requirement_name}': Evidence is present (${ev.evidence.length} items) but verdict is 'no_evidence'.`
      );
    }

    if (hasEvidence && ev.score === 0.0 && ev.status !== "no_evidence") {
      issues.push(
        `Contradiction in requirement '${ev.requirement_name}': Evidence is present but score is 0.0 with status '${ev.status}'.`
      );
    }

    if (!hasEvidence && (ev.status === "strong_match" || ev.status === "claimed_match")) {
      issues.push(
        `Missing proof for requirement '${ev.requirement_name}': Status is '${ev.status}' but no verified evidence units are attached.`
      );
    }

    if (ev.status === "no_evidence" && (ev.evidence_ids.length !== 0 || hasEvidence)) {
      issues.push(`No-evidence requirement '${ev.requirement_name}' must not retain evidence IDs or resolved evidence.`);
    }

    const expectedScore = ev.status === "strong_match" ? 1.0
      : ev.status === "claimed_match" ? 0.8
      : ev.status === "partial_match" ? 0.6
      : 0.0;
    if (ev.score !== expectedScore) {
      issues.push(`Score-tier mismatch for '${ev.requirement_name}'.`);
    }
  }

  const allStrong = evaluations.length > 0 && evaluations.every((ev) => ev.status === "strong_match" && ev.score === 1.0);
  if (allStrong && analysis.match_score !== 100) {
    issues.push("Score invariant violated: all strong requirements must produce a 100% capability score.");
  }
  if (analysis.match_score < 100 && evaluations.length > 0 && evaluations.every((ev) => ev.score === 1.0)) {
    issues.push("Score invariant violated: a sub-100 capability score requires at least one non-strong requirement.");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
