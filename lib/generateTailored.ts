import { JDRequirements, ResumeData, TailoredOutput } from "../types";
import { callLLM } from "./llm";
import { validateNoFabrication } from "./validator";

// Tech Synonym and Alias Mapping for High Accuracy Skill Matching
const SKILL_ALIASES: Record<string, string[]> = {
  react: ["react.js", "reactjs", "react"],
  "react.js": ["react", "reactjs"],
  node: ["node.js", "nodejs", "node"],
  "node.js": ["node", "nodejs"],
  vue: ["vue.js", "vuejs", "vue"],
  "vue.js": ["vue", "vuejs"],
  next: ["next.js", "nextjs", "next"],
  "next.js": ["next", "nextjs"],
  express: ["express.js", "expressjs", "express"],
  "express.js": ["express", "expressjs"],
  typescript: ["ts", "typescript"],
  ts: ["typescript", "ts"],
  javascript: ["js", "javascript"],
  js: ["javascript", "js"],
  postgresql: ["postgres", "postgresql"],
  postgres: ["postgresql", "postgres"],
  mongodb: ["mongo", "mongodb"],
  mongo: ["mongodb", "mongo"],
  kubernetes: ["k8s", "kubernetes"],
  k8s: ["kubernetes", "k8s"],
  aws: ["amazon web services", "aws"],
  "amazon web services": ["aws"],
  "rest api": ["rest apis", "restful api", "restful apis", "rest", "rest api integration"],
  "rest apis": ["rest api", "restful api", "restful apis", "rest"],
  "ci/cd": ["cicd", "continuous integration", "continuous deployment"],
};

function getSkillVariants(str: string): string[] {
  const lower = str.toLowerCase().trim();
  const variants = new Set<string>([lower]);

  const parenMatch = lower.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    if (parenMatch[1].trim()) variants.add(parenMatch[1].trim());
    if (parenMatch[2].trim()) variants.add(parenMatch[2].trim());
  }

  const fluffRegex = /\b(integration|integrations|optimization|optimizations|architecture|design|development|testing|framework|library|services|service|tools|tool|expertise|proficiency)\b/g;
  const stripped = lower.replace(fluffRegex, "").trim();
  if (stripped && stripped !== lower) {
    variants.add(stripped);
  }

  Array.from(variants).forEach((v) => {
    if (v.endsWith("s") && v.length > 3) variants.add(v.slice(0, -1));
    if (v.endsWith("es") && v.length > 4) variants.add(v.slice(0, -2));
  });

  Array.from(variants).forEach((v) => {
    if (SKILL_ALIASES[v]) {
      SKILL_ALIASES[v].forEach((alias) => variants.add(alias));
    }
  });

  return Array.from(variants);
}

export function computeSkillMatch(
  jd: JDRequirements,
  resume: ResumeData
): {
  matched_skills: string[];
  missing_skills: string[];
  match_score: number;
} {
  let rawJDSkills = [...(jd.must_have_skills || []), ...(jd.nice_to_have_skills || [])];

  if (rawJDSkills.length === 0 && jd.keywords && jd.keywords.length > 0) {
    rawJDSkills = jd.keywords;
  }

  const allJDSkills = Array.from(new Set(rawJDSkills));

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

  const candidateSkillVariants = resumeSkills.flatMap((s) => getSkillVariants(s));

  const matched_skills: string[] = [];
  const missing_skills: string[] = [];

  for (const skill of allJDSkills) {
    const jdVariants = getSkillVariants(skill);

    const isMatchedInSkills = jdVariants.some((jdV) =>
      candidateSkillVariants.some(
        (candV) => candV === jdV || candV.includes(jdV) || jdV.includes(candV)
      )
    );

    const isMatchedInBullets = jdVariants.some((jdV) =>
      allBulletsText.includes(jdV)
    );

    if (isMatchedInSkills || isMatchedInBullets) {
      matched_skills.push(skill);
    } else {
      missing_skills.push(skill);
    }
  }

  const totalJDSkills = allJDSkills.length;
  const match_score =
    totalJDSkills > 0
      ? Math.round((matched_skills.length / totalJDSkills) * 100)
      : 50;

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

  const basePrompt = `You are an expert ATS Resume Customization Engineer. Your goal is to tailor the candidate's resume so it MAXIMUM MATCHES the target Job Description (JD) while remaining 100% TRUTHFUL to the candidate's real experience.

JOB DESCRIPTION REQUIREMENTS:
- Target Role Title: ${jd.role_title}
- Must-Have Skills: ${JSON.stringify(jd.must_have_skills || [])}
- Nice-to-Have Skills: ${JSON.stringify(jd.nice_to_have_skills || [])}
- Core Keywords: ${JSON.stringify(jd.keywords || [])}
- Matched Candidate Skills: ${JSON.stringify(skillMatch.matched_skills)}

CANDIDATE RESUME DATA:
${JSON.stringify(resume, null, 2)}

TAILORING INSTRUCTIONS (HIGH JD ALIGNMENT):
1. FOR EXPERIENCE BULLETS:
   - For each work experience entry, reorder the bullets so that bullets containing matched JD skills/keywords appear FIRST (#1 and #2).
   - Each rewritten bullet may ONLY reorder, trim, or lightly rephrase the words already present in that specific original bullet. Do not pull in any skill, tool, or technology name from elsewhere in the resume into a bullet where it did not originally appear, even if that skill is truthfully listed on the resume elsewhere.
   - Maintain the EXACT bullet count, company name, title, and date range for each company entry. DO NOT SKIP ANY COMPANY OR EXPERIENCE ENTRY.
   - Do NOT invent any company, title, date range, metric, or achievement not present in the original resume.

2. FOR REORDERED SKILLS LIST ("rewritten_skills"):
   - Place all JD Matched Skills (${JSON.stringify(skillMatch.matched_skills)}) at the VERY TOP of the array.
   - Follow with all remaining candidate skills.
   - Do NOT add any skill that was not originally present in the candidate's resume.

Return ONLY a valid JSON object with no markdown formatting, no code fences, and no explanation text matching this JSON shape:
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

  // Log bullet count comparison for attempt 1
  console.log("\n--- ATTEMPT 1 BULLET COUNT COMPARISON ---");
  for (const exp of candidateOutput.rewritten_experience || []) {
    const orig = resume.sections?.experience?.find(
      (e) => e.company.toLowerCase() === exp.company.toLowerCase()
    );
    console.log(
      `Company '${exp.company}': Original Bullets = ${orig ? orig.bullets.length : "NOT FOUND"}, Rewritten Bullets = ${exp.bullets.length}`
    );
  }

  // Validate first attempt
  const validation1 = validateNoFabrication(resume, candidateOutput);
  console.log("\n--- ATTEMPT 1 VALIDATION RESULT ---");
  console.log(`Valid: ${validation1.valid}`);
  console.log(`Issues (${validation1.issues.length}):`, validation1.issues);

  if (validation1.valid) {
    console.log("\n[SUCCESS] Returning Attempt 1 Output.");
    return candidateOutput;
  }

  // Validation failed -> log warning and retry once
  console.log("\n[RETRY TRIGGERED] Validation failed on Attempt 1. Executing retry attempt...");

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

  // Log bullet count comparison for attempt 2
  console.log("\n--- ATTEMPT 2 (RETRY) BULLET COUNT COMPARISON ---");
  for (const exp of retryOutput.rewritten_experience || []) {
    const orig = resume.sections?.experience?.find(
      (e) => e.company.toLowerCase() === exp.company.toLowerCase()
    );
    console.log(
      `Company '${exp.company}': Original Bullets = ${orig ? orig.bullets.length : "NOT FOUND"}, Rewritten Bullets = ${exp.bullets.length}`
    );
  }

  const validation2 = validateNoFabrication(resume, retryOutput);
  console.log("\n--- ATTEMPT 2 (RETRY) VALIDATION RESULT ---");
  console.log(`Valid: ${validation2.valid}`);
  console.log(`Issues (${validation2.issues.length}):`, validation2.issues);

  if (!validation2.valid) {
    console.log("\n[ERROR] Validation failed on Attempt 2. Throwing Error.");
    throw new Error(
      `Tailored content validation failed after retry:\n${validation2.issues.map((i) => `- ${i}`).join("\n")}`
    );
  }

  console.log("\n[SUCCESS] Returning Attempt 2 (Retry) Output.");
  return retryOutput;
}
