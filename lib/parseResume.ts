import { ResumeData } from "../types";
import { callLLM } from "./llm";

export interface SplitSections {
  summaryText: string;
  experienceText: string;
  projectsText: string;
  skillsText: string;
  educationText: string;
  certificationsText: string;
  additionalText: string;
}

/**
 * Deterministically splits raw resume text into scoped section blocks based on header patterns.
 */
export function splitResumeIntoSections(resumeText: string): SplitSections {
  const lines = resumeText.split("\n");
  const sections: Record<string, string[]> = {
    summary: [],
    experience: [],
    projects: [],
    skills: [],
    education: [],
    certifications: [],
    additional: [],
    other: [],
  };

  let currentCategory = "other";

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();

    if (trimmed.length > 2 && trimmed.length <= 45) {
      const cleanHeader = trimmed
        .replace(/^[\#\*\-\s\>]+/, "")
        .replace(/[\:\#\*\-\>\=]+$/, "")
        .trim()
        .toLowerCase();

      let detectedCategory: string | null = null;

      if (/^(experience|work experience|employment history|professional experience|work history)$/i.test(cleanHeader)) {
        detectedCategory = "experience";
      } else if (/^(projects|personal projects|key projects|selected projects|publications & projects)$/i.test(cleanHeader)) {
        detectedCategory = "projects";
      } else if (/^(skills|technical skills|technologies|technical stack|core competencies|technical stack & algorithms)$/i.test(cleanHeader)) {
        detectedCategory = "skills";
      } else if (/^(education|academic background|academic qualifications)$/i.test(cleanHeader)) {
        detectedCategory = "education";
      } else if (/^(certifications|certifications & learning|certifications and learning|licenses|certifications & licenses)$/i.test(cleanHeader)) {
        detectedCategory = "certifications";
      } else if (/^(profile|summary|profile summary|professional summary|about me)$/i.test(cleanHeader)) {
        detectedCategory = "summary";
      } else if (/^(additional|additional information|languages|methodology)$/i.test(cleanHeader)) {
        detectedCategory = "additional";
      } else if (
        trimmed === trimmed.toUpperCase() &&
        /[A-Z]/.test(trimmed) &&
        !/[.?!]/.test(trimmed) &&
        !trimmed.includes("|") &&
        !trimmed.includes("@") &&
        !trimmed.includes(":")
      ) {
        // Generic uppercase short line boundary
        detectedCategory = "other";
      }

      if (detectedCategory) {
        currentCategory = detectedCategory;
        continue;
      }
    }

    sections[currentCategory].push(rawLine);
  }

  return {
    summaryText: (sections.summary || []).join("\n").trim(),
    experienceText: (sections.experience || []).join("\n").trim(),
    projectsText: (sections.projects || []).join("\n").trim(),
    skillsText: (sections.skills || []).join("\n").trim(),
    educationText: (sections.education || []).join("\n").trim(),
    certificationsText: (sections.certifications || []).join("\n").trim(),
    additionalText: (sections.additional || []).join("\n").trim(),
  };
}

function parseJSONWithRetry<T>(responseText: string, fallbackName: string): T {
  try {
    return JSON.parse(responseText) as T;
  } catch {
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    try {
      return JSON.parse(cleanedText) as T;
    } catch (err) {
      console.error(`Failed to parse ${fallbackName} JSON:`, responseText);
      throw new Error(`Failed to parse ${fallbackName} JSON: ${err}`);
    }
  }
}

export async function parseResume(resumeText: string): Promise<ResumeData> {
  const split = splitResumeIntoSections(resumeText);

  // Fallback to full resume text for experience if deterministic splitting returned empty
  const experienceSourceText = split.experienceText.length > 0 ? split.experienceText : resumeText;

  // 1. Scoped Call: Experience
  const expPrompt = `You are an expert resume parser. Extract ONLY work experience entries from the experience section of the resume provided below.
This text block contains ONLY experience content (no projects, skills, or education).

Return ONLY a valid JSON array matching this exact shape, with no markdown code fences:
[
  {
    "company": "string",
    "title": "string",
    "dates": "string",
    "bullets": ["string"],
    "location": "string (optional)"
  }
]

CRITICAL EXTRACTION INSTRUCTIONS:
- You MUST extract bullets exactly as they appear in the source text — no rewriting, summarizing, or paraphrasing at this stage.
- Extract every single bullet point for each company entry exhaustively. DO NOT skip any bullet.
- Do NOT invent or infer any company, title, date, or bullet not present in the text.

Experience Text Block:
${experienceSourceText}`;

  const expResponse = await callLLM(expPrompt, 0.1);
  const parsedExperience = parseJSONWithRetry<
    { company: string; title: string; dates: string; bullets: string[]; location?: string }[]
  >(expResponse, "Experience");

  // 2. Scoped Call: Projects
  let parsedProjects: { name: string; bullets: string[]; url?: string; techStack?: string }[] = [];
  if (split.projectsText.length > 0) {
    const projPrompt = `You are an expert resume parser. Extract ONLY project entries from the projects section provided below.

Return ONLY a valid JSON array matching this exact shape, with no markdown code fences:
[
  {
    "name": "string",
    "bullets": ["string"],
    "url": "string (optional)",
    "techStack": "string (optional)"
  }
]

CRITICAL EXTRACTION INSTRUCTIONS:
- Extract bullets exactly as they appear in the source text — no rewriting or paraphrasing.
- Extract every single bullet point for each project entry.

Projects Text Block:
${split.projectsText}`;

    const projResponse = await callLLM(projPrompt, 0.1);
    parsedProjects = parseJSONWithRetry<
      { name: string; bullets: string[]; url?: string; techStack?: string }[]
    >(projResponse, "Projects");
  }

  // 3. Scoped Call: Skills
  let parsedSkills: string[] = [];
  const skillsSourceText = split.skillsText.length > 0 ? split.skillsText : resumeText;

  const skillsPrompt = `You are an expert resume parser. Extract ONLY technical skills from the skills text provided below.

Return ONLY a valid JSON array of string items matching this exact shape, with no markdown code fences:
["string"]

CRITICAL EXTRACTION INSTRUCTIONS:
- Extract skills exactly as listed in the text.
- Split categories or comma-separated lists into individual skill strings (e.g. ["React.js", "Node.js", "TypeScript"]).

Skills Text Block:
${skillsSourceText}`;

  const skillsResponse = await callLLM(skillsPrompt, 0.1);
  parsedSkills = parseJSONWithRetry<string[]>(skillsResponse, "Skills");

  // 4. Scoped Call: Education (Optional)
  let parsedEducation: { institution: string; degree: string; dates: string; details?: string }[] | undefined = undefined;
  if (split.educationText.length > 0) {
    const eduPrompt = `You are an expert resume parser. Extract ONLY education entries from the education text provided below.

Return ONLY a valid JSON array matching this exact shape, with no markdown code fences:
[
  {
    "institution": "string",
    "degree": "string",
    "dates": "string",
    "details": "string (optional)"
  }
]

Education Text Block:
${split.educationText}`;

    const eduResponse = await callLLM(eduPrompt, 0.1);
    parsedEducation = parseJSONWithRetry<
      { institution: string; degree: string; dates: string; details?: string }[]
    >(eduResponse, "Education");
  }

  // 5. Scoped Call: Certifications (Optional)
  let parsedCertifications: string[] | undefined = undefined;
  if (split.certificationsText.length > 0) {
    const certPrompt = `You are an expert resume parser. Extract ONLY certification items as a string array from the text below.

Return ONLY a valid JSON array of strings:
["string"]

Certifications Text Block:
${split.certificationsText}`;

    const certResponse = await callLLM(certPrompt, 0.1);
    parsedCertifications = parseJSONWithRetry<string[]>(certResponse, "Certifications");
  }

  // 6. Additional info lines (Optional)
  let parsedAdditional: string[] | undefined = undefined;
  if (split.additionalText.length > 0) {
    parsedAdditional = split.additionalText
      .split("\n")
      .map((l) => l.trim().replace(/^[\#\*\-\•\>]+\s*/, ""))
      .filter((l) => l.length > 0);
  }

  return {
    sections: {
      summary: split.summaryText.length > 0 ? split.summaryText : undefined,
      experience: parsedExperience,
      projects: parsedProjects,
      education: parsedEducation,
      certifications: parsedCertifications,
      skills: parsedSkills,
      additional: parsedAdditional,
    },
  };
}
