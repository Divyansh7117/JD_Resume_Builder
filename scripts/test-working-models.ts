import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testWorkingModels() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);

  const testList = [
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
    "gemini-2.5-pro",
    "gemini-3-flash-preview",
  ];

  for (const m of testList) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const t0 = Date.now();
      const res = await model.generateContent("Respond with: OK");
      console.log(`✅ [WORKING] ${m}: "${res.response.text().trim()}" (${Date.now() - t0}ms)`);
    } catch (err: any) {
      console.log(`❌ [FAILED] ${m}: ${err.message?.substring(0, 100)}`);
    }
  }
}

testWorkingModels();
