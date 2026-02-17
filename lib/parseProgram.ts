import type { GunAdi, HaftalikProgram } from "./types";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

export type KaloriMap = Partial<Record<GunAdi, number>>;

export interface ParsedProgram {
  program: HaftalikProgram;
  kaloriler: KaloriMap;
}

const GUN_SIRASI: GunAdi[] = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

// All day name variants mapped to Turkish GunAdi index (0=Pazartesi..6=Pazar)
const DAY_NAME_VARIANTS: Record<string, number> = {
  // Turkish
  pazartesi: 0, salı: 1, çarşamba: 2, perşembe: 3, cuma: 4, cumartesi: 5, pazar: 6,
  // English
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
  // German
  montag: 0, dienstag: 1, mittwoch: 2, donnerstag: 3, freitag: 4, samstag: 5, sonntag: 6,
  // Russian
  "понедельник": 0, "вторник": 1, "среда": 2, "четверг": 3, "пятница": 4, "суббота": 5, "воскресенье": 6,
};

const ALL_DAY_NAMES = Object.keys(DAY_NAME_VARIANTS).join("|");
const GUN_PATTERN = new RegExp(
  `(${ALL_DAY_NAMES})\\s*:\\s*`,
  "gi"
);

function mapDayNameToGunAdi(dayName: string): GunAdi | null {
  const idx = DAY_NAME_VARIANTS[dayName.toLowerCase()];
  if (idx === undefined) return null;
  return GUN_SIRASI[idx];
}

// Kalori degerini gunun basligindan veya iceriginden parse eder
// Ornek: "(~350 kcal)" veya "~350 kcal" veya "350 kcal"
const KALORI_PATTERN = /\(?~?(\d+)\s*kcal\)?/i;

function emptyProgram(): HaftalikProgram {
  return GUN_SIRASI.reduce((acc, gun) => ({ ...acc, [gun]: "" }), {} as HaftalikProgram);
}

/**
 * Bir gunun iceriginden kalori degerini cikarir ve iceritten temizler.
 */
function extractKalori(content: string): { content: string; kalori: number | null } {
  const match = content.match(KALORI_PATTERN);
  if (!match) return { content, kalori: null };
  const kalori = parseInt(match[1], 10);
  // Kalori etiketini icerikten temizle (ilk satirdan)
  const lines = content.split("\n");
  if (lines.length > 0) {
    lines[0] = lines[0].replace(KALORI_PATTERN, "").trim();
    // Bos ilk satir kaldiysa sil
    if (!lines[0]) lines.shift();
  }
  return { content: lines.join("\n").trim(), kalori: isNaN(kalori) ? null : kalori };
}

/**
 * Her günün içeriğinden giriş/tanıtım cümlelerini temizler.
 * "İşte ... programı:" gibi satırları kaldırır, sadece egzersiz bilgilerini bırakır.
 */
function cleanDayContent(content: string): string {
  if (!content) return content;
  const lines = content.split("\n");
  const cleaned: string[] = [];
  let foundExercise = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Boş satırları atla (egzersiz bulunmadan önce)
    if (!trimmed && !foundExercise) continue;
    // Skip introduction sentences in any language
    if (!foundExercise && /^(İşte|Here\s+is|Hier\s+ist|Вот)\s/i.test(trimmed)) continue;
    if (!foundExercise && /(haftalık\s+antrenman|weekly\s+workout|wöchentliches?\s+Training|недельная\s+программа)/i.test(trimmed)) continue;
    if (!foundExercise && /^(hedef|boy|kilo|yaş|goal|height|weight|age|Ziel|Gewicht|Größe|Alter|цель|рост|вес|возраст)/i.test(trimmed) && !/set|tekrar|saniye|reps?|sec/i.test(trimmed)) continue;
    // İçerik satırı bulundu
    foundExercise = true;
    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
}

/**
 * API'den gelen antrenman metnini günlere böler.
 * Başlıklar "Pazartesi:", "Salı:", ... formatında aranır.
 * Eşleşmezse tüm metin Pazartesi'ye konur; eksik günler boş bırakılır.
 * Giriş cümleleri ("İşte ... programı:") otomatik olarak temizlenir.
 * Ayrıca her gün için tahmini yakılacak kalori değerini de parse eder.
 */
export function parseProgramToDays(fullText: string): ParsedProgram {
  const result = emptyProgram();
  const kaloriler: KaloriMap = {};
  if (!fullText?.trim()) return { program: result, kaloriler };

  const normalized = fullText.trim();
  const parts = normalized.split(GUN_PATTERN);

  // split with capturing group: [intro?, "Pazartesi", content1, "Salı", content2, ...]
  if (parts.length < 2) {
    // Gün başlığı bulunamadı, tüm metni temizleyip Pazartesi'ye koy
    const { content: cleaned, kalori } = extractKalori(cleanDayContent(normalized));
    result.Pazartesi = cleaned;
    if (kalori !== null) kaloriler.Pazartesi = kalori;
    return { program: result, kaloriler };
  }

  // parts[0] giriş metnidir (intro), onu yok sayıyoruz

  for (let i = 1; i < parts.length - 1; i += 2) {
    const dayName = parts[i]?.trim();
    const content = parts[i + 1]?.trim() ?? "";
    if (!dayName) continue;
    // Map any language day name to Turkish GunAdi
    const gun = mapDayNameToGunAdi(dayName);
    if (gun) {
      const cleanedContent = cleanDayContent(content);
      const { content: finalContent, kalori } = extractKalori(cleanedContent);
      result[gun] = (result[gun] ? result[gun] + "\n\n" + finalContent : finalContent).trim();
      if (kalori !== null) kaloriler[gun] = kalori;
    }
  }

  return { program: result, kaloriler };
}

// Kalori localStorage yardımcıları (user-scoped)
const KALORI_STORAGE_KEY = "bodypilot-antrenman-kalori";

export function loadKaloriler(userId: string): KaloriMap {
  if (!userId) return {};
  const data = getUserStorageJSON<KaloriMap>(KALORI_STORAGE_KEY, userId);
  return data && typeof data === "object" ? data : {};
}

export function saveKaloriler(userId: string, kaloriler: KaloriMap) {
  if (!userId) return;
  setUserStorageJSON(KALORI_STORAGE_KEY, userId, kaloriler);
}

/**
 * MET (Metabolic Equivalent of Task) tabanlı kalori hesaplama.
 * Formül: Kalori = MET × Kilo(kg) × Süre(saat)
 * 
 * MET değerleri: Compendium of Physical Activities (Arizona State University) kaynaklı.
 * https://pacompendium.com/
 * 
 * Ağırlık egzersizleri için: 1 set ≈ 1.5 dakika (set + dinlenme arası)
 * Varsayılan süre: 3 set × 1.5 dk = 4.5 dk ≈ 0.075 saat
 */

interface METEntry {
  met: number;          // MET değeri
  defaultDkPerSet: number; // set başına varsayılan dakika (set + dinlenme)
  defaultSets: number;  // varsayılan set sayısı
  isCardio: boolean;    // kardio mu (süre bazlı) yoksa set bazlı mı
}

// MET tablosu - bilimsel kaynaklara dayalı
const MET_TABLOSU: Record<string, METEntry> = {
  // === KARDİO (süre bazlı, varsayılan 10 dk) ===
  "koşu": { met: 9.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "koş": { met: 9.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "running": { met: 9.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "run": { met: 9.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "sprint": { met: 12.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "yürüyüş": { met: 3.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "yürü": { met: 3.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "walking": { met: 3.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "walk": { met: 3.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "tempolu yürüyüş": { met: 5.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "bisiklet": { met: 7.5, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "cycling": { met: 7.5, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "bike": { met: 7.5, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "ip atlama": { met: 11.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "jump rope": { met: 11.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "ip atla": { met: 11.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "kürek çekme": { met: 7.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "rowing": { met: 7.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "yüzme": { met: 8.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "swimming": { met: 8.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "yüz": { met: 8.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "merdiven": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "stairs": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "eliptik": { met: 5.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "elliptical": { met: 5.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "hiit": { met: 12.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "tabata": { met: 14.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "dans": { met: 5.5, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "dance": { met: 5.5, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "koşu bandı": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "treadmill": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },

  // === GÖĞÜS (set bazlı) ===
  "bench press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "bench": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "göğüs press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "incline press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "decline press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "şınav": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "push up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "pushup": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "push-up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "dumbbell fly": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "fly": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "açma": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "dips": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "dip": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "cable crossover": { met: 4.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "crossover": { met: 4.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "chest press": { met: 5.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },

  // === SIRT (set bazlı) ===
  "deadlift": { met: 8.0, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "ölü çekiş": { met: 8.0, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "barbell row": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "row": { met: 5.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "lat pulldown": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "pulldown": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "pull up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "pullup": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "pull-up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "barfiks": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "chin up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "chin-up": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "t-bar row": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "seated row": { met: 5.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },

  // === BACAK (set bazlı) ===
  "squat": { met: 7.5, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "skuat": { met: 7.5, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "çömelme": { met: 7.5, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "leg press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "bacak press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "lunge": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "lunges": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "hamle": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "leg curl": { met: 4.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "bacak kıvrım": { met: 4.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "hamstring curl": { met: 4.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "leg extension": { met: 4.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "bacak açma": { met: 4.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "calf raise": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "baldır": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "bulgarian split": { met: 6.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "hip thrust": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "kalça": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "hack squat": { met: 7.0, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "front squat": { met: 7.5, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "sumo squat": { met: 7.0, defaultDkPerSet: 2.0, defaultSets: 3, isCardio: false },
  "goblet squat": { met: 6.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },

  // === OMUZ (set bazlı) ===
  "shoulder press": { met: 5.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "omuz press": { met: 5.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "military press": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "lateral raise": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "yan kaldırma": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "lateral": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "front raise": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "ön kaldırma": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "face pull": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "shrug": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "omuz silkme": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "arnold press": { met: 5.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },

  // === KOL (set bazlı) ===
  "bicep curl": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "curl": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "kol bükme": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "tricep": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "triceps": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "hammer curl": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "skull crusher": { met: 4.5, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "preacher curl": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "tricep pushdown": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "concentration curl": { met: 3.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },

  // === KARIN (set bazlı) ===
  "plank": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "planke": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "crunch": { met: 3.8, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "mekik": { met: 3.8, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "sit up": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "sit-up": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "leg raise": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "bacak kaldırma": { met: 4.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "russian twist": { met: 4.5, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "ab wheel": { met: 5.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "mountain climber": { met: 8.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },
  "burpee": { met: 10.0, defaultDkPerSet: 1.0, defaultSets: 3, isCardio: false },

  // === GENEL / SPORLAR (süre bazlı) ===
  "stretching": { met: 2.3, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "esneme": { met: 2.3, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "germe": { met: 2.3, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "yoga": { met: 3.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "pilates": { met: 3.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "futbol": { met: 10.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "football": { met: 10.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "soccer": { met: 10.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "basketbol": { met: 8.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "basketball": { met: 8.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "tenis": { met: 7.3, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "tennis": { met: 7.3, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "voleybol": { met: 6.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "volleyball": { met: 6.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "boks": { met: 12.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "boxing": { met: 12.8, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "kickboks": { met: 12.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "kickboxing": { met: 12.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "güreş": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "wrestling": { met: 9.0, defaultDkPerSet: 1, defaultSets: 1, isCardio: true },
  "halter": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
  "weightlifting": { met: 6.0, defaultDkPerSet: 1.5, defaultSets: 3, isCardio: false },
};

// Varsayılan MET değeri: orta yoğunlukta ağırlık antrenmanı
const DEFAULT_MET = 5.0;
const DEFAULT_SET = 3;
const DEFAULT_DK_PER_SET = 1.5;
const DEFAULT_CARDIO_DK = 20; // Kardio için varsayılan süre
const DEFAULT_KILO = 70; // Kilo bilinmiyorsa

/**
 * Profil bilgisiyle MET tabanlı kalori hesaplama.
 * Formül: Kalori = MET × Kilo(kg) × Süre(saat)
 * 
 * @param content - Egzersiz içeriği (satır satır)
 * @param kilo - Kullanıcının kilosu (kg). Yoksa 70 kg varsayılır.
 */
export function estimateKalori(content: string, kilo?: number): number {
  if (!content || content.trim() === "") return 0;

  const kg = kilo && kilo > 0 ? kilo : DEFAULT_KILO;
  const lines = content.split("\n").filter((l) => l.trim() !== "");
  let toplam = 0;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.length < 3) continue;
    if (lower === "dinlenme" || lower === "rest" || lower === "-" || lower === "yok") continue;

    // Satırdan set, tekrar, süre bilgilerini çıkar
    const setMatch = lower.match(/(\d+)\s*(?:set|seri)/i);
    const tekrarMatch = lower.match(/(\d+)\s*(?:tekrar|reps?|rep)/i);
    const dkMatch = lower.match(/(\d+)\s*(?:dk|min|dakika|minute|minutes)/i);
    const saatMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:saat|hour|hr|sa)/i);
    const snMatch = lower.match(/(\d+)\s*(?:sn|sec|saniye|second)/i);

    // MET tablosundan egzersizi bul
    let entry: METEntry | null = null;
    for (const [keyword, e] of Object.entries(MET_TABLOSU)) {
      if (lower.includes(keyword)) {
        entry = e;
        break;
      }
    }

    const met = entry?.met ?? DEFAULT_MET;
    let sureDk: number;

    if (entry?.isCardio) {
      // Kardio: süre bazlı hesapla
      if (saatMatch) {
        sureDk = parseFloat(saatMatch[1]) * 60;
      } else if (dkMatch) {
        sureDk = parseInt(dkMatch[1], 10);
      } else if (snMatch) {
        sureDk = parseInt(snMatch[1], 10) / 60;
      } else {
        sureDk = DEFAULT_CARDIO_DK;
      }
    } else {
      // Ağırlık/set bazlı: set × dk/set
      const sets = setMatch ? parseInt(setMatch[1], 10) : (entry?.defaultSets ?? DEFAULT_SET);
      const dkPerSet = entry?.defaultDkPerSet ?? DEFAULT_DK_PER_SET;

      // Tekrar sayısı yüksekse (15+) süreyi biraz artır
      if (tekrarMatch) {
        const tekrar = parseInt(tekrarMatch[1], 10);
        const tekrarMultiplier = tekrar > 15 ? 1.3 : tekrar > 10 ? 1.1 : 1.0;
        sureDk = sets * dkPerSet * tekrarMultiplier;
      } else if (dkMatch) {
        // "Plank 1 dk" gibi süre belirtilmişse
        sureDk = parseInt(dkMatch[1], 10) * (setMatch ? parseInt(setMatch[1], 10) : 1);
      } else {
        sureDk = sets * dkPerSet;
      }
    }

    // Kalori = MET × Kilo(kg) × Süre(saat)
    const sureSaat = sureDk / 60;
    const kcal = met * kg * sureSaat;
    toplam += kcal;
  }

  // 5'in katına yuvarla
  return Math.round(toplam / 5) * 5;
}

export { GUN_SIRASI };
