import OpenAI from "openai";

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-...") return null;
  return new OpenAI({ apiKey: key });
}

// Keep backward compatibility
export const openai = getOpenAI();

export function hasOpenAIKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key !== "sk-...");
}
