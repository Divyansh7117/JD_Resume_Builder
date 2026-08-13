import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { callLLM } from "../lib/llm";

async function main() {
  try {
    const result = await callLLM("Say hello in one sentence.");
    console.log("Result:", result);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

main();
