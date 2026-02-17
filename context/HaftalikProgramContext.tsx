"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GunAdi, HaftalikProgram } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-haftalik-program";
const TRANSLATION_CACHE_KEY = "bodypilot-program-translations";

type Lang = "tr" | "en" | "de" | "ru";

const GUN_SIRASI: GunAdi[] = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];

function emptyProgram(): HaftalikProgram {
  return GUN_SIRASI.reduce(
    (acc, gun) => ({ ...acc, [gun]: "" }),
    {} as HaftalikProgram
  );
}

function getCurrentWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

interface StoredProgram {
  weekKey: string;
  program: HaftalikProgram;
  sourceLang?: Lang;
}

interface TranslationCache {
  weekKey: string;
  translations: Partial<Record<Lang, HaftalikProgram>>;
}

interface HaftalikProgramContextValue {
  /** The original program (always in source language, Turkish day keys) */
  program: HaftalikProgram;
  /** The display program - translated if available, else original */
  displayProgram: HaftalikProgram;
  /** Whether a translation is in progress */
  isTranslating: boolean;
  /** The language the program was originally generated in */
  sourceLang: Lang;
  setProgram: (program: HaftalikProgram, lang?: Lang) => void;
  setGun: (gun: GunAdi, content: string) => void;
  swapGun: (gun1: GunAdi, gun2: GunAdi) => void;
  isLoaded: boolean;
}

const HaftalikProgramContext = createContext<HaftalikProgramContextValue>({
  program: emptyProgram(),
  displayProgram: emptyProgram(),
  isTranslating: false,
  sourceLang: "tr",
  setProgram: () => {},
  setGun: () => {},
  swapGun: () => {},
  isLoaded: false,
});

function hasContent(prog: HaftalikProgram): boolean {
  return Object.values(prog).some((v) => v && v.trim() !== "");
}

export function HaftalikProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [program, setProgramState] = useState<HaftalikProgram>(emptyProgram());
  const [sourceLang, setSourceLang] = useState<Lang>("tr");
  const [displayProgram, setDisplayProgram] = useState<HaftalikProgram>(emptyProgram());
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const translationCacheRef = useRef<TranslationCache>({ weekKey: "", translations: {} });
  const abortRef = useRef<AbortController | null>(null);

  // Load translation cache from storage
  const loadTranslationCache = useCallback((userId: string, weekKey: string): TranslationCache => {
    const cached = getUserStorageJSON<TranslationCache>(TRANSLATION_CACHE_KEY, userId);
    if (cached && cached.weekKey === weekKey) {
      return cached;
    }
    return { weekKey, translations: {} };
  }, []);

  // Save translation cache to storage
  const saveTranslationCache = useCallback((userId: string, cache: TranslationCache) => {
    setUserStorageJSON(TRANSLATION_CACHE_KEY, userId, cache);
  }, []);

  // Load program from storage
  useEffect(() => {
    setProgramState(emptyProgram());
    setDisplayProgram(emptyProgram());
    setIsLoaded(false);
    setSourceLang("tr");

    if (!user) {
      setIsLoaded(true);
      return;
    }

    const currentWeek = getCurrentWeekKey();

    const localRaw = getUserStorageJSON<StoredProgram | HaftalikProgram>(STORAGE_KEY, user.id);
    if (localRaw && typeof localRaw === "object") {
      if ("weekKey" in localRaw && "program" in localRaw) {
        if (localRaw.weekKey === currentWeek) {
          const prog = { ...emptyProgram(), ...localRaw.program };
          setProgramState(prog);
          setDisplayProgram(prog);
          if (localRaw.sourceLang) setSourceLang(localRaw.sourceLang);
        }
      }
    }

    // Load translation cache
    translationCacheRef.current = loadTranslationCache(user.id, currentWeek);

    setIsLoaded(true);

    getUserData<StoredProgram | HaftalikProgram>(STORAGE_KEY).then((remoteData) => {
      if (remoteData && typeof remoteData === "object") {
        if ("weekKey" in remoteData && "program" in remoteData) {
          if (remoteData.weekKey === currentWeek) {
            const merged = { ...emptyProgram(), ...remoteData.program };
            setProgramState(merged);
            setDisplayProgram(merged);
            if (remoteData.sourceLang) setSourceLang(remoteData.sourceLang);
            setUserStorageJSON(STORAGE_KEY, user.id, {
              weekKey: currentWeek,
              program: merged,
              sourceLang: remoteData.sourceLang || "tr",
            });
          }
        }
      }
    });
  }, [user, loadTranslationCache]);

  // Translate when language changes
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!hasContent(program)) {
      setDisplayProgram(program);
      return;
    }

    const currentLang = language as Lang;

    // If current language is the source language, show original
    if (currentLang === sourceLang) {
      setDisplayProgram(program);
      return;
    }

    // Check cache
    const cache = translationCacheRef.current;
    const cached = cache.translations[currentLang];
    if (cached && hasContent(cached)) {
      setDisplayProgram(cached);
      return;
    }

    // Need to translate - call API
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsTranslating(true);

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ program, targetLang: currentLang }),
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Translation failed");
        return res.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const translated = data.translated as HaftalikProgram;
        if (translated && hasContent(translated)) {
          setDisplayProgram(translated);

          // Save to cache
          const weekKey = getCurrentWeekKey();
          const cache = translationCacheRef.current;
          cache.weekKey = weekKey;
          cache.translations[currentLang] = translated;
          translationCacheRef.current = cache;
          if (user) {
            saveTranslationCache(user.id, cache);
          }
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("Translation error:", err);
        // Fallback: show original program
        setDisplayProgram(program);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsTranslating(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [language, sourceLang, program, isLoaded, user, saveTranslationCache]);

  const persist = useCallback(
    (data: HaftalikProgram, lang?: Lang) => {
      if (user) {
        const stored: StoredProgram = {
          weekKey: getCurrentWeekKey(),
          program: data,
          sourceLang: lang || sourceLang,
        };
        setUserStorageJSON(STORAGE_KEY, user.id, stored);
        setUserData(STORAGE_KEY, stored).catch(() => {});
      }
    },
    [user, sourceLang]
  );

  const setProgram = useCallback(
    (next: HaftalikProgram, lang?: Lang) => {
      setProgramState(next);
      setDisplayProgram(next);
      if (lang) setSourceLang(lang);

      // Clear translation cache when a new program is set
      if (user) {
        const weekKey = getCurrentWeekKey();
        const newCache: TranslationCache = { weekKey, translations: {} };
        // The new program itself is in the given lang
        if (lang) {
          newCache.translations[lang] = next;
        }
        translationCacheRef.current = newCache;
        saveTranslationCache(user.id, newCache);
      }

      persist(next, lang);
    },
    [persist, user, saveTranslationCache]
  );

  const setGun = useCallback(
    (gun: GunAdi, content: string) => {
      setProgramState((prev) => {
        const next = { ...prev, [gun]: content };
        setDisplayProgram(next);

        // Invalidate translation cache for this change
        if (user) {
          const weekKey = getCurrentWeekKey();
          translationCacheRef.current = { weekKey, translations: {} };
          saveTranslationCache(user.id, translationCacheRef.current);
        }

        persist(next);
        return next;
      });
    },
    [persist, user, saveTranslationCache]
  );

  const swapGun = useCallback(
    (gun1: GunAdi, gun2: GunAdi) => {
      if (gun1 === gun2) return;
      setProgramState((prev) => {
        const next = { ...prev, [gun1]: prev[gun2], [gun2]: prev[gun1] };
        setDisplayProgram(next);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <HaftalikProgramContext.Provider
      value={{
        program,
        displayProgram,
        isTranslating,
        sourceLang,
        setProgram,
        setGun,
        swapGun,
        isLoaded,
      }}
    >
      {children}
    </HaftalikProgramContext.Provider>
  );
}

export function useHaftalikProgram() {
  const ctx = useContext(HaftalikProgramContext);
  if (!ctx)
    throw new Error(
      "useHaftalikProgram must be used within HaftalikProgramProvider"
    );
  return ctx;
}
