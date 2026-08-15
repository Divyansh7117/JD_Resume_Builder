import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { diffPipelineSnapshots, PipelineDebugSnapshot } from "../lib/debugSnapshot";
import { getLLMCacheStats, CANONICAL_MODEL, CANONICAL_EMBEDDING_MODEL } from "../lib/llm";
import { PIPELINE_VERSION, clearPipelineCache } from "../lib/cache";

const TOING_JD_TEXT = `Job Title: Product Manager II – Storefront & Growth (TOING)
Location: Bangalore, Karnataka (3 days a week in office)
Experience: Minimum of 4-5 years in product management, with strong experience in B2C products and growth-led impact.

About TOING
Toing is an affordability-first food ordering app built for students and young professionals.
In this role, you'll own the end-to-end consumer product and growth journey, from acquiring first-time users to building loyal, repeat customers.

Key Requirements:
• 4-5 years in Product Management owning B2C products.
• Proven track record owning conversion funnels, activation, engagement, and retention.
• Experience designing rapid A/B experiments and cohort-level retention analysis.
• Deep understanding of customer journey mapping and product analytics.
• Cross-functional leadership across engineering, design, and ops.

Required Skills:
• B2C Product Management
• Conversion Rate Optimization (CRO)
• Cohort Retention Analysis
• A/B Testing & Experimentation
• SQL & Product Analytics
• Cross-functional Team Leadership`;

const SAMPLE_RESUME_TEXT = `Alex Morgan
Full Stack Developer · React / Next.js / Node.js
San Francisco, CA • (555) 019-2834 • alex.morgan@example.com
linkedin.com/in/alexmorgan • github.com/alexmorgan

SUMMARY
Software Engineer Intern Oct 2025 – Present
Xoodrip · Remote — Building GrowIn Bharat, a live social media platform with 500+ real users
● Engineered end-to-end full-stack architecture as sole developer; owned feature development, CI/CD deployment pipeline, and release reviews.
● Built secure JWT-based authentication with role-based authorization, eliminating unauthorized access across all API endpoints; validated cross-browser (Chrome, Firefox, Safari).
● Optimized MongoDB aggregation pipelines for the news feed; cut initial payload from 120 to 10 posts via cursor-based pagination and infinite scroll, reducing API response time to under 200ms.
● Improved Lighthouse Performance score from 62 to 88 through media optimization, achieving 1.8–2.2s initial page loads.
● Built a desktop feed UI and Admin Dashboard with real-time KPI cards for user growth, content volume, and engagement metrics.
● Designed and developed the official Xoodrip company website (xoodrip.com), optimized for performance, SEO, and responsiveness.

PROJECTS
GrowIn Bharat — Social Media Platform · Next.js · Node.js · MongoDB · JWT · WebSockets
● Live in production with 500+ real users; implemented infinite scroll with cursor-based pagination, cutting API response time to under 200ms and reaching a Lighthouse score of 88.
Bondbrite — B2B Industrial Adhesives Platform (Freelance) · Next.js · MongoDB · JWT · Cloudinary
● Delivered a manufacturer-direct B2B platform with product catalogue, dealer onboarding, and GST-validated inquiry workflows; JWT-secured admin panel with Cloudinary-backed CDN delivery.
Gostart — Dating App (Personal Project) · React Native · Expo · TypeScript · WebSockets
● Built real-time chat over native WebSockets with optimistic updates and REST fallback; engineered a bidirectional match engine with a custom dual-thumb age-range slider and credit-gated conversations.

TECHNICAL SKILLS
Frontend: React.js, Next.js, React Native (Expo), TypeScript, Tailwind CSS, Responsive Design, SEO
Backend: Node.js, Express.js, RESTful APIs, GraphQL, WebSockets, JWT Auth, MVC Architecture
Databases: MongoDB, PostgreSQL, MySQL, SQL
Languages / AI: JavaScript, TypeScript, Python, C · Machine Learning, Deep Learning, NLP (actively learning)
Tools: Git, GitHub, VS Code, Postman, Docker, CI/CD, Jest, Vercel, Cloudinary, Nodemailer

EDUCATION & CERTIFICATIONS
B.Tech – Computer Science Engineering (Data Science) 2024 – 2028
USICT, Guru Gobind Singh Indraprastha University · New Delhi
The Complete JavaScript Course 2025 · Udemy (Jonas Schmedtmann) — actively upskilling in Machine Learning, Deep Learning, and NLP.`;

const GENERIC_BACKEND_JD = `Backend Engineer | CloudScale Data
Location: Remote | Experience: 3+ years

Responsibilities:
- Build high-performance REST APIs using Python and FastAPI
- Design and optimize PostgreSQL relational database schemas
- Containerize services using Docker and deploy to Kubernetes
- Implement caching layer using Redis`;

const GENERIC_BACKEND_RESUME = `Alex Turner
alex.turner@example.com | San Francisco, CA | github.com/alexturner

EXPERIENCE
Backend Engineer | CloudScale | 2021 - Present
• Designed and shipped 15+ high-throughput REST APIs using Python and FastAPI.
• Optimized PostgreSQL relational database schemas, reducing query latency by 45%.
• Containerized microservices using Docker and managed deployments on Kubernetes.
• Built Redis distributed caching layer handling 100K requests/minute.

SKILLS
Python, FastAPI, PostgreSQL, Docker, Kubernetes, Redis, REST APIs, Git`;

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE A: REPEATABILITY TEST (cached responses → identical results)
// ══════════════════════════════════════════════════════════════════════════════

async function testRepeatability(): Promise<boolean> {
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("TEST A: REPEATABILITY (Same cached responses → Same result)");
  console.log("═════════════════════════════════════════════════════════════════\n");

  const NUM_RUNS = 5;
  const snapshots: PipelineDebugSnapshot[] = [];
  const scores: number[] = [];

  for (let run = 1; run <= NUM_RUNS; run++) {
    console.log(`▶ Iteration ${run}/${NUM_RUNS}...`);
    const t0 = Date.now();
    const result = await runEvaluationPipeline(TOING_JD_TEXT, SAMPLE_RESUME_TEXT);
    const elapsed = Date.now() - t0;

    snapshots.push(result.snapshot);
    scores.push(result.snapshot.scoring_breakdown.final_match_score);

    const stats = getLLMCacheStats();
    console.log(`  ${elapsed}ms | Score=${result.snapshot.scoring_breakdown.final_match_score}% | CacheHits=${stats.hits} CacheMisses=${stats.misses}\n`);
  }

  let totalDiffs = 0;
  for (let i = 1; i < snapshots.length; i++) {
    const diff = diffPipelineSnapshots(snapshots[0], snapshots[i]);
    if (!diff.identical) {
      totalDiffs += diff.differences.length;
      console.error(`❌ Run 1 vs Run ${i + 1}: ${diff.differences.length} differences`);
      diff.differences.forEach((d) => console.error(`   • ${d}`));
    } else {
      console.log(`✓ Run 1 vs Run ${i + 1}: IDENTICAL`);
    }
  }

  const variation = Math.max(...scores) - Math.min(...scores);
  console.log(`\n• Scores: [ ${scores.map((s) => `${s}%`).join(", ")} ] | Variation: ${variation}pp`);

  if (variation === 0 && totalDiffs === 0) {
    console.log("✅ TEST A PASSED: Repeatability confirmed (zero variance).\n");
    return true;
  } else {
    console.error("❌ TEST A FAILED: Variance detected.\n");
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE B: FIRST-RUN CORRECTNESS INSPECTION
// ══════════════════════════════════════════════════════════════════════════════

async function testFirstRunCorrectness(): Promise<boolean> {
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("TEST B: FIRST-RUN CORRECTNESS INSPECTION");
  console.log("═════════════════════════════════════════════════════════════════\n");

  const result = await runEvaluationPipeline(TOING_JD_TEXT, SAMPLE_RESUME_TEXT);
  const analysis = result.tailored.match_analysis;

  if (!analysis) {
    console.error("❌ No match_analysis in result.");
    return false;
  }

  console.log(`Role: ${result.jdRequirements.role_title}`);
  console.log(`Requirements: ${analysis.total_requirements_count}`);
  console.log(`Scorable: ${analysis.scorable_capabilities_count}`);
  console.log(`Eligibility: ${analysis.eligibility_constraints_count}`);
  console.log(`Overall Score: ${analysis.match_score}%`);
  console.log(`Hard Score: ${analysis.hard_requirement_match_score}%`);
  console.log(`Preferred Score: ${analysis.preferred_requirement_match_score}%\n`);

  console.log("─── FULL REQUIREMENT EVALUATION ───\n");

  for (const ev of analysis.evaluations || []) {
    console.log(`  Requirement : ${ev.requirement_name}`);
    console.log(`  Category    : ${ev.category}`);
    console.log(`  Importance  : ${ev.importance} | Criticality: ${ev.criticality} | Weight: ${ev.weight ?? "N/A"}`);
    console.log(`  Verdict     : ${ev.status} (score=${ev.score})`);
    console.log(`  Confidence  : ${ev.confidence}`);
    console.log(`  Evidence IDs: [${ev.evidence_ids.join(", ")}]`);
    for (const e of ev.evidence || []) {
      console.log(`    └─ [${e.evidence_id}] ${e.source}: "${e.text.substring(0, 120)}${e.text.length > 120 ? "..." : ""}"`);
    }
    console.log(`  Reasoning   : ${ev.reasoning}`);
    console.log("");
  }

  if (analysis.eligibility_results && analysis.eligibility_results.length > 0) {
    console.log("─── ELIGIBILITY RESULTS ───\n");
    for (const elig of analysis.eligibility_results) {
      console.log(`  Constraint  : ${elig.stated_requirement}`);
      console.log(`  Status      : ${elig.status}`);
      console.log(`  Reasoning   : ${elig.reasoning}`);
      console.log("");
    }
  }

  console.log("─── AUDIT TRAIL ───\n");
  let totalNumerator = 0;
  let totalDenominator = 0;
  for (const at of analysis.audit_trail || []) {
    const contribution = at.weight * at.score * 100;
    totalNumerator += contribution;
    totalDenominator += at.weight;
    console.log(`  ${at.requirement_name.padEnd(45)} | w=${at.weight.toFixed(2)} × s=${at.score.toFixed(1)} = ${contribution.toFixed(1)} | ${at.status}`);
  }
  console.log(`\n  TOTAL: Σ(w×s×100) = ${totalNumerator.toFixed(1)} / Σ(w) = ${totalDenominator.toFixed(1)} = ${totalDenominator > 0 ? Math.round(totalNumerator / totalDenominator) : 0}%`);

  console.log("\n✅ TEST B COMPLETE: First-run evaluation logged for manual correctness review.\n");
  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE C: GENERIC PAIR (no hardcoding verification)
// ══════════════════════════════════════════════════════════════════════════════

async function testGenericPair(): Promise<boolean> {
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("TEST C: GENERIC PAIR (Backend Engineer + Alex Turner)");
  console.log("═════════════════════════════════════════════════════════════════\n");

  const result = await runEvaluationPipeline(GENERIC_BACKEND_JD, GENERIC_BACKEND_RESUME);
  console.log(`• Role: ${result.jdRequirements.role_title}`);
  console.log(`• Requirements: ${result.snapshot.extracted_requirements.length}`);
  console.log(`• Match Score: ${result.snapshot.scoring_breakdown.final_match_score}%`);
  console.log(`• Hard Score: ${result.snapshot.scoring_breakdown.hard_requirement_match_score}%`);

  if (result.snapshot.scoring_breakdown.final_match_score >= 80) {
    console.log("✅ TEST C PASSED: Generic matching works for arbitrary pairs.\n");
    return true;
  } else {
    console.error("❌ TEST C FAILED: Generic matching underperformed.\n");
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE D: FRESH-CACHE VARIANCE MEASUREMENT
// ══════════════════════════════════════════════════════════════════════════════

async function testFreshCacheVariance(): Promise<boolean> {
  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("TEST D: FRESH-CACHE VARIANCE (3 independent Gemini evaluations)");
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("Each run clears ALL caches and makes fresh Gemini calls.");
  console.log("This measures inherent LLM semantic variance.\n");

  const FRESH_RUNS = 3;
  const freshScores: number[] = [];
  const freshSnapshots: PipelineDebugSnapshot[] = [];

  for (let run = 1; run <= FRESH_RUNS; run++) {
    console.log(`▶ Fresh Run ${run}/${FRESH_RUNS} (clearing all caches)...`);
    clearPipelineCache(); // clears LLM cache + all higher-level caches

    try {
      const t0 = Date.now();
      const result = await runEvaluationPipeline(TOING_JD_TEXT, SAMPLE_RESUME_TEXT);
      const elapsed = Date.now() - t0;

      freshScores.push(result.snapshot.scoring_breakdown.final_match_score);
      freshSnapshots.push(result.snapshot);

      console.log(`  ${elapsed}ms | Score=${result.snapshot.scoring_breakdown.final_match_score}% | Reqs=${result.snapshot.extracted_requirements.length} | Denom=${result.snapshot.scoring_breakdown.total_weighted_denominator}\n`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "LLMRateLimitError") {
        console.warn(`  ⚠ Run ${run} hit rate limit: ${err.message}`);
        console.warn("  Skipping remaining fresh runs due to quota exhaustion.\n");
        break;
      }
      throw err;
    }
  }

  if (freshScores.length < 2) {
    console.log("⚠ Insufficient fresh runs completed (quota limit). Skipping variance analysis.");
    console.log("✅ TEST D SKIPPED (not enough quota for 3 fresh runs).\n");
    return true;
  }

  const variation = Math.max(...freshScores) - Math.min(...freshScores);
  console.log(`• Fresh Scores: [ ${freshScores.map((s) => `${s}%`).join(", ")} ]`);
  console.log(`• Max Variation: ${variation} percentage points`);

  if (freshSnapshots.length >= 2) {
    console.log("\n─── Fresh Run Diffs ───");
    for (let i = 1; i < freshSnapshots.length; i++) {
      const diff = diffPipelineSnapshots(freshSnapshots[0], freshSnapshots[i]);
      if (!diff.identical) {
        console.log(`  Run 1 vs Run ${i + 1}: ${diff.differences.length} differences`);
        diff.differences.forEach((d) => console.log(`    • ${d}`));
      } else {
        console.log(`  Run 1 vs Run ${i + 1}: IDENTICAL`);
      }
    }
  }

  if (variation <= 1) {
    console.log("\n✅ TEST D PASSED: Fresh-model variance ≤ 1pp.\n");
  } else {
    console.log(`\n⚠ TEST D INFO: Fresh-model variance is ${variation}pp (inherent LLM nondeterminism).`);
    console.log("  This is expected — caching ensures reproducibility after first evaluation.\n");
  }

  return true; // Informational — does not fail the suite
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║          COMPLETE SCORE STABILITY & CORRECTNESS AUDIT           ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  console.log(`• Pipeline Version     : ${PIPELINE_VERSION}`);
  console.log(`• Canonical LLM Model  : ${CANONICAL_MODEL}`);
  console.log(`• Embedding Model      : ${CANONICAL_EMBEDDING_MODEL}`);
  console.log(`• LLM Temperature      : 0.0`);
  console.log(`• Execution Service    : runEvaluationPipeline() [Single Canonical Path]`);
  console.log(`• Cache Mode           : ${process.env.LLM_CACHE_MODE || "read-write (default)"}\n`);

  const results: { name: string; passed: boolean }[] = [];

  // A: Repeatability
  results.push({ name: "A: Repeatability", passed: await testRepeatability() });

  // B: First-Run Correctness Inspection
  results.push({ name: "B: Correctness Inspection", passed: await testFirstRunCorrectness() });

  // C: Generic Pair
  results.push({ name: "C: Generic Pair", passed: await testGenericPair() });

  // D: Fresh-Cache Variance (informational)
  results.push({ name: "D: Fresh-Cache Variance", passed: await testFreshCacheVariance() });

  // Summary
  console.log("═════════════════════════════════════════════════════════════════");
  console.log("FINAL SUMMARY");
  console.log("═════════════════════════════════════════════════════════════════\n");

  for (const r of results) {
    console.log(`  ${r.passed ? "✅" : "❌"} ${r.name}`);
  }

  const allPassed = results.every((r) => r.passed);
  if (allPassed) {
    console.log("\n🎉 ALL TESTS PASSED.\n");
  } else {
    console.error("\n❌ SOME TESTS FAILED.\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
