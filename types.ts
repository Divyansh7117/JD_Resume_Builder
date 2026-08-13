export interface JDRequirements {
  role_title: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  keywords: string[]; // for ATS-style matching
  seniority_signal: string; // e.g. "entry-level", "2+ yrs"
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[]; // LinkedIn, GitHub, portfolio URLs, etc. — whatever's present
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

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  sections: {
    experience: { company: string; title: string; bullets: string[]; dates: string }[];
    projects: { name: string; bullets: string[] }[];
    skills: string[];
    education: EducationEntry[];
    certifications: CertificationEntry[];
  };
}

export interface TailoredOutput {
  matched_skills: string[];
  missing_skills: string[];
  match_score: number;
  rewritten_summary: string;   // NEW — a JD-tailored version of the summary
  rewritten_experience: {
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }[];
  rewritten_skills: string[];
}
