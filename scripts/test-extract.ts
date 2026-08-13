import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { extractJDRequirements } from "../lib/extractJD";

const solaceHealthJD = `
Solace Health — Frontend Engineer (Next.js)
Location: Remote | Experience: 2+ Years

About the Role:
Solace Health is seeking a Frontend Engineer specializing in Next.js, React, and modern UI engineering to craft accessible, highly responsive web platforms for modern healthcare operations.

Key Responsibilities & Requirements:
- Deep expertise in React, Next.js, and TypeScript
- Advanced styling with Tailwind CSS, responsive design, and cross-browser compatibility
- Experience building clean REST API integrations
- Performance optimization
- Hands-on experience with Framer Motion / Motion for fluid UI micro-interactions

Nice to Have:
- Familiarity with WCAG accessibility standards and web accessibility compliance
- Prior experience collaborating in Figma and designing component systems
- Background in healthcare, fintech, or other regulated industries handling sensitive user data
`;

async function main() {
  try {
    console.log("Extracting Solace Health JD requirements...");
    const result = await extractJDRequirements(solaceHealthJD);
    console.log("Parsed Output:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Extraction failed:", err);
  }
}

main();
