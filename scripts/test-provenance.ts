import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { detectFabricatedClaims, validateNoFabrication } from "../lib/validator";
import { ResumeData, TailoredOutput } from "../types";

async function runProvenanceTests() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║           IMMUTABLE PROVENANCE & ANTI-FABRICATION SUITE         ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  const sourceEvidence = `Built and scaled PW Store (₹200Cr+ revenue, 3,000+ SKUs, 50K DAU).
Owned integration of PW Store’s Order Management System (OMS) end-to-end.
Senior Business Analyst from Jun 2021 – Mar 2022.`;

  const dummyResume: ResumeData = {
    contact: { name: "Rachit Agarwal", email: "test@example.com", phone: "123", location: "New Delhi", links: [] },
    summary: "Product leader with 5+ years of B2C consumer product experience.",
    sections: {
      experience: [
        {
          company: "PhysicsWallah",
          title: "Product Owner",
          dates: "Mar 2022 – Jun 2024",
          bullets: [
            "Built and scaled PW Store (₹200Cr+ revenue, 3,000+ SKUs, 50K DAU).",
            "Owned integration of PW Store’s Order Management System (OMS) end-to-end.",
          ],
        },
      ],
      projects: [],
      skills: ["Product Management", "A/B Testing", "SQL"],
      education: [],
      certifications: [],
    },
  };

  let passed = 0;
  let total = 0;

  // Test 1: Fabricated Revenue Rejection
  total++;
  console.log("▶ Test 1: Fabricated Currency/Revenue Rejection (₹1200Cr+ vs ₹200Cr+)...");
  const test1 = detectFabricatedClaims(sourceEvidence, "Scaled storefront driving ₹1200Cr+ revenue.");
  if (!test1.valid && test1.violations.some((v) => v.includes("1200cr"))) {
    console.log("  ✅ [PASS] Successfully detected and rejected fabricated revenue figure (₹1200Cr+).");
    passed++;
  } else {
    console.error("  ❌ [FAIL] Allowed fabricated revenue figure:", test1);
  }

  // Test 2: Fabricated Date Rejection
  total++;
  console.log("▶ Test 2: Fabricated Year/Date Rejection (2019 vs 2021)...");
  const test2 = detectFabricatedClaims(sourceEvidence, "Product Specialist starting in 2019.");
  if (!test2.valid && test2.violations.some((v) => v.includes("2019"))) {
    console.log("  ✅ [PASS] Successfully detected and rejected unsupported date (2019).");
    passed++;
  } else {
    console.error("  ❌ [FAIL] Allowed fabricated date:", test2);
  }

  // Test 3: Fabricated Percentage Rejection
  total++;
  console.log("▶ Test 3: Fabricated Percentage Rejection (84% vs source)...");
  const test3 = detectFabricatedClaims(sourceEvidence, "Improved course completion rate to 84%.");
  if (!test3.valid && test3.violations.some((v) => v.includes("84%"))) {
    console.log("  ✅ [PASS] Successfully detected and rejected unsupported percentage (84%).");
    passed++;
  } else {
    console.error("  ❌ [FAIL] Allowed fabricated percentage:", test3);
  }

  // Test 4: End-to-end validateNoFabrication on TailoredOutput
  total++;
  console.log("▶ Test 4: End-to-end validateNoFabrication rejection on hallucinated bullet...");
  const badTailoredOutput: TailoredOutput = {
    match_score: 90,
    matched_skills: ["Product Management"],
    missing_skills: [],
    rewritten_summary: "Product leader driving ₹1200Cr+ offline revenue.", // Hallucinated ₹1200Cr
    rewritten_experience: [
      {
        company: "PhysicsWallah",
        title: "Product Owner",
        dates: "Mar 2022 – Jun 2024",
        bullets: [
          "Built PW Store scaling to ₹200Cr+ revenue.",
          "Deployed real-time seat allocation systems across 25+ cities.", // Hallucinated 25+
        ],
      },
    ],
    rewritten_skills: ["Product Management"],
    used_fallback: false,
  };

  const validation = validateNoFabrication(dummyResume, badTailoredOutput);
  if (!validation.valid && validation.issues.length >= 2) {
    console.log(`  ✅ [PASS] Successfully caught ${validation.issues.length} fabrication violations:`);
    validation.issues.forEach((issue) => console.log(`      • ${issue}`));
    passed++;
  } else {
    console.error("  ❌ [FAIL] Failed to catch fabricated bullet:", validation);
  }

  // Test 5: Legitimate bullet passes validation
  total++;
  console.log("▶ Test 5: Legitimate tailored bullet passes validation...");
  const goodTailoredOutput: TailoredOutput = {
    match_score: 90,
    matched_skills: ["Product Management"],
    missing_skills: [],
    rewritten_summary: "Product leader with 5+ years of B2C consumer product experience.",
    rewritten_experience: [
      {
        company: "PhysicsWallah",
        title: "Product Owner",
        dates: "Mar 2022 – Jun 2024",
        bullets: [
          "Scaled PW Store from 0→1 to ₹200Cr+ annual revenue with 3,000+ SKUs.",
          "Orchestrated cross-functional integration of PW Store’s Order Management System (OMS) end-to-end.",
        ],
      },
    ],
    rewritten_skills: ["Product Management"],
    used_fallback: false,
  };

  const goodValidation = validateNoFabrication(dummyResume, goodTailoredOutput);
  if (goodValidation.valid && goodValidation.issues.length === 0) {
    console.log("  ✅ [PASS] Legitimate bullet correctly passed factual validation.");
    passed++;
  } else {
    console.error("  ❌ [FAIL] Incorrectly flagged legitimate bullet:", goodValidation.issues);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`  PROVENANCE & ANTI-FABRICATION SUITE RESULTS: ${passed}/${total} PASSED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (passed !== total) {
    process.exit(1);
  }
}

runProvenanceTests().catch((err) => {
  console.error("Provenance test failed:", err);
  process.exit(1);
});
