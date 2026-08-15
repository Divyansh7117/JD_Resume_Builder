export type RequirementImportance = "required" | "high" | "medium" | "low" | "preferred";
export type RequirementCriticality = "hard" | "soft" | "preferred";
export type MatchStatus = "strong_match" | "claimed_match" | "partial_match" | "weak_evidence" | "no_evidence";
export type EvidenceLevel = "demonstrated" | "claimed" | "partial" | "none";
export type GapSeverity = "critical" | "moderate" | "minor";
export type RequirementType = "skill_capability" | "eligibility_constraint";

export type EligibilityStatus =
  | "meets_requirement"
  | "below_stated_requirement"
  | "location_mismatch"
  | "requirement_not_met"
  | "partially_verified"
  | "not_specified"
  | "conflicting_evidence";

export type EvidenceSourceType =
  | "explicit_resume_claim"
  | "employment_date_calculation"
  | "inferred"
  | "source_bullet"
  | "skills_section"
  | "unavailable";

export interface JDRequirement {
  id: string;
  name: string;
  description: string;
  category: string; // e.g. "technical_skill", "core_competency", "domain_expertise", "tools_and_tech", "leadership", "experience_tenure", "education", "location"
  requirement_type?: RequirementType;
  importance: RequirementImportance;
  criticality?: RequirementCriticality; // "hard" | "soft" | "preferred"
  logical_operator?: "AND" | "OR" | "AT_LEAST_ONE" | "SINGLE";
  sub_requirements?: string[];
  weight?: number;
}

export interface JDRequirements {
  role_title: string;
  seniority_signal: string; // e.g. "entry-level", "2+ yrs", "mid-senior (4-5 yrs)"
  requirements: JDRequirement[];
  summary_keywords: string[];
  must_have_skills: string[];
  nice_to_have_skills: string[];
  keywords: string[];
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface EducationEntry {
  institution: string;
  degree: string;
  dates: string;
}

export interface CertificationEntry {
  name: string;
  issuer: string;
}

export interface CandidateEvidenceUnit {
  id: string; // Unique immutable ID, e.g. "ev_sum_1", "ev_exp_1_1", "ev_exp_1_dates", "ev_edu_1"
  source_section: "summary" | "experience" | "project" | "skill" | "education" | "certification" | "contact";
  source_title?: string; // Company, project name, institution, or section name
  text: string; // EXACT immutable substring from the parsed resume (never modified by LLM)
  start_offset?: number;
  end_offset?: number;
  evidence_type?: EvidenceSourceType;
  context_tags?: string[];
}

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  sections: {
    experience: { company: string; title: string; bullets: string[]; dates: string; location?: string }[];
    projects: { name: string; bullets: string[]; url?: string; techStack?: string }[];
    skills: string[];
    education: EducationEntry[];
    certifications: CertificationEntry[];
  };
  evidence_units?: CandidateEvidenceUnit[];
}

export interface RequirementMatchResult {
  requirement_id: string;
  requirement_name: string;
  category: string;
  requirement_type?: RequirementType;
  importance: RequirementImportance;
  criticality: RequirementCriticality;
  weight?: number;
  status: MatchStatus;
  evidence_level?: EvidenceLevel;
  score: number; // 1.0 (demonstrated/strong), 0.8 (claimed), 0.6 (partial), 0.0 (none)
  confidence: number; // 0.0 to 1.0
  evidence_ids: string[]; // Strictly required: IDs of supporting CandidateEvidenceUnits
  evidence: { text: string; source: string; evidence_id: string }[]; // Deterministically resolved from CandidateEvidenceUnits
  reasoning: string;
  is_exact_tech_match?: boolean;
  is_non_equivalent_technology?: boolean;
}

export interface CapabilityDimension {
  id: string;
  name: string;
  weight: number;
  requirement_ids: string[];
  dimension_score: number; // 0 - 100
}

export interface AuditTrailEntry {
  requirement_id: string;
  requirement_name: string;
  importance: RequirementImportance;
  criticality: RequirementCriticality;
  evidence_ids: string[];
  status: MatchStatus;
  evidence_level?: EvidenceLevel;
  score: number;
  weight: number;
  contribution_percent: number;
}

export interface ExperienceChronologyVerification {
  claimed_years?: number;
  verified_years?: number;
  claim_type: EvidenceSourceType;
  verification_type: EvidenceSourceType;
  roles_breakdown?: { company: string; title: string; dates: string; calculated_years: number }[];
}

export interface EligibilityResult {
  requirement_id: string;
  requirement_name: string;
  constraint_type: "years_experience" | "education" | "location" | "work_authorization" | "certification";
  stated_requirement: string;
  evidence_ids: string[];
  candidate_evidence: string; // Deterministically resolved text from original evidence units
  evidence_source_type: EvidenceSourceType;
  status: EligibilityStatus;
  reasoning: string;
  experience_verification?: ExperienceChronologyVerification;
}

export interface GapItem {
  requirement_id: string;
  requirement_name: string;
  importance: RequirementImportance;
  criticality: RequirementCriticality;
  severity: GapSeverity;
  status: MatchStatus;
  reasoning: string;
  recommendation: string;
}

export interface MatchAnalysis {
  match_score: number; // Overall deterministic weighted score (0-100)
  hard_requirement_match_score: number; // Deterministic score for hard requirements only (0-100)
  preferred_requirement_match_score: number; // Deterministic score for soft/preferred requirements (0-100)
  confidence_score: number; // Evidence-based confidence (0-100)
  confidence_level: "high" | "medium" | "low";
  confidence_reasons: string[];
  critical_gaps: GapItem[]; // Hard requirements with no_evidence
  why_not_100: string[]; // Deterministic breakdown explaining score deductions
  total_requirements_count?: number; // Total extracted requirements (capabilities + eligibility)
  scorable_capabilities_count?: number; // Total technical/capability requirements evaluated in score denominator
  eligibility_constraints_count?: number; // Total non-scored qualification/eligibility constraints
  eligibility_results?: EligibilityResult[];
  dimensions?: CapabilityDimension[];
  evaluations: RequirementMatchResult[];
  matched_requirements: RequirementMatchResult[];
  partial_requirements: RequirementMatchResult[];
  missing_requirements: RequirementMatchResult[];
  gaps: GapItem[];
  audit_trail?: AuditTrailEntry[];
  matched_skills: string[];
  missing_skills: string[];
}

export interface TailoredBullet {
  bullet: string;
  source_evidence_ids: string[];
}

export interface TailoredExperienceEntry {
  company: string;
  title: string;
  dates: string;
  bullets: string[];
  bullet_provenance?: TailoredBullet[];
  location?: string;
}

export interface TailoredOutput {
  match_score: number;
  confidence_score?: number;
  match_analysis?: MatchAnalysis;
  matched_skills: string[];
  missing_skills: string[];
  rewritten_summary: string;
  summary_source_evidence_ids?: string[];
  rewritten_experience: TailoredExperienceEntry[];
  rewritten_skills: string[];
  used_fallback: boolean;
}
