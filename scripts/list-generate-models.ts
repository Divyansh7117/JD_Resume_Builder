import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function listGenerateModels() {
  const apiKey = process.env.GEMINI_API_KEY!;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  const generateModels = (data.models || []).filter((m: any) =>
    m.supportedGenerationMethods?.includes("generateContent")
  );
  console.log("GenerateContent Models:");
  for (const m of generateModels) {
    console.log(`• ${m.name.replace("models/", "")} (${m.displayName})`);
  }
}

listGenerateModels();
