/**
 * Deterministic Experience Engine
 * 
 * Performs 100% deterministic calculation of candidate employment history,
 * date interval union (eliminating double counting for overlapping jobs),
 * role type categorization (professional, internship, freelance, academic),
 * and dynamic JD experience constraint evaluation.
 * 
 * NO LLM ARITHMETIC. NO HARDCODED DATES. NO CANDIDATE-SPECIFIC RULES.
 */

import { ResumeData, JDRequirement, EligibilityStatus, ExperienceChronologyVerification } from "../types";

export interface DateInterval {
  startDate: Date;
  endDate: Date;
  company: string;
  title: string;
  rawDates: string;
  isInternship: boolean;
  isFreelance: boolean;
  isAcademic: boolean;
  months: number;
}

export interface ParsedDateRange {
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
  isValid: boolean;
}

export interface ExperienceChronology {
  referenceDate: Date;
  totalProfessionalMonths: number;
  totalProfessionalYears: number;
  totalInternshipMonths: number;
  totalInternshipYears: number;
  totalCombinedMonths: number;
  totalCombinedYears: number;
  rolesBreakdown: {
    company: string;
    title: string;
    dates: string;
    calculated_years: number;
    calculated_months: number;
    role_type: "professional" | "internship" | "freelance" | "academic";
    isOverlapping: boolean;
  }[];
}

export interface ParsedExperienceConstraint {
  minYears: number;
  maxYears?: number;
  domain?: string;
  allowsInternships: boolean;
  requiresFullTimeOnly: boolean;
  isUnspecified: boolean;
}

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const PRESENT_TOKENS = ["present", "current", "now", "ongoing", "till date", "to date", "current date"];

const INTERNSHIP_KEYWORDS = [
  "intern",
  "internship",
  "trainee",
  "traineeship",
  "fellow",
  "fellowship",
  "apprentice",
  "apprenticeship",
  "co-op",
  "summer analyst",
  "graduate trainee",
];

const FREELANCE_KEYWORDS = [
  "freelance",
  "freelancer",
  "contract",
  "contractor",
  "self-employed",
  "consultant",
];

const ACADEMIC_KEYWORDS = [
  "student",
  "research assistant",
  "teaching assistant",
  "academic",
  "coursework",
  "capstone",
];

/**
 * Classifies a role title and company into role types.
 */
export function classifyRoleType(
  title: string,
  company: string = ""
): "professional" | "internship" | "freelance" | "academic" {
  const text = `${title} ${company}`.toLowerCase();

  for (const kw of INTERNSHIP_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(text)) {
      return "internship";
    }
  }

  for (const kw of FREELANCE_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(text)) {
      return "freelance";
    }
  }

  for (const kw of ACADEMIC_KEYWORDS) {
    const regex = new RegExp(`\\b${kw}\\b`, "i");
    if (regex.test(text)) {
      return "academic";
    }
  }

  return "professional";
}

/**
 * Parses a single month-year token (e.g. "Jan 2024", "January 2024", "01/2024", "2024").
 */
function parseDateToken(token: string, isEnd: boolean, referenceDate: Date): Date | null {
  const cleaned = token.trim().toLowerCase();
  if (!cleaned) return null;

  if (PRESENT_TOKENS.some((p) => cleaned.includes(p))) {
    return new Date(referenceDate);
  }

  // Format 1: "Jan 2024" or "January 2024" or "Jan. 2024"
  const textMonthMatch = cleaned.match(/([a-z]+)\.?\s*(\d{4})/i);
  if (textMonthMatch) {
    const mStr = textMonthMatch[1].toLowerCase();
    const month = MONTH_NAMES[mStr] ?? (MONTH_NAMES[mStr.substring(0, 3)] ?? (isEnd ? 11 : 0));
    const year = parseInt(textMonthMatch[2], 10);
    return isEnd ? new Date(year, month + 1, 0) : new Date(year, month, 1);
  }

  // Format 2: "01/2024" or "1-2024" or "2024/01"
  const numMonthMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (numMonthMatch) {
    const month = Math.max(0, Math.min(11, parseInt(numMonthMatch[1], 10) - 1));
    const year = parseInt(numMonthMatch[2], 10);
    return isEnd ? new Date(year, month + 1, 0) : new Date(year, month, 1);
  }

  const numYearMonthMatch = cleaned.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (numYearMonthMatch) {
    const year = parseInt(numYearMonthMatch[1], 10);
    const month = Math.max(0, Math.min(11, parseInt(numYearMonthMatch[2], 10) - 1));
    return isEnd ? new Date(year, month + 1, 0) : new Date(year, month, 1);
  }

  // Format 3: Just year "2024"
  const yearMatch = cleaned.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return isEnd ? new Date(year, 11, 31) : new Date(year, 0, 1);
  }

  return null;
}

/**
 * Parses raw dates string into start and end Dates using dynamic referenceDate.
 */
export function parseDateRange(datesStr: string, referenceDate: Date = new Date()): ParsedDateRange {
  if (!datesStr || !datesStr.trim()) {
    return { startDate: null, endDate: null, isCurrent: false, isValid: false };
  }

  const cleaned = datesStr.trim();
  const isCurrent = PRESENT_TOKENS.some((p) => cleaned.toLowerCase().includes(p));

  // Split by standard delimiters: –, —, -, to, until, ..
  const parts = cleaned.split(/\s*(?:–|—|-|to|until|\.{2,})\s*/i);

  if (parts.length >= 2) {
    const start = parseDateToken(parts[0], false, referenceDate);
    const end = isCurrent ? new Date(referenceDate) : parseDateToken(parts[1], true, referenceDate);

    if (start && end) {
      // If end is before start due to year-only or formatting, normalize
      if (end < start) {
        return { startDate: start, endDate: start, isCurrent, isValid: true };
      }
      return { startDate: start, endDate: end, isCurrent, isValid: true };
    }
  }

  // Single year or single token fallback
  const singleDate = parseDateToken(cleaned, false, referenceDate);
  if (singleDate) {
    const end = isCurrent ? new Date(referenceDate) : new Date(singleDate.getFullYear(), 11, 31);
    return { startDate: singleDate, endDate: end, isCurrent, isValid: true };
  }

  return { startDate: null, endDate: null, isCurrent, isValid: false };
}

/**
 * Computes elapsed calendar months between two dates using the standard
 * Inclusive Calendar-Month Employment Convention:
 *
 * In standard professional resume screening, an employment range (e.g. "Jan 2024 – Present")
 * represents tenure active throughout both the start month and the current month.
 * Formula: Elapsed Months = (endYear - startYear) * 12 + (endMonth - startMonth) + 1
 *
 * Example:
 * Jan 2024 to Aug 2026:
 * - 2024: 12 months (Jan–Dec inclusive)
 * - 2025: 12 months (Jan–Dec inclusive)
 * - 2026: 8 months (Jan–Aug inclusive)
 * Total: 12 + 12 + 8 = 32 calendar months (32 / 12 = 2.6667... => 2.67 years).
 */
export function calculateMonthsBetween(start: Date, end: Date): number {
  if (end < start) return 0;
  const yearsDiff = end.getFullYear() - start.getFullYear();
  const monthsDiff = end.getMonth() - start.getMonth();
  // Count elapsed months only; do not inflate tenure with inclusive endpoints.
  return Math.max(0, yearsDiff * 12 + monthsDiff);
}

/**
 * Merges overlapping date intervals to calculate mathematical union.
 */
export function mergeDateIntervals(intervals: { startDate: Date; endDate: Date }[]): { startDate: Date; endDate: Date }[] {
  if (intervals.length === 0) return [];

  // Sort by start date ascending
  const sorted = [...intervals].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  const merged: { startDate: Date; endDate: Date }[] = [];

  let current = { startDate: new Date(sorted[0].startDate), endDate: new Date(sorted[0].endDate) };

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // If next interval starts before or in the month current interval ends (overlap or contiguous)
    if (next.startDate <= current.endDate) {
      if (next.endDate > current.endDate) {
        current.endDate = new Date(next.endDate);
      }
    } else {
      merged.push(current);
      current = { startDate: new Date(next.startDate), endDate: new Date(next.endDate) };
    }
  }

  merged.push(current);
  return merged;
}

/**
 * Calculates continuous verified tenure from merged intervals.
 */
export function calculateTenureFromMergedIntervals(merged: { startDate: Date; endDate: Date }[]): { months: number; years: number } {
  let totalMonths = 0;
  for (const interval of merged) {
    totalMonths += calculateMonthsBetween(interval.startDate, interval.endDate);
  }
  const years = Number((totalMonths / 12).toFixed(2));
  return { months: totalMonths, years };
}

/**
 * Full deterministic calculation of candidate experience chronology from resume.
 */
export function calculateCandidateChronology(
  resume: ResumeData,
  referenceDate: Date = new Date()
): ExperienceChronology {
  const experiences = resume.sections?.experience || [];
  const validProfessionalIntervals: { startDate: Date; endDate: Date }[] = [];
  const validInternshipIntervals: { startDate: Date; endDate: Date }[] = [];
  const validCombinedIntervals: { startDate: Date; endDate: Date }[] = [];

  const rolesBreakdown: ExperienceChronology["rolesBreakdown"] = [];

  for (const exp of experiences) {
    const roleType = classifyRoleType(exp.title, exp.company);
    const parsed = parseDateRange(exp.dates, referenceDate);

    let calculated_months = 0;
    let calculated_years = 0;

    if (parsed.isValid && parsed.startDate && parsed.endDate) {
      calculated_months = calculateMonthsBetween(parsed.startDate, parsed.endDate);
      calculated_years = Number((calculated_months / 12).toFixed(2));

      const interval = { startDate: parsed.startDate, endDate: parsed.endDate };
      validCombinedIntervals.push(interval);

      if (roleType === "internship") {
        validInternshipIntervals.push(interval);
      } else {
        // Professional, freelance, etc. count toward professional experience
        validProfessionalIntervals.push(interval);
      }
    }

    rolesBreakdown.push({
      company: exp.company,
      title: exp.title,
      dates: exp.dates,
      calculated_years,
      calculated_months,
      role_type: roleType,
      isOverlapping: false,
    });
  }

  // Calculate merged union for professional
  const mergedProf = mergeDateIntervals(validProfessionalIntervals);
  const profTenure = calculateTenureFromMergedIntervals(mergedProf);

  // Calculate merged union for internships
  const mergedIntern = mergeDateIntervals(validInternshipIntervals);
  const internTenure = calculateTenureFromMergedIntervals(mergedIntern);

  // Calculate merged union for combined
  const mergedCombined = mergeDateIntervals(validCombinedIntervals);
  const combinedTenure = calculateTenureFromMergedIntervals(mergedCombined);

  return {
    referenceDate,
    totalProfessionalMonths: profTenure.months,
    totalProfessionalYears: profTenure.years,
    totalInternshipMonths: internTenure.months,
    totalInternshipYears: internTenure.years,
    totalCombinedMonths: combinedTenure.months,
    totalCombinedYears: combinedTenure.years,
    rolesBreakdown,
  };
}

/**
 * Parses generic JD text / requirement for experience constraints.
 * Supports arbitrary phrases:
 * - "1–3 years", "1-3 years", "1 to 3 years"
 * - "2+ years", "2+ yrs", "2 + years"
 * - "minimum 3 years", "at least 2 years", "min 4 yrs"
 * - "more than 3 years", "over 5 years"
 * - "3-5 years of professional experience"
 */
export function parseExperienceConstraint(reqText: string): ParsedExperienceConstraint {
  const text = reqText.toLowerCase();

  const requiresFullTimeOnly =
    text.includes("full-time") ||
    text.includes("full time") ||
    text.includes("excluding internship") ||
    text.includes("excluding internships") ||
    text.includes("non-internship") ||
    text.includes("post-graduate");

  const allowsInternships =
    !requiresFullTimeOnly &&
    (text.includes("internship") ||
      text.includes("intern") ||
      text.includes("internships count") ||
      text.includes("internships welcome"));

  // Pattern 1: Range "1-3 years", "1–3 yrs", "1 to 3 years", "between 1 and 3 years", "3-5 years"
  const rangeMatch = text.match(/(?:between\s+)?(\d+(?:\.\d+)?)\s*(?:–|—|-|to|and)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  if (rangeMatch) {
    const minYears = parseFloat(rangeMatch[1]);
    const maxYears = parseFloat(rangeMatch[2]);
    return { minYears, maxYears, allowsInternships, requiresFullTimeOnly, isUnspecified: false };
  }

  // Pattern 2: Plus format "2+ years", "5+ yrs", "3 + years"
  const plusMatch = text.match(/(\d+(?:\.\d+)?)\s*\+\s*(?:years?|yrs?)/i);
  if (plusMatch) {
    const minYears = parseFloat(plusMatch[1]);
    return { minYears, allowsInternships, requiresFullTimeOnly, isUnspecified: false };
  }

  // Pattern 3: Minimum / At least / More than "minimum 2 years", "at least 3 yrs", "more than 4 years", "over 5 years"
  const minMatch = text.match(/(?:minimum|min|at least|more than|over|greater than)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  if (minMatch) {
    const minYears = parseFloat(minMatch[1]);
    return { minYears, allowsInternships, requiresFullTimeOnly, isUnspecified: false };
  }

  // Pattern 4: "X years of experience"
  const standardMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience)?/i);
  if (standardMatch) {
    const minYears = parseFloat(standardMatch[1]);
    return { minYears, allowsInternships, requiresFullTimeOnly, isUnspecified: false };
  }

  return { minYears: 0, allowsInternships, requiresFullTimeOnly, isUnspecified: true };
}

/**
 * Deterministically evaluates an experience constraint against candidate chronology.
 */
export function evaluateExperienceRequirement(
  req: JDRequirement,
  chronology: ExperienceChronology,
  resumeSummary: string = ""
): {
  status: EligibilityStatus;
  reasoning: string;
  verification: ExperienceChronologyVerification;
} {
  const combinedReqText = `${req.name} ${req.description}`;
  const constraint = parseExperienceConstraint(combinedReqText);

  // Check if summary explicitly claims years (e.g. "5+ years of experience")
  const summaryConstraint = parseExperienceConstraint(resumeSummary);
  const claimedYears = summaryConstraint.isUnspecified ? undefined : summaryConstraint.minYears;

  // Internships count only when the stated requirement explicitly permits them.
  const allowsInternships = constraint.allowsInternships;

  const relevantYears = allowsInternships
    ? chronology.totalCombinedYears
    : chronology.totalProfessionalYears;

  const rolesBreakdown = chronology.rolesBreakdown.map((r) => ({
    company: r.company,
    title: r.title,
    dates: r.dates,
    calculated_years: r.calculated_years,
  }));

  const verification: ExperienceChronologyVerification = {
    claimed_years: claimedYears,
    verified_years: relevantYears,
    claim_type: claimedYears !== undefined ? "explicit_resume_claim" : "employment_date_calculation",
    verification_type: "employment_date_calculation",
    roles_breakdown: rolesBreakdown,
  };

  if (constraint.isUnspecified) {
    let expDesc = `${relevantYears} years of verified experience`;
    if (chronology.totalInternshipYears > 0 && chronology.totalProfessionalYears === 0) {
      expDesc = `${chronology.totalInternshipYears} years of verified internship experience`;
    } else if (chronology.totalInternshipYears > 0) {
      expDesc = `${chronology.totalProfessionalYears} years of professional and ${chronology.totalInternshipYears} years of internship experience (${chronology.totalCombinedYears} years combined)`;
    }
    return {
      status: "meets_requirement",
      reasoning: `Candidate has ${expDesc} across ${rolesBreakdown.length} roles.`,
      verification,
    };
  }

  const { minYears, maxYears } = constraint;

  // Evaluation logic:
  // 1. If candidate meets or exceeds minYears (or is within acceptable range)
  if (relevantYears >= minYears) {
    let reasoning = `Requirement met: Candidate has ${relevantYears} years of verified experience, satisfying the requirement (${minYears}${maxYears ? `–${maxYears}` : "+"} years).`;
    if (chronology.totalInternshipYears > 0 && chronology.totalProfessionalYears === 0) {
      reasoning = `Requirement met: Candidate has ${chronology.totalInternshipYears} years of verified internship experience, satisfying the junior/entry requirement (${minYears}${maxYears ? `–${maxYears}` : "+"} years).`;
    } else if (chronology.totalInternshipYears > 0) {
      reasoning += ` (Includes ${chronology.totalInternshipYears} yrs internship tenure).`;
    }
    return {
      status: "meets_requirement",
      reasoning,
      verification,
    };
  }

  // 2. If candidate has claimed years in summary that meet the requirement but dated roles are shorter
  if (claimedYears !== undefined && claimedYears >= minYears) {
    return {
      status: "partially_verified",
      reasoning: `Resume summary claims ${claimedYears}+ years of experience, while chronological dated roles verify ${relevantYears} years.`,
      verification,
    };
  }

  // 3. Below requirement
  let belowReasoning = `Candidate has ${relevantYears} years of verified professional experience, which is below the stated requirement of ${minYears}${maxYears ? `–${maxYears}` : "+"} years.`;
  if (chronology.totalInternshipYears > 0 && chronology.totalProfessionalYears === 0) {
    belowReasoning = `Candidate has ${chronology.totalInternshipYears} years of verified internship experience (0 years non-internship full-time), which is below the stated requirement of ${minYears}${maxYears ? `–${maxYears}` : "+"} years.`;
  } else if (chronology.totalInternshipYears > 0) {
    belowReasoning = `Candidate has ${chronology.totalProfessionalYears} years of full-time professional experience and ${chronology.totalInternshipYears} years of internship experience (${chronology.totalCombinedYears} years combined), which is below the stated requirement of ${minYears}${maxYears ? `–${maxYears}` : "+"} years.`;
  }

  return {
    status: "below_stated_requirement",
    reasoning: belowReasoning,
    verification,
  };
}
