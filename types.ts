export interface JDRequirements {
  role_title: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  keywords: string[]; // for ATS-style matching
  seniority_signal: string; // e.g. "entry-level", "2+ yrs"
}

export interface ResumeData {
  sections: {
    summary?: string;
    experience: { company: string; title: string; bullets: string[]; dates: string; location?: string }[];
    projects: { name: string; bullets: string[]; url?: string; techStack?: string }[];
    education?: { institution: string; degree: string; dates: string; details?: string }[];
    certifications?: string[];
    skills: string[];
    additional?: string[];
  };
}

export interface TailoredOutput {
  matched_skills: string[];
  missing_skills: string[]; // gap analysis, shown to the user
  match_score: number; // 0-100
  rewritten_experience: {
    company: string;
    title: string;
    dates: string;
    bullets: string[]; // reordered/reworded, same underlying facts
  }[];
  rewritten_skills: string[]; // reordered to surface JD-relevant ones first
}
