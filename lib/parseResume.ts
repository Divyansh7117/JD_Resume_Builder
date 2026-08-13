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

const BULLET_MARKER_REGEX = /^[\s\t]*[•●\-\*▪○▸\+–—\>]\s*|^[\s\t]*\d+[\.\)]\s+/;

/**
 * Deterministically extracts bullet strings from a raw text block using regex matching.
 * Bullet text is NEVER rewritten — line content is extracted character-for-character.
 * Multi-line wrapped bullets are joined with a space.
 */
export function extractBulletsFromBlock(text: string): string[] {
  if (!text || !text.trim()) return [];

  const lines = text.split("\n");
  const bullets: string[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (BULLET_MARKER_REGEX.test(rawLine)) {
      // Strip leading bullet symbol and whitespace
      const cleanBullet = rawLine
        .replace(/^[\s\t]*[•●\-\*▪○▸\+–—\>]\s*|^[\s\t]*\d+[\.\)]\s*/, "")
        .trim();

      if (cleanBullet.length > 0) {
        bullets.push(cleanBullet);
      }
    } else if (bullets.length > 0) {
      // Append non-bullet continuation lines to the previous bullet
      bullets[bullets.length - 1] += " " + trimmed;
    }
  }

  return bullets;
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
  const experienceSourceText = split.experienceText.length > 0 ? split.experienceText : resumeText;

  // 1. LLM Boundary Call: Experience Structural Boundaries
  const expPrompt = `You are an expert resume parser. Identify structural boundaries for each work experience entry in the text provided below.
For each experience entry, return company, title, dates, location (if present), and blockText.

blockText MUST be the exact raw text segment (copied character-for-character, unmodified) belonging to that entry, INCLUDING all bullet lines exactly as they appear in the source text.

Return ONLY a valid JSON object matching this exact shape:
{
  "entries": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "location": "string (optional)",
      "blockText": "string"
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Copy blockText character-for-character from the source text. Do not rewrite, summarize, paraphrase, or omit any line or bullet.
- Do NOT generate or rewrite bullet strings.

Experience Text Block:
${experienceSourceText}`;

  const expResponse = await callLLM(expPrompt, 0.1);
  const parsedExpStruct = parseJSONWithRetry<{
    entries: { company: string; title: string; dates: string; location?: string; blockText: string }[];
  }>(expResponse, "Experience Boundaries");

  const parsedExperience = (parsedExpStruct.entries || []).map((entry) => {
    let bullets = extractBulletsFromBlock(entry.blockText);

    // Fallback if no bullet markers were found in blockText
    if (bullets.length === 0 && entry.blockText) {
      bullets = entry.blockText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.includes(entry.company) && !l.includes(entry.title));
    }

    // Sanity Assertion
    const rawLines = (entry.blockText || "").split("\n");
    const markerCount = rawLines.filter((l) => BULLET_MARKER_REGEX.test(l)).length;
    if (markerCount > 0 && markerCount !== bullets.length) {
      console.warn(
        `[BULLET SANITY WARNING] Mismatch in '${entry.company}': expected ${markerCount} bullets from markers, extracted ${bullets.length} bullets.`
      );
    }

    return {
      company: entry.company,
      title: entry.title,
      dates: entry.dates,
      location: entry.location,
      bullets,
    };
  });

  // 2. LLM Boundary Call: Projects Structural Boundaries
  let parsedProjects: { name: string; bullets: string[]; url?: string; techStack?: string }[] = [];
  if (split.projectsText.length > 0) {
    const projPrompt = `You are an expert resume parser. Identify structural boundaries for each project entry in the text provided below.
For each project entry, return name, url (if present), techStack (if present), and blockText.

blockText MUST be the exact raw text segment (copied character-for-character, unmodified) belonging to that project entry, INCLUDING all bullet lines exactly as they appear in the source text.

Return ONLY a valid JSON object matching this exact shape:
{
  "projects": [
    {
      "name": "string",
      "url": "string (optional)",
      "techStack": "string (optional)",
      "blockText": "string"
    }
  ]
}

CRITICAL INSTRUCTIONS:
- Copy blockText character-for-character from the source text. Do not rewrite, summarize, or paraphrase anything.

Projects Text Block:
${split.projectsText}`;

    const projResponse = await callLLM(projPrompt, 0.1);
    const parsedProjStruct = parseJSONWithRetry<{
      projects: { name: string; url?: string; techStack?: string; blockText: string }[];
    }>(projResponse, "Projects Boundaries");

    parsedProjects = (parsedProjStruct.projects || []).map((proj) => {
      let bullets = extractBulletsFromBlock(proj.blockText);

      if (bullets.length === 0 && proj.blockText) {
        bullets = proj.blockText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.includes(proj.name));
      }

      // Sanity Assertion
      const rawLines = (proj.blockText || "").split("\n");
      const markerCount = rawLines.filter((l) => BULLET_MARKER_REGEX.test(l)).length;
      if (markerCount > 0 && markerCount !== bullets.length) {
        console.warn(
          `[BULLET SANITY WARNING] Mismatch in project '${proj.name}': expected ${markerCount} bullets from markers, extracted ${bullets.length} bullets.`
        );
      }

      return {
        name: proj.name,
        url: proj.url,
        techStack: proj.techStack,
        bullets,
      };
    });
  }

  // 3. Scoped Call: Skills
  let parsedSkills: string[] = [];
  const skillsSourceText = split.skillsText.length > 0 ? split.skillsText : resumeText;

  const skillsPrompt = `You are an expert resume parser. Extract ONLY technical skills from the skills text provided below.

Return ONLY a valid JSON array of string items matching this exact shape:
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

Return ONLY a valid JSON array matching this exact shape:
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
