import { NextResponse } from "next/server";
import { runEvaluationPipeline } from "../../../lib/pipeline";

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
    const result = await runEvaluationPipeline(jdText, resumeText);

    return NextResponse.json(
      { tailored: result.tailored, originalResume: result.originalResume },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/tailor error:", error);
    const message = error instanceof Error ? error.message : String(error);

    if (error?.name === "LLMRateLimitError" || message.includes("LLM_RATE_LIMIT")) {
      return NextResponse.json(
        {
          error: "AI evaluation is temporarily unavailable because the configured Gemini model has reached its API rate limit. Please try again in a moment.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    if (error?.name === "LLMUnavailableError" || message.includes("LLM_UNAVAILABLE")) {
      return NextResponse.json(
        {
          error: "AI evaluation service is temporarily unavailable. Please try again shortly.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Failed to process resume: ${message}` },
      { status: 500 }
    );
  }
}

