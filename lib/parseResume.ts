import { ResumeData, ContactInfo, EducationEntry, CertificationEntry } from "../types";
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
 * Deterministically extracts contact info using regex for email, phone, links, and name from top line.
 * Location is passed in after a scoped top-5-line LLM check.
 */
export function extractContactInfo(resumeText: string, location: string): ContactInfo {
  const lines = resumeText.split("\n");
  const firstNonEmptyLine = lines.find((l) => l.trim().length > 0)?.trim() || "";
  const name = firstNonEmptyLine;

  // Email regex
  const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : "";

  // Phone regex (matches formats like +91-XXXXXXXXXX, (XXX) XXX-XXXX, XXX-XXX-XXXX, 10+ digits)
  const phoneMatch = resumeText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : "";

  // Header text block (lines before first section header or top 10 lines)
  const headerLines: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.length > 2 &&
      trimmed.length <= 45 &&
      /^(summary|profile|experience|work experience|projects|skills|education|certifications)$/i.test(
        trimmed.replace(/^[\#\*\-\s\>]+/, "").replace(/[\:\#\*\-\>\=]+$/, "").trim()
      )
    ) {
      break;
    }
    headerLines.push(line);
  }
  const headerText = headerLines.length > 0 ? headerLines.join("\n") : lines.slice(0, 10).join("\n");
  const headerTextNoEmail = headerText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "");

  // Links regex: collect ALL matches into the links array (excluding email & tech stack terms)
  const linkRegex = /(?:https?:\/\/)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s•|,\n\r\)\>]*)?/gi;
  const rawMatches = headerTextNoEmail.match(linkRegex) || [];

  const IGNORED_LINK_PATTERNS = [
    /\.js$/i,
    /^(b|m)\.tech$/i,
    /^(b|m)\.s\.$/i,
    /^(b|m)\.a\.$/i,
    /gmail\.com$/i,
    /yahoo\.com$/i,
    /hotmail\.com$/i,
    /outlook\.com$/i,
    /icloud\.com$/i,
  ];

  const linksSet = new Set<string>();
  for (const rawMatch of rawMatches) {
    let clean = rawMatch.trim();
    clean = clean.replace(/^[\(\<\[]+/, "").replace(/[\)\>\.\,]+$/, "");
    if (clean.includes("@")) continue; // Skip email addresses
    if (clean.length < 4) continue;

    if (IGNORED_LINK_PATTERNS.some((p) => p.test(clean))) continue;

    linksSet.add(clean);
  }

  return {
    name,
    email,
    phone,
    location,
    links: Array.from(linksSet),
  };
}

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
      } else if (/^(education|academic background|academic qualifications|education & certifications|education and certifications)$/i.test(cleanHeader)) {
        detectedCategory = "education";
      } else if (/^(certifications|certifications & learning|certifications and learning|licenses|certifications & licenses|certificates)$/i.test(cleanHeader)) {
        detectedCategory = "certifications";
      } else if (/^(profile|summary|profile summary|professional summary|about me|objective|summary of qualifications)$/i.test(cleanHeader)) {
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

  let summaryText = (sections.summary || []).join("\n").trim();

  if (!summaryText && sections.other && sections.other.length > 0) {
    const nonContactLines = sections.other.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.includes("@")) return false;
      if (/(?:\+\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}/.test(trimmed)) return false;
      if (/(?:linkedin|github|vercel|http|\.com|\.dev|\.io)/i.test(trimmed)) return false;
      if (trimmed === lines.find((l) => l.trim().length > 0)?.trim()) return false;
      return true;
    });

    if (nonContactLines.length > 0) {
      summaryText = nonContactLines.join("\n").trim();
    }
  }

  return {
    summaryText,
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

  // 1. Contact Location LLM prompt (ONLY first 5 header lines)
  const headerLines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 5)
    .join("\n");

  const locPrompt = `Extract ONLY the candidate's city, state/region, and/or country (location) from the resume header lines provided below.
If a location is present (e.g. "New Delhi, India" or "San Francisco, CA"), return ONLY a JSON object matching this exact shape:
{"location": "string"}
If no location is found, return {"location": ""}.

Resume Header Lines:
${headerLines}`;

  // 2. Scoped LLM Prompt: Experience Entry Metadata ONLY
  const experienceSourceText = split.experienceText.length > 0 ? split.experienceText : resumeText;

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

  // 3. Scoped LLM Prompt: Projects Entry Metadata ONLY
  const projPrompt = split.projectsText.length > 0
    ? `You are an expert resume parser. Identify project entry metadata in the projects text provided below.
Return ONLY project name for each project.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "projects": [
    {
      "name": "string"
    }
  ]
}

Projects Text Block:
${split.projectsText}`
    : "";

  // 4. Scoped LLM Prompt: Technical Skills
  const skillsSourceText = split.skillsText.length > 0 ? split.skillsText : resumeText;

  const skillsPrompt = `You are an expert resume parser. Extract ONLY technical skills from the skills text provided below.

Return ONLY a valid JSON array of string items matching this exact shape:
["string"]

CRITICAL EXTRACTION INSTRUCTIONS:
- Extract skills exactly as listed in the text.
- Split categories or comma-separated lists into individual skill strings (e.g. ["React.js", "Node.js", "TypeScript"]).

Skills Text Block:
${skillsSourceText}`;

  // 5. Scoped LLM Prompt: Education
  const eduPrompt = split.educationText.length > 0
    ? `You are an expert resume parser. Extract ONLY education entries from the education text provided below.

Return ONLY a valid JSON object matching this exact shape:
{
  "entries": [
    {
      "institution": "string",
      "degree": "string",
      "dates": "string"
    }
  ]
}

Education Text Block:
${split.educationText}`
    : "";

  // 6. Scoped LLM Prompt: Certifications
  const certSourceText = split.certificationsText.length > 0 ? split.certificationsText : split.educationText;
  const certPrompt = certSourceText.length > 0
    ? `You are an expert resume parser. Extract ONLY certification entries from the certifications text provided below.

Return ONLY a valid JSON object matching this exact shape:
{
  "entries": [
    {
      "name": "string",
      "issuer": "string"
    }
  ]
}

Certifications Text Block:
${certSourceText}`
    : "";

  // Execute all scoped section LLM calls concurrently
  const [
    locResponse,
    expResponse,
    projResponse,
    skillsResponse,
    eduResponse,
    certResponse,
  ] = await Promise.all([
    callLLM(locPrompt, 0.1).catch(() => '{"location":""}'),
    callLLM(expPrompt, 0.1),
    projPrompt ? callLLM(projPrompt, 0.1) : Promise.resolve('{"projects":[]}'),
    callLLM(skillsPrompt, 0.1),
    eduPrompt ? callLLM(eduPrompt, 0.1) : Promise.resolve('{"entries":[]}'),
    certPrompt ? callLLM(certPrompt, 0.1) : Promise.resolve('{"entries":[]}'),
  ]);

  // Process Location
  let extractedLocation = "";
  try {
    const parsedLoc = parseJSONWithRetry<{ location: string }>(locResponse, "Location");
    extractedLocation = parsedLoc.location || "";
  } catch {
    extractedLocation = "";
  }

  const contactInfo = extractContactInfo(resumeText, extractedLocation);

  // Process Experience
  const parsedExpMetadata = parseJSONWithRetry<{
    entries: { company: string; title: string; dates: string; location?: string }[];
  }>(expResponse, "Experience Metadata");

  const rawEntries = parsedExpMetadata.entries || [];

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
      bullets,
    };
  });

  // Process Projects
  let parsedProjects: { name: string; bullets: string[] }[] = [];
  if (split.projectsText.length > 0) {
    const parsedProjMetadata = parseJSONWithRetry<{
      projects: { name: string }[];
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
        bullets,
      };
    });
  }

  // Process Skills
  const parsedSkills = parseJSONWithRetry<string[]>(skillsResponse, "Skills");

  // Process Education
  let parsedEducation: EducationEntry[] = [];
  if (split.educationText.length > 0) {
    const parsedEduObj = parseJSONWithRetry<{
      entries: { institution: string; degree: string; dates: string }[];
    }>(eduResponse, "Education");
    parsedEducation = (parsedEduObj.entries || []).map((e) => ({
      institution: e.institution || "",
      degree: e.degree || "",
      dates: e.dates || "",
    }));
  }

  // Process Certifications
  let parsedCertifications: CertificationEntry[] = [];
  if (certSourceText.length > 0) {
    const parsedCertObj = parseJSONWithRetry<{
      entries: { name: string; issuer: string }[];
    }>(certResponse, "Certifications");
    parsedCertifications = (parsedCertObj.entries || []).map((c) => ({
      name: c.name || "",
      issuer: c.issuer || "",
    }));
  }

  const finalResult: ResumeData = {
    contact: contactInfo,
    summary: split.summaryText.trim(),
    sections: {
      experience: parsedExperience,
      projects: parsedProjects,
      skills: parsedSkills,
      education: parsedEducation,
      certifications: parsedCertifications,
    },
  };

  // Run Substring Verification for Bullets
  verifyBulletSubstrings(resumeText, finalResult);

  return finalResult;
}
