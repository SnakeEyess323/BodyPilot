import type { Challenge, ChallengeStatus } from "@/lib/types";

/**
 * Fallback challenge definitions used when Supabase is unreachable.
 * The same data lives in the `challenges` table for production use.
 */
export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "10-gun-baslangic",
    title_tr: "10 Gün Başlangıç",
    title_en: "10 Day Kickstart",
    title_de: "10-Tage-Kickstart",
    title_ru: "10-дневный старт",
    description_tr:
      "Fitness yolculuğuna başlama zamanı! 10 gün boyunca her gün antrenman yap ve alışkanlık kazanmaya başla.",
    description_en:
      "Time to start your fitness journey! Work out every day for 10 days and build the habit.",
    description_de:
      "Zeit, deine Fitnessreise zu starten! Trainiere 10 Tage lang jeden Tag und baue die Gewohnheit auf.",
    description_ru:
      "Время начать фитнес-путешествие! Тренируйся каждый день в течение 10 дней и выработай привычку.",
    motivation_tr: "Her yeni başlangıç, büyük bir dönüşümün ilk adımıdır!",
    motivation_en:
      "Every new beginning is the first step of a great transformation!",
    motivation_de:
      "Jeder neue Anfang ist der erste Schritt einer großen Verwandlung!",
    motivation_ru:
      "Каждое новое начало — первый шаг к великой трансформации!",
    duration_days: 10,
    start_date: "2026-03-01T00:00:00Z",
    end_date: "2026-03-10T23:59:59Z",
    icon: "🚀",
    points_per_day: 10,
    bonus_points: 50,
    created_at: "2026-02-16T00:00:00Z",
  },
  {
    id: "21-gun-aliskanlik",
    title_tr: "21 Gün Alışkanlık",
    title_en: "21 Day Habit Builder",
    title_de: "21-Tage-Gewohnheit",
    title_ru: "21-дневная привычка",
    description_tr:
      "21 gün boyunca sporu alışkanlık haline getir! Her gün en az 30 dakika hareket et ve vücudunu dönüştür.",
    description_en:
      "Make fitness a habit in 21 days! Move at least 30 minutes every day and transform your body.",
    description_de:
      "Mach Fitness in 21 Tagen zur Gewohnheit! Bewege dich jeden Tag mindestens 30 Minuten.",
    description_ru:
      "Сделай фитнес привычкой за 21 день! Двигайся минимум 30 минут каждый день.",
    motivation_tr:
      "Alışkanlıklar karakter oluşturur, karakter kader belirler!",
    motivation_en:
      "Habits build character, character determines destiny!",
    motivation_de:
      "Gewohnheiten formen den Charakter, Charakter bestimmt das Schicksal!",
    motivation_ru:
      "Привычки формируют характер, характер определяет судьбу!",
    duration_days: 21,
    start_date: "2026-03-10T00:00:00Z",
    end_date: "2026-03-30T23:59:59Z",
    icon: "🔥",
    points_per_day: 15,
    bonus_points: 100,
    created_at: "2026-02-16T00:00:00Z",
  },
  {
    id: "30-gun-donusum",
    title_tr: "Zirve Dönüşümü",
    title_en: "Peak Transformation",
    title_de: "Gipfel-Transformation",
    title_ru: "Пиковая трансформация",
    description_tr:
      "En sadık kullanıcılar için sonuç odaklı bir maraton! 1. gün kapasiteni test et, her gün artan bir programla ilerle. Her 6 günde 1 aktif dinlenme günü. 30. günde başlangıç skorunu en az %50 artır!",
    description_en:
      "A results-driven marathon for the most dedicated users! Test your capacity on day 1, progress with an increasing daily program. Active rest every 6th day. Beat your starting score by at least 50% on day 30!",
    description_de:
      "Ein ergebnisorientierter Marathon für die engagiertesten Nutzer! Teste deine Kapazität am 1. Tag, steigere dich täglich. Aktive Ruhe alle 6 Tage. Schlage deinen Startwert am 30. Tag um mindestens 50%!",
    description_ru:
      "Марафон для самых преданных пользователей! Проверь свои возможности в 1-й день, прогрессируй с ежедневной программой. Активный отдых каждый 6-й день. Побей начальный результат минимум на 50% на 30-й день!",
    motivation_tr: "30 günün sonunda kendi sınırlarını yeniden tanımla. Başarı rozetini profilinde sergile!",
    motivation_en:
      "Redefine your limits in 30 days. Earn the achievement badge and showcase it on your profile!",
    motivation_de:
      "Definiere deine Grenzen in 30 Tagen neu. Verdiene das Erfolgsabzeichen und zeige es in deinem Profil!",
    motivation_ru:
      "Переопредели свои пределы за 30 дней. Заработай значок достижения и покажи его в своём профиле!",
    duration_days: 30,
    start_date: "2026-04-01T00:00:00Z",
    end_date: "2026-04-30T23:59:59Z",
    icon: "🏔️",
    points_per_day: 20,
    bonus_points: 200,
    created_at: "2026-02-16T00:00:00Z",
  },
];

/** Get the localised title for a challenge */
export function getChallengeTitle(
  challenge: Challenge,
  language: string
): string {
  const key = `title_${language}` as keyof Challenge;
  return (challenge[key] as string) || challenge.title_en;
}

/** Get the localised description for a challenge */
export function getChallengeDescription(
  challenge: Challenge,
  language: string
): string {
  const key = `description_${language}` as keyof Challenge;
  return (challenge[key] as string) || challenge.description_en;
}

/** Get the localised motivation for a challenge */
export function getChallengeMotivation(
  challenge: Challenge,
  language: string
): string {
  const key = `motivation_${language}` as keyof Challenge;
  return (challenge[key] as string) || challenge.motivation_en;
}

/** Determine the current status of a challenge */
export function getChallengeStatus(challenge: Challenge): ChallengeStatus {
  const now = new Date();
  const start = new Date(challenge.start_date);
  const end = new Date(challenge.end_date);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "active";
}

/** Days remaining until the challenge ends (0 if ended) */
export function getDaysRemaining(challenge: Challenge): number {
  const now = new Date();
  const end = new Date(challenge.end_date);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Days until the challenge starts (0 if already started) */
export function getDaysUntilStart(challenge: Challenge): number {
  const now = new Date();
  const start = new Date(challenge.start_date);
  const diff = start.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Number of elapsed days since the challenge started */
export function getElapsedDays(challenge: Challenge): number {
  const now = new Date();
  const start = new Date(challenge.start_date);
  const diff = now.getTime() - start.getTime();
  if (diff <= 0) return 0;
  return Math.min(
    challenge.duration_days,
    Math.floor(diff / (1000 * 60 * 60 * 24))
  );
}

/** Progress percentage for a participant (0-100) */
export function getProgressPercent(
  completedDays: string[],
  totalDays: number
): number {
  if (totalDays <= 0) return 0;
  return Math.min(100, Math.round((completedDays.length / totalDays) * 100));
}

/** Format date range for display */
export function formatDateRange(
  startDate: string,
  endDate: string,
  language: string
): string {
  const locale =
    language === "tr"
      ? "tr-TR"
      : language === "de"
        ? "de-DE"
        : language === "ru"
          ? "ru-RU"
          : "en-US";

  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };
  return `${start.toLocaleDateString(locale, opts)} - ${end.toLocaleDateString(locale, opts)}`;
}
