import { JDRequirements } from "../types";
import { callLLM } from "./llm";

export async function extractJDRequirements(jdText: string): Promise<JDRequirements> {
  const prompt = `You are an expert HR analyst. Extract structured requirements from the following Job Description (JD).
Return ONLY a valid JSON object with no markdown formatting, no code fences, and no explanations. It must strictly match this JSON shape:
{
  "role_title": "string",
  "must_have_skills": ["string"],
  "nice_to_have_skills": ["string"],
  "keywords": ["string"],
  "seniority_signal": "string"
}

CRITICAL EXTRACTION RULES:
1. Extract each requirement as a SHORT, atomic phrase — ideally just the technology/skill name itself (e.g. 'React', 'Next.js', 'TypeScript' as THREE separate entries, not one combined sentence). Do NOT wrap entries in descriptive sentence framing like 'Deep expertise in X, Y, and Z' or 'Experience building X' — strip this framing and extract just the technology names as individual entries.

The ONLY case where you should keep multiple items as ONE entry is true interchangeable alternatives, where the JD explicitly presents them as either/or options using '/' or 'or' between them (e.g. 'Framer Motion / Motion' stays one entry because they're presented as the same choice, not because they're both mentioned nearby). If the JD lists several distinct, separately-required technologies in a sentence (e.g. 'Strong proficiency in React, TypeScript, and Node.js'), extract each as its own separate entry: 'React', 'TypeScript', 'Node.js' — three entries, not one. Similarly, split 'responsive design' and 'cross-browser compatibility' into two separate entries — they are two distinct requirements that happened to appear in the same sentence, not alternatives.

2. Include EVERY requirement explicitly listed in the JD's requirements/responsibilities sections, even if it's not a specific named technology — e.g. 'responsive design', 'cross-browser compatibility', 'strong communication skills', 'problem-solving' all count as requirements to extract if the JD lists them. Do not skip a requirement just because it isn't a product/framework name.

3. Categorize strictly based on which section of the JD the requirement appeared under: only items under a 'Requirements', 'Must have', or 'Responsibilities' heading go in must_have_skills. Only items under 'Nice to have', 'Preferred', or 'Bonus' headings go in nice_to_have_skills. Do not move an item between categories based on how important it seems — use the JD's own section placement.

4. Do not infer or add sub-components of a requirement that the JD itself didn't separately list. If the JD says 'performance optimization (Core Web Vitals, bundle size, image loading strategies)', extract this as 'performance optimization' — do not create separate entries for 'Web vitals' or invent a term like 'Lighthouse audit scores' that isn't in the JD text at all.

Job Description:
${jdText}`;

  const responseText = await callLLM(prompt, 0.2);

  try {
    return JSON.parse(responseText) as JDRequirements;
  } catch (_initialError) {
    // Clean common markdown code block wrappers (e.g. ```json ... ```)
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleanedText) as JDRequirements;
    } catch (retryError) {
      console.error("Failed to parse raw LLM output:", responseText);
      const errMessage = retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(`Failed to parse extracted JD requirements JSON: ${errMessage}`);
    }
  }
}
