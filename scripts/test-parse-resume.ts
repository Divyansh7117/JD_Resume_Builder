import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume, splitResumeIntoSections } from "../lib/parseResume";
import { sampleResumeB, sampleResumeC } from "../samples/test-resumes";

const divyanshResumeText = `
Divyansh Agarwal
Full Stack Developer · React / Next.js / Node.js · Open to Opportunities
New Delhi, India Email: divyanshagarwal.work7117@gmail.com Phone: +91-9205216028
linkedin.com/in/divyansh-agarwal github.com/Divyansh7117 · divyansh-agarwal-portfolio.vercel.app

PROFILE
Full Stack Developer and B.Tech CSE (Data Science) student with production-level experience building and shipping real applications. Led end-to-end development of a social media platform (500+ live users), delivered a freelance B2B platform, and shipped a cross-platform React Native dating app — spanning JWT authentication, RESTful APIs, real-time WebSockets, optimized MongoDB pipelines, and responsive React/Next.js frontends. Currently expanding into Python, Machine Learning, and Deep Learning to build AI-native features into production software.

TECHNICAL SKILLS
Frontend: React.js, Next.js, React Native (Expo), HTML5, CSS3, TypeScript, Tailwind CSS, Responsive Design, SEO
Backend: Node.js, Express.js, RESTful APIs, GraphQL, WebSockets, JWT Auth, MVC Architecture
Databases: MongoDB, PostgreSQL, MySQL, SQL
Languages: JavaScript, TypeScript, Python, C
AI / Data: Python, Machine Learning, Deep Learning, Neural Networks, NLP
Tools: Git, GitHub, VS Code, Postman, Cloudinary, Vercel, Nodemailer, Docker, CI/CD, Jest, Framer Motion

EXPERIENCE
Software Engineer Intern | Xoodrip | Oct 2025 – Present
Building GrowIn Bharat — a live social media platform with 500+ real users
• Engineered end-to-end full-stack architecture for GrowIn Bharat — owned feature development, CI/CD deployment pipeline, and ongoing maintenance as sole developer; conducted self-directed code reviews at every release.
• Built secure JWT-based authentication with role-based authorization and protected routes, eliminating unauthorized access vulnerabilities across all API endpoints; validated across Chrome, Firefox, and Safari (cross-browser testing).
• Designed and implemented scalable RESTful APIs and proxy APIs for posts, engagement (likes, comments), follows, polls, and user management — all serving real production traffic with efficient API fetching patterns.
• Optimized MongoDB aggregation pipelines for a dynamic news feed; reduced initial feed payload from 120 to 10 posts via cursor-based pagination and infinite scroll, cutting average API response time to under 200ms; wrote unit tests (Jest) for critical API endpoints.
• Applied media optimization across all image and video assets; improved Lighthouse Performance score from 62 to 88, achieving 1.8–2.2s initial page load.
• Developed a comprehensive desktop feed UI and Admin Dashboard with dynamic KPI cards to monitor user growth, content volume, and engagement metrics in real time.
• Structured backend using MVC architecture for long-term scalability; built reusable, fully responsive React/Next.js component library following Agile development practices.
• Designed and developed the official Xoodrip company website (xoodrip.com) — optimized for performance, SEO, and responsive design across all devices and screen sizes.

PROJECTS
GrowIn Bharat — Social Media Platform | Next.js, Node.js, MongoDB, JWT, WebSockets
• Live in production with 500+ real users; built end-to-end under Xoodrip internship.
• Implemented infinite scroll with cursor-based pagination; reduced initial feed payload from 120 to 10 posts, cutting API response time to under 200ms and achieving Lighthouse Performance score of 88.

Bondbrite — B2B Industrial Adhesives Platform (Freelance) | Next.js, MongoDB, Cloudinary, JWT, Nodemailer
• Delivered a manufacturer-direct B2B platform: product catalogue, dealer onboarding, and inquiry workflows for an industrial adhesives client.
• JWT-secured admin panel with role-based access; Cloudinary-backed image upload and CDN delivery for product catalogue.

EDUCATION
B.Tech – Computer Science Engineering (Data Science) | 2024 – 2028
USICT, Guru Gobind Singh Indraprastha University · New Delhi
`;

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
