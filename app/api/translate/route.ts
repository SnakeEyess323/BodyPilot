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

const LANG_EXAMPLES: Record<Lang, string> = {
  tr: 'Isınma: 5-10 dk hafif kardiyo\nBench Press: 1x12 (ısınma) + 3x10\nDinlenme',
  en: 'Warm-up: 5-10 min light cardio\nBench Press: 1x12 (warm-up) + 3x10\nRest',
  de: 'Aufwärmen: 5-10 Min leichtes Cardio\nBankdrücken: 1x12 (Aufwärmen) + 3x10\nRuhetag',
  ru: 'Разминка: 5-10 мин лёгкое кардио\nЖим лёжа: 1x12 (разминка) + 3x10\nОтдых',
};

const MEAL_EXAMPLES: Record<Lang, string> = {
  tr: 'KAHVALTI:\n**Yumurtalı Tost**\n- **Malzemeler:** 2 yumurta, 2 dilim ekmek',
  en: 'BREAKFAST:\n**Egg Toast**\n- **Ingredients:** 2 eggs, 2 slices bread',
  de: 'FRÜHSTÜCK:\n**Eier-Toast**\n- **Zutaten:** 2 Eier, 2 Scheiben Brot',
  ru: 'ЗАВТРАК:\n**Тост с яйцами**\n- **Ингредиенты:** 2 яйца, 2 ломтика хлеба',
};

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
  const example = LANG_EXAMPLES[targetLang];
  const programText = dayEntries
    .map(([day, content]) => `=== ${day} ===\n${content}`)
    .join("\n\n");

  const systemPrompt = `You are a fitness content translator. Your task is to translate workout program content into ${langName}.

CRITICAL: Every single word of your output MUST be in ${langName}. Do NOT output any English, Turkish, or other language text. ALL exercise names, descriptions, notes, warm-up instructions, cool-down instructions, and rest day markers must be written in ${langName}.

Example output in ${langName}:
${example}

RULES:
- Translate ALL exercise names to their ${langName} equivalents (e.g. "Bench Press" → "${targetLang === 'de' ? 'Bankdrücken' : targetLang === 'ru' ? 'Жим лёжа' : targetLang === 'tr' ? 'Bench Press' : 'Bench Press'}").
- Translate ALL descriptions, notes, warm-up/cool-down instructions to ${langName}.
- KEEP numbers, sets, reps, weights, durations unchanged (3x10, 5 dk/min, kcal, kg).
- KEEP special characters: **, -, •, numbers.
- KEEP the day separator lines (=== DayName ===) EXACTLY as they are - do NOT translate day names in separators.
- Do NOT add any introduction or explanation. Output ONLY the translated content.
- Rest day markers must be in ${langName}: "${targetLang === 'de' ? 'Ruhetag' : targetLang === 'ru' ? 'Отдых' : targetLang === 'tr' ? 'Dinlenme' : 'Rest'}".`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Translate the following workout program to ${langName}. Remember: EVERY word must be in ${langName}.\n\n${programText}` },
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
  const example = MEAL_EXAMPLES[targetLang];

  const systemPrompt = `You are a nutrition content translator. Your task is to translate a meal program into ${langName}.

CRITICAL: Every single word of your output MUST be in ${langName}. Do NOT output any English, Turkish, or other language text. ALL food names, ingredients, recipe steps, meal headers, and descriptions must be written in ${langName}.

Example output in ${langName}:
${example}

RULES:
- Translate ALL food names, ingredients, recipe steps, and descriptions to ${langName}.
- Translate meal category headers to ${langName} equivalents.
- KEEP numbers, quantities, calories, macros unchanged (kcal, g).
- KEEP special characters: **, -, •, numbers.
- Do NOT add any introduction or explanation. Output ONLY the translated content.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Translate the following meal program to ${langName}. Remember: EVERY word must be in ${langName}.\n\n${content}` },
    ],
    max_tokens: 3000,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content?.trim() || content;
}
