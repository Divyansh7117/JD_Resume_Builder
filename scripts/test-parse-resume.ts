import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";

const sampleResume = `
ALEX RIVERA
Full-Stack Developer | MERN Stack | Next.js | TypeScript | React Native
Email: alex.rivera@example.com | GitHub: github.com/alexrivera | Location: San Francisco, CA

PROFESSIONAL EXPERIENCE
Senior Full-Stack Engineer | TechCorp Inc. | Jan 2022 - Present
• Architected and launched a real-time web platform using Next.js, React, and TypeScript, reducing page load times by 40%.
• Built high-throughput RESTful APIs and MongoDB data pipelines using Node.js and Express (MERN stack) to serve over 100k daily active users.
• Developed cross-platform mobile application modules using React Native and Redux Toolkit for seamless sync across iOS and Android.

PROJECTS
TaskCraft - Mobile & Web Task Manager
• Implemented end-to-end task synchronization using React Native for mobile, Next.js for web dashboard, and WebSocket connections via Node.js backend.
• Integrated TypeScript strict mode across shared frontend-backend packages to ensure type safety and prevent runtime errors.

SKILLS
TypeScript, JavaScript, React.js, Next.js, Node.js, Express.js, MongoDB, React Native, Redux, HTML5, CSS3, Tailwind CSS, REST APIs, GraphQL, Git
`;

async function main() {
  try {
    console.log("Parsing sample resume...");
    const result = await parseResume(sampleResume);
    console.log("Parsed Resume Result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Parse resume failed:", err);
  }
}

main();
