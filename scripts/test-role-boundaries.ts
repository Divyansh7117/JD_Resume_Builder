import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";
import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";
import { JDRequirements, JDRequirement } from "../types";

function makeJD(reqName: string, reqDesc: string, category: string): JDRequirements {
  const req: JDRequirement = {
    id: "req_test_1",
    name: reqName,
    description: reqDesc,
    category: category,
    importance: "required",
    criticality: "hard",
    weight: 4.5,
    requirement_type: "skill_capability",
    logical_operator: "SINGLE",
  };
  return {
    role_title: "Role Evaluation Test",
    seniority_signal: "mid",
    requirements: [req],
    must_have_skills: [reqName],
    nice_to_have_skills: [],
    keywords: [reqName],
    summary_keywords: [reqName],
  };
}

function makeResume(name: string, title: string, bulletText: string) {
  return `Candidate Name: ${name}
Title: ${title}
Email: candidate@example.com | Location: Remote

EXPERIENCE
${title} | TechCorp | 2023 - Present
• ${bulletText}

SKILLS
General Tools`;
}

interface TestCase {
  id: number;
  type: "NEGATIVE" | "POSITIVE";
  requirementName: string;
  requirementDesc: string;
  category: string;
  resumeTitle: string;
  resumeBullet: string;
  expectedDemonstrated: boolean;
  description: string;
}

const TEST_CASES: TestCase[] = [
  // ── NEGATIVE BOUNDARY CASES (Implementation != Functional Ownership) ──
  {
    id: 1,
    type: "NEGATIVE",
    requirementName: "Product Management",
    requirementDesc: "Own end-to-end product strategy, PRDs, roadmaps, and feature prioritization.",
    category: "product_management",
    resumeTitle: "Full Stack Developer",
    resumeBullet: "Built a React/Node.js web application and led frontend and backend implementation across microservices.",
    expectedDemonstrated: false,
    description: "React/Node full-stack coding must NOT be classified as Demonstrated Product Management",
  },
  {
    id: 2,
    type: "NEGATIVE",
    requirementName: "Growth Funnel Management",
    requirementDesc: "Manage acquisition funnels, conversion optimization, activation, and cohort retention.",
    category: "growth_strategy",
    resumeTitle: "Frontend Engineer",
    resumeBullet: "Built an analytics dashboard in React displaying user growth and engagement metrics.",
    expectedDemonstrated: false,
    description: "Building an analytics dashboard UI must NOT be classified as Demonstrated Growth Funnel Management",
  },
  {
    id: 3,
    type: "NEGATIVE",
    requirementName: "Product Analytics",
    requirementDesc: "Expertise in product analytics tools, user cohort retention, and funnel drop-off analysis.",
    category: "product_analytics",
    resumeTitle: "Database Administrator",
    resumeBullet: "Wrote complex SQL queries to query and optimize PostgreSQL relational databases.",
    expectedDemonstrated: false,
    description: "SQL database querying must NOT be classified as Demonstrated Product Analytics",
  },
  {
    id: 4,
    type: "NEGATIVE",
    requirementName: "AI-Powered Product Design",
    requirementDesc: "Design AI-powered user experiences, recommendation loops, and consumer product personalization.",
    category: "ai_product_design",
    resumeTitle: "Machine Learning Engineer",
    resumeBullet: "Built and trained a transformer-based NLP text classification model in PyTorch.",
    expectedDemonstrated: false,
    description: "PyTorch NLP model training must NOT be classified as Demonstrated AI Product Design",
  },
  {
    id: 5,
    type: "NEGATIVE",
    requirementName: "Data Science",
    requirementDesc: "Perform statistical inference, machine learning experimentation, and predictive modeling.",
    category: "data_science",
    resumeTitle: "Data Engineer",
    resumeBullet: "Engineered robust ETL data pipelines and managed data lake transformations using Apache Spark and Airflow.",
    expectedDemonstrated: false,
    description: "Spark/Airflow ETL data engineering must NOT be classified as Demonstrated Data Science",
  },
  {
    id: 6,
    type: "NEGATIVE",
    requirementName: "UX Research",
    requirementDesc: "Conduct usability interviews, synthesize user research, and evaluate user journeys.",
    category: "ux_research",
    resumeTitle: "Frontend Developer",
    resumeBullet: "Developed pixel-perfect responsive web components and implemented design system CSS styles.",
    expectedDemonstrated: false,
    description: "Frontend UI component coding must NOT be classified as Demonstrated UX Research",
  },
  {
    id: 7,
    type: "NEGATIVE",
    requirementName: "DevOps Leadership",
    requirementDesc: "Lead engineering infrastructure strategy, manage DevOps teams, and establish cloud standards.",
    category: "devops_leadership",
    resumeTitle: "DevOps Engineer",
    resumeBullet: "Containerized microservices using Docker and maintained deployment YAML manifests on Kubernetes.",
    expectedDemonstrated: false,
    description: "Technical Docker/Kubernetes maintenance must NOT be classified as Demonstrated DevOps Leadership",
  },
  {
    id: 8,
    type: "NEGATIVE",
    requirementName: "Investment Banking & M&A",
    requirementDesc: "Advise on M&A deal execution, perform DCF valuations, and conduct financial due diligence.",
    category: "investment_banking",
    resumeTitle: "Financial Analyst",
    resumeBullet: "Managed daily bookkeeping spreadsheets and generated monthly expense variance reports in Excel.",
    expectedDemonstrated: false,
    description: "Routine Excel expense reporting must NOT be classified as Demonstrated M&A / Investment Banking",
  },

  // ── POSITIVE BOUNDARY CASES (Explicit Functional Ownership) ──
  {
    id: 9,
    type: "POSITIVE",
    requirementName: "Product Management",
    requirementDesc: "Own end-to-end product strategy, PRDs, roadmaps, and feature prioritization.",
    category: "product_management",
    resumeTitle: "Product Manager",
    resumeBullet: "Owned the product roadmap, wrote PRDs, prioritized features using customer research, and led quarterly product strategy.",
    expectedDemonstrated: true,
    description: "Explicit PRDs, roadmaps, and product strategy MUST be classified as Demonstrated Product Management",
  },
  {
    id: 10,
    type: "POSITIVE",
    requirementName: "Growth Funnel Management",
    requirementDesc: "Manage acquisition funnels, conversion optimization, activation, and cohort retention.",
    category: "growth_strategy",
    resumeTitle: "Growth Lead",
    resumeBullet: "Designed acquisition and activation funnels, ran A/B experiments, analyzed conversion rates, and improved retention by 18%.",
    expectedDemonstrated: true,
    description: "Funnel design and conversion A/B experimentation MUST be classified as Demonstrated Growth Funnel Management",
  },
  {
    id: 11,
    type: "POSITIVE",
    requirementName: "Product Analytics",
    requirementDesc: "Expertise in product analytics tools, user cohort retention, and funnel drop-off analysis.",
    category: "product_analytics",
    resumeTitle: "Product Analyst",
    resumeBullet: "Analyzed Mixpanel cohorts, created retention funnels, and used Amplitude to identify activation drop-offs.",
    expectedDemonstrated: true,
    description: "Mixpanel cohorts and Amplitude funnel analysis MUST be classified as Demonstrated Product Analytics",
  },
  {
    id: 12,
    type: "POSITIVE",
    requirementName: "UX Research",
    requirementDesc: "Conduct usability interviews, synthesize user research, and evaluate user journeys.",
    category: "ux_research",
    resumeTitle: "UX Researcher",
    resumeBullet: "Conducted usability interviews, created user personas, performed usability testing, and designed interaction flows.",
    expectedDemonstrated: true,
    description: "Usability interviews and persona testing MUST be classified as Demonstrated UX Research",
  },
  {
    id: 13,
    type: "POSITIVE",
    requirementName: "AI-Powered Product Design",
    requirementDesc: "Design AI-powered user experiences, recommendation loops, and consumer product personalization.",
    category: "ai_product_design",
    resumeTitle: "Product Lead",
    resumeBullet: "Designed and launched an AI recommendation feature based on customer behavior and defined the product requirements with stakeholders.",
    expectedDemonstrated: true,
    description: "Designing consumer AI recommendation feature requirements MUST be classified as Demonstrated AI Product Design",
  },
  {
    id: 14,
    type: "POSITIVE",
    requirementName: "Data Science",
    requirementDesc: "Perform statistical inference, machine learning experimentation, and predictive modeling.",
    category: "data_science",
    resumeTitle: "Data Scientist",
    resumeBullet: "Built predictive statistical models and machine learning pipelines in Python to forecast customer churn with 92% accuracy.",
    expectedDemonstrated: true,
    description: "Predictive statistical modeling in Python MUST be classified as Demonstrated Data Science",
  },
  {
    id: 15,
    type: "POSITIVE",
    requirementName: "DevOps Leadership",
    requirementDesc: "Lead engineering infrastructure strategy, manage DevOps teams, and establish cloud standards.",
    category: "devops_leadership",
    resumeTitle: "Head of Infrastructure",
    resumeBullet: "Led the global infrastructure team, defined cloud architecture strategy, and managed 12 DevOps engineers.",
    expectedDemonstrated: true,
    description: "Managing DevOps teams and defining cloud strategy MUST be classified as Demonstrated DevOps Leadership",
  },
  {
    id: 16,
    type: "POSITIVE",
    requirementName: "Investment Banking & M&A",
    requirementDesc: "Advise on M&A deal execution, perform DCF valuations, and conduct financial due diligence.",
    category: "investment_banking",
    resumeTitle: "Investment Banking Associate",
    resumeBullet: "Advised on $500M cross-border M&A transactions, built detailed DCF valuation models, and led due diligence.",
    expectedDemonstrated: true,
    description: "M&A deal execution and DCF valuation modeling MUST be classified as Demonstrated Investment Banking & M&A",
  },
];

async function runRoleBoundaryTests() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║     16-CASE GENERIC FUNCTIONAL ROLE & DISCIPLINE AUDIT          ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  for (const tc of TEST_CASES) {
    const jd = makeJD(tc.requirementName, tc.requirementDesc, tc.category);
    const resumeText = makeResume(`Test Candidate ${tc.id}`, tc.resumeTitle, tc.resumeBullet);
    const parsed = await parseResume(resumeText);
    const analysis = await evaluateRequirementsAgainstEvidence(jd, parsed);
    const evalResult = analysis.evaluations[0];

    const isDemonstrated = evalResult.status === "strong_match" || evalResult.score === 1.0;
    const testOk = isDemonstrated === tc.expectedDemonstrated;

    if (testOk) {
      passed++;
      console.log(`  ✓ PASS [${tc.type} Case ${tc.id}]: ${tc.description}`);
      console.log(`    Status=${evalResult.status}, Score=${evalResult.score}, Level=${evalResult.evidence_level}`);
    } else {
      failed++;
      console.error(`  ❌ FAIL [${tc.type} Case ${tc.id}]: ${tc.description}`);
      console.error(`    Expected Demonstrated: ${tc.expectedDemonstrated}, Got: status=${evalResult.status}, score=${evalResult.score}`);
      console.error(`    Reasoning: ${evalResult.reasoning}`);
    }
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`RESULTS: ${passed} / ${TEST_CASES.length} PASSED (${failed} failed)`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runRoleBoundaryTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
