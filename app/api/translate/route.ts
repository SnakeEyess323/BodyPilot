import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const LANG_NAMES: Record<string, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  ru: "Russian",
};

const MAX_BODY = 30 * 1024;

export async function POST(request: NextRequest) {
  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI API key not configured." },
      { status: 500 }
    );
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY) {
      return NextResponse.json(
        { error: "Request too large." },
        { status: 400 }
      );
    }

    const body = JSON.parse(raw);
    const { program, targetLang } = body as {
      program: Record<string, string>;
      targetLang: string;
    };

    if (!program || !targetLang || !LANG_NAMES[targetLang]) {
      return NextResponse.json(
        { error: "Missing program or targetLang." },
        { status: 400 }
      );
    }

    // Build the content to translate - only non-empty days
    const dayEntries = Object.entries(program).filter(
      ([, content]) => content && content.trim() !== ""
    );

    if (dayEntries.length === 0) {
      return NextResponse.json({ translated: program });
    }

    const targetLangName = LANG_NAMES[targetLang];

    // Combine all days into one prompt for efficiency
    const programText = dayEntries
      .map(([day, content]) => `=== ${day} ===\n${content}`)
      .join("\n\n");

    const systemPrompt = `You are a fitness content translator. Translate the workout program content to ${targetLangName}.

RULES:
- Translate exercise names, descriptions, notes, and instructions to ${targetLangName}.
- KEEP the exact same format: sets, reps, weights, time durations, numbers stay unchanged.
- KEEP special characters like **, -, •, numbers, "kcal", "kg", "x" (as in 3x10).
- KEEP the day separator lines (=== DayName ===) EXACTLY as they are - do NOT translate them.
- Do NOT add any introduction or explanation. Output ONLY the translated content.
- If content is a rest day marker (like "Dinlenme", "Rest", "Ruhetag", "Отдых"), translate it to the ${targetLangName} equivalent.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: programText },
      ],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const result = completion.choices[0]?.message?.content?.trim() || "";

    // Parse the result back into day→content map
    const translated: Record<string, string> = { ...program };
    const sections = result.split(/===\s*(.+?)\s*===/);

    // sections: ["", "Pazartesi", "\ncontent...", "Salı", "\ncontent...", ...]
    for (let i = 1; i < sections.length - 1; i += 2) {
      const dayName = sections[i]?.trim();
      const content = sections[i + 1]?.trim();
      if (dayName && content !== undefined && dayName in program) {
        translated[dayName] = content;
      }
    }

    return NextResponse.json({ translated });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json(
      { error: "Translation failed." },
      { status: 500 }
    );
  }
}
