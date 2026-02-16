"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Language, type TranslationKeys } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "bodypilot-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved language from localStorage
    const savedLang = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.slice(0, 2) as Language;
      if (translations[browserLang]) {
        setLanguageState(browserLang);
      }
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    // Note: Language is lightweight enough to stay localStorage-only.
    // It's included in the migration for completeness but no real-time sync needed.
  };

  const t = translations[language] as TranslationKeys;

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: "tr", setLanguage, t: translations.tr }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export { type Language };
