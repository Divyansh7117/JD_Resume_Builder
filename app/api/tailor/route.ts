import { NextResponse } from "next/server";
import { extractJDRequirements } from "../../../lib/extractJD";
import { parseResume } from "../../../lib/parseResume";
import { generateTailoredContent } from "../../../lib/generateTailored";

export async function POST(request: Request) {
  let body: { jdText?: string; resumeText?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { jdText, resumeText } = body;

  if (!jdText || typeof jdText !== "string" || jdText.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'jdText' field." },
      { status: 400 }
    );
  }

  if (!resumeText || typeof resumeText !== "string" || resumeText.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty 'resumeText' field." },
      { status: 400 }
    );
  }

  try {
    const [jdResult, resumeResult] = await Promise.all([
      extractJDRequirements(jdText),
      parseResume(resumeText),
    ]);

    const tailored = await generateTailoredContent(jdResult, resumeResult);

    return NextResponse.json(
      { tailored, originalResume: resumeResult },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/tailor error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to process resume: ${message}` },
      { status: 500 }
    );
  }
}
