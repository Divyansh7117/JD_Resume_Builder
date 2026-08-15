import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testModel() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const genAI = new GoogleGenerativeAI(apiKey);

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.7-flash"];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const t0 = Date.now();
      const res = await model.generateContent("Respond with only: OK");
      console.log(`[MODEL SUCCESS] ${m}: ${res.response.text().trim()} (${Date.now() - t0}ms)`);
    } catch (err: any) {
      console.log(`[MODEL FAILED] ${m}: ${err.message}`);
    }
  }
}

testModel();
