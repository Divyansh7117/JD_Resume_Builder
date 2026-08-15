import { JDRequirements, MatchAnalysis } from "../types";
import { computeContentHash, PIPELINE_VERSION } from "./cache";

export interface PipelineDebugSnapshot {
  pipeline_version: string;
  jd_hash: string;
  resume_hash: string;
  extracted_requirements: {
    id: string;
    name: string;
    category: string;
    importance: string;
    criticality: string;
    weight: number;
    requirement_type: string;
  }[];
  capability_dimensions: {
    id: string;
    name: string;
    weight: number;
    dimension_score: number;
    requirement_ids: string[];
  }[];
  evidence_retrieval_map: Record<string, string[]>;
  evaluations: {
    requirement_id: string;
    requirement_name: string;
    status: string;
    score: number;
    confidence: number;
    evidence_ids: string[];
    reasoning: string;
  }[];
  eligibility_results: {
    stated_requirement: string;
    status: string;
    reasoning: string;
  }[];
  scoring_breakdown: {
    total_weighted_numerator: number;
    total_weighted_denominator: number;
    final_match_score: number;
    hard_requirement_match_score: number;
    preferred_requirement_match_score: number;
    confidence_score: number;
  };
}

/**
 * Creates an immutable, structured debug snapshot of an evaluation pipeline run.
 */
export function createPipelineSnapshot(
  jdText: string,
  resumeText: string,
  jdReqs: JDRequirements,
  analysis: MatchAnalysis
): PipelineDebugSnapshot {
  const reqs = (jdReqs.requirements || []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    importance: r.importance,
    criticality: r.criticality || "hard",
    weight: r.weight || 1.0,
    requirement_type: r.requirement_type || "skill_capability",
  }));

  const evidenceRetrievalMap: Record<string, string[]> = {};
  for (const ev of analysis.evaluations || []) {
    evidenceRetrievalMap[ev.requirement_id] = ev.evidence_ids || [];
  }

  let totalNumerator = 0;
  let totalDenominator = 0;
  for (const entry of analysis.audit_trail || []) {
    totalNumerator += entry.weight * entry.score * 100;
    totalDenominator += entry.weight;
  }

  return {
    pipeline_version: PIPELINE_VERSION,
    jd_hash: computeContentHash(jdText),
    resume_hash: computeContentHash(resumeText),
    extracted_requirements: reqs,
    capability_dimensions: (analysis.dimensions || []).map((d) => ({
      id: d.id,
      name: d.name,
      weight: d.weight,
      dimension_score: d.dimension_score,
      requirement_ids: d.requirement_ids,
    })),
    evidence_retrieval_map: evidenceRetrievalMap,
    evaluations: (analysis.evaluations || []).map((e) => ({
      requirement_id: e.requirement_id,
      requirement_name: e.requirement_name,
      status: e.status,
      score: e.score,
      confidence: e.confidence,
      evidence_ids: e.evidence_ids || [],
      reasoning: e.reasoning,
    })),
    eligibility_results: (analysis.eligibility_results || []).map((el) => ({
      stated_requirement: el.stated_requirement,
      status: el.status,
      reasoning: el.reasoning,
    })),
    scoring_breakdown: {
      total_weighted_numerator: Number(totalNumerator.toFixed(2)),
      total_weighted_denominator: Number(totalDenominator.toFixed(2)),
      final_match_score: analysis.match_score,
      hard_requirement_match_score: analysis.hard_requirement_match_score,
      preferred_requirement_match_score: analysis.preferred_requirement_match_score,
      confidence_score: analysis.confidence_score,
    },
  };
}

/**
 * Diffs two pipeline snapshots and returns a list of any divergences.
 */
export function diffPipelineSnapshots(
  s1: PipelineDebugSnapshot,
  s2: PipelineDebugSnapshot
): { identical: boolean; differences: string[] } {
  const differences: string[] = [];

  if (s1.jd_hash !== s2.jd_hash) differences.push(`JD hash mismatch: ${s1.jd_hash} vs ${s2.jd_hash}`);
  if (s1.resume_hash !== s2.resume_hash) differences.push(`Resume hash mismatch: ${s1.resume_hash} vs ${s2.resume_hash}`);

  if (s1.extracted_requirements.length !== s2.extracted_requirements.length) {
    differences.push(`Requirement count mismatch: ${s1.extracted_requirements.length} vs ${s2.extracted_requirements.length}`);
  } else {
    for (let i = 0; i < s1.extracted_requirements.length; i++) {
      const r1 = s1.extracted_requirements[i];
      const r2 = s2.extracted_requirements[i];
      if (r1.name !== r2.name) differences.push(`Requirement [${i}] name mismatch: '${r1.name}' vs '${r2.name}'`);
      if (r1.weight !== r2.weight) differences.push(`Requirement [${r1.name}] weight mismatch: ${r1.weight} vs ${r2.weight}`);
      if (r1.criticality !== r2.criticality) differences.push(`Requirement [${r1.name}] criticality mismatch: ${r1.criticality} vs ${r2.criticality}`);
    }
  }

  if (s1.evaluations.length !== s2.evaluations.length) {
    differences.push(`Evaluation count mismatch: ${s1.evaluations.length} vs ${s2.evaluations.length}`);
  } else {
    for (let i = 0; i < s1.evaluations.length; i++) {
      const e1 = s1.evaluations[i];
      const e2 = s2.evaluations[i];
      if (e1.status !== e2.status) differences.push(`Verdict mismatch for '${e1.requirement_name}': ${e1.status} vs ${e2.status}`);
      if (e1.score !== e2.score) differences.push(`Score mismatch for '${e1.requirement_name}': ${e1.score} vs ${e2.score}`);
    }
  }

  if (s1.scoring_breakdown.final_match_score !== s2.scoring_breakdown.final_match_score) {
    differences.push(
      `Final score mismatch: ${s1.scoring_breakdown.final_match_score}% vs ${s2.scoring_breakdown.final_match_score}%`
    );
  }

  if (s1.scoring_breakdown.total_weighted_denominator !== s2.scoring_breakdown.total_weighted_denominator) {
    differences.push(
      `Denominator mismatch: ${s1.scoring_breakdown.total_weighted_denominator} vs ${s2.scoring_breakdown.total_weighted_denominator}`
    );
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}
