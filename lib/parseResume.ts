import { ResumeData } from "../types";
import { callLLM } from "./llm";

export async function parseResume(resumeText: string): Promise<ResumeData> {
  const prompt = `You are an expert resume parser. Extract structured data from the raw resume text provided below.
Return ONLY valid JSON matching this exact shape, with no markdown code fences, no explanation text, and no surrounding text:
{
  "sections": {
    "experience": [
      {
        "company": "string",
        "title": "string",
        "bullets": ["string"],
        "dates": "string"
      }
    ],
    "projects": [
      {
        "name": "string",
        "bullets": ["string"]
      }
    ],
    "skills": ["string"]
  }
}

CRITICAL EXTRACTION INSTRUCTIONS:
- You MUST extract bullets exactly as they appear in the source text — no rewriting, summarizing, or paraphrasing at this stage. This is a pure extraction step, not a rewriting step.
- Only extract skills, tools, and experience that are explicitly mentioned in the resume text. Do not infer, assume, or add any skill or detail that is not literally present in the text, even if it seems typical for this type of role.

Raw Resume Text:
${resumeText}`;

  const responseText = await callLLM(prompt, 0.2);

  try {
    return JSON.parse(responseText) as ResumeData;
  } catch (_initialError) {
    // Clean common markdown code block wrappers (e.g. ```json ... ```)
    const cleanedText = responseText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      return JSON.parse(cleanedText) as ResumeData;
    } catch (retryError) {
      console.error("Failed to parse raw LLM output:", responseText);
      const errMessage = retryError instanceof Error ? retryError.message : String(retryError);
      throw new Error(`Failed to parse extracted ResumeData JSON: ${errMessage}`);
    }
  }
}
