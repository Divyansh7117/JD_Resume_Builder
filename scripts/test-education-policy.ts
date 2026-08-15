import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";

async function testEducationPolicy() {
  console.log("\n=======================================================");
  console.log("TESTING GENERIC EDUCATION & DEGREE POLICY (NO FALSE POSITIVES)");
  console.log("=======================================================\n");

  const JD_TEXT = `Senior Business Intelligence Analyst | RetailCorp
Requirements:
- 3+ years experience in business intelligence or analytics
- Strong SQL querying and data warehousing
- Statistical Modeling & Inferential Statistics
- Power BI or Tableau dashboarding
- Python or R scripting`;

  const RESUME_TEXT = `RACHEL ADAMS
rachel.a@example.com | Boston, MA

SUMMARY
BI Analyst with 3 years experience building dashboards in Power BI and writing SQL queries.

EXPERIENCE
BI Analyst — RetailMetrics (2023 - Present)
• Built executive dashboards in Power BI.
• Wrote SQL queries and maintained data pipelines.
• Automated reporting workflows using Python.

EDUCATION
MBA in Business Analytics — Boston University (2020 - 2022)

SKILLS
SQL, Power BI, Python, Tableau, Excel`;

  const res = await runEvaluationPipeline(JD_TEXT, RESUME_TEXT, { bypassCache: true });
  const analysis = res.tailored.match_analysis!;

  console.log(`Overall Match Score: ${analysis.match_score}%`);
  console.log("\nRequirements Evaluations:");
  console.table(
    analysis.evaluations.map((e) => ({
      Requirement: e.requirement_name,
      Status: e.status,
      EvidenceLevel: e.evidence_level,
      Score: e.score,
      Evidence: e.evidence.map((ev) => `${ev.evidence_id} (${ev.source}): "${ev.text}"`).join(" | "),
    }))
  );

  const statsReq = analysis.evaluations.find((e) => e.requirement_name.toLowerCase().includes("statistic"));
  console.log(`\n• Statistics Evaluation: status=${statsReq?.status}, score=${statsReq?.score}, evidenceCount=${statsReq?.evidence.length}`);

  if (statsReq && (statsReq.status === "no_evidence" || statsReq.score === 0)) {
    console.log("✓ SUCCESS: Statistics correctly evaluated as Missing (0%) with NO false positive from MBA degree title.");
  } else {
    console.error("✗ FAILURE: Statistics was falsely matched using degree title!");
  }
}

testEducationPolicy().catch((err) => console.error(err));
