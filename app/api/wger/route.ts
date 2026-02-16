import { NextRequest, NextResponse } from "next/server";

const WGER_TOKEN = process.env.WGER_API_TOKEN;
const WGER_BASE = "https://wger.de/api/v2";

// wger exercise base_id mapping (our exercise ID → wger base_id)
// Built from wger search results
const EXERCISE_WGER_MAP: Record<string, number> = {
  // CHEST
  "bench-press": 73,
  "push-up": 1551,
  "dumbbell-fly": 1643,
  "incline-press": 539,
  "cable-crossover": 323,
  // SHOULDERS
  "overhead-press": 687,
  "lateral-raise": 348,
  "front-raise": 256,
  "arnold-press": 20,
  "face-pull": 222,
  // BICEPS
  "barbell-curl": 51,
  "dumbbell-curl": 1482,
  "hammer-curl": 1260,
  "preacher-curl": 465,
  "concentration-curl": 1649,
  // TRICEPS
  "tricep-pushdown": 1185,
  "skull-crusher": 1468,
  "tricep-dip": 1372,
  "overhead-tricep-extension": 1266,
  "close-grip-bench": 1228,
  // FOREARMS
  "wrist-curl": 1771,
  "reverse-curl": 495,
  "farmers-walk": 1021,
  "dead-hang": 853,
  // ABS
  "crunch": 167,
  "plank": 458,
  "leg-raise": 376,
  "ab-wheel": 1573,
  "cable-crunch": 173,
  // OBLIQUES
  "russian-twist": 1193,
  "side-plank": 675,
  "bicycle-crunch": 1412,
  "woodchopper": 209,
  // QUADS
  "squat": 615,
  "leg-press": 371,
  "lunge": 984,
  "leg-extension": 851,
  "bulgarian-split-squat": 278,
  // CALVES
  "standing-calf-raise": 1203,
  "seated-calf-raise": 771,
  "donkey-calf-raise": 308,
  "jump-rope": 810,
  // TRAPS
  "barbell-shrug": 571,
  "dumbbell-shrug": 405,
  "upright-row": 119,
  "face-pull-traps": 222,
  // LATS
  "pull-up": 475,
  "lat-pulldown": 1806,
  "barbell-row": 1698,
  "dumbbell-row": 1227,
  "seated-cable-row": 1117,
  // LOWER BACK
  "deadlift": 184,
  "hyperextension": 301,
  "good-morning": 1392,
  "superman": 734,
  // GLUTES
  "hip-thrust": 294,
  "glute-bridge": 265,
  "cable-kickback": 410,
  "sumo-squat": 648,
  "step-up": 1040,
  // HAMSTRINGS
  "romanian-deadlift": 507,
  "leg-curl": 364,
  "stiff-leg-deadlift": 627,
  "nordic-curl": 839,
  "swiss-ball-curl": 399,
};

// In-memory cache
interface WgerCacheEntry {
  data: WgerExerciseInfo;
  timestamp: number;
}
const cache = new Map<string, WgerCacheEntry>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Search cache (search term → base_id)
const searchCache = new Map<string, number>();

export interface WgerExerciseInfo {
  baseId: number;
  translations: Record<number, string>; // language_id → name
  images: string[];
  videos: string[];
  category: string;
}

async function wgerFetch(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (WGER_TOKEN) {
    headers["Authorization"] = `Token ${WGER_TOKEN}`;
  }
  const res = await fetch(url, { headers, next: { revalidate: 86400 } });
  if (!res.ok) {
    throw new Error(`wger API error: ${res.status}`);
  }
  return res.json();
}

async function searchExercise(term: string): Promise<number | null> {
  if (searchCache.has(term)) {
    return searchCache.get(term)!;
  }
  try {
    const encoded = encodeURIComponent(term);
    const data = await wgerFetch(
      `${WGER_BASE}/exercise/search/?term=${encoded}&language=en&format=json`
    );
    if (data.suggestions && data.suggestions.length > 0) {
      const baseId = data.suggestions[0].data.base_id;
      searchCache.set(term, baseId);
      return baseId;
    }
    return null;
  } catch {
    return null;
  }
}

async function getExerciseInfo(baseId: number): Promise<WgerExerciseInfo | null> {
  const cacheKey = `base_${baseId}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const data = await wgerFetch(
      `${WGER_BASE}/exerciseinfo/${baseId}/?format=json`
    );

    const translations: Record<number, string> = {};
    if (data.translations) {
      for (const t of data.translations) {
        translations[t.language] = t.name;
      }
    }

    const images: string[] = [];
    if (data.images) {
      for (const img of data.images) {
        if (img.image) images.push(img.image);
      }
    }

    const videos: string[] = [];
    if (data.videos) {
      // Prefer MP4 over MOV
      const mp4s = data.videos.filter(
        (v: { video: string }) => v.video?.toLowerCase().endsWith(".mp4")
      );
      const movs = data.videos.filter(
        (v: { video: string }) => !v.video?.toLowerCase().endsWith(".mp4")
      );
      for (const v of [...mp4s, ...movs]) {
        if (v.video) videos.push(v.video);
      }
    }

    const info: WgerExerciseInfo = {
      baseId,
      translations,
      images,
      videos,
      category: data.category?.name || "",
    };

    cache.set(cacheKey, { data: info, timestamp: Date.now() });
    return info;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("id");
  const searchTerm = searchParams.get("search");
  const action = searchParams.get("action");

  // Get media for a specific exercise by our exercise ID
  if (exerciseId) {
    const baseId = EXERCISE_WGER_MAP[exerciseId];
    if (!baseId) {
      return NextResponse.json(
        { error: "Exercise not mapped to wger" },
        { status: 404 }
      );
    }

    const info = await getExerciseInfo(baseId);
    if (!info) {
      return NextResponse.json(
        { error: "Exercise not found in wger" },
        { status: 404 }
      );
    }

    // Language 16 = Turkish, 2 = English
    return NextResponse.json({
      exerciseId,
      baseId: info.baseId,
      nameTr: info.translations[16] || null,
      nameEn: info.translations[2] || null,
      nameDe: info.translations[1] || null,
      images: info.images,
      videos: info.videos,
      category: info.category,
    });
  }

  // Search by term
  if (searchTerm) {
    const baseId = await searchExercise(searchTerm);
    if (!baseId) {
      return NextResponse.json(
        { error: "No exercise found" },
        { status: 404 }
      );
    }

    const info = await getExerciseInfo(baseId);
    if (!info) {
      return NextResponse.json(
        { error: "Exercise info not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      baseId: info.baseId,
      nameTr: info.translations[16] || null,
      nameEn: info.translations[2] || null,
      images: info.images,
      videos: info.videos,
      category: info.category,
    });
  }

  // Bulk fetch all mapped exercises
  if (action === "all") {
    const results: Record<
      string,
      {
        images: string[];
        videos: string[];
        nameTr: string | null;
        nameEn: string | null;
      }
    > = {};

    const entries = Object.entries(EXERCISE_WGER_MAP);
    // Fetch in batches of 5 to avoid rate limiting
    for (let i = 0; i < entries.length; i += 5) {
      const batch = entries.slice(i, i + 5);
      const promises = batch.map(async ([exId, baseId]) => {
        const info = await getExerciseInfo(baseId);
        return { exId, info };
      });
      const batchResults = await Promise.all(promises);
      for (const { exId, info } of batchResults) {
        if (info) {
          results[exId] = {
            images: info.images,
            videos: info.videos,
            nameTr: info.translations[16] || null,
            nameEn: info.translations[2] || null,
          };
        }
      }
    }

    return NextResponse.json(results);
  }

  return NextResponse.json(
    { error: "Missing id, search, or action parameter" },
    { status: 400 }
  );
}
