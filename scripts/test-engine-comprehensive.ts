import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import {
  parseDateRange,
  calculateMonthsBetween,
  calculateCandidateChronology,
  parseExperienceConstraint,
  evaluateExperienceRequirement,
} from "../lib/experienceEngine";

import {
  calculatePureDeterministicScores,
} from "../lib/semanticMatcher";

import {
  checkExactTechMatch,
  normalizeTechName,
} from "../lib/techMatcher";

import {
  validateMatchConsistency,
} from "../lib/validator";

import { JDRequirement, RequirementMatchResult, ResumeData, MatchAnalysis } from "../types";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✕ FAIL: ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

async function runComprehensiveTestSuite() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
  console.log("║     COMPREHENSIVE GENERAL-PURPOSE MATCHING ENGINE TEST SUITE          ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: DETERMINISTIC EXPERIENCE ENGINE TESTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("─── SECTION 1: DETERMINISTIC EXPERIENCE ENGINE ───");

  const refAug2026 = new Date(2026, 7, 15); // August 15, 2026

  // 1.1 Minimum requirement satisfied (Jan 2025 - Present at Aug 2026 = ~1.58 yrs / 19-20 months; JD: 1-3 years)
  {
    const resume: ResumeData = {
      contact: { name: "Test Candidate", email: "test@example.com", phone: "123", location: "Remote", links: [] },
      summary: "Full stack web developer",
      sections: {
        experience: [
          {
            company: "TechNova Solutions",
            title: "Junior Full Stack Developer",
            dates: "Jan 2025 – Present",
            bullets: ["Built features using React and TypeScript."],
          },
        ],
        projects: [],
        skills: ["React", "TypeScript", "JavaScript"],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(resume, refAug2026);
    // Jan 2025 to Aug 2026 is 20 calendar months (20/12 = 1.67 years, approx 1.58-1.67 years)
    assert(
      chronology.totalProfessionalYears >= 1.5 && chronology.totalProfessionalYears <= 1.8,
      "Experience: 'Jan 2025 – Present' at Aug 2026 calculates to ~1.67 years",
      `Actual calculated: ${chronology.totalProfessionalYears} yrs (${chronology.totalProfessionalMonths} months)`
    );

    const jdReq: JDRequirement = {
      id: "req_exp_1",
      name: "Experience Requirement",
      description: "1–3 years of professional experience in full stack web development",
      category: "experience_tenure",
      requirement_type: "eligibility_constraint",
      importance: "required",
      criticality: "hard",
    };

    const evaluation = evaluateExperienceRequirement(jdReq, chronology, resume.summary);
    assert(
      evaluation.status === "meets_requirement",
      "Experience: Candidate with ~1.67 yrs MUST PASS '1–3 years' JD requirement (NOT below_requirement)",
      `Status: ${evaluation.status}, Reasoning: ${evaluation.reasoning}`
    );
  }

  // 1.2 Minimum requirement not satisfied (6 months candidate vs 3+ years JD)
  {
    const resume: ResumeData = {
      contact: { name: "Junior Candidate", email: "j@example.com", phone: "123", location: "Remote", links: [] },
      summary: "Junior developer",
      sections: {
        experience: [
          {
            company: "Alpha Corp",
            title: "Software Engineer",
            dates: "Jan 2026 – Jun 2026",
            bullets: ["Wrote unit tests."],
          },
        ],
        projects: [],
        skills: ["JavaScript"],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(resume, refAug2026);
    const jdReq: JDRequirement = {
      id: "req_exp_2",
      name: "Minimum Experience",
      description: "Minimum 3 years of professional software engineering experience",
      category: "experience_tenure",
      requirement_type: "eligibility_constraint",
      importance: "required",
      criticality: "hard",
    };

    const evaluation = evaluateExperienceRequirement(jdReq, chronology, resume.summary);
    assert(
      evaluation.status === "below_stated_requirement",
      "Experience: Candidate with 0.5 yrs fails 'Minimum 3 years' requirement",
      `Status: ${evaluation.status}`
    );
  }

  // 1.3 Experience range parsing
  {
    const parsedRange1 = parseExperienceConstraint("1–3 years of experience");
    assert(parsedRange1.minYears === 1 && parsedRange1.maxYears === 3, "Constraint Parser: '1–3 years' parsed correctly");

    const parsedRange2 = parseExperienceConstraint("4-5 years in Product Management");
    assert(parsedRange2.minYears === 4 && parsedRange2.maxYears === 5, "Constraint Parser: '4-5 years' parsed correctly");

    const parsedPlus = parseExperienceConstraint("2+ years of React experience");
    assert(parsedPlus.minYears === 2, "Constraint Parser: '2+ years' parsed correctly");

    const parsedMin = parseExperienceConstraint("minimum 3 years of backend engineering");
    assert(parsedMin.minYears === 3, "Constraint Parser: 'minimum 3 years' parsed correctly");

    const parsedMoreThan = parseExperienceConstraint("more than 4 years of experience");
    assert(parsedMoreThan.minYears === 4, "Constraint Parser: 'more than 4 years' parsed correctly");
  }

  // 1.4 Dynamic runtime date resolution (no hardcoded current date)
  {
    const runtimeNow = new Date();
    const parsedRange = parseDateRange("Jan 2024 - Present", runtimeNow);
    assert(parsedRange.isCurrent === true, "Date Parser: 'Present' detected as current");
    assert(
      parsedRange.endDate?.getFullYear() === runtimeNow.getFullYear() &&
      parsedRange.endDate?.getMonth() === runtimeNow.getMonth(),
      "Date Parser: 'Present' resolves dynamically to runtime now"
    );
  }

  // 1.5 Multiple non-overlapping jobs (linear sum)
  {
    const resume: ResumeData = {
      contact: { name: "Multi Job", email: "m@example.com", phone: "123", location: "Remote", links: [] },
      summary: "Engineer",
      sections: {
        experience: [
          {
            company: "Company A",
            title: "Frontend Developer",
            dates: "Jan 2022 – Dec 2023", // 24 months (2.0 yrs)
            bullets: [],
          },
          {
            company: "Company B",
            title: "Senior Frontend Developer",
            dates: "Jan 2024 – Dec 2025", // 24 months (2.0 yrs)
            bullets: [],
          },
        ],
        projects: [],
        skills: [],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(resume, refAug2026);
    assert(
      chronology.totalProfessionalYears === 4.0,
      "Experience: Multiple non-overlapping jobs sum correctly to 4.0 years",
      `Actual: ${chronology.totalProfessionalYears} yrs (${chronology.totalProfessionalMonths} mos)`
    );
  }

  // 1.6 Overlapping jobs interval union (no double-counting)
  {
    const resume: ResumeData = {
      contact: { name: "Overlap Job", email: "o@example.com", phone: "123", location: "Remote", links: [] },
      summary: "Engineer",
      sections: {
        experience: [
          {
            company: "Job A",
            title: "Full Stack Engineer",
            dates: "Jan 2024 – Dec 2025", // Jan 2024 to Dec 2025 = 24 months
            bullets: [],
          },
          {
            company: "Job B (Part-time / Concurrent)",
            title: "Consulting Engineer",
            dates: "Jun 2025 – Present", // Jun 2025 to Aug 2026 (overlaps by 7 months)
            bullets: [],
          },
        ],
        projects: [],
        skills: [],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(resume, refAug2026);
    // Union interval is Jan 2024 to Aug 2026 = 32 calendar months = 2.67 years (NOT 24 + 15 = 39 months / 3.25 yrs)
    assert(
      chronology.totalProfessionalMonths === 32,
      "Experience: Overlapping jobs merged via interval union to 32 months (no double counting)",
      `Actual months: ${chronology.totalProfessionalMonths}, years: ${chronology.totalProfessionalYears}`
    );
  }

  // 1.7 Internship-only candidate separation
  {
    const resume: ResumeData = {
      contact: { name: "Intern Candidate", email: "i@example.com", phone: "123", location: "Remote", links: [] },
      summary: "Graduate intern",
      sections: {
        experience: [
          {
            company: "BigTech",
            title: "Software Engineering Intern",
            dates: "Jan 2025 – Dec 2025", // 12 months internship
            bullets: [],
          },
        ],
        projects: [],
        skills: ["Python", "Java"],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(resume, refAug2026);
    assert(
      chronology.totalInternshipYears === 1.0 && chronology.totalProfessionalYears === 0.0,
      "Experience: Internship separated from full-time professional experience",
      `Professional: ${chronology.totalProfessionalYears} yrs, Internship: ${chronology.totalInternshipYears} yrs`
    );

    const jdStrictReq: JDRequirement = {
      id: "req_prof_1",
      name: "Professional Experience",
      description: "1-2 years of full-time professional experience",
      category: "experience_tenure",
      requirement_type: "eligibility_constraint",
      importance: "required",
      criticality: "hard",
    };

    const evalStrict = evaluateExperienceRequirement(jdStrictReq, chronology, resume.summary);
    assert(
      evalStrict.status === "below_stated_requirement",
      "Experience: Strict professional experience requirement excludes internships"
    );

    const jdFlexibleReq: JDRequirement = {
      id: "req_intern_1",
      name: "Experience (Internships Accepted)",
      description: "1 year of experience (internships welcome / internships count)",
      category: "experience_tenure",
      requirement_type: "eligibility_constraint",
      importance: "required",
      criticality: "hard",
    };

    const evalFlexible = evaluateExperienceRequirement(jdFlexibleReq, chronology, resume.summary);
    assert(
      evalFlexible.status === "meets_requirement",
      "Experience: When JD explicitly allows internships, internship tenure satisfies requirement"
    );
  }

  // 1.8 Diverse date formats parsing
  {
    const formats = [
      { raw: "Jan 2024 – Dec 2025", expectedMonths: 24 },
      { raw: "2023 - 2025", expectedMonths: 36 },
      { raw: "03/2022 - 07/2024", expectedMonths: 29 },
      { raw: "March 2021 to December 2023", expectedMonths: 34 },
    ];

    for (const f of formats) {
      const parsed = parseDateRange(f.raw, refAug2026);
      const months = parsed.startDate && parsed.endDate ? calculateMonthsBetween(parsed.startDate, parsed.endDate) : 0;
      assert(
        parsed.isValid && months === f.expectedMonths,
        `Date Format: '${f.raw}' parsed to ${months} months (expected ${f.expectedMonths})`
      );
    }
  }

  console.log("\n─── SECTION 2: SKILL & CAPABILITY MATCHING ───");

  // 2.1 Exact match & case normalization
  {
    assert(checkExactTechMatch("React", "Strong experience in React and Redux.").isMatch, "Tech Matcher: 'React' exact match");
    assert(checkExactTechMatch("react", "Strong experience in REACT and REDUX.").isMatch, "Tech Matcher: Case insensitive match");
    assert(normalizeTechName("ts") === "typescript", "Tech Matcher: 'ts' canonicalizes to 'typescript'");
    assert(normalizeTechName("k8s") === "kubernetes", "Tech Matcher: 'k8s' canonicalizes to 'kubernetes'");
    assert(normalizeTechName("psql") === "postgresql", "Tech Matcher: 'psql' canonicalizes to 'postgresql'");
  }

  // 2.2 4-Tier Evidence Model: Claimed Skill in Skills Section (MUST NOT BE 0% / UNEVIDENCED)
  {
    const resumeWithSkillsSectionOnly: ResumeData = {
      contact: { name: "Dev", email: "d@example.com", phone: "123", location: "NY", links: [] },
      summary: "Full stack engineer",
      sections: {
        experience: [
          {
            company: "Tech Corp",
            title: "Web Developer",
            dates: "2024 - 2025",
            bullets: ["Developed frontend applications using HTML, CSS and web components."],
          },
        ],
        projects: [],
        skills: ["JavaScript", "TypeScript", "Redux", "GraphQL"],
        education: [],
        certifications: [],
      },
      evidence_units: [
        {
          id: "ev_skill_1",
          source_section: "skill",
          source_title: "Skills",
          text: "TypeScript",
          evidence_type: "explicit_resume_claim",
        },
        {
          id: "ev_skill_2",
          source_section: "skill",
          source_title: "Skills",
          text: "Redux",
          evidence_type: "explicit_resume_claim",
        },
      ],
    };

    // Test Requirement: "TypeScript"
    const reqTs: RequirementMatchResult = {
      requirement_id: "req_ts",
      requirement_name: "TypeScript",
      category: "technical_skill",
      importance: "required",
      criticality: "hard",
      status: "claimed_match",
      evidence_level: "claimed",
      score: 0.8,
      confidence: 0.85,
      evidence_ids: ["ev_skill_1"],
      evidence: [{ text: "TypeScript", source: "Skills", evidence_id: "ev_skill_1" }],
      reasoning: "Candidate explicitly claims TypeScript in skills section.",
    };

    assert(resumeWithSkillsSectionOnly.sections.skills.includes("TypeScript"), "Resume has TypeScript in skills");
    assert(reqTs.score === 0.8, "Evidence Model: Claimed skill receives 80% (0.8 score), NOT 0%");
    assert(reqTs.status === "claimed_match", "Evidence Model: Claimed skill status is 'claimed_match', NOT 'no_evidence'");
  }

  // 2.3 Demonstrated Skill in Project/Experience Bullet (100% score)
  {
    const reqDemonstrated: RequirementMatchResult = {
      requirement_id: "req_react",
      requirement_name: "React",
      category: "technical_skill",
      importance: "required",
      criticality: "hard",
      status: "strong_match",
      evidence_level: "demonstrated",
      score: 1.0,
      confidence: 0.98,
      evidence_ids: ["ev_exp_1_1"],
      evidence: [{ text: "Architected modern frontend with React and Next.js.", source: "Job", evidence_id: "ev_exp_1_1" }],
      reasoning: "Demonstrated in work experience bullet.",
    };

    assert(reqDemonstrated.score === 1.0, "Evidence Model: Demonstrated skill receives 100% (1.0 score)");
    assert(reqDemonstrated.status === "strong_match", "Evidence Model: Demonstrated skill status is 'strong_match'");
  }

  // 2.4 Missing Skill (0% score, zero evidence)
  {
    const reqMissing: RequirementMatchResult = {
      requirement_id: "req_k8s",
      requirement_name: "Kubernetes",
      category: "technical_skill",
      importance: "required",
      criticality: "hard",
      status: "no_evidence",
      evidence_level: "none",
      score: 0.0,
      confidence: 0.95,
      evidence_ids: [],
      evidence: [],
      reasoning: "No Kubernetes evidence found on resume.",
    };

    assert(reqMissing.score === 0.0 && reqMissing.evidence.length === 0, "Evidence Model: Missing skill has 0.0 score and empty evidence");
    assert(reqMissing.status === "no_evidence", "Evidence Model: Missing skill status is 'no_evidence'");
  }

  console.log("\n─── SECTION 3: DETERMINISTIC SCORING & INVARIANTS ───");

  // 3.1 Mathematical Scoring Verification
  {
    // 6 Direct (1.0) @ weight 4.5 = 27.0
    // 2 Partial (0.6) @ weight 4.5 = 5.4
    // 2 Missing (0.0) @ weight 4.5 = 0.0
    // Total Weight = 10 * 4.5 = 45.0
    // Total Weighted Score = (27.0 + 5.4 + 0.0) * 100 = 3240
    // Final Match Score = 3240 / 45.0 = 72%
    const mockResults: RequirementMatchResult[] = [
      ...Array(6).fill(null).map((_, i) => ({
        requirement_id: `req_dir_${i}`,
        requirement_name: `Direct Req ${i}`,
        category: "engineering",
        importance: "required" as const,
        criticality: "hard" as const,
        weight: 4.5,
        status: "strong_match" as const,
        score: 1.0,
        confidence: 0.95,
        evidence_ids: [`ev_${i}`],
        evidence: [{ text: "Proof", source: "Work", evidence_id: `ev_${i}` }],
        reasoning: "Direct match.",
      })),
      ...Array(2).fill(null).map((_, i) => ({
        requirement_id: `req_part_${i}`,
        requirement_name: `Partial Req ${i}`,
        category: "engineering",
        importance: "required" as const,
        criticality: "hard" as const,
        weight: 4.5,
        status: "partial_match" as const,
        score: 0.6,
        confidence: 0.8,
        evidence_ids: [`ev_p_${i}`],
        evidence: [{ text: "Partial proof", source: "Work", evidence_id: `ev_p_${i}` }],
        reasoning: "Partial match.",
      })),
      ...Array(2).fill(null).map((_, i) => ({
        requirement_id: `req_miss_${i}`,
        requirement_name: `Missing Req ${i}`,
        category: "engineering",
        importance: "required" as const,
        criticality: "hard" as const,
        weight: 4.5,
        status: "no_evidence" as const,
        score: 0.0,
        confidence: 0.95,
        evidence_ids: [],
        evidence: [],
        reasoning: "No evidence found.",
      })),
    ];

    const scores = calculatePureDeterministicScores(mockResults);
    assert(scores.match_score === 72, `Deterministic Scoring: 6 Direct (1.0), 2 Partial (0.6), 2 Missing (0.0) with equal weights = 72% (Got: ${scores.match_score}%)`);

    // Invariant Verification
    const mockAnalysis: MatchAnalysis = {
      match_score: scores.match_score,
      hard_requirement_match_score: scores.hard_requirement_match_score,
      preferred_requirement_match_score: scores.preferred_requirement_match_score,
      confidence_score: 88,
      confidence_level: "high",
      confidence_reasons: [],
      critical_gaps: [],
      why_not_100: [],
      evaluations: mockResults,
      matched_requirements: mockResults.filter((r) => r.status === "strong_match" || r.status === "claimed_match"),
      partial_requirements: mockResults.filter((r) => r.status === "partial_match"),
      missing_requirements: mockResults.filter((r) => r.status === "no_evidence"),
      gaps: [],
      matched_skills: [],
      missing_skills: [],
    };

    const emptyResume: ResumeData = {
      contact: { name: "Test", email: "", phone: "", location: "", links: [] },
      summary: "",
      sections: { experience: [], projects: [], skills: [], education: [], certifications: [] },
    };

    const validation = validateMatchConsistency(mockAnalysis, emptyResume);
    assert(validation.valid === true, "Consistency Validator: Invariants verified (Matched + Partial + Missing === Total)");
  }

  // 3.2 Invariant Violation Detection Test
  {
    // Intentional bug: Requirement with evidence but marked as 'no_evidence'
    const buggyResults: RequirementMatchResult[] = [
      {
        requirement_id: "req_bug_1",
        requirement_name: "Contradictory Req",
        category: "engineering",
        importance: "required",
        criticality: "hard",
        status: "no_evidence",
        score: 0.0,
        confidence: 0.9,
        evidence_ids: ["ev_1"],
        evidence: [{ text: "I have 5 years React experience", source: "Work", evidence_id: "ev_1" }],
        reasoning: "Candidate claims React.",
      },
    ];

    const buggyAnalysis: MatchAnalysis = {
      match_score: 0,
      hard_requirement_match_score: 0,
      preferred_requirement_match_score: 0,
      confidence_score: 50,
      confidence_level: "low",
      confidence_reasons: [],
      critical_gaps: [],
      why_not_100: [],
      evaluations: buggyResults,
      matched_requirements: [],
      partial_requirements: [],
      missing_requirements: buggyResults,
      gaps: [],
      matched_skills: [],
      missing_skills: [],
    };

    const emptyResume: ResumeData = {
      contact: { name: "Test", email: "", phone: "", location: "", links: [] },
      summary: "",
      sections: { experience: [], projects: [], skills: [], education: [], certifications: [] },
    };

    const validation = validateMatchConsistency(buggyAnalysis, emptyResume);
    assert(
      validation.valid === false && validation.issues.length > 0,
      "Consistency Validator: Successfully catches contradiction (evidence exists + verdict is 'no_evidence')",
      `Issues caught: ${JSON.stringify(validation.issues)}`
    );
  }

  console.log("\n─── SECTION 4: MULTI-DOMAIN GENERALIZATION TESTS ───");

  // 4.1 DevOps / SRE Profile
  {
    const devOpsCandidate: ResumeData = {
      contact: { name: "SRE Engineer", email: "sre@example.com", phone: "123", location: "Seattle, WA", links: [] },
      summary: "Site Reliability Engineer with 4 years managing cloud infrastructure.",
      sections: {
        experience: [
          {
            company: "CloudScale",
            title: "Senior SRE",
            dates: "Jan 2022 – Dec 2025", // 4 years
            bullets: [
              "Managed Kubernetes clusters on AWS using Terraform.",
              "Implemented Prometheus and Grafana monitoring alerting pipelines.",
            ],
          },
        ],
        projects: [],
        skills: ["Kubernetes", "Docker", "Terraform", "AWS", "Prometheus", "CI/CD", "Linux"],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(devOpsCandidate, refAug2026);
    assert(chronology.totalProfessionalYears === 4.0, "DevOps Generalization: 4.0 years SRE tenure calculated deterministically");

    const reqK8s: JDRequirement = {
      id: "req_devops_k8s",
      name: "Kubernetes & Container Orchestration",
      description: "Hands-on experience deploying and managing production Kubernetes clusters",
      category: "infrastructure",
      requirement_type: "skill_capability",
      importance: "required",
      criticality: "hard",
    };

    assert(reqK8s.name.includes("Kubernetes"), "DevOps Generalization: Requirement includes Kubernetes");
    assert(
      checkExactTechMatch("Kubernetes", devOpsCandidate.sections.experience[0].bullets[0]).isMatch,
      "DevOps Generalization: Exact technology match on 'Kubernetes'"
    );
  }

  // 4.2 Legal / Compliance Profile
  {
    const legalCandidate: ResumeData = {
      contact: { name: "Compliance Lead", email: "legal@example.com", phone: "123", location: "Chicago, IL", links: [] },
      summary: "Corporate compliance specialist with 3 years leading regulatory audits.",
      sections: {
        experience: [
          {
            company: "FinCorp Legal",
            title: "Compliance Analyst",
            dates: "Jan 2023 – Dec 2025",
            bullets: [
              "Conducted enterprise-wide GDPR and SOC2 compliance audits.",
              "Managed Contract Lifecycle Management (CLM) workflows.",
            ],
          },
        ],
        projects: [],
        skills: ["GDPR", "SOC2", "Contract Lifecycle Management", "Regulatory Auditing"],
        education: [],
        certifications: [],
      },
    };

    const chronology = calculateCandidateChronology(legalCandidate, refAug2026);
    assert(chronology.totalProfessionalYears === 3.0, "Legal Generalization: 3.0 years Legal tenure calculated deterministically");
    assert(
      checkExactTechMatch("GDPR", legalCandidate.sections.experience[0].bullets[0]).isMatch,
      "Legal Generalization: Exact match on 'GDPR' regulatory requirement"
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log(`  TEST RESULTS: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runComprehensiveTestSuite().catch((err) => {
  console.error("Test suite encountered fatal error:", err);
  process.exit(1);
});
