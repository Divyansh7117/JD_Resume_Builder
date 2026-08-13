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

CRITICAL EXTRACTION CONSTRAINTS:
Only extract skills, tools, and requirements that are explicitly mentioned in the job description text. Do not infer, assume, or add any skill that is not literally present in the text, even if it seems typical for this type of role.

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
