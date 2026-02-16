import type { GunAdi, HaftalikProgram } from "@/lib/types";
import {
  getUserStorage,
  setUserStorage,
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

// =============================================================================
// TYPES
// =============================================================================

export interface AntrenmanGecmisHafta {
  weekKey: string;        // "2026-W7"
  startDate: string;      // "2026-02-09" (Pazartesi)
  program: HaftalikProgram;
  completed: GunAdi[];
}

// =============================================================================
// STORAGE KEYS
// =============================================================================

const HISTORY_KEY = "bodypilot-antrenman-gecmis";
const COMPLETED_KEY = "bodypilot-completed-workouts";
const PROGRAM_KEY = "spor-asistan-haftalik-program";

// =============================================================================
// WEEK KEY HELPERS
// =============================================================================

/**
 * ISO hafta numarasini hesaplar.
 * Pazartesi = haftanin ilk gunu.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Pazar = 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Belirli bir tarih icin hafta key'i dondurur. Ornek: "2026-W7"
 */
export function getWeekKeyForDate(date: Date): string {
  const weekNum = getISOWeekNumber(date);
  // ISO hafta yili, Ocak'in ilk haftasi icin onceki yila ait olabilir
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  return `${year}-W${weekNum}`;
}

/**
 * Mevcut hafta key'ini dondurur.
 */
export function getCurrentWeekKey(): string {
  return getWeekKeyForDate(new Date());
}

/**
 * Bir haftanin Pazartesi tarihini dondurur.
 */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Mevcut haftanin Pazartesi tarihini ISO formatinda dondurur.
 */
export function getCurrentWeekStartDate(): string {
  return getMondayOfWeek(new Date()).toISOString().split("T")[0];
}

// =============================================================================
// LOAD / SAVE (user-scoped)
// =============================================================================

/**
 * Tum gecmis haftalari yukler.
 */
export function loadHistory(userId: string): AntrenmanGecmisHafta[] {
  if (!userId) return [];
  const data = getUserStorageJSON<AntrenmanGecmisHafta[]>(HISTORY_KEY, userId);
  return Array.isArray(data) ? data : [];
}

/**
 * Gecmis haftalari kaydeder.
 */
function saveHistory(userId: string, history: AntrenmanGecmisHafta[]) {
  if (!userId) return;
  // Maksimum 12 hafta sakla
  const trimmed = history.slice(-12);
  setUserStorageJSON(HISTORY_KEY, userId, trimmed);
}

/**
 * Mevcut haftanin tamamlanmis gunlerini okur.
 */
function loadCompletedForWeek(userId: string, weekKey: string): GunAdi[] {
  if (!userId) return [];
  const all = getUserStorageJSON<Record<string, string[]>>(COMPLETED_KEY, userId);
  if (!all) return [];
  return (all[weekKey] || []) as GunAdi[];
}

/**
 * Mevcut haftanin programini okur.
 */
function loadCurrentProgram(userId: string): HaftalikProgram | null {
  if (!userId) return null;
  const parsed = getUserStorageJSON<HaftalikProgram>(PROGRAM_KEY, userId);
  if (!parsed || typeof parsed !== "object") return null;
  // En az bir gun icerik var mi kontrol et
  const hasContent = Object.values(parsed).some(
    (v) => typeof v === "string" && v.trim() !== ""
  );
  if (!hasContent) return null;
  return parsed;
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Mevcut haftayi gecmise kaydeder veya gunceller.
 * Her antrenman tamamlandiginda cagirilmali.
 */
export function saveCurrentWeekToHistory(userId: string): void {
  if (!userId) return;
  const program = loadCurrentProgram(userId);
  if (!program) return; // Program yoksa kaydetme

  const weekKey = getCurrentWeekKey();
  const startDate = getCurrentWeekStartDate();
  const completed = loadCompletedForWeek(userId, weekKey);

  const history = loadHistory(userId);

  // Bu hafta zaten varsa guncelle
  const existingIndex = history.findIndex((h) => h.weekKey === weekKey);

  const entry: AntrenmanGecmisHafta = {
    weekKey,
    startDate,
    program,
    completed,
  };

  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.push(entry);
  }

  saveHistory(userId, history);
}

/**
 * Belirli bir haftanin tamamlanma durumunu gunceller.
 * WorkoutStickyNotes'dan her complete/uncomplete'de cagirilir.
 */
export function updateHistoryCompletion(userId: string, weekKey: string, completed: GunAdi[]): void {
  if (!userId) return;
  const history = loadHistory(userId);
  const existingIndex = history.findIndex((h) => h.weekKey === weekKey);

  if (existingIndex >= 0) {
    history[existingIndex].completed = completed;
    saveHistory(userId, history);
  } else {
    // Bu hafta gecmiste yok, kaydet
    saveCurrentWeekToHistory(userId);
  }
}

/**
 * Gecmis haftalari en yeniden en eskiye siralanmis olarak dondurur.
 * Mevcut haftayi da dahil eder.
 */
export function getHistoryWithCurrentWeek(userId: string): AntrenmanGecmisHafta[] {
  if (!userId) return [];
  // Oncelikle mevcut haftayi kaydet/guncelle
  saveCurrentWeekToHistory(userId);

  const history = loadHistory(userId);

  // En yeniden en eskiye sirala
  return [...history].reverse();
}

/**
 * Bir tarih string'ini "9 Şub - 15 Şub" formatinda gosterir.
 */
export function formatWeekRange(startDateStr: string): string {
  const months = [
    "Oca", "Şub", "Mar", "Nis", "May", "Haz",
    "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
  ];

  try {
    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];

    if (startMonth === endMonth) {
      return `${startDay} - ${endDay} ${endMonth}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
  } catch {
    return startDateStr;
  }
}

/**
 * Hafta key'inden "Bu Hafta", "Gecen Hafta", veya tarih araligi olusturur.
 */
export function getWeekLabel(weekKey: string, startDate: string): string {
  const currentWeek = getCurrentWeekKey();

  if (weekKey === currentWeek) {
    return "Bu Hafta";
  }

  // Gecen haftayi hesapla
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekKey = getWeekKeyForDate(lastWeek);

  if (weekKey === lastWeekKey) {
    return "Geçen Hafta";
  }

  return formatWeekRange(startDate);
}
