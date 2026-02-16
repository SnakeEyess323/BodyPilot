"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Profil } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-profil";

interface ProfilContextValue {
  profil: Profil;
  setProfil: (profil: Profil) => void;
  isLoaded: boolean;
}

const defaultProfil: Profil = {};

const ProfilContext = createContext<ProfilContextValue>({
  profil: defaultProfil,
  setProfil: () => {},
  isLoaded: false,
});

export function ProfilProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profil, setProfilState] = useState<Profil>(defaultProfil);
  const [isLoaded, setIsLoaded] = useState(false);

  // When user changes → reset state, then load user-specific data
  useEffect(() => {
    // Always reset to defaults first so the old user's data is never visible
    setProfilState(defaultProfil);
    setIsLoaded(false);

    if (!user) {
      setIsLoaded(true);
      return;
    }

    // Load from user-scoped localStorage (fast)
    const localData = getUserStorageJSON<Profil>(STORAGE_KEY, user.id);
    let localProfil = defaultProfil;
    if (localData && typeof localData === "object") {
      localProfil = { ...defaultProfil, ...localData };
      setProfilState(localProfil);
    }

    // If localStorage already has onboardingCompleted, we can trust it immediately
    if (localProfil.onboardingCompleted === true) {
      setIsLoaded(true);
    }

    // Always fetch from Supabase to get the authoritative data
    getUserData<Profil>(STORAGE_KEY).then((remoteData) => {
      if (remoteData && typeof remoteData === "object") {
        setProfilState((prev) => {
          const merged = { ...defaultProfil, ...prev, ...remoteData };
          // Once onboarding is completed (locally or remotely), never revert
          if (prev.onboardingCompleted === true) {
            merged.onboardingCompleted = true;
          }
          setUserStorageJSON(STORAGE_KEY, user!.id, merged);
          return merged;
        });
      }
      // Mark as loaded only after Supabase check completes
      setIsLoaded(true);
    }).catch(() => {
      // If Supabase fetch fails, still mark as loaded with local data
      setIsLoaded(true);
    });
  }, [user]);

  // Write: user-scoped localStorage (instant) + Supabase (async)
  const setProfil = useCallback(
    (next: Profil) => {
      setProfilState(next);
      if (user) {
        setUserStorageJSON(STORAGE_KEY, user.id, next);
        setUserData(STORAGE_KEY, next).catch(() => {});
      }
    },
    [user]
  );

  return (
    <ProfilContext.Provider value={{ profil, setProfil, isLoaded }}>
      {children}
    </ProfilContext.Provider>
  );
}

export function useProfil() {
  const ctx = useContext(ProfilContext);
  if (!ctx) throw new Error("useProfil must be used within ProfilProvider");
  return ctx;
}
