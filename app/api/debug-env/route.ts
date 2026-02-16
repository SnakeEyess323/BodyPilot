import { NextResponse } from "next/server";

export async function GET() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const rapidApiKey = process.env.RAPIDAPI_KEY;

  return NextResponse.json({
    OPENAI_API_KEY: openaiKey ? `${openaiKey.slice(0, 8)}...${openaiKey.slice(-4)} (${openaiKey.length} chars)` : "NOT SET",
    RAPIDAPI_KEY: rapidApiKey ? `${rapidApiKey.slice(0, 6)}... (set)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
