import { JDRequirements, ResumeData, TailoredOutput } from "../types";
import { extractJDRequirements } from "./extractJD";
import { parseResume } from "./parseResume";
import { generateTailoredContent } from "./generateTailored";
import { createPipelineSnapshot, PipelineDebugSnapshot } from "./debugSnapshot";

export interface PipelineOptions {
  bypassCache?: boolean;
}

export interface PipelineResult {
  tailored: TailoredOutput;
  originalResume: ResumeData;
  jdRequirements: JDRequirements;
  snapshot: PipelineDebugSnapshot;
}

/**
 * The Single Canonical Pipeline Function.
 * Used by BOTH the live UI API (/api/tailor) and all automated stability test suites.
 */
export async function runEvaluationPipeline(
  jdText: string,
  resumeText: string,
  options: PipelineOptions = {}
): Promise<PipelineResult> {
  // Step 1: Extract & Canonicalize JD Requirements (with content-addressed caching)
  const jdRequirements = await extractJDRequirements(jdText, options.bypassCache);

  // Step 2: Parse & Structure Candidate Resume (with content-addressed caching)
  const parsedResume = await parseResume(resumeText, options.bypassCache);

  // Step 3: Semantic Evidence Matching, Deterministic Math & Tailoring (with content-addressed caching)
  const tailored = await generateTailoredContent(jdRequirements, parsedResume, options.bypassCache);

  // Step 4: Construct Canonical Debug Snapshot
  const snapshot = createPipelineSnapshot(jdText, resumeText, jdRequirements, tailored.match_analysis!);

  return {
    tailored,
    originalResume: parsedResume,
    jdRequirements,
    snapshot,
  };
}
