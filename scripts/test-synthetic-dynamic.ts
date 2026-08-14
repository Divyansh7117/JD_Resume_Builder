import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";
import { extractJDRequirements } from "../lib/extractJD";
import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";

async function runSyntheticAndMutationSuite() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║     COMPLETELY NEW SYNTHETIC & DYNAMIC MUTATION TEST SUITE      ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");

  let passedTests = 0;
  let totalTests = 0;

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1 — SYNTHETIC POSITIVE TEST (Junior Backend Engineer)
  // ───────────────────────────────────────────────────────────────────────────
  totalTests++;
  console.log("▶ 1. Synthetic Positive Test (Python / FastAPI / PostgreSQL / Docker / REST APIs)...");

  const syntheticBackendJD = `Job Title: Junior Backend Engineer
Location: Remote
Requirements:
• Strong programming experience in Python.
• Web framework experience with FastAPI.
• Relational database schema design and querying with PostgreSQL.
• Containerization and service orchestration with Docker.
• Building, documenting, and consuming scalable REST APIs.
Preferred:
• Cloud experience with AWS.
• Caching with Redis.`;

  const syntheticBackendResume = `ALEX RIVERA
alex.rivera@example.com • San Francisco, CA

SUMMARY
Backend Software Developer with 2 years of experience building Python microservices, relational databases, and containerized cloud applications.

EXPERIENCE
Backend Engineer — CloudStream Inc
2023 – Present
• Designed and developed high-throughput backend APIs using Python and FastAPI.
• Architected PostgreSQL schemas, indexed complex foreign-key tables, and optimized SQL queries reducing latency by 45%.
• Containerized microservices using Docker and Docker Compose for seamless local and production environments.
• Built and consumed REST APIs adhering to OpenAPI standards for client-facing dashboards.
• Implemented distributed in-memory caching using Redis, decreasing database load by 60%.

SKILLS
Languages & Frameworks: Python, FastAPI, SQL
Databases & Tools: PostgreSQL, Redis, Docker, REST APIs, Git`;

  const parsedJD1 = await extractJDRequirements(syntheticBackendJD);
  const parsedResume1 = await parseResume(syntheticBackendResume);
  const result1 = await evaluateRequirementsAgainstEvidence(parsedJD1, parsedResume1);

  console.log(`  ✓ Evaluated Requirements Count: ${result1.evaluations.length}`);
  console.log(`  ✓ Overall Match Score: ${result1.match_score}%`);
  console.log(`  ✓ Hard Requirement Score: ${result1.hard_requirement_match_score}%`);
  console.log(`  ✓ Preferred Requirement Score: ${result1.preferred_requirement_match_score}%`);

  const pythonMatched = result1.evaluations.find((e) => e.requirement_name.toLowerCase().includes("python"))?.status === "strong_match";
  const fastApiMatched = result1.evaluations.find((e) => e.requirement_name.toLowerCase().includes("fastapi"))?.status === "strong_match";
  const postgresMatched = result1.evaluations.find((e) => e.requirement_name.toLowerCase().includes("postgres"))?.status === "strong_match";
  const dockerMatched = result1.evaluations.find((e) => e.requirement_name.toLowerCase().includes("docker"))?.status === "strong_match";
  const restMatched = result1.evaluations.find((e) => e.requirement_name.toLowerCase().includes("rest"))?.status === "strong_match";

  if (result1.match_score >= 80 && pythonMatched && fastApiMatched && postgresMatched && dockerMatched && restMatched) {
    console.log(`  ✅ [PASS] Synthetic Positive Test passed with dynamic score ${result1.match_score}%.`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Synthetic Positive Test failed: Score = ${result1.match_score}%`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2 — SYNTHETIC NEGATIVE TEST (Mobile iOS Engineer vs Web/Mongo Resume)
  // ───────────────────────────────────────────────────────────────────────────
  totalTests++;
  console.log("\n▶ 2. Synthetic Negative Test (iOS / Swift / SwiftUI vs React / Node / Mongo)...");

  const syntheticIosJD = `Job Title: iOS Mobile Engineer
Location: Remote
Required:
• Native iOS app development using Swift.
• Declarative UI development with SwiftUI.
• Local persistence with Core Data.
• App Store deployment and iOS lifecycle.
Preferred:
• Experience with Firebase.`;

  const syntheticFrontendResume = `JORDAN LEE
jordan.lee@example.com • Seattle, WA

SUMMARY
Frontend web developer with 3 years building web applications.

EXPERIENCE
Web Developer — Webify Systems
2022 – Present
• Built web user interfaces using React, Next.js, and TypeScript.
• Developed server-side rendering routes with Node.js and Express.
• Maintained MongoDB document databases for customer profiles.

SKILLS
Frontend: React, Next.js, TypeScript, HTML, CSS
Backend: Node.js, Express, MongoDB`;

  const parsedJD2 = await extractJDRequirements(syntheticIosJD);
  const parsedResume2 = await parseResume(syntheticFrontendResume);
  const result2 = await evaluateRequirementsAgainstEvidence(parsedJD2, parsedResume2);

  console.log(`  ✓ Overall Match Score: ${result2.match_score}%`);
  console.log(`  ✓ Hard Requirement Score: ${result2.hard_requirement_match_score}%`);
  console.log(`  ✓ Critical Gaps Count: ${result2.critical_gaps.length}`);

  if (result2.match_score <= 25 && result2.hard_requirement_match_score <= 20) {
    console.log(`  ✅ [PASS] Synthetic Negative Test passed with uninflated score ${result2.match_score}%.`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Synthetic Negative Test failed: Score = ${result2.match_score}%`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3 & 4 — RESUME MUTATION & SKILL REMOVAL TEST
  // ───────────────────────────────────────────────────────────────────────────
  totalTests++;
  console.log("\n▶ 3. Resume Mutation Test (Removing Docker, then removing Python)...");

  // Mutation 1: Remove Docker
  const resumeMinusDocker = syntheticBackendResume
    .replace("• Containerized microservices using Docker and Docker Compose for seamless local and production environments.\n", "")
    .replace("Docker, ", "");

  const parsedResumeMinusDocker = await parseResume(resumeMinusDocker);
  const resultMinusDocker = await evaluateRequirementsAgainstEvidence(parsedJD1, parsedResumeMinusDocker);

  // Mutation 2: Remove Python & FastAPI as well
  const resumeMinusPython = resumeMinusDocker
    .replace("• Designed and developed high-throughput backend APIs using Python and FastAPI.\n", "")
    .replace("Python, FastAPI, ", "");

  const parsedResumeMinusPython = await parseResume(resumeMinusPython);
  const resultMinusPython = await evaluateRequirementsAgainstEvidence(parsedJD1, parsedResumeMinusPython);

  console.log(`  • Full Backend Resume Score         : ${result1.match_score}%`);
  console.log(`  • Mutated Resume (Minus Docker)     : ${resultMinusDocker.match_score}%`);
  console.log(`  • Mutated Resume (Minus Python & API): ${resultMinusPython.match_score}%`);

  if (result1.match_score > resultMinusDocker.match_score && resultMinusDocker.match_score > resultMinusPython.match_score) {
    console.log(`  ✅ [PASS] Resume Mutation Test passed! Monotonic decrease verified: ${result1.match_score}% > ${resultMinusDocker.match_score}% > ${resultMinusPython.match_score}%.`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Resume Mutation Test failed: Expected monotonic decrease but got ${result1.match_score}%, ${resultMinusDocker.match_score}%, ${resultMinusPython.match_score}%`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5 — JD MUTATION TEST (Same Resume, Changing JD to Java + Spring + MySQL)
  // ───────────────────────────────────────────────────────────────────────────
  totalTests++;
  console.log("\n▶ 4. JD Mutation Test (Switching JD from Python to Java / Spring Boot / MySQL)...");

  const syntheticJavaJD = `Job Title: Enterprise Java Backend Engineer
Location: Remote
Required:
• Enterprise Java application development with Java 17+.
• Spring Boot framework and Spring Data JPA.
• Relational database engineering with MySQL.
• Enterprise messaging with Apache Kafka.`;

  const parsedJavaJD = await extractJDRequirements(syntheticJavaJD);
  const resultJavaMatch = await evaluateRequirementsAgainstEvidence(parsedJavaJD, parsedResume1);

  console.log(`  • Score against Python/FastAPI JD: ${result1.match_score}%`);
  console.log(`  • Score against Java/Spring JD   : ${resultJavaMatch.match_score}%`);

  if (result1.match_score >= 80 && resultJavaMatch.match_score <= 35) {
    console.log(`  ✅ [PASS] JD Mutation Test passed! Score dynamically dropped from ${result1.match_score}% to ${resultJavaMatch.match_score}%.`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] JD Mutation Test failed: Score = ${resultJavaMatch.match_score}%`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6 — SCORE ORDERING TEST (Resume A > Resume B > Resume C)
  // ───────────────────────────────────────────────────────────────────────────
  totalTests++;
  console.log("\n▶ 5. Score Ordering Test (Resume A [All skills] > Resume B [Python only] > Resume C [Java/Mongo])...");

  // Resume B: Python only (no FastAPI, no Postgres, no Docker, no REST)
  const resumeBText = `SAM DEV
sam@example.com
EXPERIENCE
Python Developer — DataCorp
2023 – Present
• Wrote Python scripts for data extraction and basic automation.
SKILLS
Python`;

  // Resume C: Java / Spring / Mongo (zero overlap)
  const resumeCText = `MAX JAVA
max@example.com
EXPERIENCE
Java Developer — Corp
2023 – Present
• Built Java applications with Spring Boot and MongoDB.
SKILLS
Java, Spring Boot, MongoDB`;

  const parsedResumeB = await parseResume(resumeBText);
  const parsedResumeC = await parseResume(resumeCText);

  const resB = await evaluateRequirementsAgainstEvidence(parsedJD1, parsedResumeB);
  const resC = await evaluateRequirementsAgainstEvidence(parsedJD1, parsedResumeC);

  console.log(`  • Resume A (Full Match) Score   : ${result1.match_score}%`);
  console.log(`  • Resume B (Python only) Score  : ${resB.match_score}%`);
  console.log(`  • Resume C (Irrelevant) Score   : ${resC.match_score}%`);

  if (result1.match_score > resB.match_score && resB.match_score > resC.match_score) {
    console.log(`  ✅ [PASS] Score Ordering Test passed! Verified: Resume A (${result1.match_score}%) > Resume B (${resB.match_score}%) > Resume C (${resC.match_score}%).`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Score Ordering Test failed: Scores were A=${result1.match_score}%, B=${resB.match_score}%, C=${resC.match_score}%`);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`  SYNTHETIC & MUTATION SUITE RESULTS: ${passedTests}/${totalTests} PASSED`);
  console.log("═════════════════════════════════════════════════════════════════\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSyntheticAndMutationSuite().catch((err) => {
  console.error("Synthetic suite encountered an error:", err);
  process.exit(1);
});
