import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";
import { validateNoFabrication } from "../lib/validator";
import { TailoredOutput } from "../types";

const sampleResumeText = `
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
    const originalResume = await parseResume(sampleResumeText);

    // Deliberately BAD fake TailoredOutput object constructed by hand
    const badOutput: TailoredOutput = {
      matched_skills: ["TypeScript", "Next.js"],
      missing_skills: ["Docker"],
      match_score: 80,
      rewritten_summary: "Experienced Full-Stack Developer specializing in MERN stack, Python, and Docker.", // Fabricated Python and Docker into summary
      rewritten_experience: [
        {
          company: "TechCorp Inc.",
          title: "Senior Full-Stack Engineer",
          dates: "Jan 2022 - Present",
          bullets: [
            "Architected web platform using GraphQL, increasing system throughput by 85%.", // Fabricated 85% metric AND inserted GraphQL into bullet #1 where it wasn't originally
            "Built APIs serving over 100k daily active users."
          ]
        },
        {
          company: "FakeCorp LLC", // Invented company
          title: "Lead Developer",
          dates: "2020 - 2021",
          bullets: ["Engineered cloud solutions."]
        }
      ],
      rewritten_skills: [
        "TypeScript",
        "Next.js",
        "Python" // Invented skill
      ],
      used_fallback: false,
    };

    console.log("Validating deliberately BAD output against original resume...");
    const validationResult = validateNoFabrication(originalResume, badOutput);
    console.log("Validation Result:");
    console.log(JSON.stringify(validationResult, null, 2));
  } catch (err) {
    console.error("Validator test failed:", err);
  }
}

main();
