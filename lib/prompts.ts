import type { Profil } from "./types";

type Lang = "tr" | "en" | "de" | "ru";

const LANG_NAMES: Record<Lang, string> = {
  tr: "Turkish",
  en: "English",
  de: "German",
  ru: "Russian",
};

const DAY_NAMES: Record<Lang, string[]> = {
  tr: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  de: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
  ru: ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"],
};

const MEAL_LABELS: Record<Lang, { breakfast: string; lunch: string; dinner: string; snack: string }> = {
  tr: { breakfast: "KAHVALTI", lunch: "ÖĞLE YEMEĞİ", dinner: "AKŞAM YEMEĞİ", snack: "ARA ÖĞÜN" },
  en: { breakfast: "BREAKFAST", lunch: "LUNCH", dinner: "DINNER", snack: "SNACK" },
  de: { breakfast: "FRÜHSTÜCK", lunch: "MITTAGESSEN", dinner: "ABENDESSEN", snack: "SNACK" },
  ru: { breakfast: "ЗАВТРАК", lunch: "ОБЕД", dinner: "УЖИН", snack: "ПЕРЕКУС" },
};

const GOAL_LABELS: Record<string, Record<Lang, string>> = {
  kilo_verme: { tr: "kilo verme", en: "weight loss", de: "Abnehmen", ru: "похудение" },
  kas: { tr: "kas kütlesi", en: "muscle mass", de: "Muskelmasse", ru: "мышечная масса" },
  dayaniklilik: { tr: "dayanıklılık", en: "endurance", de: "Ausdauer", ru: "выносливость" },
  genel_fitness: { tr: "genel fitness", en: "general fitness", de: "allgemeine Fitness", ru: "общий фитнес" },
  yag_yakmak: { tr: "yağ yakmak", en: "fat burn", de: "Fettverbrennung", ru: "сжигание жира" },
  kas_yapmak: { tr: "kas yapmak", en: "build muscle", de: "Muskelaufbau", ru: "набор мышц" },
  sikilasmak: { tr: "sıkılaşmak", en: "tone up", de: "straffen", ru: "подтянуться" },
  kilo_almak: { tr: "kilo almak", en: "weight gain", de: "Zunehmen", ru: "набор веса" },
  postur_duzeltmek: { tr: "postür düzeltmek", en: "fix posture", de: "Haltung verbessern", ru: "исправить осанку" },
  kondisyon_artirmak: { tr: "kondisyon artırmak", en: "build endurance", de: "Ausdauer aufbauen", ru: "повысить выносливость" },
  genel_saglikli_yasam: { tr: "genel sağlıklı yaşam", en: "healthy lifestyle", de: "gesunder Lebensstil", ru: "здоровый образ жизни" },
};

function profilMetni(profil?: Profil, lang: Lang = "tr"): string {
  if (!profil) return "";
  const parts: string[] = [];
  const l = lang;

  if (profil.yas) parts.push(l === "tr" ? `${profil.yas} yaşında` : l === "en" ? `${profil.yas} years old` : l === "de" ? `${profil.yas} Jahre alt` : `${profil.yas} лет`);
  if (profil.cinsiyet) {
    const g = profil.cinsiyet === "erkek"
      ? { tr: "erkek", en: "male", de: "männlich", ru: "мужчина" }
      : { tr: "kadın", en: "female", de: "weiblich", ru: "женщина" };
    parts.push(g[l]);
  }
  if (profil.kilo) parts.push(`${profil.kilo} kg`);
  if (profil.boy) parts.push(`${profil.boy} cm`);
  if (profil.hedef && profil.hedef.length > 0) {
    const goals = profil.hedef.map((h) => GOAL_LABELS[h]?.[l] || h).join(", ");
    parts.push(l === "tr" ? `hedef: ${goals}` : l === "en" ? `goal: ${goals}` : l === "de" ? `Ziel: ${goals}` : `цель: ${goals}`);
  }
  if (profil.seviye) parts.push(l === "tr" ? `seviye: ${profil.seviye}` : l === "en" ? `level: ${profil.seviye}` : l === "de" ? `Level: ${profil.seviye}` : `уровень: ${profil.seviye}`);
  if (profil.gunSayisi) {
    const d = profil.gunSayisi;
    parts.push(l === "tr" ? `haftalık ${d === "7" ? "her gün" : `${d} gün`} antrenman` : l === "en" ? `${d === "7" ? "daily" : `${d} days/week`} training` : l === "de" ? `${d === "7" ? "tägliches" : `${d} Tage/Woche`} Training` : `${d === "7" ? "ежедневные" : `${d} дней/неделю`} тренировки`);
  }
  if (profil.ortam) {
    const env = profil.ortam === "ev"
      ? { tr: "ev", en: "home", de: "Zuhause", ru: "дом" }
      : { tr: "salon", en: "gym", de: "Fitnessstudio", ru: "спортзал" };
    parts.push(env[l]);
  }
  if (profil.kisitlar?.trim()) parts.push(l === "tr" ? `kısıtlar: ${profil.kisitlar.trim()}` : l === "en" ? `restrictions: ${profil.kisitlar.trim()}` : l === "de" ? `Einschränkungen: ${profil.kisitlar.trim()}` : `ограничения: ${profil.kisitlar.trim()}`);

  const prefix = { tr: "Kullanıcı bilgileri", en: "User info", de: "Benutzerinfo", ru: "Информация о пользователе" };
  return parts.length ? `${prefix[l]}: ${parts.join(", ")}.` : "";
}

export function antrenmanSistemPromptu(profil?: Profil, lang: Lang = "tr"): string {
  const ek = profilMetni(profil, lang);
  const turkishDays = DAY_NAMES.tr;
  const dayHeaders = turkishDays.map((d) => `${d}:`).join(", ");
  const langName = LANG_NAMES[lang];
  const rest = { tr: "Dinlenme", en: "Rest", de: "Ruhetag", ru: "Отдых" }[lang];
  const warmup = { tr: "ısınma - hafif kilo", en: "warm-up - light weight", de: "Aufwärmen - leichtes Gewicht", ru: "разминка - лёгкий вес" }[lang];

  return `You are a fitness coach. Generate a weekly workout program based on user info. For each day, provide exercise names, sets-reps or duration, and short notes. RESPOND ENTIRELY IN ${langName.toUpperCase()} (exercise descriptions, notes, rest days - everything in ${langName}).
Output must be day-by-day. CRITICAL: You MUST output ALL 7 day headers using exactly these Turkish names (required for parsing): ${dayHeaders}. For rest days write "${rest}" under that day.
CRITICAL DAY COUNT RULE: The user will specify how many WORKOUT days they want per week. You MUST create EXACTLY that many workout days with exercises. The remaining days MUST be "${rest}" (rest days). For example, if the user says "3 days/week", you must have EXACTLY 3 days with exercises and 4 days with "${rest}". If "5 days/week", EXACTLY 5 days with exercises and 2 days with "${rest}". NEVER create fewer workout days than requested.
IMPORTANT: Next to each day header, add the estimated calories burned. Format: "${turkishDays[0]}: (~350 kcal)". Don't write calories for rest days.
IMPORTANT: Do NOT write any introduction. Start directly with day headers and exercises.
WARM-UP RULE: Each workout day must start with a 5-10 minute general warm-up (light cardio, dynamic stretching). Also, the first set of every weight exercise must be a light-weight warm-up set. Example: "Bench Press: 1x12 (${warmup}) + 3x10". ${ek}`.trim();
}

export function yemekSistemPromptu(profil?: Profil, lang: Lang = "tr"): string {
  const ek = profilMetni(profil, lang);
  const m = MEAL_LABELS[lang];
  const langName = LANG_NAMES[lang];
  const ingredients = { tr: "Malzemeler", en: "Ingredients", de: "Zutaten", ru: "Ингредиенты" }[lang];
  const recipe = { tr: "Tarif", en: "Recipe", de: "Rezept", ru: "Рецепт" }[lang];
  const calories = { tr: "Kalori", en: "Calories", de: "Kalorien", ru: "Калории" }[lang];
  const macro = { tr: "Makro", en: "Macros", de: "Makros", ru: "Макросы" }[lang];
  const protein = { tr: "Protein", en: "Protein", de: "Protein", ru: "Белок" }[lang];
  const carbs = { tr: "Karbonhidrat", en: "Carbs", de: "Kohlenhydrate", ru: "Углеводы" }[lang];
  const fat = { tr: "Yağ", en: "Fat", de: "Fett", ru: "Жиры" }[lang];

  return `You are a nutrition expert. Create a daily meal program. RESPOND ENTIRELY IN ${langName.toUpperCase()}.

CRITICAL FORMAT RULES:
- Use ONLY these meal categories: ${m.breakfast}, ${m.lunch}, ${m.dinner}, ${m.snack}.
- NEVER write day headers like "Day 1", "Monday", etc.
- Create a single day meal plan with multiple options per meal.
- Do NOT write any introduction. Start directly with meal headers.

IMPORTANT: Write recipes step-by-step so even a complete beginner can follow.

MANDATORY FORMAT:

${m.breakfast}:

**${m.breakfast}: [Meal Name]**
- **${ingredients}:** [ingredient list with measurements]
- **${recipe}:**
  1. [First step - detailed]
  2. [Second step - detailed]
- **${calories}:** ~[number] kcal
- **${macro}:** ${protein}: [x]g, ${carbs}: [y]g, ${fat}: [z]g

${m.lunch}:

**${m.lunch}: [Meal Name]**
- **${ingredients}:** [ingredient list with measurements]
- **${recipe}:**
  1. [First step - detailed]
  2. [Second step - detailed]
- **${calories}:** ~[number] kcal
- **${macro}:** ${protein}: [x]g, ${carbs}: [y]g, ${fat}: [z]g

${m.dinner}:

**${m.dinner}: [Meal Name]**
- **${ingredients}:** [ingredient list with measurements]
- **${recipe}:**
  1. [First step - detailed]
  2. [Second step - detailed]
- **${calories}:** ~[number] kcal
- **${macro}:** ${protein}: [x]g, ${carbs}: [y]g, ${fat}: [z]g

${m.snack}:

**${m.snack}: [Snack Name]**
- **${ingredients}:** [ingredient list with measurements]
- **${recipe}:**
  1. [Step - detailed]
- **${calories}:** ~[number] kcal
- **${macro}:** ${protein}: [x]g, ${carbs}: [y]g, ${fat}: [z]g

Provide 2-3 different options per meal category. Separate with blank lines. ${ek}`.trim();
}

export function chatSistemPromptu(lang: Lang = "tr"): string {
  const langName = LANG_NAMES[lang];
  return `You are BodyPilot, the user's personal AI fitness and nutrition coach. You have access to all user information: profile, workout program, meal program, what they ate today, workout history and statistics.

RULES:
- Act like a coach who knows the user personally. Actively use their data.
- If user asks "What should I do today?", remind them of today's workout.
- If user asks about nutrition, reference their current meal program and what they ate today.
- ALWAYS respond in ${langName}. Keep answers short and actionable.
- Give advice suited to user's goals, level and restrictions.
- Motivate the user, appreciate their streak and progress.
- Don't diagnose health issues, refer to doctor for serious cases.
- Include user info naturally in responses, don't list them robotically.`;
}
