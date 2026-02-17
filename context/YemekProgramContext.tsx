"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorageJSON,
  setUserStorageJSON,
  getUserStorage,
  setUserStorage,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-yemek-programi";

type Lang = "tr" | "en" | "de" | "ru";

interface StoredYemek {
  content: string;
  sourceLang?: Lang;
  translations?: Partial<Record<Lang, string>>;
}

interface YemekProgramContextValue {
  /** Original content (source language) */
  content: string;
  /** Content in the current display language */
  displayContent: string;
  /** All translations */
  translations: Partial<Record<Lang, string>>;
  /** Source language */
  sourceLang: Lang;
  setContent: (content: string, lang?: Lang) => void;
  setContentWithTranslations: (
    content: string,
    lang: Lang,
    translations: Partial<Record<Lang, string>>
  ) => void;
  isLoaded: boolean;
}

const YemekProgramContext = createContext<YemekProgramContextValue>({
  content: "",
  displayContent: "",
  translations: {},
  sourceLang: "tr",
  setContent: () => {},
  setContentWithTranslations: () => {},
  isLoaded: false,
});

export function YemekProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [content, setContentState] = useState("");
  const [sourceLang, setSourceLang] = useState<Lang>("tr");
  const [translations, setTranslations] = useState<Partial<Record<Lang, string>>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute display content based on current language
  const displayContent = useMemo(() => {
    const lang = language as Lang;
    if (lang === sourceLang) return content;
    const translated = translations[lang];
    if (translated && translated.trim()) return translated;
    return content; // fallback to original
  }, [language, sourceLang, content, translations]);

  useEffect(() => {
    setContentState("");
    setTranslations({});
    setIsLoaded(false);
    setSourceLang("tr");

    if (!user) {
      setIsLoaded(true);
      return;
    }

    // Try new format first (StoredYemek with translations)
    const localData = getUserStorageJSON<StoredYemek>(STORAGE_KEY, user.id);
    if (localData && typeof localData === "object" && "content" in localData) {
      setContentState(localData.content || "");
      if (localData.sourceLang) setSourceLang(localData.sourceLang);
      if (localData.translations) setTranslations(localData.translations);
    } else {
      // Fallback to old format (plain string)
      const oldData = getUserStorage(STORAGE_KEY, user.id);
      if (oldData) {
        setContentState(oldData);
      }
    }
    setIsLoaded(true);

    // Fetch fresh from Supabase
    getUserData<StoredYemek | string>(STORAGE_KEY).then((remoteData) => {
      if (remoteData !== null && remoteData !== undefined) {
        if (typeof remoteData === "object" && "content" in remoteData) {
          setContentState(remoteData.content || "");
          if (remoteData.sourceLang) setSourceLang(remoteData.sourceLang);
          if (remoteData.translations) setTranslations(remoteData.translations);
          setUserStorageJSON(STORAGE_KEY, user.id, remoteData);
        } else {
          const val = typeof remoteData === "string" ? remoteData : JSON.stringify(remoteData);
          setContentState(val);
          setUserStorage(STORAGE_KEY, user.id, val);
        }
      }
    });
  }, [user]);

  const persist = useCallback(
    (data: string, lang?: Lang, trans?: Partial<Record<Lang, string>>) => {
      if (user) {
        const stored: StoredYemek = {
          content: data,
          sourceLang: lang || sourceLang,
          translations: trans,
        };
        setUserStorageJSON(STORAGE_KEY, user.id, stored);
        setUserData(STORAGE_KEY, stored).catch(() => {});
      }
    },
    [user, sourceLang]
  );

  const setContent = useCallback(
    (next: string, lang?: Lang) => {
      setContentState(next);
      const newLang = lang || sourceLang;
      if (lang) setSourceLang(newLang);
      const newTrans: Partial<Record<Lang, string>> = { [newLang]: next };
      setTranslations(newTrans);
      persist(next, newLang, newTrans);
    },
    [persist, sourceLang]
  );

  const setContentWithTranslations = useCallback(
    (next: string, lang: Lang, trans: Partial<Record<Lang, string>>) => {
      setContentState(next);
      setSourceLang(lang);
      const fullTrans = { ...trans, [lang]: next };
      setTranslations(fullTrans);
      persist(next, lang, fullTrans);
    },
    [persist]
  );

  return (
    <YemekProgramContext.Provider
      value={{
        content,
        displayContent,
        translations,
        sourceLang,
        setContent,
        setContentWithTranslations,
        isLoaded,
      }}
    >
      {children}
    </YemekProgramContext.Provider>
  );
}

export function useYemekProgram() {
  const ctx = useContext(YemekProgramContext);
  if (!ctx)
    throw new Error("useYemekProgram must be used within YemekProgramProvider");
  return ctx;
}
