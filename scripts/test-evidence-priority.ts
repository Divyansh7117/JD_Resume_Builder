import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";
import { JDRequirements, JDRequirement, ResumeData, CandidateEvidenceUnit } from "../types";

function createJD(requirements: { name: string; description: string; category: string }[]): JDRequirements {
  const reqs: JDRequirement[] = requirements.map((r, i) => ({
    id: `req_${i + 1}`,
    name: r.name,
    description: r.description,
    category: r.category,
    importance: "required",
    criticality: "hard",
    weight: 4.0,
    requirement_type: "skill_capability",
    logical_operator: "SINGLE",
  }));

  return {
    role_title: "Full Stack Engineer Evaluation",
    seniority_signal: "mid",
    requirements: reqs,
    must_have_skills: requirements.map((r) => r.name),
    nice_to_have_skills: [],
    keywords: requirements.map((r) => r.name),
    summary_keywords: requirements.map((r) => r.name),
  };
}

function createSyntheticResumeData(params: {
  skills: string[];
  projectTitle?: string;
  projectBullets?: string[];
  experienceBullets?: string[];
  experienceTitle?: string;
  company?: string;
}): ResumeData {
  const evidence_units: CandidateEvidenceUnit[] = [];

  evidence_units.push({
    id: "ev_contact_loc",
    source_section: "contact",
    source_title: "Candidate Location",
    text: "Remote",
    evidence_type: "explicit_resume_claim",
  });

  evidence_units.push({
    id: "ev_sum_1",
    source_section: "summary",
    source_title: "Professional Summary",
    text: "Experienced engineer focused on building performant and reliable systems.",
    evidence_type: "explicit_resume_claim",
  });

  if (params.experienceBullets && params.experienceBullets.length > 0) {
    const title = params.experienceTitle || "Software Engineer";
    const company = params.company || "TechCorp";

    evidence_units.push({
      id: "ev_exp_1_header",
      source_section: "experience",
      source_title: `${title} at ${company}`,
      text: `${title} at ${company} (2023 – Present, Remote)`,
      evidence_type: "employment_date_calculation",
    });

    params.experienceBullets.forEach((bullet, idx) => {
      evidence_units.push({
        id: `ev_exp_1_${idx + 1}`,
        source_section: "experience",
        source_title: `${title} at ${company}`,
        text: bullet,
        evidence_type: "source_bullet",
      });
    });
  }

  if (params.projectBullets && params.projectBullets.length > 0) {
    const projName = params.projectTitle || "Project Alpha";

    evidence_units.push({
      id: "ev_proj_1_header",
      source_section: "project",
      source_title: projName,
      text: projName,
      evidence_type: "source_bullet",
    });

    params.projectBullets.forEach((bullet, idx) => {
      evidence_units.push({
        id: `ev_proj_1_${idx + 1}`,
        source_section: "project",
        source_title: projName,
        text: bullet,
        evidence_type: "source_bullet",
      });
    });
  }

  params.skills.forEach((skill, idx) => {
    evidence_units.push({
      id: `ev_skill_${idx + 1}`,
      source_section: "skill",
      source_title: "Skills & Competencies",
      text: skill,
      evidence_type: "explicit_resume_claim",
    });
  });

  return {
    contact: {
      name: "Alex Jordan",
      email: "alex.jordan@example.com",
      phone: "",
      location: "Remote",
      links: [],
    },
    summary: "Experienced engineer focused on building performant and reliable systems.",
    sections: {
      experience: params.experienceBullets
        ? [
            {
              company: params.company || "TechCorp",
              title: params.experienceTitle || "Software Engineer",
              dates: "2023 – Present",
              bullets: params.experienceBullets,
            },
          ]
        : [],
      projects: params.projectBullets
        ? [
            {
              name: params.projectTitle || "Project Alpha",
              bullets: params.projectBullets,
            },
          ]
        : [],
      skills: params.skills,
      education: [],
      certifications: [],
    },
    evidence_units,
  };
}

async function runEvidencePriorityTests() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
  console.log("║     GENERIC EVIDENCE PRIORITY & CONFLICT RESOLUTION TESTS             ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  // ─── TEST 1: Node.js & REST APIs demonstrated in project + skill listed ───
  {
    console.log("▶ [Test 1] Node.js in Skills + 'Developed REST APIs using Node.js and Express.' in Project");
    const resumeData = createSyntheticResumeData({
      skills: ["Node.js", "Express", "JavaScript"],
      projectTitle: "API Service Platform",
      projectBullets: ["Developed REST APIs using Node.js and Express to handle user operations."],
    });

    const jd = createJD([
      { name: "Node.js", description: "Experience building backend services in Node.js", category: "Backend" },
      { name: "REST APIs", description: "Experience designing and implementing REST APIs", category: "Architecture" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const nodeEval = analysis.evaluations.find((e) => e.requirement_name === "Node.js");
    const restEval = analysis.evaluations.find((e) => e.requirement_name === "REST APIs");

    const t1a = nodeEval?.status === "strong_match" && nodeEval?.score === 1.0;
    const t1b = restEval?.status === "strong_match" && restEval?.score === 1.0;
    const t1c = nodeEval?.evidence.some((ev) => ev.evidence_id.startsWith("ev_proj_"));

    if (t1a && t1b && t1c) {
      console.log("  ✓ PASS: Node.js (1.0, strong_match) & REST APIs (1.0, strong_match) with project evidence attached.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Node status=${nodeEval?.status} score=${nodeEval?.score}, REST status=${restEval?.status}`);
      failed++;
    }
  }

  // ─── TEST 2: Node.js ONLY in Skills + React in Project ───
  {
    console.log("\n▶ [Test 2] Node.js in Skills + 'Built a web application using React.' in Project (Node.js NOT demonstrated)");
    const resumeData = createSyntheticResumeData({
      skills: ["Node.js", "React", "CSS"],
      projectTitle: "Frontend Portal",
      projectBullets: ["Built a web application using React with responsive layout components."],
    });

    const jd = createJD([
      { name: "Node.js", description: "Backend development with Node.js", category: "Backend" },
      { name: "React", description: "Frontend development with React", category: "Frontend" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const nodeEval = analysis.evaluations.find((e) => e.requirement_name === "Node.js");
    const reactEval = analysis.evaluations.find((e) => e.requirement_name === "React");

    const t2a = nodeEval?.status === "claimed_match" && nodeEval?.score === 0.8;
    const t2b = reactEval?.status === "strong_match" && reactEval?.score === 1.0;

    if (t2a && t2b) {
      console.log("  ✓ PASS: Node.js is claimed_match (0.8) and React is strong_match (1.0).");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Node status=${nodeEval?.status} (expected claimed_match), React status=${reactEval?.status}`);
      failed++;
    }
  }

  // ─── TEST 3: PostgreSQL & SQL demonstrated in Project + PostgreSQL in Skills ───
  {
    console.log("\n▶ [Test 3] PostgreSQL in Skills + 'Designed PostgreSQL schemas and optimized SQL queries.' in Project");
    const resumeData = createSyntheticResumeData({
      skills: ["PostgreSQL", "SQL", "Database Design"],
      projectTitle: "Data Layer Optimization",
      projectBullets: ["Designed PostgreSQL schemas and optimized SQL queries, reducing latency by 35%."],
    });

    const jd = createJD([
      { name: "PostgreSQL", description: "Relational database management with PostgreSQL", category: "Database" },
      { name: "SQL", description: "Database querying and optimization using SQL", category: "Database" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const pgEval = analysis.evaluations.find((e) => e.requirement_name === "PostgreSQL");
    const sqlEval = analysis.evaluations.find((e) => e.requirement_name === "SQL");

    const t3a = pgEval?.status === "strong_match" && pgEval?.score === 1.0;
    const t3b = sqlEval?.status === "strong_match" && sqlEval?.score === 1.0;

    if (t3a && t3b) {
      console.log("  ✓ PASS: PostgreSQL (1.0, strong_match) & SQL (1.0, strong_match) verified from project demonstration.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: PostgreSQL status=${pgEval?.status}, SQL status=${sqlEval?.status}`);
      failed++;
    }
  }

  // ─── TEST 4: PostgreSQL in Skills + MongoDB in Project ───
  {
    console.log("\n▶ [Test 4] PostgreSQL in Skills + 'Built a web application using MongoDB.' in Project");
    const resumeData = createSyntheticResumeData({
      skills: ["PostgreSQL", "MongoDB", "NoSQL"],
      projectTitle: "Document Store Service",
      projectBullets: ["Built a web application using MongoDB for dynamic document storage."],
    });

    const jd = createJD([
      { name: "PostgreSQL", description: "Relational database expertise with PostgreSQL", category: "Database" },
      { name: "MongoDB", description: "NoSQL document database development with MongoDB", category: "Database" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const pgEval = analysis.evaluations.find((e) => e.requirement_name === "PostgreSQL");
    const mongoEval = analysis.evaluations.find((e) => e.requirement_name === "MongoDB");

    const t4a = pgEval?.status === "claimed_match" && pgEval?.score === 0.8;
    const t4b = mongoEval?.status === "strong_match" && mongoEval?.score === 1.0;

    if (t4a && t4b) {
      console.log("  ✓ PASS: PostgreSQL is claimed_match (0.8) and MongoDB is strong_match (1.0).");
      passed++;
    } else {
      console.log(`  ❌ FAIL: PostgreSQL status=${pgEval?.status} (expected claimed_match), MongoDB status=${mongoEval?.status}`);
      failed++;
    }
  }

  // ─── TEST 5: SQL in Skills + Generic Dashboard in Project without SQL ───
  {
    console.log("\n▶ [Test 5] SQL in Skills + 'Built a custom dashboard displaying application metrics.' in Project");
    const resumeData = createSyntheticResumeData({
      skills: ["SQL", "Analytics", "HTML"],
      projectTitle: "Metrics UI",
      projectBullets: ["Built a custom dashboard displaying application metrics using chart components."],
    });

    const jd = createJD([
      { name: "SQL", description: "Writing complex SQL queries and relational analysis", category: "Database" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const sqlEval = analysis.evaluations.find((e) => e.requirement_name === "SQL");
    const t5 = sqlEval?.status === "claimed_match" && sqlEval?.score === 0.8;

    if (t5) {
      console.log("  ✓ PASS: SQL correctly classified as claimed_match (0.8) because project did not demonstrate SQL.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: SQL status=${sqlEval?.status} (expected claimed_match), score=${sqlEval?.score}`);
      failed++;
    }
  }

  // ─── TEST 6: Product Management vs 'Built React/Node applications' ───
  {
    console.log("\n▶ [Test 6] Product Management required vs 'Built React/Node applications' (Implementation != PM)");
    const resumeData = createSyntheticResumeData({
      skills: ["React", "Node.js", "TypeScript"],
      experienceBullets: ["Built React/Node applications for internal inventory tracking."],
    });

    const jd = createJD([
      { name: "Product Management", description: "Leading product roadmaps, PRDs, and user research", category: "Product" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const pmEval = analysis.evaluations.find((e) => e.requirement_name === "Product Management");
    const t6 = pmEval?.status === "no_evidence" && pmEval?.score === 0.0 && pmEval?.evidence_ids.length === 0;

    if (t6) {
      console.log("  ✓ PASS: Product Management correctly classified as no_evidence (0.0) with zero evidence units.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Product Management status=${pmEval?.status} (expected no_evidence), score=${pmEval?.score}`);
      failed++;
    }
  }

  // ─── TEST 7: Product Management vs Explicit PM Demonstration ───
  {
    console.log("\n▶ [Test 7] Product Management required vs 'Owned product roadmap, wrote PRDs, prioritized quarterly roadmap and conducted user discovery.'");
    const resumeData = createSyntheticResumeData({
      experienceTitle: "Product Manager",
      skills: ["Product Management", "Roadmapping", "PRD Writing", "User Discovery"],
      experienceBullets: ["Owned product roadmap, wrote PRDs, prioritized quarterly roadmap and conducted user discovery."],
    });

    const jd = createJD([
      { name: "Product Management", description: "Leading product roadmaps, PRDs, and user research", category: "Product" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const pmEval = analysis.evaluations.find((e) => e.requirement_name === "Product Management");
    const t7 = pmEval?.status === "strong_match" && pmEval?.score === 1.0;

    if (t7) {
      console.log("  ✓ PASS: Product Management correctly classified as strong_match (1.0) from explicit PM evidence.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Product Management status=${pmEval?.status} (expected strong_match), score=${pmEval?.score}`);
      failed++;
    }
  }

  // ─── TEST 8: Growth Funnel Management vs 'Built KPI dashboard using React.' ───
  {
    console.log("\n▶ [Test 8] Growth Funnel Management vs 'Built KPI dashboard using React.' (UI != Growth Funnel)");
    const resumeData = createSyntheticResumeData({
      skills: ["React", "JavaScript", "CSS"],
      projectTitle: "KPI Dashboard",
      projectBullets: ["Built KPI dashboard using React to render frontend metrics widgets."],
    });

    const jd = createJD([
      { name: "Growth Funnel Management", description: "Managing conversion funnels, onboarding flows, and growth experiments", category: "Growth" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const growthEval = analysis.evaluations.find((e) => e.requirement_name === "Growth Funnel Management");
    const t8 = growthEval?.status === "no_evidence" || growthEval?.status === "partial_match";

    if (t8 && growthEval?.status !== "strong_match") {
      console.log(`  ✓ PASS: Growth Funnel Management is ${growthEval?.status} (NOT strong_match).`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Growth Funnel Management status=${growthEval?.status} (expected no_evidence or partial)`);
      failed++;
    }
  }

  // ─── TEST 9: Growth Funnel Management vs Explicit Funnel A/B Demonstration ───
  {
    console.log("\n▶ [Test 9] Growth Funnel Management vs 'Designed acquisition funnel experiments and improved activation conversion through A/B testing.'");
    const resumeData = createSyntheticResumeData({
      experienceTitle: "Growth Lead",
      skills: ["Growth Strategy", "A/B Testing", "Funnel Optimization"],
      experienceBullets: ["Designed acquisition funnel experiments and improved activation conversion through A/B testing."],
    });

    const jd = createJD([
      { name: "Growth Funnel Management", description: "Managing conversion funnels, onboarding flows, and growth experiments", category: "Growth" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const growthEval = analysis.evaluations.find((e) => e.requirement_name === "Growth Funnel Management");
    const t9 = growthEval?.status === "strong_match" && growthEval?.score === 1.0;

    if (t9) {
      console.log("  ✓ PASS: Growth Funnel Management correctly classified as strong_match (1.0).");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Growth Funnel Management status=${growthEval?.status} (expected strong_match)`);
      failed++;
    }
  }

  // ─── TEST 10: Retrieval-Conflict Regression (Skills claim does NOT override Project demonstration) ───
  {
    console.log("\n▶ [Test 10] Retrieval-Conflict Regression: Weaker skills-list claim MUST NOT override stronger project demonstration");
    const resumeData = createSyntheticResumeData({
      skills: ["Node.js", "Express", "TypeScript"],
      projectTitle: "Backend Architecture",
      projectBullets: ["Developed backend REST APIs using Node.js and Express to process real-time transactions."],
    });

    const jd = createJD([
      { name: "Node.js", description: "Backend development with Node.js", category: "Backend" },
    ]);

    const analysis = await evaluateRequirementsAgainstEvidence(jd, resumeData);

    const nodeEval = analysis.evaluations.find((e) => e.requirement_name === "Node.js");
    const t10a = nodeEval?.status === "strong_match" && nodeEval?.score === 1.0;
    const t10b = nodeEval?.evidence.some((ev) => ev.evidence_id.startsWith("ev_proj_"));

    if (t10a && t10b) {
      console.log("  ✓ PASS: Retrieval-conflict resolved: strong_match (1.0) with project evidence attached.");
      passed++;
    } else {
      console.log(`  ❌ FAIL: Node status=${nodeEval?.status} (expected strong_match), project attached=${t10b}`);
      failed++;
    }
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`RESULTS: ${passed} / ${passed + failed} PASSED (${failed} failed)`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runEvidencePriorityTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
