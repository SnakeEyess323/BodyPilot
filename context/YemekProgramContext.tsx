"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorage,
  setUserStorage,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-yemek-programi";

interface YemekProgramContextValue {
  content: string;
  setContent: (content: string) => void;
  isLoaded: boolean;
}

const YemekProgramContext = createContext<YemekProgramContextValue>({
  content: "",
  setContent: () => {},
  isLoaded: false,
});

export function YemekProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [content, setContentState] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state so old user's data is never visible
    setContentState("");
    setIsLoaded(false);

    if (!user) {
      setIsLoaded(true);
      return;
    }

    // Load from user-scoped localStorage (fast)
    const localData = getUserStorage(STORAGE_KEY, user.id);
    if (localData) {
      setContentState(localData);
    }
    setIsLoaded(true);

    // Fetch fresh data from Supabase
    getUserData<string>(STORAGE_KEY).then((remoteData) => {
      if (remoteData !== null && remoteData !== undefined) {
        const val =
          typeof remoteData === "string" ? remoteData : JSON.stringify(remoteData);
        setContentState(val);
        setUserStorage(STORAGE_KEY, user.id, val);
      }
    });
  }, [user]);

  const setContent = useCallback(
    (next: string) => {
      setContentState(next);
      if (user) {
        setUserStorage(STORAGE_KEY, user.id, next);
        setUserData(STORAGE_KEY, next).catch(() => {});
      }
    },
    [user]
  );

  return (
    <YemekProgramContext.Provider value={{ content, setContent, isLoaded }}>
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
