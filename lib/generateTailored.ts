import { JDRequirements, ResumeData, TailoredOutput } from "../types";
import { callLLM } from "./llm";
import { validateNoFabrication } from "./validator";

export function computeSkillMatch(
  jd: JDRequirements,
  resume: ResumeData
): {
  matched_skills: string[];
  missing_skills: string[];
  match_score: number;
} {
  const allJDSkills = Array.from(
    new Set([...(jd.must_have_skills || []), ...(jd.nice_to_have_skills || [])])
  );

  const resumeSkills = resume.sections?.skills || [];
  const experienceBullets = (resume.sections?.experience || []).flatMap(
    (exp) => exp.bullets || []
  );
  const projectBullets = (resume.sections?.projects || []).flatMap(
    (proj) => proj.bullets || []
  );
  const allBulletsText = [...experienceBullets, ...projectBullets]
    .join(" ")
    .toLowerCase();

  const matched_skills: string[] = [];
  const missing_skills: string[] = [];

  for (const skill of allJDSkills) {
    const skillLower = skill.toLowerCase();

    const inSkillsList = resumeSkills.some(
      (s) => s.toLowerCase() === skillLower || s.toLowerCase().includes(skillLower)
    );
    const inBullets = allBulletsText.includes(skillLower);

    if (inSkillsList || inBullets) {
      matched_skills.push(skill);
    } else {
      missing_skills.push(skill);
    }
  }

  const totalJDSkills = allJDSkills.length;
  const match_score =
    totalJDSkills > 0
      ? Math.round((matched_skills.length / totalJDSkills) * 100)
      : 100;

  return {
    matched_skills,
    missing_skills,
    match_score,
  };
}

interface LLMTailoredSection {
  rewritten_experience: {
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }[];
  rewritten_skills: string[];
}

function parseLLMResponse(responseText: string): LLMTailoredSection {
  try {
    return JSON.parse(responseText) as LLMTailoredSection;
  } catch (_initialError) {
    // Clean common markdown code block wrappers (e.g. ```json ... ```)
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleanedText) as LLMTailoredSection;
    } catch (retryError) {
      console.error("Failed to parse raw LLM output:", responseText);
      const errMessage =
        retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(`Failed to parse generated TailoredOutput JSON: ${errMessage}`);
    }
  }
}

export async function generateTailoredContent(
  jd: JDRequirements,
  resume: ResumeData
): Promise<TailoredOutput> {
  const skillMatch = computeSkillMatch(jd, resume);

  const basePrompt = `You are an expert resume tailoring assistant. Analyze the provided Job Description (JD) requirements and candidate Resume Data.
Generate tailored experience bullets and a reordered skills list strictly based on the facts provided in the resume.

JOB DESCRIPTION REQUIREMENTS:
${JSON.stringify(jd, null, 2)}

CANDIDATE RESUME DATA:
${JSON.stringify(resume, null, 2)}

INSTRUCTIONS:
1. For each experience entry in the resume:
   - Reorder and rephrase the EXISTING bullets to surface JD-relevant language and skills first.
   - Preserve company, title, dates, and bullets count/structure.
   - Do NOT invent, add, or exaggerate any company, title, date, metric, or achievement not already present in the original bullets. Rephrasing must stay strictly truthful to the original content.
   - Do not add any adjective, qualifier, or descriptor (e.g. 'full-stack', 'advanced', 'optimized') that does not appear in the original bullet text. Only reorder words and combine existing phrasing.
2. Reorder the skills list ("rewritten_skills") to surface JD-relevant skills first — do NOT add skills that were not in the original resume skills list.

CRITICAL ETHICAL & TRUTHFULNESS REQUIREMENT:
This is for a real job application. Fabricating experience is unacceptable and will make the output unusable. Only reorder and rephrase what already exists.

Return ONLY a valid JSON object with no markdown formatting, no code fences, and no explanation text. It must strictly match this JSON shape:
{
  "rewritten_experience": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "bullets": ["string"]
    }
  ],
  "rewritten_skills": ["string"]
}`;

  // First LLM attempt
  const responseText = await callLLM(basePrompt, 0.2);
  const llmParsed = parseLLMResponse(responseText);

  const candidateOutput: TailoredOutput = {
    matched_skills: skillMatch.matched_skills,
    missing_skills: skillMatch.missing_skills,
    match_score: skillMatch.match_score,
    rewritten_experience: llmParsed.rewritten_experience,
    rewritten_skills: llmParsed.rewritten_skills,
  };

  // Validate first attempt
  const validation1 = validateNoFabrication(resume, candidateOutput);
  if (validation1.valid) {
    return candidateOutput;
  }

  // Validation failed -> log warning and retry once
  console.warn("Validation failed, retrying once:");
  for (const issue of validation1.issues) {
    console.warn(`- ${issue}`);
  }

  const retryPrompt = `${basePrompt}

CRITICAL FIX REQUIRED:
Your previous output had these problems:
${validation1.issues.map((issue) => `- ${issue}`).join("\n")}
Fix these by using ONLY the exact facts, numbers, and skills from the original resume data provided. Do not invent anything.`;

  const retryResponseText = await callLLM(retryPrompt, 0.2);
  const llmParsedRetry = parseLLMResponse(retryResponseText);

  const retryOutput: TailoredOutput = {
    matched_skills: skillMatch.matched_skills,
    missing_skills: skillMatch.missing_skills,
    match_score: skillMatch.match_score,
    rewritten_experience: llmParsedRetry.rewritten_experience,
    rewritten_skills: llmParsedRetry.rewritten_skills,
  };

  const validation2 = validateNoFabrication(resume, retryOutput);
  if (!validation2.valid) {
    throw new Error(
      `Tailored content validation failed after retry:\n${validation2.issues.map((i) => `- ${i}`).join("\n")}`
    );
  }

  return retryOutput;
}
