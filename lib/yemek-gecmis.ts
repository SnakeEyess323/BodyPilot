import type { OgunTipi } from "@/lib/parseYemekProgram";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

// =============================================================================
// TYPES
// =============================================================================

export interface YemekGecmisGunlukOgun {
  baslik: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
}

export interface YemekGecmisGun {
  tarih: string; // "2026-02-14"
  ogunler: Record<OgunTipi, YemekGecmisGunlukOgun[]>;
  toplamlar: {
    kalori: number;
    protein: number;
    karbonhidrat: number;
    yag: number;
  };
}

// =============================================================================
// STORAGE
// =============================================================================

const HISTORY_KEY = "bodypilot-yemek-gecmis";
const MAX_DAYS = 30; // Son 30 gun sakla

// =============================================================================
// HELPERS
// =============================================================================

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateLabel(tarih: string): string {
  const today = getTodayKey();

  if (tarih === today) return "Bugün";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (tarih === yesterday.toISOString().slice(0, 10)) return "Dün";

  try {
    const d = new Date(tarih + "T00:00:00");
    const gunler = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const aylar = [
      "Oca", "Şub", "Mar", "Nis", "May", "Haz",
      "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
    ];
    return `${gunler[d.getDay()]} ${d.getDate()} ${aylar[d.getMonth()]}`;
  } catch {
    return tarih;
  }
}

// =============================================================================
// LOAD / SAVE (user-scoped)
// =============================================================================

export function loadYemekGecmis(userId: string): YemekGecmisGun[] {
  if (!userId) return [];
  const data = getUserStorageJSON<YemekGecmisGun[]>(HISTORY_KEY, userId);
  return Array.isArray(data) ? data : [];
}

function saveYemekGecmis(userId: string, history: YemekGecmisGun[]) {
  if (!userId) return;
  const trimmed = history.slice(-MAX_DAYS);
  setUserStorageJSON(HISTORY_KEY, userId, trimmed);
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

/**
 * Bugunku yemekleri gecmise kaydeder.
 * Her "Ekle" veya secim yapildiginda cagirilir.
 */
export function saveTodayToYemekGecmis(
  userId: string,
  ogunler: Record<OgunTipi, YemekGecmisGunlukOgun[]>,
  toplamlar: { kalori: number; protein: number; karbonhidrat: number; yag: number }
): void {
  if (!userId) return;
  // En az bir yemek olmali
  const hasAny = Object.values(ogunler).some((arr) => arr.length > 0);
  if (!hasAny && toplamlar.kalori === 0) return;

  const tarih = getTodayKey();
  const history = loadYemekGecmis(userId);

  const entry: YemekGecmisGun = { tarih, ogunler, toplamlar };

  const existingIndex = history.findIndex((h) => h.tarih === tarih);
  if (existingIndex >= 0) {
    history[existingIndex] = entry;
  } else {
    history.push(entry);
  }

  saveYemekGecmis(userId, history);
}

/**
 * Gecmisi en yeniden en eskiye dondurur.
 */
export function getYemekGecmis(userId: string): YemekGecmisGun[] {
  if (!userId) return [];
  return [...loadYemekGecmis(userId)].reverse();
}
