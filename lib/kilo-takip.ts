import { getUserStorageJSON, setUserStorageJSON } from "@/lib/user-storage";

// =============================================================================
// TYPES
// =============================================================================

export interface SetKayit {
  set: number;
  tekrar: number;
  kilo: number;
}

export interface HareketKayit {
  id: string;
  hareketAdi: string;
  kasGrubu: string;
  setler: SetKayit[];
  notlar?: string;
}

export interface GunlukAntrenman {
  id: string;
  tarih: string; // ISO "2026-02-17"
  hareketler: HareketKayit[];
}

export interface KisiselRekor {
  hareketAdi: string;
  kasGrubu: string;
  maxKilo: number;
  tekrar: number;
  tarih: string;
}

// Kas grubu seçenekleri
export const KAS_GRUPLARI = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "abs",
  "glutes",
  "cardio",
  "other",
] as const;

export type KasGrubu = (typeof KAS_GRUPLARI)[number];

export const KAS_GRUBU_LABELS: Record<string, Record<KasGrubu, string>> = {
  tr: {
    chest: "Göğüs",
    back: "Sırt",
    legs: "Bacak",
    shoulders: "Omuz",
    arms: "Kol",
    abs: "Karın",
    glutes: "Kalça",
    cardio: "Kardiyo",
    other: "Diğer",
  },
  en: {
    chest: "Chest",
    back: "Back",
    legs: "Legs",
    shoulders: "Shoulders",
    arms: "Arms",
    abs: "Abs",
    glutes: "Glutes",
    cardio: "Cardio",
    other: "Other",
  },
  de: {
    chest: "Brust",
    back: "Rücken",
    legs: "Beine",
    shoulders: "Schultern",
    arms: "Arme",
    abs: "Bauch",
    glutes: "Gesäß",
    cardio: "Kardio",
    other: "Sonstige",
  },
  ru: {
    chest: "Грудь",
    back: "Спина",
    legs: "Ноги",
    shoulders: "Плечи",
    arms: "Руки",
    abs: "Пресс",
    glutes: "Ягодицы",
    cardio: "Кардио",
    other: "Другое",
  },
};

export const KAS_GRUBU_ICONS: Record<KasGrubu, string> = {
  chest: "🏋️",
  back: "🔙",
  legs: "🦵",
  shoulders: "💪",
  arms: "💪",
  abs: "🎯",
  glutes: "🍑",
  cardio: "🏃",
  other: "⚡",
};

// =============================================================================
// STORAGE
// =============================================================================

const STORAGE_KEY = "bodypilot-kilo-takip";
const MAX_DAYS = 90;

export function loadKiloTakip(userId: string): GunlukAntrenman[] {
  if (!userId) return [];
  const data = getUserStorageJSON<GunlukAntrenman[]>(STORAGE_KEY, userId);
  return Array.isArray(data) ? data : [];
}

export function saveKiloTakip(userId: string, data: GunlukAntrenman[]): void {
  if (!userId) return;
  const sorted = [...data].sort((a, b) => a.tarih.localeCompare(b.tarih));
  const trimmed = sorted.slice(-MAX_DAYS);
  setUserStorageJSON(STORAGE_KEY, userId, trimmed);
}

export function addAntrenman(userId: string, antrenman: GunlukAntrenman): void {
  const all = loadKiloTakip(userId);
  all.push(antrenman);
  saveKiloTakip(userId, all);
}

export function updateAntrenman(userId: string, antrenman: GunlukAntrenman): void {
  const all = loadKiloTakip(userId);
  const idx = all.findIndex((a) => a.id === antrenman.id);
  if (idx >= 0) {
    all[idx] = antrenman;
  } else {
    all.push(antrenman);
  }
  saveKiloTakip(userId, all);
}

export function deleteAntrenman(userId: string, id: string): void {
  const all = loadKiloTakip(userId);
  saveKiloTakip(userId, all.filter((a) => a.id !== id));
}

// =============================================================================
// ANALYTICS
// =============================================================================

export function getHareketGecmis(
  data: GunlukAntrenman[],
  hareketAdi: string
): { tarih: string; maxKilo: number; toplamHacim: number }[] {
  const results: { tarih: string; maxKilo: number; toplamHacim: number }[] = [];
  for (const gun of data) {
    for (const hareket of gun.hareketler) {
      if (hareket.hareketAdi.toLowerCase() === hareketAdi.toLowerCase()) {
        const maxKilo = Math.max(...hareket.setler.map((s) => s.kilo), 0);
        const toplamHacim = hareket.setler.reduce((acc, s) => acc + s.kilo * s.tekrar, 0);
        results.push({ tarih: gun.tarih, maxKilo, toplamHacim });
      }
    }
  }
  return results.sort((a, b) => a.tarih.localeCompare(b.tarih));
}

export function getKisiselRekorlar(data: GunlukAntrenman[]): KisiselRekor[] {
  const prMap = new Map<string, KisiselRekor>();

  for (const gun of data) {
    for (const hareket of gun.hareketler) {
      for (const set of hareket.setler) {
        const key = hareket.hareketAdi.toLowerCase();
        const existing = prMap.get(key);
        if (!existing || set.kilo > existing.maxKilo) {
          prMap.set(key, {
            hareketAdi: hareket.hareketAdi,
            kasGrubu: hareket.kasGrubu,
            maxKilo: set.kilo,
            tekrar: set.tekrar,
            tarih: gun.tarih,
          });
        }
      }
    }
  }

  return Array.from(prMap.values()).sort((a, b) => b.maxKilo - a.maxKilo);
}

export function getSonAntrenmanBilgisi(
  data: GunlukAntrenman[],
  hareketAdi: string,
  excludeId?: string
): { maxKilo: number; setler: SetKayit[] } | null {
  const sorted = [...data].sort((a, b) => b.tarih.localeCompare(a.tarih));
  for (const gun of sorted) {
    if (gun.id === excludeId) continue;
    for (const hareket of gun.hareketler) {
      if (hareket.hareketAdi.toLowerCase() === hareketAdi.toLowerCase()) {
        const maxKilo = Math.max(...hareket.setler.map((s) => s.kilo), 0);
        return { maxKilo, setler: hareket.setler };
      }
    }
  }
  return null;
}

export function getToplamHacim(antrenman: GunlukAntrenman): number {
  return antrenman.hareketler.reduce(
    (acc, h) => acc + h.setler.reduce((a, s) => a + s.kilo * s.tekrar, 0),
    0
  );
}

export function getTumHareketAdlari(data: GunlukAntrenman[]): string[] {
  const names = new Set<string>();
  for (const gun of data) {
    for (const hareket of gun.hareketler) {
      names.add(hareket.hareketAdi);
    }
  }
  return Array.from(names).sort();
}

export function generateId(): string {
  return `wt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatTarih(tarih: string, lang: string = "tr"): string {
  try {
    const date = new Date(tarih + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return { tr: "Bugün", en: "Today", de: "Heute", ru: "Сегодня" }[lang] || "Bugün";
    }
    if (dateOnly.getTime() === yesterday.getTime()) {
      return { tr: "Dün", en: "Yesterday", de: "Gestern", ru: "Вчера" }[lang] || "Dün";
    }

    const months: Record<string, string[]> = {
      tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
      en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      de: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
      ru: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
    };
    const m = months[lang] || months.tr;
    return `${date.getDate()} ${m[date.getMonth()]}`;
  } catch {
    return tarih;
  }
}
