import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testModelNames() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY missing");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-3.7-flash",
  ];

  console.log("Testing model availability with GEMINI_API_KEY...\n");

  for (const name of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent("Respond with OK");
      console.log(`✓ Model '${name}': SUCCESS -> ${res.response.text().trim()}`);
    } catch (err: any) {
      console.log(`✕ Model '${name}': FAILED -> ${err.message}`);
    }
  }
}

testModelNames();
