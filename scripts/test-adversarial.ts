import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";
import { JDRequirements, ResumeData } from "../types";

async function runFullAdversarialSuite() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║         COMPREHENSIVE ADVERSARIAL & CALIBRATION SUITE           ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let total = 0;

  // ───────────────────────────────────────────────────────────────────────────
  // TEST A — Exact Strong Match
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("▶ Test A: Exact Strong Match (React, TypeScript, Git)...");
  const jdA: JDRequirements = {
    role_title: "Frontend Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["React", "TypeScript", "Git"],
    nice_to_have_skills: [],
    keywords: ["React", "TypeScript", "Git"],
    summary_keywords: ["React", "TypeScript", "Git"],
    requirements: [
      { id: "r1", name: "React", description: "Modern React.js frontend development", category: "frontend", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r2", name: "TypeScript", description: "Static typing with TypeScript", category: "frontend", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r3", name: "Git", description: "Version control with Git/GitHub", category: "tooling", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeA: ResumeData = {
    contact: { name: "Sarah Tech", email: "sarah@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Senior Frontend Engineer with 4 years building web applications with React and TypeScript.",
    sections: {
      experience: [
        {
          company: "Web Studio",
          title: "Frontend Developer",
          dates: "2022 – Present",
          bullets: [
            "Built responsive Single Page Applications in React and TypeScript with 99.9% uptime.",
            "Managed version control and team code reviews using Git and GitHub workflows.",
          ],
        },
      ],
      projects: [],
      skills: ["React", "TypeScript", "Git"],
      education: [],
      certifications: [],
    },
  };

  const resA = await evaluateRequirementsAgainstEvidence(jdA, resumeA);
  const allStrongA = resA.evaluations.every((e) => e.status === "strong_match");
  if (allStrongA && resA.match_score >= 95) {
    console.log(`  ✅ [PASS] Test A: All exact requirements evaluated as strong_match (Score: ${resA.match_score}%).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test A: Not all exact matches were strong:`, resA.evaluations.map((e) => `${e.requirement_name}: ${e.status}`));
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST B — Missing Hard Skills
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test B: Missing Hard Skills (JD: Flutter, Supabase, PostgreSQL vs Resume: React, MongoDB)...");
  const jdB: JDRequirements = {
    role_title: "Mobile Backend Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["Flutter", "Supabase", "PostgreSQL"],
    nice_to_have_skills: [],
    keywords: ["Flutter", "Supabase", "PostgreSQL"],
    summary_keywords: ["Flutter", "Supabase", "PostgreSQL"],
    requirements: [
      { id: "r1", name: "Flutter", description: "Mobile app development with Flutter & Dart", category: "mobile", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r2", name: "Supabase", description: "Backend development with Supabase", category: "backend", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r3", name: "PostgreSQL", description: "Relational PostgreSQL database management", category: "database", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeB: ResumeData = {
    contact: { name: "Bob Web", email: "bob@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Web developer specializing in React and MongoDB.",
    sections: {
      experience: [
        {
          company: "Doc Co",
          title: "Full Stack Developer",
          dates: "2021 – Present",
          bullets: ["Built web applications using React.js and MongoDB NoSQL databases."],
        },
      ],
      projects: [],
      skills: ["React", "MongoDB"],
      education: [],
      certifications: [],
    },
  };

  const resB = await evaluateRequirementsAgainstEvidence(jdB, resumeB);
  const hardScoreB = resB.hard_requirement_match_score;
  const missingCountB = resB.evaluations.filter((e) => e.status === "no_evidence" || e.status === "weak_evidence").length;

  if (hardScoreB <= 30 && missingCountB >= 2 && resB.critical_gaps.length >= 2) {
    console.log(`  ✅ [PASS] Test B: Hard requirements correctly flagged missing (Hard Score: ${hardScoreB}%, Critical Gaps: ${resB.critical_gaps.length}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test B: Allowed missing hard skills to score high: Hard Score = ${hardScoreB}%, Gaps = ${resB.critical_gaps.length}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST C — Related but Non-Equivalent Technologies (React Native ≠ Flutter)
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test C: Non-Equivalent Technologies (JD: Flutter vs Resume: React Native)...");
  const jdC: JDRequirements = {
    role_title: "Flutter Developer",
    seniority_signal: "Mid",
    must_have_skills: ["Flutter"],
    nice_to_have_skills: [],
    keywords: ["Flutter"],
    summary_keywords: ["Flutter"],
    requirements: [
      { id: "r1", name: "Flutter", description: "Mobile cross-platform development with Flutter framework", category: "mobile", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeC: ResumeData = {
    contact: { name: "Charlie Native", email: "charlie@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Senior mobile engineer with 4 years in React Native.",
    sections: {
      experience: [
        {
          company: "App Works",
          title: "React Native Developer",
          dates: "2021 – Present",
          bullets: ["Built iOS and Android mobile apps using React Native and JavaScript."],
        },
      ],
      projects: [],
      skills: ["React Native", "JavaScript", "iOS", "Android"],
      education: [],
      certifications: [],
    },
  };

  const resC = await evaluateRequirementsAgainstEvidence(jdC, resumeC);
  const flutterEval = resC.evaluations[0];

  if (flutterEval && flutterEval.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test C: React Native was NOT evaluated as strong_match for Flutter (${flutterEval.status}, Score: ${flutterEval.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test C: React Native was mistakenly given strong_match for Flutter!`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST D — Explicit Claim vs Verified Dates
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test D: Claimed vs Verified Dates (Claims 5+ yrs in summary vs 4.4 yrs in dated roles)...");
  const jdD: JDRequirements = {
    role_title: "Senior Product Manager",
    seniority_signal: "5+ yrs",
    must_have_skills: [],
    nice_to_have_skills: [],
    keywords: [],
    summary_keywords: [],
    requirements: [
      { id: "r1", name: "Product Management Experience", description: "Minimum 5 years in product management roles", category: "experience_tenure", requirement_type: "eligibility_constraint", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeD: ResumeData = {
    contact: { name: "Rachit PM", email: "rachit@example.com", phone: "123", location: "New Delhi", links: [] },
    summary: "Product & growth professional with 5+ years of B2C consumer product and e-commerce experience.",
    sections: {
      experience: [
        {
          company: "PhysicsWallah",
          title: "General Manager – Product & Growth",
          dates: "Jun 2024 – Present",
          bullets: ["Led product and growth initiatives."],
        },
        {
          company: "PhysicsWallah",
          title: "Product Owner",
          dates: "Mar 2022 – Jun 2024",
          bullets: ["Built e-commerce product from zero."],
        },
      ],
      projects: [],
      skills: ["Product Management"],
      education: [],
      certifications: [],
    },
  };

  const resD = await evaluateRequirementsAgainstEvidence(jdD, resumeD);
  const eligD = resD.eligibility_results?.[0];

  if (eligD && eligD.experience_verification?.verified_years !== undefined) {
    console.log(`  ✅ [PASS] Test D: Chronology verification computed (Claimed: ${eligD.experience_verification.claimed_years} yrs, Verified: ${eligD.experience_verification.verified_years} yrs).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test D: Chronology verification missing from eligibility result:`, eligD);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST E — Keyword Stuffing Protection
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test E: Keyword Stuffing Protection (Flutter in Skills section only without bullets)...");
  const jdE: JDRequirements = {
    role_title: "Flutter Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["Flutter"],
    nice_to_have_skills: [],
    keywords: ["Flutter"],
    summary_keywords: ["Flutter"],
    requirements: [
      { id: "r1", name: "Flutter", description: "Production Flutter application development", category: "mobile", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeE: ResumeData = {
    contact: { name: "Stuffer", email: "stuff@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Software engineer.",
    sections: {
      experience: [
        {
          company: "Old Corp",
          title: "Java Developer",
          dates: "2020 – 2023",
          bullets: ["Maintained legacy Java backends and Oracle databases."],
        },
      ],
      projects: [],
      skills: ["Flutter", "Java", "SQL"], // Flutter only in skills
      education: [],
      certifications: [],
    },
  };

  const resE = await evaluateRequirementsAgainstEvidence(jdE, resumeE);
  const flutterStuffEval = resE.evaluations[0];

  if (flutterStuffEval && flutterStuffEval.status !== "strong_match" && flutterStuffEval.score < 1.0) {
    console.log(`  ✅ [PASS] Test E: Keyword stuffing caught (Status: ${flutterStuffEval.status}, Score: ${flutterStuffEval.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test E: Skills-only keyword stuffing was allowed as strong_match:`, flutterStuffEval);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST F — AI Personalization vs General AI
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test F: AI Personalization (Recommendation Engine vs Agentic LLMs)...");
  const jdF: JDRequirements = {
    role_title: "AI Personalization Lead",
    seniority_signal: "Lead",
    must_have_skills: ["AI Personalization"],
    nice_to_have_skills: [],
    keywords: ["AI Personalization"],
    summary_keywords: ["AI Personalization"],
    requirements: [
      { id: "r1", name: "AI Personalization", description: "Building ML recommendation and personalized discovery systems", category: "ai", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeF: ResumeData = {
    contact: { name: "Agentic Dev", email: "agentic@example.com", phone: "123", location: "Remote", links: [] },
    summary: "AI engineer building agentic LLM workflows.",
    sections: {
      experience: [
        {
          company: "AI Startup",
          title: "AI Lead",
          dates: "2023 – Present",
          bullets: ["Built agentic LLM pipelines for invoice parsing and HR policy bots."],
        },
      ],
      projects: [],
      skills: ["Agentic AI", "LLM Workflows"],
      education: [],
      certifications: [],
    },
  };

  const resF = await evaluateRequirementsAgainstEvidence(jdF, resumeF);
  const aiPersEval = resF.evaluations[0];

  if (aiPersEval && aiPersEval.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test F: AI Personalization not equated to general LLMs (${aiPersEval.status}, Score: ${aiPersEval.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test F: Evaluated general LLMs as strong_match for Personalization:`, aiPersEval);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST G — Location Mismatch
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test G: Location Mismatch (JD: Bangalore on-site vs Resume: New Delhi)...");
  const jdG: JDRequirements = {
    role_title: "On-site PM",
    seniority_signal: "Mid",
    must_have_skills: [],
    nice_to_have_skills: [],
    keywords: [],
    summary_keywords: [],
    requirements: [
      { id: "r1", name: "Location", description: "Bangalore, Karnataka (3 days a week in office)", category: "location", requirement_type: "eligibility_constraint", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeG: ResumeData = {
    contact: { name: "Delhi PM", email: "delhi@example.com", phone: "123", location: "New Delhi, India", links: [] },
    summary: "Product manager based in New Delhi.",
    sections: { experience: [], projects: [], skills: [], education: [], certifications: [] },
  };

  const resG = await evaluateRequirementsAgainstEvidence(jdG, resumeG);
  const locResult = resG.eligibility_results?.[0];

  if (locResult && locResult.status === "location_mismatch") {
    console.log(`  ✅ [PASS] Test G: Location mismatch identified correctly (${locResult.status}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test G: Failed to classify location mismatch:`, locResult);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST H — Perfect Candidate (100%)
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test H: Perfect Candidate (Direct evidence for all requirements)...");
  const jdH: JDRequirements = {
    role_title: "TypeScript Backend Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["TypeScript", "PostgreSQL"],
    nice_to_have_skills: [],
    keywords: ["TypeScript", "PostgreSQL"],
    summary_keywords: ["TypeScript", "PostgreSQL"],
    requirements: [
      { id: "r1", name: "TypeScript", description: "TypeScript backend development", category: "backend", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r2", name: "PostgreSQL", description: "PostgreSQL database optimization", category: "database", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeH: ResumeData = {
    contact: { name: "Perfect Dev", email: "perf@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Senior backend engineer with deep expertise in TypeScript and PostgreSQL.",
    sections: {
      experience: [
        {
          company: "Core Inc",
          title: "Backend Lead",
          dates: "2020 – Present",
          bullets: [
            "Built TypeScript microservices processing 50M daily requests with Node.js.",
            "Optimized PostgreSQL queries, partitioning tables and reducing latency by 70%.",
          ],
        },
      ],
      projects: [],
      skills: ["TypeScript", "PostgreSQL"],
      education: [],
      certifications: [],
    },
  };

  const resH = await evaluateRequirementsAgainstEvidence(jdH, resumeH);
  if (resH.match_score === 100 && resH.hard_requirement_match_score === 100) {
    console.log(`  ✅ [PASS] Test H: Perfect candidate scored 100% (Overall: ${resH.match_score}%, Hard: ${resH.hard_requirement_match_score}%).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test H: Perfect candidate failed to score 100%: Score = ${resH.match_score}%`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST I — Empty / Poor Resume
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test I: Empty / Poor Resume (Zero crash, very low score, high confidence in missing)...");
  const resumeI: ResumeData = {
    contact: { name: "Empty Person", email: "empty@example.com", phone: "123", location: "Unknown", links: [] },
    summary: "",
    sections: { experience: [], projects: [], skills: [], education: [], certifications: [] },
  };

  const resI = await evaluateRequirementsAgainstEvidence(jdH, resumeI);
  if (resI.match_score <= 10 && resI.missing_requirements.length === 2 && resI.confidence_score >= 80) {
    console.log(`  ✅ [PASS] Test I: Empty resume handled gracefully (Score: ${resI.match_score}%, Confidence: ${resI.confidence_score}%).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test I: Empty resume had unexpected score: Score = ${resI.match_score}%, Missing = ${resI.missing_requirements.length}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST J — Keyword-Rich but Irrelevant Resume
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test J: Keyword-Rich Irrelevant Resume (Listing buzzwords without operational context)...");
  const jdJ: JDRequirements = {
    role_title: "Senior Cloud Architect",
    seniority_signal: "Senior",
    must_have_skills: ["AWS", "Kubernetes"],
    nice_to_have_skills: [],
    keywords: ["AWS", "Kubernetes"],
    summary_keywords: ["AWS", "Kubernetes"],
    requirements: [
      { id: "r1", name: "AWS", description: "Designing multi-region AWS cloud architectures", category: "cloud", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
      { id: "r2", name: "Kubernetes", description: "Managing production Kubernetes clusters at scale", category: "cloud", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeJ: ResumeData = {
    contact: { name: "Buzzword", email: "buzz@example.com", phone: "123", location: "Remote", links: [] },
    summary: "IT Helpdesk Specialist.",
    sections: {
      experience: [
        {
          company: "Desk Co",
          title: "Helpdesk Tech",
          dates: "2021 – Present",
          bullets: ["Reset passwords and installed software on employee laptops."],
        },
      ],
      projects: [],
      skills: ["AWS", "Kubernetes", "Docker", "Cloud", "Microservices", "DevOps"], // Keyword dump in skills
      education: [],
      certifications: [],
    },
  };

  const resJ = await evaluateRequirementsAgainstEvidence(jdJ, resumeJ);
  if (resJ.match_score <= 60 && resJ.hard_requirement_match_score <= 60) {
    console.log(`  ✅ [PASS] Test J: Keyword-rich irrelevant resume capped appropriately (Score: ${resJ.match_score}%, Hard: ${resJ.hard_requirement_match_score}%).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test J: Keyword-rich irrelevant resume scored artificially high: Score = ${resJ.match_score}%`);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`  COMPREHENSIVE ADVERSARIAL RESULTS: ${passed}/${total} PASSED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runFullAdversarialSuite().catch((err) => {
  console.error("Adversarial suite encountered an error:", err);
  process.exit(1);
});
