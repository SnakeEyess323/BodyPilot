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
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-favori-yemekler";

interface FavoriYemekContextValue {
  favoriler: string[];
  toggleFavori: (id: string) => void;
  isFavori: (id: string) => boolean;
  isLoaded: boolean;
}

const FavoriYemekContext = createContext<FavoriYemekContextValue>({
  favoriler: [],
  toggleFavori: () => {},
  isFavori: () => false,
  isLoaded: false,
});

export function FavoriYemekProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriler, setFavoriler] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state so old user's data is never visible
    setFavoriler([]);
    setIsLoaded(false);

    if (!user) {
      setIsLoaded(true);
      return;
    }

    // Load from user-scoped localStorage (fast)
    const localData = getUserStorageJSON<string[]>(STORAGE_KEY, user.id);
    if (Array.isArray(localData)) {
      setFavoriler(localData);
    }
    setIsLoaded(true);

    // Fetch fresh data from Supabase
    getUserData<string[]>(STORAGE_KEY).then((remoteData) => {
      if (Array.isArray(remoteData)) {
        setFavoriler(remoteData);
        setUserStorageJSON(STORAGE_KEY, user.id, remoteData);
      }
    });
  }, [user]);

  const toggleFavori = useCallback(
    (id: string) => {
      setFavoriler((prev) => {
        const newFavoriler = prev.includes(id)
          ? prev.filter((f) => f !== id)
          : [...prev, id];
        if (user) {
          setUserStorageJSON(STORAGE_KEY, user.id, newFavoriler);
          setUserData(STORAGE_KEY, newFavoriler).catch(() => {});
        }
        return newFavoriler;
      });
    },
    [user]
  );

  const isFavori = useCallback(
    (id: string) => favoriler.includes(id),
    [favoriler]
  );

  return (
    <FavoriYemekContext.Provider
      value={{ favoriler, toggleFavori, isFavori, isLoaded }}
    >
      {children}
    </FavoriYemekContext.Provider>
  );
}

export function useFavoriYemek() {
  const ctx = useContext(FavoriYemekContext);
  if (!ctx)
    throw new Error(
      "useFavoriYemek must be used within FavoriYemekProvider"
    );
  return ctx;
}
