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

/**
 * Finds start index of a string in source text case-insensitively, rewinding to line-start (\n).
 */
function findStringIndex(source: string, searchStr: string, fromIndex: number = 0): number {
  if (!searchStr || !searchStr.trim()) return -1;
  const lowerSource = source.toLowerCase();
  const lowerSearch = searchStr.toLowerCase().trim();

  let idx = lowerSource.indexOf(lowerSearch, fromIndex);
  if (idx !== -1) {
    const lineStart = lowerSource.lastIndexOf("\n", idx);
    return lineStart === -1 ? 0 : lineStart + 1;
  }

  if (lowerSearch.length > 10) {
    idx = lowerSource.indexOf(lowerSearch.substring(0, 10), fromIndex);
    if (idx !== -1) {
      const lineStart = lowerSource.lastIndexOf("\n", idx);
      return lineStart === -1 ? 0 : lineStart + 1;
    }
  }

  return -1;
}

/**
 * Verification step: Confirms that every extracted bullet appears as a substring in the original full resumeText.
 */
function verifyBulletSubstrings(resumeText: string, data: ResumeData): void {
  const fullTextLower = resumeText.toLowerCase();

  const allEntries = [
    ...(data.sections.experience || []).map((e) => ({ label: `experience '${e.company}'`, bullets: e.bullets })),
    ...(data.sections.projects || []).map((p) => ({ label: `project '${p.name}'`, bullets: p.bullets })),
  ];

  for (const item of allEntries) {
    for (const bullet of item.bullets) {
      const trimmedBullet = bullet.trim();
      if (!trimmedBullet) continue;

      const sample = trimmedBullet.length > 25 ? trimmedBullet.substring(0, 25).toLowerCase() : trimmedBullet.toLowerCase();

      if (!fullTextLower.includes(sample)) {
        console.error(
          `[SUBSTRING VERIFICATION ERROR] Bullet "${trimmedBullet}" for ${item.label} NOT found in original resumeText!`
        );
      }
    }
  }
}

export async function parseResume(resumeText: string): Promise<ResumeData> {
  const split = splitResumeIntoSections(resumeText);
  const experienceSourceText = split.experienceText.length > 0 ? split.experienceText : resumeText;

  // 1. Scoped LLM Call: Experience Entry Metadata ONLY (no blockText, no bullets)
  const expPrompt = `You are an expert resume parser. Identify work experience entry metadata in the experience text provided below.
Return ONLY company, title, dates, and location (if present) for each entry.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "entries": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "location": "string (optional)"
    }
  ]
}

Experience Text Block:
${experienceSourceText}`;

  const expResponse = await callLLM(expPrompt, 0.1);
  const parsedExpMetadata = parseJSONWithRetry<{
    entries: { company: string; title: string; dates: string; location?: string }[];
  }>(expResponse, "Experience Metadata");

  const rawEntries = parsedExpMetadata.entries || [];

  // Find start indices for each experience entry deterministically via indexOf in experienceSourceText
  const expStartIndices: number[] = [];
  let lastExpIndex = 0;

  for (const entry of rawEntries) {
    let foundIdx = findStringIndex(experienceSourceText, entry.company, lastExpIndex);
    if (foundIdx === -1 && entry.title) {
      foundIdx = findStringIndex(experienceSourceText, entry.title, lastExpIndex);
    }

    if (foundIdx === -1) {
      console.warn(
        `[INDEX NOT FOUND WARNING] Could not find start index for experience entry '${entry.company}' / '${entry.title}' in experienceText. Falling back to offset ${lastExpIndex}.`
      );
      foundIdx = lastExpIndex;
    } else {
      lastExpIndex = foundIdx;
    }

    expStartIndices.push(foundIdx);
  }

  // Slice blockText in TypeScript code & extract bullets deterministically
  const parsedExperience = rawEntries.map((entry, i) => {
    const start = expStartIndices[i];
    const end = i + 1 < rawEntries.length ? expStartIndices[i + 1] : experienceSourceText.length;
    const blockText = experienceSourceText.substring(start, end);

    let bullets = extractBulletsFromBlock(blockText);

    if (bullets.length === 0 && blockText) {
      bullets = blockText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.includes(entry.company) && !l.includes(entry.title));
    }

    return {
      company: entry.company,
      title: entry.title,
      dates: entry.dates,
      location: entry.location,
      bullets,
    };
  });

  // 2. Scoped LLM Call: Projects Entry Metadata ONLY (no blockText, no bullets)
  let parsedProjects: { name: string; bullets: string[]; url?: string; techStack?: string }[] = [];
  if (split.projectsText.length > 0) {
    const projPrompt = `You are an expert resume parser. Identify project entry metadata in the projects text provided below.
Return ONLY name, url (if present), and techStack (if present) for each project.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "projects": [
    {
      "name": "string",
      "url": "string (optional)",
      "techStack": "string (optional)"
    }
  ]
}

Projects Text Block:
${split.projectsText}`;

    const projResponse = await callLLM(projPrompt, 0.1);
    const parsedProjMetadata = parseJSONWithRetry<{
      projects: { name: string; url?: string; techStack?: string }[];
    }>(projResponse, "Projects Metadata");

    const rawProjects = parsedProjMetadata.projects || [];
    const projStartIndices: number[] = [];
    let lastProjIndex = 0;

    for (const proj of rawProjects) {
      let foundIdx = findStringIndex(split.projectsText, proj.name, lastProjIndex);
      if (foundIdx === -1) {
        console.warn(
          `[INDEX NOT FOUND WARNING] Could not find start index for project '${proj.name}' in projectsText. Falling back to offset ${lastProjIndex}.`
        );
        foundIdx = lastProjIndex;
      } else {
        lastProjIndex = foundIdx;
      }
      projStartIndices.push(foundIdx);
    }

    parsedProjects = rawProjects.map((proj, i) => {
      const start = projStartIndices[i];
      const end = i + 1 < rawProjects.length ? projStartIndices[i + 1] : split.projectsText.length;
      const blockText = split.projectsText.substring(start, end);

      let bullets = extractBulletsFromBlock(blockText);

      if (bullets.length === 0 && blockText) {
        bullets = blockText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0 && !l.includes(proj.name));
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

  const finalResult: ResumeData = {
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

  // 5. Run Last-Line Substring Verification
  verifyBulletSubstrings(resumeText, finalResult);

  return finalResult;
}
