import type { BadgeId, DailyTaskId, GamificationData } from "@/lib/types";

// ============ XP Rewards ============
export const XP_REWARDS = {
  dailyLogin: 10,
  workoutComplete: 50,
  mealPlanFollow: 30,
  streak7Bonus: 100,
  streak30Bonus: 500,
  allTasksBonus: 50,
  drinkWater: 5,
  askBodypilot: 5,
} as const;

// ============ Level System ============
export const LEVELS = [
  { level: 1, xpRequired: 0, title: "baslangic" },
  { level: 2, xpRequired: 100, title: "amator" },
  { level: 3, xpRequired: 300, title: "sporcu" },
  { level: 4, xpRequired: 600, title: "atlet" },
  { level: 5, xpRequired: 1000, title: "sampiyon" },
  { level: 6, xpRequired: 1500, title: "efsane" },
  { level: 7, xpRequired: 2500, title: "efsane_plus" },
] as const;

export type LevelTitle = (typeof LEVELS)[number]["title"];

export function calculateLevel(totalXP: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xpRequired) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

export function getLevelTitle(level: number): LevelTitle {
  const found = LEVELS.find((l) => l.level === level);
  return found?.title || "baslangic";
}

export function getXPForNextLevel(level: number): number {
  const nextLevel = LEVELS.find((l) => l.level === level + 1);
  if (nextLevel) {
    return nextLevel.xpRequired;
  }
  // Max level reached
  return LEVELS[LEVELS.length - 1].xpRequired;
}

export function getXPForLevel(level: number): number {
  const found = LEVELS.find((l) => l.level === level);
  return found?.xpRequired || 0;
}

// ============ Badges System ============
export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  xpReward: number;
}

export const BADGES: Record<BadgeId, BadgeDefinition> = {
  first_step: {
    id: "first_step",
    icon: "👣",
    xpReward: 10,
  },
  committed_7: {
    id: "committed_7",
    icon: "🔥",
    xpReward: 50,
  },
  iron_will_30: {
    id: "iron_will_30",
    icon: "💪",
    xpReward: 200,
  },
  century_100: {
    id: "century_100",
    icon: "💯",
    xpReward: 500,
  },
  first_workout: {
    id: "first_workout",
    icon: "🏋️",
    xpReward: 25,
  },
  fitness_guru_50: {
    id: "fitness_guru_50",
    icon: "🏆",
    xpReward: 300,
  },
  nutrition_master: {
    id: "nutrition_master",
    icon: "🥗",
    xpReward: 100,
  },
  challenge_completer: {
    id: "challenge_completer",
    icon: "🏅",
    xpReward: 150,
  },
  challenge_winner: {
    id: "challenge_winner",
    icon: "👑",
    xpReward: 300,
  },
  referral_first: {
    id: "referral_first",
    icon: "🤝",
    xpReward: 50,
  },
};

export function checkBadgeUnlock(
  badgeId: BadgeId,
  data: GamificationData
): boolean {
  switch (badgeId) {
    case "first_step":
      return data.visitHistory.length >= 1;
    case "committed_7":
      return data.currentStreak >= 7;
    case "iron_will_30":
      return data.currentStreak >= 30;
    case "century_100":
      return data.currentStreak >= 100;
    case "first_workout":
      return data.totalWorkouts >= 1;
    case "fitness_guru_50":
      return data.totalWorkouts >= 50;
    case "nutrition_master":
      return data.totalMealDaysFollowed >= 7;
    case "challenge_completer":
      return (data.challengesCompleted ?? 0) >= 1;
    case "challenge_winner":
      return (data.challengesWon ?? 0) >= 1;
    case "referral_first":
      return (data.referralsCount ?? 0) >= 1;
    default:
      return false;
  }
}

// ============ Daily Tasks ============
export interface DailyTaskDefinition {
  id: DailyTaskId;
  icon: string;
  xpReward: number;
}

export const DAILY_TASKS: DailyTaskDefinition[] = [
  { id: "daily_login", icon: "✅", xpReward: XP_REWARDS.dailyLogin },
  { id: "complete_workout", icon: "🏋️", xpReward: XP_REWARDS.workoutComplete },
  { id: "follow_meal_plan", icon: "🍽️", xpReward: XP_REWARDS.mealPlanFollow },
  { id: "drink_water", icon: "💧", xpReward: XP_REWARDS.drinkWater },
  { id: "ask_bodypilot", icon: "🤖", xpReward: XP_REWARDS.askBodypilot },
];

// ============ Motivation Quotes ============
export const MOTIVATION_QUOTES = {
  tr: [
    "Bugün kendinin en iyi versiyonu ol!",
    "Başarı, her gün küçük adımlar atmakla gelir.",
    "Vücudun sana teşekkür edecek!",
    "Acı geçici, gurur kalıcıdır.",
    "Disiplin özgürlüktür.",
    "Hedefine bir adım daha yaklaştın!",
    "Harika gidiyorsun, devam et!",
    "Zor olan değerlidir.",
    "Kendine inan, başarı kaçınılmaz.",
    "Her antrenman seni güçlendirir.",
    "Bugün yorgun hissedebilirsin, yarın güçlü hissedeceksin.",
    "Mükemmelliği değil, ilerlemeyi hedefle.",
    "Sağlık en büyük zenginliktir.",
    "Tutarlılık anahtardır.",
    "Kendini seven, kendine bakar.",
    "Motivasyon seni başlatır, alışkanlık seni devam ettirir.",
    "Limitlerini zorla!",
    "Her gün yeni bir fırsat.",
    "Başlamak için mükemmel zamanı bekleme.",
    "Sen düşündüğünden daha güçlüsün!",
  ],
  en: [
    "Be the best version of yourself today!",
    "Success comes from taking small steps every day.",
    "Your body will thank you!",
    "Pain is temporary, pride is forever.",
    "Discipline is freedom.",
    "You're one step closer to your goal!",
    "You're doing great, keep going!",
    "What's hard is valuable.",
    "Believe in yourself, success is inevitable.",
    "Every workout makes you stronger.",
    "You may feel tired today, you'll feel strong tomorrow.",
    "Aim for progress, not perfection.",
    "Health is the greatest wealth.",
    "Consistency is key.",
    "Those who love themselves, take care of themselves.",
    "Motivation gets you started, habit keeps you going.",
    "Push your limits!",
    "Every day is a new opportunity.",
    "Don't wait for the perfect moment to start.",
    "You're stronger than you think!",
  ],
  de: [
    "Sei heute die beste Version von dir selbst!",
    "Erfolg kommt durch kleine Schritte jeden Tag.",
    "Dein Körper wird es dir danken!",
    "Schmerz ist vorübergehend, Stolz ist für immer.",
    "Disziplin ist Freiheit.",
    "Du bist deinem Ziel einen Schritt näher!",
    "Du machst das großartig, weiter so!",
    "Was schwer ist, ist wertvoll.",
    "Glaube an dich, Erfolg ist unvermeidlich.",
    "Jedes Training macht dich stärker.",
    "Du fühlst dich heute müde, morgen stark.",
    "Strebe nach Fortschritt, nicht nach Perfektion.",
    "Gesundheit ist der größte Reichtum.",
    "Beständigkeit ist der Schlüssel.",
    "Wer sich selbst liebt, kümmert sich um sich.",
    "Motivation bringt dich in Gang, Gewohnheit hält dich am Laufen.",
    "Überschreite deine Grenzen!",
    "Jeder Tag ist eine neue Chance.",
    "Warte nicht auf den perfekten Moment.",
    "Du bist stärker als du denkst!",
  ],
  ru: [
    "Будь лучшей версией себя сегодня!",
    "Успех приходит с маленькими шагами каждый день.",
    "Твоё тело скажет тебе спасибо!",
    "Боль временна, гордость вечна.",
    "Дисциплина — это свобода.",
    "Ты на шаг ближе к своей цели!",
    "Ты молодец, продолжай!",
    "Что сложно, то ценно.",
    "Верь в себя, успех неизбежен.",
    "Каждая тренировка делает тебя сильнее.",
    "Сегодня ты устал, завтра будешь силён.",
    "Стремись к прогрессу, а не к совершенству.",
    "Здоровье — главное богатство.",
    "Постоянство — это ключ.",
    "Кто любит себя, тот заботится о себе.",
    "Мотивация запускает, привычка продолжает.",
    "Раздвигай свои границы!",
    "Каждый день — новая возможность.",
    "Не жди идеального момента.",
    "Ты сильнее, чем думаешь!",
  ],
} as const;

export function getRandomQuote(language: "tr" | "en" | "de" | "ru"): string {
  const quotes = MOTIVATION_QUOTES[language];
  const index = Math.floor(Math.random() * quotes.length);
  return quotes[index];
}

export function getDailyQuote(language: "tr" | "en" | "de" | "ru"): string {
  const quotes = MOTIVATION_QUOTES[language];
  // Use date as seed for consistent daily quote
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % quotes.length;
  return quotes[index];
}
