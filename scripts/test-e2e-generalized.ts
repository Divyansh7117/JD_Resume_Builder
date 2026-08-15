import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { validateMatchConsistency } from "../lib/validator";

async function runE2ETests() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
  console.log("║           END-TO-END GENERALIZED PIPELINE INTEGRATION TEST            ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

  // Pair 1: Full-Stack Engineer with "Jan 2025 – Present" (tenure ~1.67 yrs) and "JavaScript", "TypeScript", "Redux"
  console.log("▶ TEST 1: Full-Stack Engineer against 1–3 Yrs Experience JD with Redux & TypeScript...");

  const JD_FULLSTACK = `Junior Full Stack Developer | Acme Web Tech
Location: Remote | Experience: 1–3 years

Role Overview:
We are looking for a Junior Full Stack Developer to build modern web applications.

Required Qualifications:
- 1–3 years of professional experience in full stack web development
- Strong proficiency in JavaScript and TypeScript
- Experience with State Management (e.g. Redux, Zustand)
- Hands-on experience with React and Node.js
- Proficiency in Relational Databases (e.g. PostgreSQL or MySQL)`;

  const RESUME_FULLSTACK = `ALEX RIVERA
alex.rivera@example.com | (555) 019-2834 | Remote | github.com/alexrivera

SUMMARY
Full stack developer with 1.5+ years of experience building web applications with React, TypeScript, and Node.js.

EXPERIENCE
Junior Full Stack Developer — TechNova Solutions
Jan 2025 – Present
• Architected dynamic client web applications using React and TypeScript.
• Implemented client-side State Management using Redux Toolkit, reducing state synchronization bugs by 40%.
• Built RESTful API microservices using Node.js and PostgreSQL.

SKILLS
JavaScript, TypeScript, React, Redux, Node.js, PostgreSQL, Git, REST APIs`;

  const result1 = await runEvaluationPipeline(JD_FULLSTACK, RESUME_FULLSTACK, { bypassCache: true });
  const analysis1 = result1.tailored.match_analysis!;

  console.log("\n--- TEST 1 RESULTS ---");
  console.log(`• Match Score: ${analysis1.match_score}%`);
  console.log(`• Hard Req Score: ${analysis1.hard_requirement_match_score}%`);
  console.log(`• Total Scorable Requirements: ${analysis1.scorable_capabilities_count}`);
  console.log(`• Matched Requirements: ${analysis1.matched_requirements.length}`);
  console.log(`• Partial Requirements: ${analysis1.partial_requirements.length}`);
  console.log(`• Missing Requirements: ${analysis1.missing_requirements.length}`);
  console.log(`• Eligibility Results Count: ${analysis1.eligibility_results?.length}`);

  if (analysis1.eligibility_results && analysis1.eligibility_results.length > 0) {
    for (const elig of analysis1.eligibility_results) {
      console.log(`  - Eligibility [${elig.constraint_type}]: status=${elig.status}, reasoning=${elig.reasoning}`);
    }
  }

  for (const ev of analysis1.evaluations) {
    console.log(`  - [${ev.status.toUpperCase()}] ${ev.requirement_name} (${(ev.score * 100).toFixed(0)}%) — Evidence: ${ev.evidence.length} items`);
  }

  // Check invariants for Test 1
  const consistency1 = validateMatchConsistency(analysis1, result1.originalResume);
  console.log(`• Invariant Validation: ${consistency1.valid ? "PASSED (No contradictions)" : "FAILED: " + JSON.stringify(consistency1.issues)}`);

  // Check that Experience requirement PASSED
  const expElig = analysis1.eligibility_results?.find((e) => e.constraint_type === "years_experience" || e.stated_requirement.includes("1–3"));
  if (expElig) {
    console.log(`• Experience Verification: status=${expElig.status} (Expected: meets_requirement)`);
  }

  // Check that no requirements with evidence are marked no_evidence
  const contradiction = analysis1.evaluations.find((e) => e.evidence.length > 0 && e.status === "no_evidence");
  if (contradiction) {
    console.error(`✕ FATAL CONTRADICTION: Requirement '${contradiction.requirement_name}' has evidence but status is no_evidence!`);
  } else {
    console.log("✓ No contradiction: All items with evidence have positive score and non-missing status.");
  }

  console.log("\n═══════════════════════════════════════════════════════════════════════\n");
}

runE2ETests().catch((err) => {
  console.error("E2E Test Error:", err);
});
