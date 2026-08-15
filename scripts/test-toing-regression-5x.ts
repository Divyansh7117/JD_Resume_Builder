import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { runEvaluationPipeline } from "../lib/pipeline";
import { CANONICAL_MODEL, CANONICAL_EMBEDDING_MODEL } from "../lib/llm";
import { PIPELINE_VERSION } from "../lib/cache";
import { MatchAnalysis } from "../types";

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
• Expertise with Product Analytics tools (SQL, Power BI, dashboards).
• Understanding of AI-powered product design and personalization.
• Strong storytelling and executive communication.`;

const DIVYANSH_RESUME_TEXT = `Divyansh Agarwal
Full Stack Developer · React / Next.js / Node.js · Open to Opportunities
New Delhi, India • +91-9205216028 • divyanshagarwal.work7117@gmail.com
linkedin.com/in/divyansh-agarwal7117 • github.com/Divyansh7117 • divyansh-agarwal-portfolio.vercel.app

SUMMARY
Full Stack Developer and B.Tech CSE (Data Science) student with production-level experience shipping real applications — led end-to-end development of a social platform with 500+ live users, delivered a freelance B2B platform, and built a cross-platform React Native dating app spanning JWT authentication, REST APIs, real-time WebSockets, and optimized MongoDB pipelines. Currently expanding into Python, Machine Learning, and Deep Learning to build AI-native features into production software.

EXPERIENCE
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

async function runToingRegression5x() {
  console.log("\n╔═════════════════════════════════════════════════════════════════╗");
  console.log("║           TOING REGRESSION 5X DETERMINISTIC AUDIT               ║");
  console.log("╚═════════════════════════════════════════════════════════════════╝\n");
  console.log(`Pipeline Version: ${PIPELINE_VERSION}`);
  console.log(`Canonical Model : ${CANONICAL_MODEL}`);
  console.log(`Embedding Model : ${CANONICAL_EMBEDDING_MODEL}\n`);

  const runScores: number[] = [];
  let detailedResult: MatchAnalysis | null = null;

  for (let run = 1; run <= 5; run++) {
    console.log(`▶ Running Run ${run} / 5...`);
    const result = await runEvaluationPipeline(TOING_JD_TEXT, DIVYANSH_RESUME_TEXT);
    const analysis = result.tailored.match_analysis!;
    runScores.push(analysis.match_score);
    if (run === 1) detailedResult = analysis;
    console.log(`  Run ${run} Score: ${analysis.match_score}% (Hard: ${analysis.hard_requirement_match_score}%) | Matched: ${analysis.matched_requirements.length}, Partial: ${analysis.partial_requirements.length}, Missing: ${analysis.missing_requirements.length}`);
  }

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log("REQUIREMENTS BREAKDOWN (RUN 1):");
  console.log("═════════════════════════════════════════════════════════════════\n");

  for (const ev of detailedResult?.evaluations || []) {
    console.log(`• [${ev.status.toUpperCase()}] ${ev.requirement_name}`);
    console.log(`  Importance: ${ev.importance} | Criticality: ${ev.criticality} | Weight: ${ev.weight} | EvidenceLevel: ${ev.evidence_level} | Score: ${ev.score}`);
    console.log(`  Evidence IDs: [${ev.evidence_ids.join(", ")}]`);
    console.log(`  Evidence: ${JSON.stringify(ev.evidence.map((e: { text: string }) => e.text))}`);
    console.log(`  Reasoning: ${ev.reasoning}\n`);
  }

  console.log("═════════════════════════════════════════════════════════════════");
  console.log("MATHEMATICAL SCORE AUDIT TABLE:");
  console.log("═════════════════════════════════════════════════════════════════\n");

  let sumW = 0;
  let sumWS = 0;
  for (const at of detailedResult?.audit_trail || []) {
    const ws = at.weight * at.score * 100;
    sumW += at.weight;
    sumWS += ws;
    console.log(`  ${at.requirement_name.padEnd(35)} | W=${at.weight.toFixed(2)} | S=${at.score.toFixed(1)} | W*S*100=${ws.toFixed(1).padStart(6)} | Status=${at.status}`);
  }
  console.log(`\n  TOTAL: Numerator=${sumWS.toFixed(1)} | Denominator=${sumW.toFixed(2)} | Exact=${(sumWS / sumW).toFixed(2)}% | Final=${Math.round(sumWS / sumW)}%`);

  console.log("\n═════════════════════════════════════════════════════════════════");
  console.log(`5-RUN SCORES: [ ${runScores.map(s => `${s}%`).join(", ")} ]`);
  const isDeterministic = runScores.every(s => s === runScores[0]);
  console.log(`5-RUN DETERMINISM: ${isDeterministic ? "PASS (100% Deterministic)" : "FAIL"}`);
  console.log("═════════════════════════════════════════════════════════════════\n");
}

runToingRegression5x().catch(err => {
  console.error("Toing regression 5x failed:", err);
  process.exit(1);
});
