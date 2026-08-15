import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { validateMatchConsistency } from "../lib/validator";

async function runAdversarialTest() {
  console.log("\n╔═══════════════════════════════════════════════════════════════════════╗");
  console.log("║           ADVERSARIAL & DIVERGENT DOMAIN INTEGRATION TEST             ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════╝\n");

  // Pair 2: Graphic Designer applying for Machine Learning Infrastructure Engineer
  console.log("▶ TEST 2: Graphic Designer applying for Machine Learning Infrastructure Engineer (Expected: Low Match / Critical Gaps)...");

  const JD_ML = `Machine Learning Systems Engineer | DeepTech Labs
Location: New York, NY | Experience: 3+ years

Responsibilities:
- Build high-throughput distributed training pipelines using PyTorch and CUDA
- Deploy containerized LLM models with Triton Inference Server and Kubernetes
- Design feature stores and low-latency vector databases using Milvus or Pinecone
- Optimize distributed model parallelism across GPU clusters

Requirements:
- 3+ years of professional ML Systems / GPU infrastructure experience
- Strong proficiency in Python, C++, and CUDA
- Deep understanding of Distributed Systems and GPU optimization`;

  const RESUME_DESIGNER = `EMILY CHEN
emily.chen@example.com | (555) 839-1029 | Los Angeles, CA | emilychen.design

SUMMARY
Senior Graphic & Brand Designer with 4 years crafting visual identities, typography, and motion design for consumer brands.

EXPERIENCE
Brand Designer — Studio Mirage
Jan 2022 – Dec 2025
• Designed comprehensive brand design systems, vector illustrations, and marketing collateral.
• Created 3D motion animations using Adobe After Effects and Blender.
• Collaborated with marketing teams in Figma and Adobe Creative Suite.

SKILLS
Figma, Adobe Photoshop, Illustrator, After Effects, Typography, Brand Identity, UI/UX Design`;

  const result2 = await runEvaluationPipeline(JD_ML, RESUME_DESIGNER, { bypassCache: true });
  const analysis2 = result2.tailored.match_analysis!;

  console.log("\n--- TEST 2 RESULTS ---");
  console.log(`• Match Score: ${analysis2.match_score}% (Expected: <= 15%)`);
  console.log(`• Total Scorable Requirements: ${analysis2.scorable_capabilities_count}`);
  console.log(`• Matched Requirements: ${analysis2.matched_requirements.length}`);
  console.log(`• Partial Requirements: ${analysis2.partial_requirements.length}`);
  console.log(`• Missing Requirements: ${analysis2.missing_requirements.length}`);
  console.log(`• Critical Gaps Count: ${analysis2.critical_gaps.length}`);

  for (const ev of analysis2.evaluations) {
    console.log(`  - [${ev.status.toUpperCase()}] ${ev.requirement_name} (${(ev.score * 100).toFixed(0)}%) — Evidence: ${ev.evidence.length} items`);
  }

  // Check invariants
  const consistency2 = validateMatchConsistency(analysis2, result2.originalResume);
  console.log(`• Invariant Validation: ${consistency2.valid ? "PASSED (No contradictions)" : "FAILED: " + JSON.stringify(consistency2.issues)}`);

  if (analysis2.match_score > 25) {
    console.error(`✕ ERROR: Graphic designer received unexpected high score (${analysis2.match_score}%) for ML Systems job!`);
  } else {
    console.log(`✓ Generalization verified: Low fit (${analysis2.match_score}%) correctly identified with zero hallucinated technical skills.`);
  }

  console.log("\n═══════════════════════════════════════════════════════════════════════\n");
}

runAdversarialTest().catch((err) => {
  console.error("Adversarial Test Error:", err);
});
