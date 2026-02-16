"use client";

import { useState, useEffect } from "react";

// Free Exercise DB (yuhonas) ImageKit CDN URL'leri
// Bu URL'ler her zaman çalışır, ücretsiz ve API anahtarı gerektirmez
const IMAGEKIT_BASE = "https://ik.imagekit.io/yuhonas";

export const staticImageUrls: Record<string, string> = {
  // CHEST
  "bench-press": `${IMAGEKIT_BASE}/Barbell_Bench_Press_-_Medium_Grip/0.jpg`,
  "push-up": `${IMAGEKIT_BASE}/Pushups/0.jpg`,
  "dumbbell-fly": `${IMAGEKIT_BASE}/Dumbbell_Flyes/0.jpg`,
  "incline-press": `${IMAGEKIT_BASE}/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg`,
  "cable-crossover": `${IMAGEKIT_BASE}/Cable_Crossover/0.jpg`,

  // SHOULDERS
  "overhead-press": `${IMAGEKIT_BASE}/Standing_Military_Press/0.jpg`,
  "lateral-raise": `${IMAGEKIT_BASE}/Side_Lateral_Raise/0.jpg`,
  "front-raise": `${IMAGEKIT_BASE}/Front_Dumbbell_Raise/0.jpg`,
  "arnold-press": `${IMAGEKIT_BASE}/Arnold_Dumbbell_Press/0.jpg`,
  "face-pull": `${IMAGEKIT_BASE}/Face_Pull/0.jpg`,

  // BICEPS
  "barbell-curl": `${IMAGEKIT_BASE}/Barbell_Curl/0.jpg`,
  "dumbbell-curl": `${IMAGEKIT_BASE}/Dumbbell_Bicep_Curl/0.jpg`,
  "hammer-curl": `${IMAGEKIT_BASE}/Alternate_Hammer_Curl/0.jpg`,
  "preacher-curl": `${IMAGEKIT_BASE}/Preacher_Curl/0.jpg`,
  "concentration-curl": `${IMAGEKIT_BASE}/Concentration_Curls/0.jpg`,

  // TRICEPS
  "tricep-pushdown": `${IMAGEKIT_BASE}/Triceps_Pushdown/0.jpg`,
  "skull-crusher": `${IMAGEKIT_BASE}/EZ-Bar_Skullcrusher/0.jpg`,
  "tricep-dip": `${IMAGEKIT_BASE}/Dips_-_Triceps_Version/0.jpg`,
  "overhead-tricep-extension": `${IMAGEKIT_BASE}/Standing_Dumbbell_Triceps_Extension/0.jpg`,
  "close-grip-bench": `${IMAGEKIT_BASE}/Close-Grip_Barbell_Bench_Press/0.jpg`,

  // FOREARMS
  "wrist-curl": `${IMAGEKIT_BASE}/Palms-Up_Barbell_Wrist_Curl_Over_A_Bench/0.jpg`,
  "reverse-curl": `${IMAGEKIT_BASE}/Standing_Dumbbell_Reverse_Curl/0.jpg`,
  "farmers-walk": `${IMAGEKIT_BASE}/Barbell_Deadlift/0.jpg`,
  "dead-hang": `${IMAGEKIT_BASE}/Pullups/0.jpg`,

  // ABS
  "crunch": `${IMAGEKIT_BASE}/Crunches/0.jpg`,
  "plank": `${IMAGEKIT_BASE}/Plank/0.jpg`,
  "leg-raise": `${IMAGEKIT_BASE}/Flat_Bench_Lying_Leg_Raise/0.jpg`,
  "ab-wheel": `${IMAGEKIT_BASE}/Ab_Roller/0.jpg`,
  "cable-crunch": `${IMAGEKIT_BASE}/Cable_Crunch/0.jpg`,

  // OBLIQUES
  "russian-twist": `${IMAGEKIT_BASE}/Russian_Twist/0.jpg`,
  "side-plank": `${IMAGEKIT_BASE}/Side_Bridge/0.jpg`,
  "bicycle-crunch": `${IMAGEKIT_BASE}/Air_Bike/0.jpg`,
  "woodchopper": `${IMAGEKIT_BASE}/Cable_Crossover/0.jpg`,

  // QUADS
  "squat": `${IMAGEKIT_BASE}/Barbell_Full_Squat/0.jpg`,
  "leg-press": `${IMAGEKIT_BASE}/Leg_Press/0.jpg`,
  "lunge": `${IMAGEKIT_BASE}/Dumbbell_Lunges/0.jpg`,
  "leg-extension": `${IMAGEKIT_BASE}/Leg_Extensions/0.jpg`,
  "bulgarian-split-squat": `${IMAGEKIT_BASE}/Dumbbell_Lunges/0.jpg`,

  // CALVES
  "standing-calf-raise": `${IMAGEKIT_BASE}/Standing_Calf_Raises/0.jpg`,
  "seated-calf-raise": `${IMAGEKIT_BASE}/Seated_Calf_Raise/0.jpg`,
  "donkey-calf-raise": `${IMAGEKIT_BASE}/Donkey_Calf_Raises/0.jpg`,
  "jump-rope": `${IMAGEKIT_BASE}/Rope_Jumping/0.jpg`,

  // TRAPS
  "barbell-shrug": `${IMAGEKIT_BASE}/Barbell_Shrug/0.jpg`,
  "dumbbell-shrug": `${IMAGEKIT_BASE}/Dumbbell_Shrug/0.jpg`,
  "upright-row": `${IMAGEKIT_BASE}/Upright_Barbell_Row/0.jpg`,
  "face-pull-traps": `${IMAGEKIT_BASE}/Face_Pull/0.jpg`,

  // LATS
  "pull-up": `${IMAGEKIT_BASE}/Pullups/0.jpg`,
  "lat-pulldown": `${IMAGEKIT_BASE}/Wide-Grip_Lat_Pulldown/0.jpg`,
  "barbell-row": `${IMAGEKIT_BASE}/Bent_Over_Barbell_Row/0.jpg`,
  "dumbbell-row": `${IMAGEKIT_BASE}/One-Arm_Dumbbell_Row/0.jpg`,
  "seated-cable-row": `${IMAGEKIT_BASE}/Seated_Cable_Rows/0.jpg`,

  // LOWER BACK
  "deadlift": `${IMAGEKIT_BASE}/Barbell_Deadlift/0.jpg`,
  "hyperextension": `${IMAGEKIT_BASE}/Superman/0.jpg`,
  "good-morning": `${IMAGEKIT_BASE}/Good_Morning/0.jpg`,
  "superman": `${IMAGEKIT_BASE}/Superman/0.jpg`,

  // GLUTES
  "hip-thrust": `${IMAGEKIT_BASE}/Barbell_Glute_Bridge/0.jpg`,
  "glute-bridge": `${IMAGEKIT_BASE}/Barbell_Glute_Bridge/0.jpg`,
  "cable-kickback": `${IMAGEKIT_BASE}/Glute_Kickback/0.jpg`,
  "sumo-squat": `${IMAGEKIT_BASE}/Barbell_Full_Squat/0.jpg`,
  "step-up": `${IMAGEKIT_BASE}/Barbell_Step_Ups/0.jpg`,

  // HAMSTRINGS
  "romanian-deadlift": `${IMAGEKIT_BASE}/Romanian_Deadlift/0.jpg`,
  "leg-curl": `${IMAGEKIT_BASE}/Lying_Leg_Curls/0.jpg`,
  "stiff-leg-deadlift": `${IMAGEKIT_BASE}/Stiff-Legged_Barbell_Deadlift/0.jpg`,
  "nordic-curl": `${IMAGEKIT_BASE}/Lying_Leg_Curls/0.jpg`,
  "swiss-ball-curl": `${IMAGEKIT_BASE}/Ball_Leg_Curl/0.jpg`,
};

// Eski isimle uyumluluk (diğer dosyalarda import ediliyor olabilir)
export const staticGifUrls = staticImageUrls;

// Tarayıcı tarafında GIF URL'lerini cache'lemek için
const gifCache = new Map<string, string>();

/**
 * Tek bir egzersiz için görsel URL'sini döner.
 * Önce statik (free-exercise-db) URL'yi hemen gösterir,
 * ardından ExerciseDB API'den animasyonlu GIF yüklemeyi dener.
 */
export function useExerciseGif(exerciseId: string) {
  // Statik URL her zaman mevcut - hemen göster
  const staticUrl = staticImageUrls[exerciseId] || null;
  const [gifUrl, setGifUrl] = useState<string | null>(staticUrl);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Statik URL varsa hemen göster
    if (staticUrl) {
      setGifUrl(staticUrl);
      setLoading(false);
    }

    // Cache'de GIF varsa kullan
    if (gifCache.has(exerciseId)) {
      setGifUrl(gifCache.get(exerciseId) || staticUrl);
      setLoading(false);
      return;
    }

    // Arka planda ExerciseDB API'den animasyonlu GIF yüklemeyi dene
    const fetchAnimatedGif = async () => {
      try {
        const response = await fetch(`/api/exercises/gif?id=${exerciseId}`);
        if (response.ok) {
          // Proxy başarılı - GIF URL'si olarak proxy endpoint'i kullan
          const gifProxyUrl = `/api/exercises/gif?id=${exerciseId}`;
          gifCache.set(exerciseId, gifProxyUrl);
          setGifUrl(gifProxyUrl);
        }
      } catch {
        // API hatası - statik URL'yi kullanmaya devam et
        setError("API unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchAnimatedGif();
  }, [exerciseId, staticUrl]);

  return { gifUrl, loading, error };
}

/**
 * Birden fazla egzersiz için GIF URL'lerini toplu yükle.
 */
export function usePreloadExerciseGifs(exerciseIds: string[]) {
  const [gifUrls, setGifUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const exerciseIdsKey = exerciseIds.join(",");

  useEffect(() => {
    const ids = exerciseIdsKey.split(",").filter(Boolean);

    // Önce statik URL'leri kullan (hemen göster)
    const urls: Record<string, string> = {};
    for (const id of ids) {
      if (gifCache.has(id)) {
        urls[id] = gifCache.get(id)!;
      } else if (staticImageUrls[id]) {
        urls[id] = staticImageUrls[id];
      }
    }

    setGifUrls(urls);
    setLoading(false);
  }, [exerciseIdsKey]);

  return { gifUrls, loading };
}

/**
 * Egzersiz için görsel URL'sini al (statik veya cache'den)
 */
export function getExerciseGifUrl(exerciseId: string): string | null {
  // Önce cache'e bak (animasyonlu GIF)
  if (gifCache.has(exerciseId)) {
    return gifCache.get(exerciseId) || null;
  }

  // Statik URL'yi döndür
  return staticImageUrls[exerciseId] || null;
}
