export type GunAdi =
  | "Pazartesi"
  | "Salı"
  | "Çarşamba"
  | "Perşembe"
  | "Cuma"
  | "Cumartesi"
  | "Pazar";

export type HaftalikProgram = Record<GunAdi, string>;

/** Hedef: yeni onboarding seçenekleri + mevcut API değerleri */
export type HedefProfil =
  | "yag_yakmak"
  | "kas_yapmak"
  | "sikilasmak"
  | "kilo_almak"
  | "postur_duzeltmek"
  | "kondisyon_artirmak"
  | "genel_saglikli_yasam"
  | "kilo_verme"
  | "kas"
  | "dayaniklilik"
  | "genel_fitness";

export interface Profil {
  adSoyad?: string;
  yas?: number;
  cinsiyet?: "erkek" | "kadin";
  kilo?: number;
  boy?: number;
  hedef?: HedefProfil[];  // çoklu seçim
  seviye?: "baslangic" | "orta" | "ileri";
  gunSayisi?: string;  // chip value: "1", "2", ... "hergun"
  ortam?: "ev" | "salon";
  kisitlar?: string;
  hedefKilo?: number;
  vucutYagOrani?: string;
  gunlukAdim?: string;  // chip value
  sporYaptiMi?: boolean;
  sporYilSayisi?: string;  // chip value: "hic", "1-2_ay", etc.
  sakatlik?: string;
  kronikRahatsizlik?: string;
  yasakHareket?: string;
  durusBozuklugu?: string;
  antrenmanSuresi?: number;
  vejetaryenVegan?: string;
  alerji?: string;
  sevmedigiYemekler?: string;
  ogunSayisi?: string;  // chip value
  suTuketimi?: string;
  sigara?: string;
  alkol?: string;
  takviye?: string;
  takviyeAciklama?: string;  // takviye evet ise açıklama
  uykuSaati?: string;
  motivasyonSeviyesi?: string;
  zorlanma?: string[];  // çoklu seçim
  onboardingCompleted?: boolean;  // true = onboarding bir defa tamamlandi
}

export interface AntrenmanRequest {
  hedef: string;
  seviye: string;
  gunSayisi: number;
  ortam: string;
  profil: Profil;
  hedefKaslar?: string[];  // Seçilen kas grupları
}

export interface YemekRequest {
  kaloriHedefi?: number;
  kisitlar: string;
  gunSayisi: number;
  profil: Profil;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  profil?: Profil;
  userContext?: string;
}

// ============ Gamification Types ============

export type BadgeId =
  | "first_step"           // İlk giriş
  | "committed_7"          // 7 gün streak
  | "iron_will_30"         // 30 gün streak
  | "century_100"          // 100 gün streak
  | "first_workout"        // İlk antrenman
  | "fitness_guru_50"      // 50 antrenman
  | "nutrition_master"     // 7 gün yemek planına uyma
  | "challenge_completer"  // Bir challenge tamamla
  | "challenge_winner"     // Challenge'da 1. ol
  | "referral_first";      // İlk arkadaş daveti

export type DailyTaskId =
  | "daily_login"
  | "complete_workout"
  | "follow_meal_plan"
  | "drink_water"
  | "ask_bodypilot";

export interface GamificationData {
  // Streak
  currentStreak: number;
  longestStreak: number;
  lastVisitDate: string | null; // ISO date string

  // XP & Level
  totalXP: number;

  // Badges
  unlockedBadges: BadgeId[];

  // Daily Tasks
  dailyTasksDate: string | null; // ISO date string
  completedTasks: DailyTaskId[];

  // Statistics
  totalWorkouts: number;
  totalMealDaysFollowed: number;

  // History
  visitHistory: string[]; // ISO date strings

  // Challenge & Referral
  challengesCompleted: number;
  challengesWon: number;
  referralsCount: number;
}

// ============ Challenge Types ============

export interface Challenge {
  id: string;
  title_tr: string;
  title_en: string;
  title_de: string;
  title_ru: string;
  description_tr: string;
  description_en: string;
  description_de: string;
  description_ru: string;
  motivation_tr: string;
  motivation_en: string;
  motivation_de: string;
  motivation_ru: string;
  duration_days: number;
  start_date: string;
  end_date: string;
  icon: string;
  points_per_day: number;
  bonus_points: number;
  created_at: string;
  // User-created challenge fields
  creator_id?: string;
  rules_text?: string;
  reward_text?: string;
  creator_name?: string;
  is_private?: boolean;
  invite_code?: string;
}

export type ChallengeStatus = "upcoming" | "active" | "ended";

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  points: number;
  completed_days: string[]; // ISO date strings
  status: "active" | "completed" | "abandoned";
  // Joined from profiles for leaderboard display
  user_name?: string;
  user_avatar?: string;
}
