"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type Lang = "tr" | "en" | "de" | "ru";
const ALL_LANGS: Lang[] = ["tr", "en", "de", "ru"];

const GUN_SIRASI: GunAdi[] = [
  "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar",
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
  translations?: Partial<Record<Lang, HaftalikProgram>>;
}

interface HaftalikProgramContextValue {
  /** The original program (source language) */
  program: HaftalikProgram;
  /** The program in the current display language */
  displayProgram: HaftalikProgram;
  /** Whether background translation is in progress */
  isTranslating: boolean;
  /** Source language of the program */
  sourceLang: Lang;
  /** All available translations */
  translations: Partial<Record<Lang, HaftalikProgram>>;
  setProgram: (program: HaftalikProgram, lang?: Lang) => void;
  /** Set program with all translations at once (called after batch translate) */
  setProgramWithTranslations: (
    program: HaftalikProgram,
    lang: Lang,
    translations: Partial<Record<Lang, HaftalikProgram>>
  ) => void;
  setGun: (gun: GunAdi, content: string) => void;
  swapGun: (gun1: GunAdi, gun2: GunAdi) => void;
  isLoaded: boolean;
}

const HaftalikProgramContext = createContext<HaftalikProgramContextValue>({
  program: emptyProgram(),
  displayProgram: emptyProgram(),
  isTranslating: false,
  sourceLang: "tr",
  translations: {},
  setProgram: () => {},
  setProgramWithTranslations: () => {},
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
  const [translations, setTranslations] = useState<Partial<Record<Lang, HaftalikProgram>>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Compute display program based on current language
  const displayProgram = useMemo(() => {
    const lang = language as Lang;
    if (lang === sourceLang) return program;
    const translated = translations[lang];
    if (translated && hasContent(translated)) return translated;
    return program; // fallback to original
  }, [language, sourceLang, program, translations]);

  // On-demand translation: if language != source and no cached translation, fetch it
  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!hasContent(program)) return;

    const lang = language as Lang;
    if (lang === sourceLang) return;

    // Already have a translation for this language
    const existing = translations[lang];
    if (existing && hasContent(existing)) return;

    // Translate on demand
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsTranslating(true);

    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "workout",
        sourceLang,
        program,
        targetLangs: [lang],
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (controller.signal.aborted) return;
        if (d.translations) {
          setTranslations((prev) => {
            const next = { ...prev, ...d.translations };
            // Persist with updated translations
            if (user) {
              const stored: StoredProgram = {
                weekKey: getCurrentWeekKey(),
                program,
                sourceLang,
                translations: next,
              };
              setUserStorageJSON(STORAGE_KEY, user.id, stored);
              setUserData(STORAGE_KEY, stored).catch(() => {});
            }
            return next;
          });
        }
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        console.error("On-demand translation error:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsTranslating(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, sourceLang, isLoaded, user]);

  // Load from storage
  useEffect(() => {
    setProgramState(emptyProgram());
    setTranslations({});
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
          if (localRaw.sourceLang) setSourceLang(localRaw.sourceLang);
          if (localRaw.translations) setTranslations(localRaw.translations);
        }
      }
    }
    setIsLoaded(true);

    // Fetch fresh from Supabase
    getUserData<StoredProgram | HaftalikProgram>(STORAGE_KEY).then((remoteData) => {
      if (remoteData && typeof remoteData === "object") {
        if ("weekKey" in remoteData && "program" in remoteData) {
          if (remoteData.weekKey === currentWeek) {
            const merged = { ...emptyProgram(), ...remoteData.program };
            setProgramState(merged);
            if (remoteData.sourceLang) setSourceLang(remoteData.sourceLang);
            if (remoteData.translations) setTranslations(remoteData.translations);
            setUserStorageJSON(STORAGE_KEY, user.id, {
              weekKey: currentWeek,
              program: merged,
              sourceLang: remoteData.sourceLang || "tr",
              translations: remoteData.translations || {},
            });
          }
        }
      }
    });
  }, [user]);

  const persist = useCallback(
    (data: HaftalikProgram, lang?: Lang, trans?: Partial<Record<Lang, HaftalikProgram>>) => {
      if (user) {
        const stored: StoredProgram = {
          weekKey: getCurrentWeekKey(),
          program: data,
          sourceLang: lang || sourceLang,
          translations: trans,
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
      const newLang = lang || sourceLang;
      if (lang) setSourceLang(newLang);
      // Clear old translations, set source as its own translation
      const newTrans: Partial<Record<Lang, HaftalikProgram>> = { [newLang]: next };
      setTranslations(newTrans);
      persist(next, newLang, newTrans);
    },
    [persist, sourceLang]
  );

  const setProgramWithTranslations = useCallback(
    (next: HaftalikProgram, lang: Lang, trans: Partial<Record<Lang, HaftalikProgram>>) => {
      setProgramState(next);
      setSourceLang(lang);
      // Ensure source lang is in translations
      const fullTrans = { ...trans, [lang]: next };
      setTranslations(fullTrans);
      persist(next, lang, fullTrans);
    },
    [persist]
  );

  const setGun = useCallback(
    (gun: GunAdi, content: string) => {
      setProgramState((prev) => {
        const next = { ...prev, [gun]: content };
        // Clear translations since content changed
        const newTrans: Partial<Record<Lang, HaftalikProgram>> = { [sourceLang]: next };
        setTranslations(newTrans);
        persist(next, sourceLang, newTrans);
        return next;
      });
    },
    [persist, sourceLang]
  );

  const swapGun = useCallback(
    (gun1: GunAdi, gun2: GunAdi) => {
      if (gun1 === gun2) return;
      setProgramState((prev) => {
        const next = { ...prev, [gun1]: prev[gun2], [gun2]: prev[gun1] };
        // Swap in all translations too
        setTranslations((prevTrans) => {
          const newTrans: Partial<Record<Lang, HaftalikProgram>> = {};
          for (const [lang, prog] of Object.entries(prevTrans)) {
            if (prog) {
              newTrans[lang as Lang] = { ...prog, [gun1]: prog[gun2], [gun2]: prog[gun1] };
            }
          }
          persist(next, sourceLang, newTrans);
          return newTrans;
        });
        return next;
      });
    },
    [persist, sourceLang]
  );

  return (
    <HaftalikProgramContext.Provider
      value={{
        program,
        displayProgram,
        isTranslating,
        sourceLang,
        translations,
        setProgram,
        setProgramWithTranslations,
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
