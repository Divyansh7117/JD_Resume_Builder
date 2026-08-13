import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume, splitResumeIntoSections } from "../lib/parseResume";
import { sampleResumeB, sampleResumeC } from "../samples/test-resumes";

const divyanshResumeText = `Divyansh Agarwal
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

console.log("=== RAW INPUT TEXT (character count: " + divyanshResumeText.length + ") ===");
console.log(divyanshResumeText);
console.log("=== END RAW INPUT ===");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function testResume(label: string, text: string) {
  console.log(`\n=======================================================`);
  console.log(`TESTING: ${label}`);
  console.log(`=======================================================`);

  const split = splitResumeIntoSections(text);
  console.log("SECTION DETECTOR SUMMARY:");
  console.log(`- Summary Text Length: ${split.summaryText.length}`);
  console.log(`- Experience Text Length: ${split.experienceText.length}`);
  console.log(`- Projects Text Length: ${split.projectsText.length}`);
  console.log(`- Skills Text Length: ${split.skillsText.length}`);

  const parsed = await parseResume(text);

  console.log("\nCONTACT INFO EXTRACTED:");
  console.log(JSON.stringify(parsed.contact, null, 2));

  console.log("\nSUMMARY EXTRACTED:");
  console.log(parsed.summary);

  console.log("\nFULL EXTRACTED BULLETS FOR EXPERIENCE ENTRIES:");
  (parsed.sections.experience || []).forEach((exp, idx) => {
    console.log(`\n[Company ${idx + 1}] ${exp.company} (${exp.title} | ${exp.dates})`);
    console.log(`Bullet Count: ${exp.bullets.length}`);
    console.log(JSON.stringify(exp.bullets, null, 2));
  });

  console.log("\nFULL EXTRACTED BULLETS FOR PROJECT ENTRIES:");
  (parsed.sections.projects || []).forEach((proj, idx) => {
    console.log(`\n[Project ${idx + 1}] ${proj.name}`);
    console.log(`Bullet Count: ${proj.bullets.length}`);
    console.log(JSON.stringify(proj.bullets, null, 2));
  });

  console.log(`\nSkills Extracted (${parsed.sections.skills?.length || 0}):`, parsed.sections.skills);

  console.log("\nEDUCATION EXTRACTED:");
  console.log(JSON.stringify(parsed.sections.education, null, 2));

  console.log("\nCERTIFICATIONS EXTRACTED:");
  console.log(JSON.stringify(parsed.sections.certifications, null, 2));
}

async function main() {
  try {
    await testResume("RESUME A: Real Divyansh Agarwal Resume", divyanshResumeText);
    await sleep(3000);
    await testResume("RESUME B: Projects Before Experience, Dash Bullets, Single Paragraph Skills", sampleResumeB);
    await sleep(3000);
    await testResume("RESUME C: Multiple Jobs, Mixed Headers, Inconsistent Spacing", sampleResumeC);
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

main();
