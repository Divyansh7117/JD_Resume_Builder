import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractJDRequirements } from "../lib/extractJD";
import { generateTailoredContent } from "../lib/generateTailored";
import { ResumeData } from "../types";

const rawJD = `
We are looking for a Full-Stack Engineer to join our dynamic web development team.
The ideal candidate should have strong proficiency in TypeScript, React, Next.js, and Node.js with hands-on experience building REST APIs and GraphQL services.
Experience with Tailwind CSS, React Native, and Docker / PostgreSQL is highly desirable.
You will collaborate closely with cross-functional teams to design, develop, and maintain web applications.
Candidates should possess strong problem-solving skills and 2+ years of relevant engineering experience.
`;

const sampleResume: ResumeData = {
  sections: {
    experience: [
      {
        company: "TechCorp Inc.",
        title: "Senior Full-Stack Engineer",
        dates: "Jan 2022 - Present",
        bullets: [
          "Architected and launched a real-time web platform using Next.js, React, and TypeScript, reducing page load times by 40%.",
          "Built high-throughput RESTful APIs and MongoDB data pipelines using Node.js and Express (MERN stack) to serve over 100k daily active users.",
          "Developed cross-platform mobile application modules using React Native and Redux Toolkit for seamless sync across iOS and Android."
        ]
      }
    ],
    projects: [
      {
        name: "TaskCraft - Mobile & Web Task Manager",
        bullets: [
          "Implemented end-to-end task synchronization using React Native for mobile, Next.js for web dashboard, and WebSocket connections via Node.js backend.",
          "Integrated TypeScript strict mode across shared frontend-backend packages to ensure type safety and prevent runtime errors."
        ]
      }
    ],
    skills: [
      "TypeScript",
      "JavaScript",
      "React.js",
      "Next.js",
      "Node.js",
      "Express.js",
      "MongoDB",
      "React Native",
      "Redux",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "REST APIs",
      "GraphQL",
      "Git"
    ]
  }
};

async function main() {
  try {
    console.log("Extracting JD requirements...");
    const jdResult = await extractJDRequirements(rawJD);
    console.log("Extracted JD Requirements:");
    console.log(JSON.stringify(jdResult, null, 2));

    console.log("\nGenerating tailored content...");
    const tailoredResult = await generateTailoredContent(jdResult, sampleResume);
    console.log("Tailored Output Result:");
    console.log(JSON.stringify(tailoredResult, null, 2));
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}

main();
