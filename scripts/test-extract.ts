import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractJDRequirements } from "../lib/extractJD";

const sampleJD = `
We are looking for an Entry-Level Software Engineer to join our dynamic web development team.
The ideal candidate should have strong proficiency in TypeScript, React, and Node.js with hands-on experience building REST APIs.
Experience with Tailwind CSS, Next.js, and SQL databases like PostgreSQL is highly desirable.
You will collaborate closely with cross-functional teams to design, develop, and maintain web applications.
Candidates should possess strong problem-solving skills, excellent communication, and 0-2 years of relevant engineering experience or internship projects.
`;

async function main() {
  try {
    console.log("Extracting JD requirements...");
    const result = await extractJDRequirements(sampleJD);
    console.log("Parsed Output:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Extraction failed:", err);
  }
}

main();
