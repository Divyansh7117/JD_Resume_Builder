import { ResumeData, ContactInfo, EducationEntry, CertificationEntry, CandidateEvidenceUnit } from "../types";
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
      /^(summary|profile|experience|work experience|projects|skills|skills & tools|skills and tools|technical skills|education|certifications|education & certifications)$/i.test(
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
      } else if (/^(skills|technical skills|skills & tools|skills and tools|skills & competencies|technical skills & tools|technologies|technical stack|core competencies|core competencies & skills|technical stack & algorithms|skills \/ tools|key skills|skills & expertise)$/i.test(cleanHeader)) {
        detectedCategory = "skills";
      } else if (/^(education|academic background|academic qualifications|education & qualifications|education and qualifications)$/i.test(cleanHeader)) {
        detectedCategory = "education";
      } else if (/^(certifications|certifications & learning|certifications and learning|licenses|certifications & licenses|certificates)$/i.test(cleanHeader)) {
        detectedCategory = "certifications";
      } else if (/^(education & certifications|education and certifications|education & learning)$/i.test(cleanHeader)) {
        detectedCategory = "education";
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

  // 1. Scoped LLM Prompt 1: Experience AND Projects Entry Metadata & Bullets in ONE consolidated call
  const experienceSourceText = split.experienceText.length > 0 ? split.experienceText : resumeText;
  const projectsSourceText = split.projectsText;

  const expProjPrompt = `You are an expert resume parser. Extract structured work experience entries and project entries from the text blocks provided below.

CRITICAL EXPERIENCE EXTRACTION RULES:
1. Identify EVERY distinct role/position in the experience text block.
2. For each role, extract:
   - "company": string (e.g. "PhysicsWallah · PW Vidyapeeth" or "PhysicsWallah · Ecommerce Business")
   - "title": string (e.g. "General Manager – Product & Growth" or "Product Owner - E-commerce (PW Store)")
   - "dates": string (e.g. "Jun 2024 – Present" or "Mar 2022 – Jun 2024")
   - "location": string (if present, e.g. "Delhi, India")
   - "bullets": array of strings. Extract EVERY bullet point belonging to this specific role verbatim from the text.
     * CRITICAL: Do NOT merge headers of subsequent roles into the previous role's bullets.
     * CRITICAL: Do NOT leave any role with empty bullets if bullets exist for it in the text.
     * If a candidate held multiple roles at the same company (e.g. internal promotions), extract EACH role as its own entry with its own distinct bullets.

3. For project entries (if any):
   - "name": string
   - "bullets": array of strings. Extract every bullet point belonging to this project verbatim.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "experienceEntries": [
    {
      "company": "string",
      "title": "string",
      "dates": "string",
      "location": "string",
      "bullets": ["string"]
    }
  ],
  "projectEntries": [
    {
      "name": "string",
      "bullets": ["string"]
    }
  ]
}

Experience Text Block:
${experienceSourceText}

Projects Text Block:
${projectsSourceText || "(No separate projects section)"}`;

  // 2. Scoped LLM Prompt 2: Education, Certifications AND Candidate Location in ONE consolidated call
  const headerLines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 5)
    .join("\n");

  const eduSourceText = split.educationText;
  const certSourceText = split.certificationsText.length > 0 ? split.certificationsText : split.educationText;
  const eduCertCombined = [eduSourceText, certSourceText !== eduSourceText ? certSourceText : ""]
    .filter(Boolean)
    .join("\n\n");

  const eduCertLocPrompt = `You are an expert resume parser. Extract the candidate's location, education entries, and certification entries from the text blocks below.

Return ONLY a valid JSON object matching this exact shape, with no markdown code fences:
{
  "location": "string",
  "educationEntries": [
    {
      "institution": "string",
      "degree": "string",
      "dates": "string"
    }
  ],
  "certificationEntries": [
    {
      "name": "string",
      "issuer": "string"
    }
  ]
}

CRITICAL RULES:
- Location: Extract candidate's city, state/region, and/or country from the header lines (e.g. "New Delhi, India" or "San Francisco, CA"). If not found, return "".
- Education: Extract degrees, universities/institutions, and graduation/attendance dates. If none, return [].
- Certifications: Extract certification/course names and issuing organizations (e.g. HelloPM, AWS, Udemy, Coursera). If none, return [].

Header Lines (for location):
${headerLines}

Education & Certifications Text:
${eduCertCombined || "(No separate education/certifications section)"}`;

  // 3. Scoped LLM Prompt 3: Technical, Product, Analytics & Domain Skills
  const skillsSourceText = split.skillsText.length > 0 ? split.skillsText : resumeText;

  const skillsPrompt = `You are an expert resume parser. Extract ALL skills, tools, technologies, methodologies, domain expertise, and core competencies listed in the skills text provided below.

Return ONLY a valid JSON array of string items matching this exact shape:
["string"]

CRITICAL EXTRACTION INSTRUCTIONS:
- Extract all skills, competencies, and tools as individual items (e.g. ["B2C Product Management", "A/B Testing", "SQL", "Python", "Prompt Engineering"]).
- Split categories or delimited lists (bullets, commas, middots '·', pipes '|', slashes) into individual skill strings.
- Do not restrict only to programming languages; include product, analytics, growth, leadership, and domain competencies.
- Do not invent skills not mentioned in the text.

Skills Text Block:
${skillsSourceText}`;

  // Execute consolidated section LLM calls concurrently (3 calls total)
  const [
    expProjResponse,
    eduCertLocResponse,
    skillsResponse,
  ] = await Promise.all([
    callLLM(expProjPrompt, 0.1),
    callLLM(eduCertLocPrompt, 0.1),
    callLLM(skillsPrompt, 0.1),
  ]);

  // Process Location, Education, and Certifications from consolidated response
  let extractedLocation = "";
  let parsedEducation: EducationEntry[] = [];
  let parsedCertifications: CertificationEntry[] = [];

  try {
    const parsedEduCertLoc = parseJSONWithRetry<{
      location?: string;
      educationEntries?: { institution: string; degree: string; dates: string }[];
      certificationEntries?: { name: string; issuer: string }[];
    }>(eduCertLocResponse, "Education, Certifications & Location");

    extractedLocation = parsedEduCertLoc.location || "";
    parsedEducation = (parsedEduCertLoc.educationEntries || []).map((e) => ({
      institution: e.institution || "",
      degree: e.degree || "",
      dates: e.dates || "",
    }));
    parsedCertifications = (parsedEduCertLoc.certificationEntries || []).map((c) => ({
      name: c.name || "",
      issuer: c.issuer || "",
    }));
  } catch (err) {
    console.error("Failed to parse education/cert/location consolidated response:", err);
  }

  const contactInfo = extractContactInfo(resumeText, extractedLocation);

  // Process Experience and Projects from consolidated response
  let rawExpEntries: { company: string; title: string; dates: string; location?: string; bullets?: string[] }[] = [];
  let rawProjEntries: { name: string; bullets?: string[] }[] = [];

  try {
    const parsedExpProj = parseJSONWithRetry<{
      experienceEntries?: { company: string; title: string; dates: string; location?: string; bullets?: string[] }[];
      entries?: { company: string; title: string; dates: string; location?: string; bullets?: string[] }[];
      projectEntries?: { name: string; bullets?: string[] }[];
      projects?: { name: string; bullets?: string[] }[];
    }>(expProjResponse, "Experience & Projects Metadata");

    rawExpEntries = parsedExpProj.experienceEntries || parsedExpProj.entries || [];
    rawProjEntries = parsedExpProj.projectEntries || parsedExpProj.projects || [];
  } catch (err) {
    console.error("Failed to parse experience/projects consolidated response:", err);
  }

  const expStartIndices: number[] = [];
  let lastExpIndex = 0;

  for (const entry of rawExpEntries) {
    let foundIdx = findStringIndex(experienceSourceText, entry.company, lastExpIndex);
    if (foundIdx === -1 && entry.title) {
      foundIdx = findStringIndex(experienceSourceText, entry.title, lastExpIndex);
    }

    if (foundIdx === -1) {
      foundIdx = lastExpIndex;
    } else {
      lastExpIndex = foundIdx;
    }

    expStartIndices.push(foundIdx);
  }

  const parsedExperience = rawExpEntries.map((entry, i) => {
    // If the LLM already extracted authentic bullets for this role, use them directly
    if (Array.isArray(entry.bullets) && entry.bullets.length > 0) {
      return {
        company: entry.company,
        title: entry.title,
        dates: entry.dates,
        location: entry.location,
        bullets: entry.bullets.map((b) => b.trim()).filter((b) => b.length > 0),
      };
    }

    // Fallback deterministic string slicing
    const start = expStartIndices[i];
    const end = i + 1 < rawExpEntries.length ? expStartIndices[i + 1] : experienceSourceText.length;
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

  // Process Projects
  let parsedProjects: { name: string; bullets: string[] }[] = [];
  if (rawProjEntries.length > 0) {
    const projStartIndices: number[] = [];
    let lastProjIndex = 0;

    for (const proj of rawProjEntries) {
      let foundIdx = findStringIndex(split.projectsText, proj.name, lastProjIndex);
      if (foundIdx === -1) {
        foundIdx = lastProjIndex;
      } else {
        lastProjIndex = foundIdx;
      }
      projStartIndices.push(foundIdx);
    }

    parsedProjects = rawProjEntries.map((proj, i) => {
      if (Array.isArray(proj.bullets) && proj.bullets.length > 0) {
        return {
          name: proj.name,
          bullets: proj.bullets.map((b) => b.trim()).filter((b) => b.length > 0),
        };
      }

      const start = projStartIndices[i];
      const end = i + 1 < rawProjEntries.length ? projStartIndices[i + 1] : split.projectsText.length;
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

  // ─── Deterministically build immutable CandidateEvidenceUnit array ───
  const evidence_units: CandidateEvidenceUnit[] = [];

  if (contactInfo.location) {
    evidence_units.push({
      id: "ev_contact_loc",
      source_section: "contact",
      source_title: "Candidate Location",
      text: contactInfo.location,
      evidence_type: "explicit_resume_claim",
    });
  }

  if (split.summaryText && split.summaryText.trim()) {
    // Index full summary and individual sentences
    evidence_units.push({
      id: "ev_sum_full",
      source_section: "summary",
      source_title: "Professional Summary",
      text: split.summaryText.trim(),
      evidence_type: "explicit_resume_claim",
    });

    const sentences = split.summaryText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    sentences.forEach((sentence, idx) => {
      evidence_units.push({
        id: `ev_sum_${idx + 1}`,
        source_section: "summary",
        source_title: "Professional Summary",
        text: sentence,
        evidence_type: "explicit_resume_claim",
      });
    });
  }

  parsedExperience.forEach((exp, i) => {
    // Index employment dates / role header
    evidence_units.push({
      id: `ev_exp_${i + 1}_header`,
      source_section: "experience",
      source_title: `${exp.title} at ${exp.company}`,
      text: `${exp.title} at ${exp.company} (${exp.dates}${exp.location ? `, ${exp.location}` : ""})`,
      evidence_type: "employment_date_calculation",
      context_tags: [exp.company, exp.title],
    });

    exp.bullets.forEach((bullet, j) => {
      evidence_units.push({
        id: `ev_exp_${i + 1}_${j + 1}`,
        source_section: "experience",
        source_title: `${exp.title} at ${exp.company} (${exp.dates})`,
        text: bullet,
        evidence_type: "source_bullet",
        context_tags: [exp.company, exp.title],
      });
    });
  });

  parsedProjects.forEach((proj, i) => {
    const p = proj as { name: string; bullets: string[]; url?: string; techStack?: string };
    evidence_units.push({
      id: `ev_proj_${i + 1}_header`,
      source_section: "project",
      source_title: p.name,
      text: `${p.name}${p.techStack ? ` (Tech: ${p.techStack})` : ""}${p.url ? ` [${p.url}]` : ""}`,
      evidence_type: "source_bullet",
      context_tags: [p.name],
    });

    proj.bullets.forEach((bullet, j) => {
      evidence_units.push({
        id: `ev_proj_${i + 1}_${j + 1}`,
        source_section: "project",
        source_title: proj.name,
        text: bullet,
        evidence_type: "source_bullet",
        context_tags: [proj.name],
      });
    });
  });

  parsedSkills.forEach((skill, i) => {
    evidence_units.push({
      id: `ev_skill_${i + 1}`,
      source_section: "skill",
      source_title: "Skills & Competencies",
      text: skill,
      evidence_type: "explicit_resume_claim",
    });
  });

  parsedEducation.forEach((edu, i) => {
    evidence_units.push({
      id: `ev_edu_${i + 1}`,
      source_section: "education",
      source_title: "Education",
      text: `${edu.degree} — ${edu.institution} (${edu.dates})`,
      evidence_type: "employment_date_calculation",
    });
  });

  parsedCertifications.forEach((cert, i) => {
    evidence_units.push({
      id: `ev_cert_${i + 1}`,
      source_section: "certification",
      source_title: "Certifications",
      text: cert.issuer ? `${cert.name} (${cert.issuer})` : cert.name,
      evidence_type: "explicit_resume_claim",
    });
  });

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
    evidence_units,
  };

  // Run Substring Verification for Bullets
  verifyBulletSubstrings(resumeText, finalResult);

  return finalResult;
}
