import OpenAI from "openai";

function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "sk-...") return null;
  return new OpenAI({ apiKey: key });
}

export const openai = getOpenAIClient();

export function hasOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key !== "sk-...");
}
