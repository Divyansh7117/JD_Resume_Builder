import { NextResponse } from "next/server";
import mammoth from "mammoth";

// Require pdf-parse/lib/pdf-parse.js directly to bypass pdf-parse index.js debug test file read bug
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded. Please select a file." },
        { status: 400 }
      );
    }

    // 5MB file size limit check (5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit. Please upload a smaller file or paste the text manually." },
        { status: 400 }
      );
    }

    const fileName = file.name || "";
    const extension = fileName.split(".").pop()?.toLowerCase();

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (extension === "pdf") {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text || "";
    } else if (extension === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || "";
    } else if (extension === "txt") {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    const trimmedText = extractedText.trim();

    if (!trimmedText) {
      return NextResponse.json(
        { error: "Couldn't extract text from that file. If it's a scanned/image-based PDF, please paste the text manually instead." },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: trimmedText }, { status: 200 });
  } catch (err) {
    console.error("File extraction error:", err);
    return NextResponse.json(
      { error: "Couldn't read that file. If it's a scanned/image-based PDF, please paste the text manually instead." },
      { status: 500 }
    );
  }
}
