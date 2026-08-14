import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";
import { extractJDRequirements } from "../lib/extractJD";
import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";

const INTERNSHIP_JD_TEXT = `Job Title: Mobile & Full Stack Engineering Intern
Location: Bangalore (On-site / Hybrid)
Type: Internship (Students / Recent Graduates)

About the Role:
We are looking for a fast-moving, high-agency Software Engineering Intern to help build next-generation mobile applications and backend microservices.

Core Responsibilities & Requirements:
• Mobile Development: Build cross-platform mobile apps using Flutter and Dart.
• Backend & Database: Design real-time backends with Supabase and PostgreSQL.
• Cloud & Services: Experience integrating Firebase (Auth, Firestore, Cloud Messaging).
• API Architecture: Design and consume scalable REST APIs.
• Version Control: Proficient with Git and GitHub collaborative workflows.
• Passion for Building: Track record of shipping real products in a high-velocity startup environment.

Preferred / Bonus:
• Experience with AI integrations (LLM APIs, embedding models, agentic workflows).
• Self-motivated and comfortable taking ownership from 0 to 1.`;

const AUTHENTIC_RACHIT_RESUME_TEXT = `RACHIT AGARWAL
+91-9811996540 • agarwalrachit42@gmail.com • LinkedIn • New Delhi, India

SUMMARY
Product & growth professional with 5+ years of B2C consumer product and e-commerce experience at PhysicsWallah (EdTech), owning 0→1 launches, P&L, and full-funnel strategy across e-commerce, offline coaching, and scholarship platforms. Founded and lead PW’s central AI team, building and scaling agentic AI/LLM workflows into production and embedding AI use-cases directly into business operations. Built and scaled PW Store (₹200Cr+ revenue, 3,000+ SKUs, 50K DAU) and India’s largest scholarship test (25L+ students, ₹700Cr+ business impact). Strong cross-functional operator across Engineering, Design, Data Science, and AI teams, balancing customer experience, business impact, and technical feasibility.

EXPERIENCE
General Manager – Product & Growth
PhysicsWallah · PW Vidyapeeth · Delhi
Jun 2024 – Present
• Founded and lead PW’s central AI team, building and scaling agentic AI/LLM workflows (AP invoice automation via ERPNext/Zoho, HR and policy bots, content-generation pipelines) from 0→1 into production, improving business outcomes and reducing manual ops load.
• Scaled India’s largest scholarship test (NSAT) to 25L+ students across 10,000+ pincodes, 4,000+ schools, and 11 states; owned the full consumer registration-to-conversion funnel, driving ₹700Cr+ in business impact.
• Built BTL growth products (SAATHI, HOME Demo, and ISAT/SAT) that expanded student reach and improved activation and sign-up conversion, generating ₹500Cr+ in combined business revenue.
• Built and owned Hummingbird ERP, an internal data and workflow platform managing 4L+ students across PW’s offline centres; scaled to 1,000+ concurrent users, integrating engagement and reporting workflows across teams.

Product Owner - E-commerce (PW Store)
PhysicsWallah · Ecommerce Business · Delhi
Mar 2022 – Jun 2024
• Built PW Store, a B2C e-commerce product, from zero: scaled to 3,000+ SKUs, ₹200Cr+ in annual revenue, and 50K DAU, while maintaining NPS above 70 throughout product evolution.
• Owned integration of PW Store’s Order Management System (OMS) end-to-end, driving cross-functional execution across engineering, ops, and logistics partners to unify order, inventory, and real-time tracking workflows across 4+ delivery partners.
• Tripled homepage-to-checkout conversion (1.75% → 5%) by forming and testing onboarding and checkout hypotheses, improving activation without degrading NPS.
• Improved retention 40% via CLM-led, cohort-based product decisions and grew organic traffic 50% through SEO-integrated product development.
• Designed free-to-paid conversion funnels and in-product upsell flows, running iterative A/B tests to improve monetization per user and maximise revenue per cohort.

Senior Business Analyst
PhysicsWallah · Delhi
Jun 2021 – Mar 2022
• Built KPI dashboards and reporting infrastructure from scratch, defining what success looked like for product and growth teams and enabling data-driven, funnel- and cohort-level decisions.
• Identified and shipped process automations via stakeholder research, reducing manual ops overhead across teams. Stack: SQL, Python, Power BI, Excel.

SKILLS & TOOLS
Product: B2C Product Management · PRD Writing · Roadmapping · 0→1 Launches · User Research · Strategy & Ops Ownership · Funnel Optimisation · Cohort Analysis · A/B Testing · Growth Strategy
Analytics: SQL · Python · Power BI · Qlik Sense · Google Data Studio · Excel
Growth: Activation, Engagement & Retention · Conversion Rate Optimisation (CRO) · CLM & Retention · SEO · Multi-channel GTM
Leadership: Cross-functional Teams (40+) · OKRs · Sprint Planning · Stakeholder Management · Storytelling
AI / Tools: AI-Powered Product Design · Agentic AI/LLM Workflows · Prompt Engineering · Figma (basic) · Jira

EDUCATION & CERTIFICATIONS
B.Tech, Mechanical & Automation Engineering
GGSIPU (Maharaja Agrasen Institute of Technology), Delhi
2017 – 2021

AI Product Management - HelloPM Cohort 50
Mar 2026 – Present
Applied AI for PMs · LLM product design · AI-first roadmapping`;

async function runInternshipAudit() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║      ACTUAL INTERNSHIP JD (FLUTTER/SUPABASE) AUDIT RUN          ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  console.log("▶ Step 1: Parsing Authentic Candidate Resume...");
  const resume = await parseResume(AUTHENTIC_RACHIT_RESUME_TEXT);
  console.log(`  ✓ Candidate: ${resume.contact.name} (${resume.contact.location})`);
  console.log(`  ✓ Indexed Evidence Units: ${resume.evidence_units?.length || 0}`);

  console.log("\n▶ Step 2: Extracting Requirements from Internship JD...");
  const jd = await extractJDRequirements(INTERNSHIP_JD_TEXT);
  console.log(`  ✓ Target Role: ${jd.role_title} (${jd.seniority_signal})`);
  console.log(`  ✓ Extracted Dynamic Atomic Requirements: ${jd.requirements.length}`);
  jd.requirements.forEach((r) => {
    console.log(`      • [${(r.criticality || "hard").toUpperCase()}] ${r.name} (${r.category}) — ${r.description.substring(0, 70)}...`);
  });

  console.log("\n▶ Step 3: Running Semantic & Tech Guard Evaluation...");
  const analysis = await evaluateRequirementsAgainstEvidence(jd, resume);

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("  INTERNSHIP AUDIT EVALUATION REPORT");
  console.log("═════════════════════════════════════════════════════════════════");
  console.log(`• Overall Match Score: ${analysis.match_score}%`);
  console.log(`• Hard Requirement Match: ${analysis.hard_requirement_match_score}%`);
  console.log(`• Preferred Requirement Match: ${analysis.preferred_requirement_match_score}%`);
  console.log(`• Confidence Score: ${analysis.confidence_score}% (${analysis.confidence_level.toUpperCase()})`);

  console.log("\n─── EVALUATION BREAKDOWN PER ATOMIC REQUIREMENT ───");
  for (const ev of analysis.evaluations) {
    const icon = ev.status === "strong_match" ? "✓ [STRONG]" : ev.status === "partial_match" ? "🟡 [PARTIAL]" : "🔴 [MISSING/WEAK]";
    console.log(`  ${icon} ${ev.requirement_name} (${ev.criticality}) — Score: ${ev.score}`);
    console.log(`      Reason: ${ev.reasoning}`);
  }

  console.log("\n─── CRITICAL GAPS (HARD REQUIREMENTS) ───");
  if (analysis.critical_gaps.length === 0) {
    console.log("  None");
  } else {
    analysis.critical_gaps.forEach((g) => {
      console.log(`  🔴 ${g.requirement_name} (${g.importance}) — ${g.reasoning}`);
    });
  }

  console.log("\n─── WHY NOT 100% (DETERMINISTIC BREAKDOWN) ───");
  analysis.why_not_100.forEach((reason, i) => {
    console.log(`  ${i + 1}. ${reason}`);
  });

  console.log("\n═════════════════════════════════════════════════════════════════\n");
}

runInternshipAudit().catch((err) => {
  console.error("Internship audit failed:", err);
  process.exit(1);
});
