import {
  JDRequirements,
  ResumeData,
  TailoredOutput,
  MatchAnalysis,
  TailoredExperienceEntry,
} from "../types";
import { callLLM } from "./llm";
import { validateNoFabrication } from "./validator";
import { evaluateRequirementsAgainstEvidence } from "./semanticMatcher";

function cleanJsonString(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseLLMResponse(raw: string): Partial<TailoredOutput> {
  const cleaned = cleanJsonString(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("Failed to parse matched JSON substring:", err);
      }
    }
    console.error("Failed to parse LLM response as JSON:", raw);
    return {};
  }
}

export async function generateTailoredContent(
  jd: JDRequirements,
  resume: ResumeData
): Promise<TailoredOutput> {
  // Step 1: Semantic evidence evaluation & deterministic scoring
  const matchAnalysis: MatchAnalysis = await evaluateRequirementsAgainstEvidence(jd, resume);

  // ─── PART 1: Filter zero-bullet entries before sending to LLM ───
  const allExperience = resume.sections?.experience || [];
  const allProjects = resume.sections?.projects || [];

  // Track which indices are passthrough (0 bullets) vs rewritable (1+ bullets)
  const experiencePassthroughIndices: number[] = [];
  const rewritableExperience: typeof allExperience = [];
  for (let i = 0; i < allExperience.length; i++) {
    if (allExperience[i].bullets.length === 0) {
      experiencePassthroughIndices.push(i);
      console.log(`[FILTER] Experience '${allExperience[i].company}' has 0 bullets — excluded from LLM prompt, will pass through unchanged.`);
    } else {
      rewritableExperience.push(allExperience[i]);
    }
  }

  const projectPassthroughIndices: number[] = [];
  const rewritableProjects: typeof allProjects = [];
  for (let i = 0; i < allProjects.length; i++) {
    if (allProjects[i].bullets.length === 0) {
      projectPassthroughIndices.push(i);
      console.log(`[FILTER] Project '${allProjects[i].name}' has 0 bullets — excluded from LLM prompt, will pass through unchanged.`);
    } else {
      rewritableProjects.push(allProjects[i]);
    }
  }

  // Build a filtered copy of resume for the LLM prompt — only rewritable entries
  const filteredResume: ResumeData = {
    ...resume,
    sections: {
      ...resume.sections,
      experience: rewritableExperience,
      projects: rewritableProjects,
    },
  };

  const basePrompt = `You are an elite Executive Resume Strategist & ATS Optimization Specialist. Your mission is to elevate the candidate's resume to the TOP 1% of applicants for the target role (${jd.role_title}) while maintaining 100% TRUTHFULNESS to their genuine experience.

TARGET JOB DESCRIPTION:
- Target Role Title: ${jd.role_title}
- Verified Matched Skills / Requirements: ${JSON.stringify(matchAnalysis.matched_skills)}
- Evaluated Requirements: ${JSON.stringify(
    matchAnalysis.evaluations.map((e) => ({
      name: e.requirement_name,
      importance: e.importance,
      status: e.status,
      evidence_ids: e.evidence_ids,
      evidence: e.evidence.map((ev) => ev.text),
    })),
    null,
    2
  )}

CANDIDATE RESUME DATA:
${JSON.stringify(filteredResume, null, 2)}

TAILORING & PROVENANCE RULES:

1. PROFESSIONAL SUMMARY ("rewritten_summary"):
   - Craft a punchy, high-impact 3-4 sentence executive summary that positions the candidate as a top-tier fit for '${jd.role_title}'.
   - Rephrase the candidate's genuine background, years of experience, and signature strengths from the original summary.
   - Highlight the largest scale metrics already mentioned in the original summary.
   - Do NOT insert additional skill names into the summary that were not originally mentioned in the original summary text.

2. EXPERIENCE BULLETS ("rewritten_experience"):
   - For EACH work experience entry:
     a. REORDER: Place the most relevant accomplishments and highest-metric bullets FIRST (#1 and #2).
     b. WRITING QUALITY & OUTCOMES:
        - Prioritize: (1) JD relevance, (2) factual accuracy, (3) measurable outcomes, (4) clarity, (5) natural professional language, and (6) ATS readability.
        - Treat the Google XYZ formula ("Accomplished [X] as measured by [Y], by doing [Z]") as an OPTIONAL heuristic.
        - Upgrade passive wording with strong, authoritative action verbs (e.g., "Scaled", "Spearheaded", "Architected", "Optimized", "Orchestrated", "Pioneered", "Accelerated", "Engineered").
     c. JD ALIGNMENT: Where the candidate's real work matches JD requirements (e.g. storefronts, conversion funnels, A/B testing, cohort analysis, microservices, real-time data), frame the bullet using industry-standard precision terminology.
     d. PRESERVE ALL ORIGINAL METRICS & QUALITATIVE CLAIMS: Every number, metric, percentage, company name, title, and date range from the original bullet MUST be preserved faithfully and accurately. Do NOT invent fake numbers, fictional team sizes, or unverified geographic/platform scope.
     e. EXACT BULLET COUNT: Return the EXACT same number of bullets for each company entry as was provided in the input.
     f. BULLET PROVENANCE: For every rewritten bullet, include "source_evidence_ids" referencing the candidate's original evidence units supporting the bullet.

3. REORDERED SKILLS LIST ("rewritten_skills"):
   - Reorder the candidate's EXACT original skills array (${JSON.stringify(resume.sections?.skills || [])}).
   - Prioritize candidate skills that align with the target role at the front of the array.
   - Every item in "rewritten_skills" MUST be chosen verbatim from the candidate's original skills list (${JSON.stringify(resume.sections?.skills || [])}).
   - Do NOT invent new skill titles or substitute JD requirement names.

Return ONLY a valid JSON object matching this exact JSON shape, with no markdown code fences and no explanations:
{
  "rewritten_summary": "string",
  "rewritten_experience": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "bullets": ["string"],
      "bullet_provenance": [
        {
          "bullet": "string",
          "source_evidence_ids": ["ev_exp_1_1"]
        }
      ]
    }
  ],
  "rewritten_skills": ["string"]
}

${
  experiencePassthroughIndices.length > 0
    ? `IMPORTANT: The following company entries had 0 bullets and were excluded: ${experiencePassthroughIndices
        .map((i) => allExperience[i].company)
        .join(", ")}. Do NOT add entries for them.`
    : ""
}`;

  function mergeExperienceWithPassthrough(
    rewrittenFromLLM: TailoredExperienceEntry[]
  ): TailoredExperienceEntry[] {
    const merged: TailoredExperienceEntry[] = [];
    let llmIdx = 0;

    for (let origIdx = 0; origIdx < allExperience.length; origIdx++) {
      if (experiencePassthroughIndices.includes(origIdx)) {
        const orig = allExperience[origIdx];
        merged.push({
          company: orig.company,
          title: orig.title,
          dates: orig.dates,
          bullets: [],
          bullet_provenance: [],
        });
      } else {
        if (llmIdx < rewrittenFromLLM.length) {
          merged.push(rewrittenFromLLM[llmIdx]);
          llmIdx++;
        }
      }
    }

    return merged;
  }

  // First LLM attempt
  const responseText = await callLLM(basePrompt, 0.2);
  const llmParsed = parseLLMResponse(responseText);

  const candidateOutput: TailoredOutput = {
    match_score: matchAnalysis.match_score,
    confidence_score: matchAnalysis.confidence_score,
    match_analysis: matchAnalysis,
    matched_skills: matchAnalysis.matched_skills,
    missing_skills: matchAnalysis.missing_skills,
    rewritten_summary: llmParsed.rewritten_summary || resume.summary,
    rewritten_experience: mergeExperienceWithPassthrough(
      (llmParsed.rewritten_experience as TailoredExperienceEntry[]) || rewritableExperience
    ),
    rewritten_skills: llmParsed.rewritten_skills && Array.isArray(llmParsed.rewritten_skills) && llmParsed.rewritten_skills.length > 0
      ? llmParsed.rewritten_skills
      : resume.sections?.skills || [],
    used_fallback: false,
  };

  // Run Validator
  const validation1 = validateNoFabrication(resume, candidateOutput);
  console.log("\n--- ATTEMPT 1 BULLET COUNT COMPARISON ---");
  for (const exp of candidateOutput.rewritten_experience) {
    const origExp = allExperience.find((e) => e.company.toLowerCase() === exp.company.toLowerCase());
    console.log(`Company '${exp.company}': Original Bullets = ${origExp?.bullets.length ?? 0}, Rewritten Bullets = ${exp.bullets.length}`);
  }
  console.log("\n--- ATTEMPT 1 VALIDATION RESULT ---");
  console.log("Valid:", validation1.valid);
  console.log(`Issues (${validation1.issues.length}):`, validation1.issues);

  if (validation1.valid) {
    console.log("\n[SUCCESS] Returning Attempt 1 Output.");
    return candidateOutput;
  }

  // Attempt 2 Retry with specific issue feedback
  console.warn("\n[RETRY] Attempt 1 failed validation. Retrying with explicit feedback...");
  const retryPrompt = `${basePrompt}

CRITICAL: Your previous response FAILED validation with the following issues. Fix EVERY issue listed below. Do NOT repeat them:
${validation1.issues.map((issue, idx) => `${idx + 1}. ${issue}`).join("\n")}

Ensure exact bullet counts, exact company names, exact dates, exact metrics, and zero hallucinated numbers or qualitative claims.`;

  const responseText2 = await callLLM(retryPrompt, 0.1);
  const llmParsed2 = parseLLMResponse(responseText2);

  const retryOutput: TailoredOutput = {
    match_score: matchAnalysis.match_score,
    confidence_score: matchAnalysis.confidence_score,
    match_analysis: matchAnalysis,
    matched_skills: matchAnalysis.matched_skills,
    missing_skills: matchAnalysis.missing_skills,
    rewritten_summary: llmParsed2.rewritten_summary || candidateOutput.rewritten_summary,
    rewritten_experience: mergeExperienceWithPassthrough(
      (llmParsed2.rewritten_experience as TailoredExperienceEntry[]) || candidateOutput.rewritten_experience
    ),
    rewritten_skills: llmParsed2.rewritten_skills && Array.isArray(llmParsed2.rewritten_skills) && llmParsed2.rewritten_skills.length > 0
      ? llmParsed2.rewritten_skills
      : candidateOutput.rewritten_skills,
    used_fallback: false,
  };

  const validation2 = validateNoFabrication(resume, retryOutput);
  console.log("\n--- ATTEMPT 2 VALIDATION RESULT ---");
  console.log("Valid:", validation2.valid);
  console.log(`Issues (${validation2.issues.length}):`, validation2.issues);

  if (validation2.valid) {
    console.log("\n[SUCCESS] Attempt 2 passed validation.");
    return retryOutput;
  }

  // Deterministic Fallback if both attempts fail
  console.warn("\n[FALLBACK] Both LLM attempts failed validation. Falling back to deterministic baseline.");
  return {
    match_score: matchAnalysis.match_score,
    confidence_score: matchAnalysis.confidence_score,
    match_analysis: matchAnalysis,
    matched_skills: matchAnalysis.matched_skills,
    missing_skills: matchAnalysis.missing_skills,
    rewritten_summary: resume.summary,
    rewritten_experience: allExperience.map((exp) => ({
      company: exp.company,
      title: exp.title,
      dates: exp.dates,
      bullets: [...exp.bullets],
      bullet_provenance: exp.bullets.map((b) => ({ bullet: b, source_evidence_ids: [] })),
      location: exp.location,
    })),
    rewritten_skills: resume.sections?.skills || [],
    used_fallback: true,
  };
}
