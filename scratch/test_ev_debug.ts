import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { parseResume } from "../lib/parseResume";
import { evaluateRequirementsAgainstEvidence } from "../lib/semanticMatcher";
import { JDRequirements, JDRequirement } from "../types";

async function debug() {
  const resumeText = `Candidate: Alex Jordan
Title: Software Engineer
Email: alex.jordan@example.com | Location: Remote

SUMMARY
Experienced software engineer focused on building performant, reliable applications.

SKILLS
Node.js, Express, JavaScript

PROJECTS
API Service Platform
• Developed REST APIs using Node.js and Express to handle user operations.
`;

  const parsed = await parseResume(resumeText);

  const req: JDRequirement = {
    id: "req_1",
    name: "Node.js",
    description: "Experience building backend services in Node.js",
    category: "Backend",
    importance: "required",
    criticality: "hard",
    weight: 4.0,
    requirement_type: "skill_capability",
    logical_operator: "SINGLE",
  };

  const jd: JDRequirements = {
    role_title: "Full Stack Engineer",
    seniority_signal: "mid",
    requirements: [req],
    must_have_skills: ["Node.js"],
    nice_to_have_skills: [],
    keywords: ["Node.js"],
    summary_keywords: ["Node.js"],
  };

  // PASS `parsed` (ResumeData) NOT `parsed.evidence_units`
  const analysis = await evaluateRequirementsAgainstEvidence(jd, parsed);
  console.log("Evaluations:", JSON.stringify(analysis.evaluations, null, 2));
}

debug().catch(console.error);
