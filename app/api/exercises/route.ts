import { NextResponse } from "next/server";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || "edb-with-videos-and-images-by-ascendapi.p.rapidapi.com";

// ExerciseDB API'den egzersiz verisi için interface
interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  gifUrl: string;
  target: string;
  secondaryMuscles: string[];
  instructions: string[];
}

// Cache için basit in-memory storage (production'da Redis kullanılmalı)
const exerciseCache = new Map<string, { data: ExerciseDBExercise; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 saat

// Bizim egzersiz ID'lerimizi ExerciseDB isimlerine eşleştir
const exerciseNameMap: Record<string, string> = {
  // CHEST
  "bench-press": "barbell bench press",
  "push-up": "push-up",
  "dumbbell-fly": "dumbbell fly",
  "incline-press": "barbell incline bench press",
  "cable-crossover": "cable crossover",
  
  // SHOULDERS
  "overhead-press": "barbell overhead press",
  "lateral-raise": "dumbbell lateral raise",
  "front-raise": "dumbbell front raise",
  "arnold-press": "dumbbell arnold press",
  "face-pull": "cable face pull",
  
  // BICEPS
  "barbell-curl": "barbell curl",
  "dumbbell-curl": "dumbbell bicep curl",
  "hammer-curl": "dumbbell hammer curl",
  "preacher-curl": "dumbbell preacher curl",
  "concentration-curl": "dumbbell concentration curl",
  
  // TRICEPS
  "tricep-pushdown": "cable pushdown",
  "skull-crusher": "barbell lying triceps extension skull crusher",
  "tricep-dip": "triceps dip",
  "overhead-tricep-extension": "dumbbell overhead triceps extension",
  "close-grip-bench": "barbell close-grip bench press",
  
  // FOREARMS
  "wrist-curl": "dumbbell wrist curl",
  "reverse-curl": "barbell reverse curl",
  "farmers-walk": "farmer's walk",
  "dead-hang": "dead hang",
  
  // ABS
  "crunch": "crunch",
  "plank": "front plank",
  "leg-raise": "lying leg raise",
  "ab-wheel": "wheel rollout",
  "cable-crunch": "cable crunch",
  
  // OBLIQUES
  "russian-twist": "russian twist",
  "side-plank": "side plank",
  "bicycle-crunch": "bicycle crunch",
  "woodchopper": "cable woodchop",
  
  // QUADS
  "squat": "barbell squat",
  "leg-press": "leg press",
  "lunge": "dumbbell lunge",
  "leg-extension": "lever leg extension",
  "bulgarian-split-squat": "dumbbell bulgarian split squat",
  
  // CALVES
  "standing-calf-raise": "standing calf raise",
  "seated-calf-raise": "seated calf raise",
  "donkey-calf-raise": "donkey calf raise",
  "jump-rope": "jump rope",
  
  // TRAPS
  "barbell-shrug": "barbell shrug",
  "dumbbell-shrug": "dumbbell shrug",
  "upright-row": "barbell upright row",
  "face-pull-traps": "cable rear pulldown",
  
  // LATS
  "pull-up": "pull-up",
  "lat-pulldown": "cable lat pulldown",
  "barbell-row": "barbell bent over row",
  "dumbbell-row": "dumbbell bent over row",
  "seated-cable-row": "cable seated row",
  
  // LOWER BACK
  "deadlift": "barbell deadlift",
  "hyperextension": "hyperextension",
  "good-morning": "barbell good morning",
  "superman": "superman",
  
  // GLUTES
  "hip-thrust": "barbell hip thrust",
  "glute-bridge": "glute bridge",
  "cable-kickback": "cable kickback",
  "sumo-squat": "dumbbell sumo squat",
  "step-up": "step-up",
  
  // HAMSTRINGS
  "romanian-deadlift": "barbell romanian deadlift",
  "leg-curl": "lever lying leg curl",
  "stiff-leg-deadlift": "barbell stiff leg deadlift",
  "nordic-curl": "nordic curl",
  "swiss-ball-curl": "stability ball hamstring curl",
};

async function fetchExerciseFromAPI(exerciseName: string): Promise<ExerciseDBExercise | null> {
  if (!RAPIDAPI_KEY) {
    console.error("RAPIDAPI_KEY is not set");
    return null;
  }

  try {
    const searchName = encodeURIComponent(exerciseName);
    const response = await fetch(
      `https://${RAPIDAPI_HOST}/api/v1/exercises?search=${searchName}&limit=1`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
        next: { revalidate: 86400 }, // 24 saat cache
      }
    );

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    // API response formatına göre parse et
    if (data.data?.exercises && data.data.exercises.length > 0) {
      return data.data.exercises[0];
    }
    
    // Alternatif response formatı
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    return null;
  } catch (error) {
    console.error("Error fetching exercise:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("id");
  const action = searchParams.get("action");

  // Tüm egzersizler için GIF URL'lerini getir
  if (action === "all-gifs") {
    const gifUrls: Record<string, string> = {};
    
    // Her egzersiz için paralel olarak GIF URL'lerini al
    const promises = Object.entries(exerciseNameMap).map(async ([id, name]) => {
      // Önce cache'e bak
      const cached = exerciseCache.get(id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { id, gifUrl: cached.data.gifUrl };
      }

      const exercise = await fetchExerciseFromAPI(name);
      if (exercise?.gifUrl) {
        exerciseCache.set(id, { data: exercise, timestamp: Date.now() });
        return { id, gifUrl: exercise.gifUrl };
      }
      return { id, gifUrl: null };
    });

    const results = await Promise.all(promises);
    
    for (const result of results) {
      if (result.gifUrl) {
        gifUrls[result.id] = result.gifUrl;
      }
    }

    return NextResponse.json({ gifUrls });
  }

  // Tek bir egzersiz için GIF URL'ini getir
  if (exerciseId) {
    const exerciseName = exerciseNameMap[exerciseId];
    
    if (!exerciseName) {
      return NextResponse.json(
        { error: "Exercise not found in mapping" },
        { status: 404 }
      );
    }

    // Önce cache'e bak
    const cached = exerciseCache.get(exerciseId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        exerciseId,
        gifUrl: cached.data.gifUrl,
        name: cached.data.name,
        target: cached.data.target,
        instructions: cached.data.instructions,
      });
    }

    const exercise = await fetchExerciseFromAPI(exerciseName);
    
    if (!exercise) {
      return NextResponse.json(
        { error: "Exercise not found in ExerciseDB" },
        { status: 404 }
      );
    }

    // Cache'e kaydet
    exerciseCache.set(exerciseId, { data: exercise, timestamp: Date.now() });

    return NextResponse.json({
      exerciseId,
      gifUrl: exercise.gifUrl,
      name: exercise.name,
      target: exercise.target,
      instructions: exercise.instructions,
    });
  }

  return NextResponse.json(
    { error: "Missing exerciseId or action parameter" },
    { status: 400 }
  );
}
