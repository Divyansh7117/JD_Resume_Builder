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

  // ───────────────────────────────────────────────────────────────────────────
  // TEST K — Python for ML vs Python for Financial Reporting
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test K: Python for ML vs Python for Financial Reporting...");
  const jdK: JDRequirements = {
    role_title: "Machine Learning Engineer",
    seniority_signal: "Mid",
    must_have_skills: ["Machine Learning with Python"],
    nice_to_have_skills: [],
    keywords: ["Machine Learning", "PyTorch", "Python"],
    summary_keywords: ["Machine Learning", "PyTorch", "Python"],
    requirements: [
      { id: "r1", name: "Machine Learning with Python", description: "Deep learning model training with PyTorch / TensorFlow in Python", category: "ai", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeK: ResumeData = {
    contact: { name: "Finance Dev", email: "finance@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Python developer specializing in financial data reporting.",
    sections: {
      experience: [
        {
          company: "FinCorp",
          title: "Python Automation Engineer",
          dates: "2022 – Present",
          bullets: ["Wrote Python scripts using pandas and openpyxl to generate monthly financial P&L spreadsheets."],
        },
      ],
      projects: [],
      skills: ["Python", "Excel", "Pandas", "Automation"],
      education: [],
      certifications: [],
    },
  };

  const resK = await evaluateRequirementsAgainstEvidence(jdK, resumeK);
  const evalK = resK.evaluations[0];
  if (evalK && evalK.status !== "strong_match" && evalK.score < 1.0) {
    console.log(`  ✅ [PASS] Test K: Python for financial scripting not equated to deep ML (${evalK.status}, Score: ${evalK.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test K: Python for finance was incorrectly given strong_match for ML:`, evalK);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST L — Collaboration vs People Management
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test L: Collaboration vs People Management...");
  const jdL: JDRequirements = {
    role_title: "Engineering Manager",
    seniority_signal: "Manager",
    must_have_skills: ["People Management"],
    nice_to_have_skills: [],
    keywords: ["People Management"],
    summary_keywords: ["People Management"],
    requirements: [
      { id: "r1", name: "People Management", description: "Direct people management, performance evaluations, and hiring for 5+ engineers", category: "leadership", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeL: ResumeData = {
    contact: { name: "Collaborator", email: "collab@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Senior IC developer.",
    sections: {
      experience: [
        {
          company: "Tech Corp",
          title: "Senior Software Engineer",
          dates: "2021 – Present",
          bullets: ["Collaborated cross-functionally with 4 backend engineers and UI designers to ship features."],
        },
      ],
      projects: [],
      skills: ["Collaboration", "Agile", "TypeScript"],
      education: [],
      certifications: [],
    },
  };

  const resL = await evaluateRequirementsAgainstEvidence(jdL, resumeL);
  const evalL = resL.evaluations[0];
  if (evalL && evalL.status !== "strong_match" && evalL.score < 1.0) {
    console.log(`  ✅ [PASS] Test L: Team collaboration not equated to direct people management (${evalL.status}, Score: ${evalL.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test L: Team collaboration was given strong_match for People Management:`, evalL);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST M — Engineering Optimization vs Product Growth
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test M: Engineering Optimization vs Product Growth...");
  const jdM: JDRequirements = {
    role_title: "Growth Product Manager",
    seniority_signal: "Mid",
    must_have_skills: ["Product Growth & Funnel Optimization"],
    nice_to_have_skills: [],
    keywords: ["Growth", "Funnels", "Activation"],
    summary_keywords: ["Growth", "Funnels", "Activation"],
    requirements: [
      { id: "r1", name: "Product Growth & Funnel Optimization", description: "Owning user acquisition, conversion funnels, and viral activation loops", category: "product_growth", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeM: ResumeData = {
    contact: { name: "Backend Dev", email: "perf@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Full Stack Engineer optimizing systems.",
    sections: {
      experience: [
        {
          company: "Social App",
          title: "Full Stack Developer",
          dates: "2023 – Present",
          bullets: [
            "Optimized MongoDB aggregation pipelines, cutting API response time from 1.2s to 180ms.",
            "Improved Lighthouse performance score from 62 to 88 via asset compression.",
          ],
        },
      ],
      projects: [],
      skills: ["Performance Optimization", "MongoDB", "Node.js"],
      education: [],
      certifications: [],
    },
  };

  const resM = await evaluateRequirementsAgainstEvidence(jdM, resumeM);
  const evalM = resM.evaluations[0];
  if (evalM && evalM.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test M: Engineering optimization not equated to product growth (${evalM.status}, Score: ${evalM.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test M: Engineering optimization was mistakenly given strong_match for product growth:`, evalM);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST N — Application Development vs Product Management
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test N: Application Development vs Product Management...");
  const jdN: JDRequirements = {
    role_title: "Product Manager",
    seniority_signal: "Mid",
    must_have_skills: ["Product Strategy & Roadmap"],
    nice_to_have_skills: [],
    keywords: ["Product Strategy", "PRDs", "Roadmaps"],
    summary_keywords: ["Product Strategy", "PRDs", "Roadmaps"],
    requirements: [
      { id: "r1", name: "Product Strategy & Roadmap", description: "Authoring PRDs, roadmap prioritization, and customer discovery", category: "product_management", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeN: ResumeData = {
    contact: { name: "Full Stack Dev", email: "dev@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Full Stack Developer building web applications.",
    sections: {
      experience: [
        {
          company: "Web Startup",
          title: "Software Engineer",
          dates: "2022 – Present",
          bullets: ["Implemented Next.js frontend components and Express REST API endpoints."],
        },
      ],
      projects: [],
      skills: ["React", "Node.js", "Express"],
      education: [],
      certifications: [],
    },
  };

  const resN = await evaluateRequirementsAgainstEvidence(jdN, resumeN);
  const evalN = resN.evaluations[0];
  if (evalN && evalN.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test N: Writing code not equated to Product Management strategy (${evalN.status}, Score: ${evalN.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test N: Writing code was given strong_match for Product Strategy:`, evalN);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST O — Raw Analytics Tools vs Product Analytics
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test O: Raw Analytics Tools vs Product Analytics...");
  const jdO: JDRequirements = {
    role_title: "Product Analytics Lead",
    seniority_signal: "Senior",
    must_have_skills: ["Cohort Retention & Funnel Drop-off Analysis"],
    nice_to_have_skills: [],
    keywords: ["Cohort Analysis", "Retention", "Funnel"],
    summary_keywords: ["Cohort Analysis", "Retention", "Funnel"],
    requirements: [
      { id: "r1", name: "Cohort Retention & Funnel Drop-off Analysis", description: "Designing cohort retention curves and diagnosing product funnel drop-offs", category: "analytics", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeO: ResumeData = {
    contact: { name: "SQL Writer", email: "sql@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Database query writer.",
    sections: {
      experience: [
        {
          company: "Data Corp",
          title: "Junior Data Operator",
          dates: "2023 – Present",
          bullets: ["Wrote basic SQL SELECT queries and formatted Power BI report tables."],
        },
      ],
      projects: [],
      skills: ["SQL", "Power BI", "Excel"],
      education: [],
      certifications: [],
    },
  };

  const resO = await evaluateRequirementsAgainstEvidence(jdO, resumeO);
  const evalO = resO.evaluations[0];
  if (evalO && evalO.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test O: Raw SQL query writing not equated to deep cohort retention analysis (${evalO.status}, Score: ${evalO.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test O: Raw SQL writing was given strong_match for Cohort Analysis:`, evalO);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST P — React vs React + TypeScript
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test P: React vs React + TypeScript...");
  const jdP: JDRequirements = {
    role_title: "TypeScript React Developer",
    seniority_signal: "Mid",
    must_have_skills: ["React with TypeScript"],
    nice_to_have_skills: [],
    keywords: ["React", "TypeScript"],
    summary_keywords: ["React", "TypeScript"],
    requirements: [
      { id: "r1", name: "React with TypeScript", description: "Strictly typed React application development using TypeScript interfaces and generics", category: "frontend", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "SINGLE" },
    ],
  };

  const resumeP: ResumeData = {
    contact: { name: "JS Dev", email: "js@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Frontend Developer using JavaScript.",
    sections: {
      experience: [
        {
          company: "UI Agency",
          title: "React Developer",
          dates: "2022 – Present",
          bullets: ["Built interactive web components using React.js and vanilla JavaScript."],
        },
      ],
      projects: [],
      skills: ["React", "JavaScript", "HTML", "CSS"], // NO TypeScript
      education: [],
      certifications: [],
    },
  };

  const resP = await evaluateRequirementsAgainstEvidence(jdP, resumeP);
  const evalP = resP.evaluations[0];
  if (evalP && evalP.status !== "strong_match") {
    console.log(`  ✅ [PASS] Test P: Vanilla React without TypeScript evaluated as partial/weak (${evalP.status}, Score: ${evalP.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test P: Vanilla React was mistakenly given strong_match for React + TypeScript:`, evalP);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST Q — Logical Operators (AND vs OR)
  // ───────────────────────────────────────────────────────────────────────────
  total++;
  console.log("\n▶ Test Q: Logical Operators (AND vs OR)...");
  const jdQ: JDRequirements = {
    role_title: "Cloud & Polyglot Engineer",
    seniority_signal: "Mid",
    must_have_skills: [],
    nice_to_have_skills: [],
    keywords: [],
    summary_keywords: [],
    requirements: [
      { id: "r_or", name: "AWS OR Google Cloud", description: "Experience with either AWS or Google Cloud Platform", category: "cloud", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "OR" },
      { id: "r_and", name: "React AND Rust", description: "Full-stack development in React AND systems programming in Rust", category: "fullstack", requirement_type: "skill_capability", importance: "required", criticality: "hard", logical_operator: "AND" },
    ],
  };

  const resumeQ: ResumeData = {
    contact: { name: "Cloud Dev", email: "cloud@example.com", phone: "123", location: "Remote", links: [] },
    summary: "Full stack developer with AWS and React experience.",
    sections: {
      experience: [
        {
          company: "Cloud Co",
          title: "Cloud Developer",
          dates: "2021 – Present",
          bullets: [
            "Architected scalable cloud backends on AWS (Lambda, S3, DynamoDB).",
            "Built responsive Single Page Applications with React.js.",
          ],
        },
      ],
      projects: [],
      skills: ["AWS", "React", "JavaScript"], // Has AWS (satisfies OR), has React but NO Rust (partial for AND)
      education: [],
      certifications: [],
    },
  };

  const resQ = await evaluateRequirementsAgainstEvidence(jdQ, resumeQ);
  const evalOr = resQ.evaluations.find((e) => e.requirement_id === "r_or");
  const evalAnd = resQ.evaluations.find((e) => e.requirement_id === "r_and");

  const orPassed = evalOr && evalOr.status === "strong_match";
  const andPassed = evalAnd && evalAnd.status !== "strong_match" && evalAnd.score <= 0.6;

  if (orPassed && andPassed) {
    console.log(`  ✅ [PASS] Test Q: OR satisfied with 1 option (${evalOr?.status}), AND penalized for missing Rust (${evalAnd?.status}, score: ${evalAnd?.score}).`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Test Q: Logical operator handling failed: OR=${evalOr?.status}, AND=${evalAnd?.status} (score: ${evalAnd?.score})`);
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
