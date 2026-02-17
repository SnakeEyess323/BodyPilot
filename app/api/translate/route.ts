import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

const ALL_LANGS = ["tr", "en", "de", "ru"] as const;
type Lang = (typeof ALL_LANGS)[number];

const LANG_NAMES: Record<Lang, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  ru: "Russian",
};

const MAX_BODY = 30 * 1024;

/**
 * Translates workout program or meal content to multiple languages in one call.
 *
 * Body:
 *   type: "workout" | "meal"
 *   sourceLang: Lang
 *   program?: Record<string, string>  (for workout)
 *   content?: string                  (for meal)
 *   targetLangs: Lang[]
 *
 * Returns:
 *   translations: Record<Lang, Record<string,string>> | Record<Lang, string>
 */
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
      return NextResponse.json({ error: "Request too large." }, { status: 400 });
    }

    const body = JSON.parse(raw);
    const { type, sourceLang, targetLangs } = body as {
      type: "workout" | "meal";
      sourceLang: Lang;
      targetLangs: Lang[];
    };

    if (!type || !sourceLang || !targetLangs || targetLangs.length === 0) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const validTargets = targetLangs.filter((l) => l !== sourceLang && LANG_NAMES[l]);
    if (validTargets.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    // Translate to each target language in parallel for speed
    if (type === "workout") {
      const program = body.program as Record<string, string>;
      if (!program) {
        return NextResponse.json({ error: "Missing program." }, { status: 400 });
      }

      const results = await Promise.all(
        validTargets.map((lang) => translateWorkout(openai, program, lang))
      );

      const translations: Record<string, Record<string, string>> = {};
      validTargets.forEach((lang, i) => {
        translations[lang] = results[i];
      });
      // Include source language as-is
      translations[sourceLang] = program;

      return NextResponse.json({ translations });
    }

    if (type === "meal") {
      const content = body.content as string;
      if (!content) {
        return NextResponse.json({ error: "Missing content." }, { status: 400 });
      }

      const results = await Promise.all(
        validTargets.map((lang) => translateMeal(openai, content, lang))
      );

      const translations: Record<string, string> = {};
      validTargets.forEach((lang, i) => {
        translations[lang] = results[i];
      });
      translations[sourceLang] = content;

      return NextResponse.json({ translations });
    }

    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

async function translateWorkout(
  openai: ReturnType<typeof getOpenAI> & object,
  program: Record<string, string>,
  targetLang: Lang
): Promise<Record<string, string>> {
  const dayEntries = Object.entries(program).filter(
    ([, content]) => content && content.trim() !== ""
  );
  if (dayEntries.length === 0) return { ...program };

  const langName = LANG_NAMES[targetLang];
  const programText = dayEntries
    .map(([day, content]) => `=== ${day} ===\n${content}`)
    .join("\n\n");

  const systemPrompt = `You are a fitness content translator. Translate the workout program content to ${langName}.

RULES:
- Translate exercise names, descriptions, notes, and instructions to ${langName}.
- KEEP the exact same format: sets, reps, weights, time durations, numbers stay unchanged.
- KEEP special characters like **, -, •, numbers, "kcal", "kg", "x" (as in 3x10).
- KEEP the day separator lines (=== DayName ===) EXACTLY as they are - do NOT translate day names.
- Do NOT add any introduction or explanation. Output ONLY the translated content.
- If content is a rest day marker (like "Dinlenme", "Rest", "Ruhetag", "Отдых"), translate it to the ${langName} equivalent.`;

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
  const translated: Record<string, string> = { ...program };
  const sections = result.split(/===\s*(.+?)\s*===/);

  for (let i = 1; i < sections.length - 1; i += 2) {
    const dayName = sections[i]?.trim();
    const content = sections[i + 1]?.trim();
    if (dayName && content !== undefined && dayName in program) {
      translated[dayName] = content;
    }
  }

  return translated;
}

async function translateMeal(
  openai: ReturnType<typeof getOpenAI> & object,
  content: string,
  targetLang: Lang
): Promise<string> {
  if (!content.trim()) return content;

  const langName = LANG_NAMES[targetLang];

  const systemPrompt = `You are a nutrition content translator. Translate the meal program to ${langName}.

RULES:
- Translate food names, ingredients, recipe steps, and descriptions to ${langName}.
- KEEP the exact same format: quantities, calories, macros, numbers stay unchanged.
- KEEP special characters like **, -, •, numbers, "kcal", "g".
- KEEP meal category headers in ${langName} (e.g. BREAKFAST, LUNCH, DINNER, SNACK in ${langName}).
- Do NOT add any introduction or explanation. Output ONLY the translated content.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content },
    ],
    max_tokens: 3000,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() || content;
}
