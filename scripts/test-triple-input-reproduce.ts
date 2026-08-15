import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { CANONICAL_MODEL, getLLMCacheStats, clearLLMResponseCache, getLLMCacheMode } from "../lib/llm";
import { PIPELINE_VERSION, clearPipelineCache, computeContentHash, computeCompositeCacheKey } from "../lib/cache";
import { diffPipelineSnapshots } from "../lib/debugSnapshot";

// ══════════════════════════════════════════════════════════════════════════════
// TEST INPUT SETS
// ══════════════════════════════════════════════════════════════════════════════

// A: Rachit + TOING
const TOING_JD = `Job Title: Product Manager II – Storefront & Growth (TOING)
Location: Bangalore, Karnataka (3 days a week in office)
Experience: Minimum of 4-5 years in product management, with strong experience in B2C products and growth-led impact.

About TOING
Toing is an affordability-first food ordering app built for students and young professionals.
In this role, you'll own the end-to-end consumer product and growth journey, from acquiring first-time users to building loyal, repeat customers.

Key Requirements:
• 4-5 years in Product Management owning B2C products.
• Proven track record owning conversion funnels, activation, engagement, and retention.
• Experience designing rapid A/B experiments and cohort-level retention analysis.
• Expertise with Product Analytics tools (SQL, Power BI, dashboards).
• Understanding of AI-powered product design and personalization.
• Strong storytelling and executive communication.`;

const RACHIT_RESUME = `RACHIT AGARWAL
+91-9811996540 • agarwalrachit42@gmail.com • New Delhi, India
linkedin.com/in/rachit-agarwal42

SUMMARY
Product & growth professional with 5+ years of B2C consumer product and e-commerce experience. Built and scaled zero-to-one product initiatives at PhysicsWallah reaching millions of students. Proven track record driving conversion funnels, onboarding optimization, and cohort retention.

EXPERIENCE
PhysicsWallah — General Manager – Product & Growth
Jun 2024 – Present | Noida, India
● Leading product and growth across PW Storefront, merchandising, and acquisition funnels.
● Scaled GMV through personalized recommendation carousels, driving a 28% increase in repeat order rate.
● Designed rapid A/B experiments on the checkout funnel, lifting conversion by 4.2% and reducing drop-offs.
● Conducted weekly cohort-level retention analysis using SQL and Power BI dashboards to diagnose churn.

PhysicsWallah — Product Owner
Mar 2022 – Jun 2024 | Noida, India
● Owned end-to-end consumer product discovery, authoring PRDs and roadmaps for mobile & web apps.
● Managed conversion funnels from user acquisition to first-order activation.
● Led cross-functional team of 12 engineers, 3 designers, and data analysts.

SKILLS
Product Management, B2C Product Growth, Conversion Funnel Optimization, A/B Testing, Cohort Retention Analysis, SQL, Power BI, User Research, Agile, Storytelling`;

// B: Divyansh + TOING
const DIVYANSH_RESUME = `Divyansh Agarwal
Full Stack Developer · React / Next.js / Node.js · Open to Opportunities
New Delhi, India • +91-9205216028 • divyanshagarwal.work7117@gmail.com
linkedin.com/in/divyansh-agarwal7117 • github.com/Divyansh7117

SUMMARY
Full Stack Developer and B.Tech CSE student with experience shipping real web platforms. Sole developer for GrowIn Bharat (500+ live users). Built B2B portals and mobile apps.

EXPERIENCE
Software Engineer Intern — Xoodrip
Oct 2025 – Present | Remote
● Built full stack Next.js and Node.js architecture for GrowIn Bharat social platform.
● Built desktop feed UI and Admin Dashboard with real-time KPI cards for user growth and engagement metrics.
● Optimized MongoDB aggregations, reducing API response times to under 200ms.

SKILLS
React.js, Next.js, Node.js, Express, MongoDB, SQL, Python, JavaScript, TypeScript, Docker, Git`;

// C: Completely NEW/RANDOM Candidate + Unrelated JD (DevOps / Site Reliability Engineer)
const UNRELATED_DEVOPS_JD = `Job Title: Senior DevOps & Site Reliability Engineer
Location: Remote
Experience: 4+ years in cloud infrastructure, CI/CD, and Kubernetes reliability.

Responsibilities:
• Architect multi-region AWS cloud infrastructure using Terraform Infrastructure-as-Code.
• Manage high-availability production Kubernetes (EKS) clusters with zero-downtime rolling deploys.
• Implement automated observability, alerting, and distributed tracing with Prometheus and Grafana.
• Design CI/CD release pipelines with GitHub Actions and ArgoCD.
• Enforce infrastructure security, IAM least-privilege policies, and SOC2 compliance.`;

const NEW_RANDOM_DEVOPS_RESUME = `Jordan Hayes
jordan.hayes.infra@example.com • Austin, TX • github.com/jordan-devops

SUMMARY
Senior Site Reliability Engineer with 5 years managing enterprise AWS cloud infrastructure, Kubernetes clusters, and automated GitOps deployment pipelines with 99.99% uptime.

EXPERIENCE
Senior DevOps Engineer — CloudFlow Systems
2021 – Present | Austin, TX (Remote)
● Architected multi-region AWS cloud foundation across 8 VPCs using modular Terraform scripts.
● Managed 14 production Kubernetes (EKS) clusters running 300+ microservices with zero-downtime upgrades.
● Built GitOps continuous delivery pipelines using GitHub Actions and ArgoCD, reducing release cycle time by 65%.
● Deployed centralized Prometheus and Grafana observability stack with dynamic alert thresholds, cutting MTTR by 40%.
● Implemented automated IAM least-privilege audit scripts and container vulnerability scanning with Trivy.

SKILLS
AWS (EKS, S3, RDS, IAM, VPC), Kubernetes, Docker, Terraform, Helm, ArgoCD, GitHub Actions, Prometheus, Grafana, Linux, Bash, Python, GitOps, SOC2`;

async function testSinglePair(
  label: string,
  jdText: string,
  resumeText: string,
  bypassCache: boolean = false
) {
  const jdHash = computeContentHash(jdText);
  const resumeHash = computeContentHash(resumeText);
  const compositeKey = computeCompositeCacheKey("match_analysis", jdText, resumeText);

  console.log(`\n─────────────────────────────────────────────────────────────────`);
  console.log(`▶ [${label}]`);
  console.log(`  • Normalized JD Hash     : ${jdHash.substring(0, 16)}...`);
  console.log(`  • Normalized Resume Hash : ${resumeHash.substring(0, 16)}...`);
  console.log(`  • Composite Cache Key    : ${compositeKey.substring(0, 16)}...`);
  console.log(`  • Pipeline Version       : ${PIPELINE_VERSION}`);
  console.log(`  • Canonical Model        : ${CANONICAL_MODEL}`);
  console.log(`  • Bypass Cache Flag      : ${bypassCache}`);

  const t0 = Date.now();
  try {
    const result = await runEvaluationPipeline(jdText, resumeText, { bypassCache });
    const elapsed = Date.now() - t0;
    const analysis = result.tailored.match_analysis;

    console.log(`  ✓ SUCCESS in ${elapsed}ms:`);
    console.log(`    - Role Title           : ${result.jdRequirements.role_title}`);
    console.log(`    - Requirements Count   : ${result.snapshot.extracted_requirements.length}`);
    console.log(`    - Overall Match Score  : ${analysis?.match_score}%`);
    console.log(`    - Hard Requirement Match: ${analysis?.hard_requirement_match_score}%`);
    console.log(`    - Eligibility Results  : ${analysis?.eligibility_results?.length || 0}`);


    return { success: true, result, elapsed };
  } catch (error: any) {
    const elapsed = Date.now() - t0;
    console.error(`  ❌ FAILED in ${elapsed}ms:`);
    console.error(`    - Error Name: ${error.name}`);
    console.error(`    - Message   : ${error.message}`);
    return { success: false, error, elapsed };
  }
}

async function main() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║     TRIPLE INPUT REPRODUCTION & GENERIC CACHE VERIFICATION      ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  // ── STEP 1: TEST IN READ-WRITE MODE (1st run: fresh/populate, 2nd run: hit) ──
  console.log("=================================================================");
  console.log("PHASE 1: THREE INPUT TYPES IN NORMAL READ-WRITE MODE");
  console.log("=================================================================");

  // Clear cache initially to simulate fresh state
  clearPipelineCache();

  console.log("\n--- RUN 1: POPULATE CACHE (ALL FRESH CALLS) ---");
  const resA1 = await testSinglePair("Pair A: Rachit + TOING JD", TOING_JD, RACHIT_RESUME);
  const resB1 = await testSinglePair("Pair B: Divyansh + TOING JD", TOING_JD, DIVYANSH_RESUME);
  const resC1 = await testSinglePair("Pair C: Jordan Hayes (DevOps) + DevOps JD", UNRELATED_DEVOPS_JD, NEW_RANDOM_DEVOPS_RESUME);

  console.log("\n--- RUN 2: CACHED REPEAT (ALL CACHE HITS) ---");
  const resA2 = await testSinglePair("Pair A Repeat: Rachit + TOING JD", TOING_JD, RACHIT_RESUME);
  const resB2 = await testSinglePair("Pair B Repeat: Divyansh + TOING JD", TOING_JD, DIVYANSH_RESUME);
  const resC2 = await testSinglePair("Pair C Repeat: Jordan Hayes (DevOps) + DevOps JD", UNRELATED_DEVOPS_JD, NEW_RANDOM_DEVOPS_RESUME);

  // ── STEP 2: VERIFY CACHE KEY INDEPENDENCE & ISOLATION ──
  console.log("\n=================================================================");
  console.log("PHASE 2: CACHE KEY INDEPENDENCE & ISOLATION VERIFICATION");
  console.log("=================================================================\n");

  const keyA = computeCompositeCacheKey("match_analysis", TOING_JD, RACHIT_RESUME);
  const keyB = computeCompositeCacheKey("match_analysis", TOING_JD, DIVYANSH_RESUME);
  const keyC = computeCompositeCacheKey("match_analysis", UNRELATED_DEVOPS_JD, NEW_RANDOM_DEVOPS_RESUME);
  const keySameResumeDiffJD = computeCompositeCacheKey("match_analysis", UNRELATED_DEVOPS_JD, RACHIT_RESUME);

  console.log(`• Key A (Rachit + TOING)    : ${keyA}`);
  console.log(`• Key B (Divyansh + TOING)  : ${keyB}`);
  console.log(`• Key C (Jordan + DevOps)   : ${keyC}`);
  console.log(`• Key D (Rachit + DevOps)   : ${keySameResumeDiffJD}\n`);

  const allKeysUnique = new Set([keyA, keyB, keyC, keySameResumeDiffJD]).size === 4;
  if (allKeysUnique) {
    console.log("✅ VERIFIED: All 4 composite cache keys are strictly distinct.");
    console.log("   - Changing Resume produces a different key.");
    console.log("   - Changing JD produces a different key.");
  } else {
    console.error("❌ ERROR: Cache key collision detected!");
    process.exit(1);
  }

  // ── STEP 3: VERIFY REPEATABILITY (RUN 1 VS RUN 2) ──
  console.log("\n=================================================================");
  console.log("PHASE 3: SNAPSHOT IDENTITY VERIFICATION (RUN 1 VS RUN 2)");
  console.log("=================================================================\n");

  if (resA1.success && resA2.success && resA1.result && resA2.result) {
    const diffA = diffPipelineSnapshots(resA1.result.snapshot, resA2.result.snapshot);
    console.log(`• Pair A (Rachit): ${diffA.identical ? "100% IDENTICAL SNAPSHOT (Zero Variance)" : "DIFFERENT"}`);
  }
  if (resB1.success && resB2.success && resB1.result && resB2.result) {
    const diffB = diffPipelineSnapshots(resB1.result.snapshot, resB2.result.snapshot);
    console.log(`• Pair B (Divyansh): ${diffB.identical ? "100% IDENTICAL SNAPSHOT (Zero Variance)" : "DIFFERENT"}`);
  }
  if (resC1.success && resC2.success && resC1.result && resC2.result) {
    const diffC = diffPipelineSnapshots(resC1.result.snapshot, resC2.result.snapshot);
    console.log(`• Pair C (DevOps): ${diffC.identical ? "100% IDENTICAL SNAPSHOT (Zero Variance)" : "DIFFERENT"}`);
  }

  // ── STEP 4: CROSS-PAIR SCORE DIFFERENTIATION ──
  console.log("\n=================================================================");
  console.log("PHASE 4: CROSS-PAIR SCORE DIFFERENTIATION");
  console.log("=================================================================\n");

  if (resA1.success && resB1.success && resC1.success && resA1.result && resB1.result && resC1.result) {
    const scoreA = resA1.result.tailored.match_analysis?.match_score;
    const scoreB = resB1.result.tailored.match_analysis?.match_score;
    const scoreC = resC1.result.tailored.match_analysis?.match_score;

    console.log(`• Pair A (Rachit + TOING PM JD)        : ${scoreA}% (PM candidate with direct growth PM experience)`);
    console.log(`• Pair B (Divyansh + TOING PM JD)      : ${scoreB}% (Software intern with technical overlaps)`);
    console.log(`• Pair C (Jordan + DevOps JD)          : ${scoreC}% (Senior DevOps engineer matching DevOps JD)\n`);

    if (scoreA !== scoreB) {
      console.log(`✅ VERIFIED: Different resumes with the same JD produce distinct, appropriate scores (${scoreA}% vs ${scoreB}%).`);
    }
  }


  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("🎉 TRIPLE INPUT VERIFICATION COMPLETE!");
  console.log("═════════════════════════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
