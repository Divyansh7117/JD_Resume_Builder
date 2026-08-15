import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { generateTailoredContent } from "../lib/generateTailored";
import { JDRequirements, ResumeData } from "../types";

// ═══════════════════════════════════════════════════════════════════════
// Shared JD used across all test cases (reduces LLM calls vs unique JDs)
// ═══════════════════════════════════════════════════════════════════════
const SHARED_JD: JDRequirements = {
  role_title: "Backend Engineer",
  seniority_signal: "2+ years",
  requirements: [
    {
      id: "req_1",
      name: "Node.js",
      description: "Proficiency in server-side development with Node.js",
      category: "technical_skill",
      importance: "required",
    },
    {
      id: "req_2",
      name: "TypeScript",
      description: "Strong typing with TypeScript",
      category: "technical_skill",
      importance: "required",
    },
    {
      id: "req_3",
      name: "PostgreSQL",
      description: "Relational database schema design and querying with PostgreSQL",
      category: "technical_skill",
      importance: "required",
    },
    {
      id: "req_4",
      name: "Docker",
      description: "Containerization with Docker",
      category: "technical_skill",
      importance: "required",
    },
    {
      id: "req_5",
      name: "Redis",
      description: "In-memory caching with Redis",
      category: "technical_skill",
      importance: "preferred",
    },
    {
      id: "req_6",
      name: "GraphQL",
      description: "GraphQL API development",
      category: "technical_skill",
      importance: "preferred",
    },
    {
      id: "req_7",
      name: "Kubernetes",
      description: "Container orchestration with Kubernetes",
      category: "technical_skill",
      importance: "preferred",
    },
  ],
  summary_keywords: ["microservices", "REST API", "CI/CD", "cloud infrastructure"],
  must_have_skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
  nice_to_have_skills: ["Redis", "GraphQL", "Kubernetes"],
  keywords: ["microservices", "REST API", "CI/CD", "cloud infrastructure"],
};

// ═══════════════════════════════════════════════════════════════════════
// Helper: base contact/education/skills shared across test resumes
// ═══════════════════════════════════════════════════════════════════════
function makeBaseResume(overrides: Partial<ResumeData> & { sections: ResumeData["sections"] }): ResumeData {
  return {
    contact: {
      name: "Test Candidate",
      email: "test@example.com",
      phone: "555-0100",
      location: "Remote",
      links: ["github.com/testcandidate"],
    },
    summary: "Experienced backend engineer with production-level Node.js and TypeScript expertise, specializing in REST APIs and microservices architecture.",
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// TEST CASES
// ═══════════════════════════════════════════════════════════════════════

interface TestCase {
  name: string;
  resume: ResumeData;
  jd: JDRequirements;
  validate: (result: Awaited<ReturnType<typeof generateTailoredContent>>, resume: ResumeData) => { passed: boolean; reason: string };
}

const testCases: TestCase[] = [
  // ─── CASE 1: Experience entry with 0 bullets + one normal entry ───
  {
    name: "Case 1: Zero-bullet experience entry alongside normal entry",
    jd: SHARED_JD,
    resume: makeBaseResume({
      sections: {
        experience: [
          {
            company: "ZeroBullet Corp",
            title: "Junior Developer",
            dates: "Jan 2020 - Jun 2020",
            bullets: [],  // ← 0 bullets — must pass through UNTOUCHED
          },
          {
            company: "RealWork Inc",
            title: "Backend Engineer",
            dates: "Jul 2020 - Present",
            bullets: [
              "Built RESTful microservices using Node.js and Express serving 50k daily requests.",
              "Designed PostgreSQL schemas and optimized query performance by 35%.",
              "Implemented CI/CD pipelines with Docker and GitHub Actions.",
            ],
          },
        ],
        projects: [
          {
            name: "API Gateway",
            bullets: ["Developed a rate-limiting API gateway using Node.js and Redis."],
          },
        ],
        skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "Express.js", "Redis"],
        education: [{ institution: "State University", degree: "B.S. Computer Science", dates: "2016 - 2020" }],
        certifications: [],
      },
    }),
    validate: (result) => {
      const zeroBulletEntry = result.rewritten_experience.find(
        (e) => e.company.toLowerCase() === "zerobullet corp"
      );
      if (!zeroBulletEntry) {
        return { passed: false, reason: "ZeroBullet Corp entry is missing from output entirely." };
      }
      if (zeroBulletEntry.bullets.length > 0) {
        return { passed: false, reason: `ZeroBullet Corp has ${zeroBulletEntry.bullets.length} bullets — should be 0.` };
      }
      if (zeroBulletEntry.title !== "Junior Developer") {
        return { passed: false, reason: `ZeroBullet Corp title changed to '${zeroBulletEntry.title}'.` };
      }
      if (zeroBulletEntry.dates !== "Jan 2020 - Jun 2020") {
        return { passed: false, reason: `ZeroBullet Corp dates changed to '${zeroBulletEntry.dates}'.` };
      }

      const normalEntry = result.rewritten_experience.find(
        (e) => e.company.toLowerCase() === "realwork inc"
      );
      if (!normalEntry) {
        return { passed: false, reason: "RealWork Inc entry is missing from output." };
      }
      if (normalEntry.bullets.length === 0) {
        return { passed: false, reason: "RealWork Inc has 0 rewritten bullets — should have been rewritten." };
      }

      return { passed: true, reason: "Zero-bullet entry passed through untouched; normal entry was rewritten." };
    },
  },

  // ─── CASE 2: Resume with 0 project entries ───
  {
    name: "Case 2: Empty projects array",
    jd: SHARED_JD,
    resume: makeBaseResume({
      sections: {
        experience: [
          {
            company: "SoloCompany LLC",
            title: "Software Engineer",
            dates: "Mar 2021 - Present",
            bullets: [
              "Developed and maintained Node.js microservices handling 10k requests per minute.",
              "Managed PostgreSQL databases with automated backup and replication.",
            ],
          },
        ],
        projects: [],  // ← empty — must not crash or invent projects
        skills: ["Node.js", "PostgreSQL", "TypeScript", "Docker"],
        education: [{ institution: "Tech Institute", degree: "B.S. Software Engineering", dates: "2017 - 2021" }],
        certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon" }],
      },
    }),
    validate: (result) => {
      if (!result.rewritten_experience || result.rewritten_experience.length === 0) {
        return { passed: false, reason: "rewritten_experience is empty — the sole entry should have been rewritten." };
      }
      // Ensure no invented projects snuck in
      const outputAny = result as unknown as Record<string, unknown>;
      if (outputAny.rewritten_projects && Array.isArray(outputAny.rewritten_projects) && (outputAny.rewritten_projects as unknown[]).length > 0) {
        return { passed: false, reason: "Output contains invented rewritten_projects despite empty input." };
      }
      return { passed: true, reason: "No crash; experience rewritten correctly with empty projects array." };
    },
  },

  // ─── CASE 3: Resume with 0 certifications ───
  {
    name: "Case 3: Empty certifications array",
    jd: SHARED_JD,
    resume: makeBaseResume({
      sections: {
        experience: [
          {
            company: "NoCerts Inc",
            title: "Backend Developer",
            dates: "Jan 2022 - Present",
            bullets: [
              "Built TypeScript REST APIs with Express.js, serving 20k daily users.",
              "Containerized services with Docker and deployed to Kubernetes clusters.",
            ],
          },
        ],
        projects: [
          {
            name: "Log Aggregator",
            bullets: ["Built a centralized log aggregation system using Node.js streams and Redis pub/sub."],
          },
        ],
        skills: ["TypeScript", "Node.js", "Docker", "Kubernetes", "Redis", "Express.js"],
        education: [{ institution: "Online University", degree: "B.S. Computer Science", dates: "2018 - 2022" }],
        certifications: [],  // ← empty — must not crash PDF assumptions
      },
    }),
    validate: (result) => {
      if (!result.rewritten_experience || result.rewritten_experience.length === 0) {
        return { passed: false, reason: "rewritten_experience is empty." };
      }
      if (!result.rewritten_skills || result.rewritten_skills.length === 0) {
        return { passed: false, reason: "rewritten_skills is empty." };
      }
      return { passed: true, reason: "No crash with empty certifications; output generated correctly." };
    },
  },

  // ─── CASE 4: Experience entry with very short bullet (3 words) ───
  {
    name: "Case 4: Very short bullet (3 words) — LLM must not pad with invented detail",
    jd: SHARED_JD,
    resume: makeBaseResume({
      sections: {
        experience: [
          {
            company: "ShortBullet Co",
            title: "Junior Engineer",
            dates: "Jun 2023 - Dec 2023",
            bullets: [
              "Maintained Node.js services.",  // ← very short, 3 substantive words
            ],
          },
          {
            company: "DetailedWork Ltd",
            title: "Backend Engineer",
            dates: "Jan 2024 - Present",
            bullets: [
              "Designed and deployed Docker-containerized TypeScript microservices on AWS ECS, reducing deployment time by 40%.",
              "Optimized PostgreSQL query plans, cutting average response time from 800ms to 120ms.",
            ],
          },
        ],
        projects: [],
        skills: ["Node.js", "TypeScript", "Docker", "PostgreSQL", "AWS"],
        education: [{ institution: "City College", degree: "B.S. CS", dates: "2019 - 2023" }],
        certifications: [],
      },
    }),
    validate: (result, resume) => {
      const shortEntry = result.rewritten_experience.find(
        (e) => e.company.toLowerCase() === "shortbullet co"
      );
      if (!shortEntry) {
        return { passed: false, reason: "ShortBullet Co entry is missing." };
      }
      if (shortEntry.bullets.length > resume.sections.experience[0].bullets.length) {
        return { passed: false, reason: `ShortBullet Co has ${shortEntry.bullets.length} bullets — original only had ${resume.sections.experience[0].bullets.length}. LLM padded with invented bullets.` };
      }
      // Check the rewritten bullet isn't drastically longer (suggesting invention)
      const origBullet = resume.sections.experience[0].bullets[0];
      if (shortEntry.bullets.length > 0) {
        const rewrittenBullet = shortEntry.bullets[0];
        if (rewrittenBullet.length > origBullet.length * 3) {
          return { passed: false, reason: `Short bullet was expanded from ${origBullet.length} chars to ${rewrittenBullet.length} chars — likely padded with invented detail.` };
        }
      }
      return { passed: true, reason: "Short bullet was not padded with invented detail." };
    },
  },

  // ─── CASE 5: Two experience entries at the SAME company (internal promotion) ───
  {
    name: "Case 5: Two entries at same company (internal promotion)",
    jd: SHARED_JD,
    resume: makeBaseResume({
      sections: {
        experience: [
          {
            company: "MegaCorp",
            title: "Junior Backend Developer",
            dates: "Jan 2021 - Dec 2022",
            bullets: [
              "Wrote unit tests for Node.js REST APIs using Jest, achieving 90% code coverage.",
              "Assisted senior engineers in PostgreSQL database migrations.",
            ],
          },
          {
            company: "MegaCorp",
            title: "Senior Backend Developer",
            dates: "Jan 2023 - Present",
            bullets: [
              "Led architecture of Docker-based microservices platform processing 100k events per day.",
              "Mentored 3 junior developers on TypeScript best practices and code review standards.",
              "Implemented Redis caching layer, reducing API latency by 60%.",
            ],
          },
        ],
        projects: [
          {
            name: "Internal CLI Tool",
            bullets: ["Built a TypeScript CLI for automated database schema diffing."],
          },
        ],
        skills: ["Node.js", "TypeScript", "PostgreSQL", "Docker", "Redis", "Jest"],
        education: [{ institution: "State University", degree: "B.S. Computer Science", dates: "2017 - 2021" }],
        certifications: [],
      },
    }),
    validate: (result, resume) => {
      // Must have exactly 2 MegaCorp entries
      const megaCorpEntries = result.rewritten_experience.filter(
        (e) => e.company.toLowerCase() === "megacorp"
      );
      if (megaCorpEntries.length !== 2) {
        return { passed: false, reason: `Expected 2 MegaCorp entries, found ${megaCorpEntries.length} — entries were merged or lost.` };
      }

      // Check titles are preserved and distinct
      const titles = megaCorpEntries.map((e) => e.title.toLowerCase());
      if (!titles.some((t) => t.includes("junior"))) {
        return { passed: false, reason: "Junior Backend Developer title is missing or altered." };
      }
      if (!titles.some((t) => t.includes("senior"))) {
        return { passed: false, reason: "Senior Backend Developer title is missing or altered." };
      }

      // Check bullet counts match originals
      const origJunior = resume.sections.experience[0];
      const origSenior = resume.sections.experience[1];
      const juniorEntry = megaCorpEntries.find((e) => e.title.toLowerCase().includes("junior"));
      const seniorEntry = megaCorpEntries.find((e) => e.title.toLowerCase().includes("senior"));

      if (juniorEntry && juniorEntry.bullets.length > origJunior.bullets.length) {
        return { passed: false, reason: `Junior entry has ${juniorEntry.bullets.length} bullets (original: ${origJunior.bullets.length}).` };
      }
      if (seniorEntry && seniorEntry.bullets.length > origSenior.bullets.length) {
        return { passed: false, reason: `Senior entry has ${seniorEntry.bullets.length} bullets (original: ${origSenior.bullets.length}).` };
      }

      return { passed: true, reason: "Both MegaCorp entries preserved separately with correct titles and bullet counts." };
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║         EDGE CASE STRESS TEST — generateTailoredContent      ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  const results: { name: string; passed: boolean; reason: string; usedFallback: boolean; error?: string }[] = [];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`\n${"═".repeat(65)}`);
    console.log(`▶ ${tc.name}`);
    console.log(`${"═".repeat(65)}`);

    try {
      const result = await generateTailoredContent(tc.jd, tc.resume);
      const validation = tc.validate(result, tc.resume);

      results.push({
        name: tc.name,
        passed: validation.passed,
        reason: validation.reason,
        usedFallback: result.used_fallback,
      });

      console.log(`\n  Result: ${validation.passed ? "✅ PASS" : "❌ FAIL"}`);
      console.log(`  Reason: ${validation.reason}`);
      console.log(`  used_fallback: ${result.used_fallback}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({
        name: tc.name,
        passed: false,
        reason: `THREW AN ERROR (should never happen after Part 3): ${errMsg}`,
        usedFallback: false,
        error: errMsg,
      });

      console.log(`\n  Result: ❌ FAIL (THREW)`);
      console.log(`  Error: ${errMsg}`);
    }

    // Small delay between tests to respect rate limits
    if (i < testCases.length - 1) {
      console.log("\n  ⏳ Waiting 2s before next test...");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // ─── FINAL SUMMARY ───
  console.log(`\n\n${"═".repeat(65)}`);
  console.log("  FINAL SUMMARY");
  console.log(`${"═".repeat(65)}`);

  for (const r of results) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    const fallback = r.usedFallback ? " [FALLBACK TRIGGERED]" : "";
    console.log(`  ${status} | ${r.name}${fallback}`);
    console.log(`         ${r.reason}`);
    if (r.error) {
      console.log(`         ERROR: ${r.error}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const fallbackCount = results.filter((r) => r.usedFallback).length;

  console.log(`\n  Total: ${passed}/${total} passed`);
  console.log(`  Fallback triggered: ${fallbackCount}/${total} cases`);
  console.log(`${"═".repeat(65)}\n`);
}

runTests();
