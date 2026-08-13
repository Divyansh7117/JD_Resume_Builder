import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractJDRequirements } from "../lib/extractJD";
import { parseResume } from "../lib/parseResume";
import { generateTailoredContent } from "../lib/generateTailored";

const nimbusLabsJD = `
Nimbus Labs — Full Stack Engineer (Remote)
Location: Remote | Experience: 2+ Years

About the Role:
Nimbus Labs is seeking a Full Stack Engineer to build and scale our cloud platform applications. You will take ownership of responsive frontends, scalable backends, and cloud API services.

Key Requirements:
- Strong proficiency in React, Next.js, Node.js, and TypeScript
- Hands-on experience developing RESTful APIs, GraphQL, and WebSockets for real-time applications
- Expertise in MongoDB, PostgreSQL, and modern database optimization
- Familiarity with CI/CD deployment pipelines, Docker, and Agile development practices
- Passion for performance optimization, UI/UX responsiveness, and clean architecture
`;

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

console.log("=== DIVYANSH RESUME TEXT IN test-generate-tailored.ts ===");
console.log("Character Count:", divyanshResumeText.length);

async function main() {
  try {
    console.log("\nParsing Divyansh Agarwal Resume...");
    const parsedResume = await parseResume(divyanshResumeText);

    console.log("\nExtracting Nimbus Labs JD Requirements...");
    const jdResult = await extractJDRequirements(nimbusLabsJD);

    console.log("\nGenerating Tailored Content with Check 7 Validation...");
    const tailoredResult = await generateTailoredContent(jdResult, parsedResume);

    console.log("\n=======================================================");
    console.log("TAILORED OUTPUT RESULT:");
    console.log("=======================================================");
    console.log(JSON.stringify(tailoredResult, null, 2));
  } catch (err) {
    console.error("\nTest execution error:", err);
  }
}

main();
