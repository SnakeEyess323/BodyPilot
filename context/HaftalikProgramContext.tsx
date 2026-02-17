"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { GunAdi, HaftalikProgram } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { getUserData, setUserData } from "@/lib/supabase/data-service";
import {
  getUserStorageJSON,
  setUserStorageJSON,
} from "@/lib/user-storage";

const STORAGE_KEY = "spor-asistan-haftalik-program";

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

// Get the Monday of the current week as YYYY-MM-DD
function getCurrentWeekKey(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

interface StoredProgram {
  weekKey: string;
  program: HaftalikProgram;
}

interface HaftalikProgramContextValue {
  program: HaftalikProgram;
  setProgram: (program: HaftalikProgram) => void;
  setGun: (gun: GunAdi, content: string) => void;
  swapGun: (gun1: GunAdi, gun2: GunAdi) => void;
  isLoaded: boolean;
}

const HaftalikProgramContext = createContext<HaftalikProgramContextValue>({
  program: emptyProgram(),
  setProgram: () => {},
  setGun: () => {},
  swapGun: () => {},
  isLoaded: false,
});

export function HaftalikProgramProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [program, setProgramState] = useState<HaftalikProgram>(emptyProgram());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset state so old user's data is never visible
    setProgramState(emptyProgram());
    setIsLoaded(false);

    if (!user) {
      setIsLoaded(true);
      return;
    }

    const currentWeek = getCurrentWeekKey();

    // Load from user-scoped localStorage (fast)
    const localRaw = getUserStorageJSON<StoredProgram | HaftalikProgram>(STORAGE_KEY, user.id);
    if (localRaw && typeof localRaw === "object") {
      // New format with weekKey
      if ("weekKey" in localRaw && "program" in localRaw) {
        if (localRaw.weekKey === currentWeek) {
          setProgramState({ ...emptyProgram(), ...localRaw.program });
        }
        // else: different week → keep empty (reset)
      } else {
        // Old format without weekKey → treat as expired
        // (don't load stale program)
      }
    }
    setIsLoaded(true);

    // Fetch fresh data from Supabase
    getUserData<StoredProgram | HaftalikProgram>(STORAGE_KEY).then((remoteData) => {
      if (remoteData && typeof remoteData === "object") {
        if ("weekKey" in remoteData && "program" in remoteData) {
          if (remoteData.weekKey === currentWeek) {
            const merged = { ...emptyProgram(), ...remoteData.program };
            setProgramState(merged);
            setUserStorageJSON(STORAGE_KEY, user.id, { weekKey: currentWeek, program: merged });
          }
          // else: different week → don't load
        } else {
          // Old format → treat as expired, clear it
        }
      }
    });
  }, [user]);

  const persist = useCallback(
    (data: HaftalikProgram) => {
      if (user) {
        const stored: StoredProgram = { weekKey: getCurrentWeekKey(), program: data };
        setUserStorageJSON(STORAGE_KEY, user.id, stored);
        setUserData(STORAGE_KEY, stored).catch(() => {});
      }
    },
    [user]
  );

  const setProgram = useCallback(
    (next: HaftalikProgram) => {
      setProgramState(next);
      persist(next);
    },
    [persist]
  );

  const setGun = useCallback(
    (gun: GunAdi, content: string) => {
      setProgramState((prev) => {
        const next = { ...prev, [gun]: content };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const swapGun = useCallback(
    (gun1: GunAdi, gun2: GunAdi) => {
      if (gun1 === gun2) return;
      setProgramState((prev) => {
        const next = { ...prev, [gun1]: prev[gun2], [gun2]: prev[gun1] };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return (
    <HaftalikProgramContext.Provider
      value={{ program, setProgram, setGun, swapGun, isLoaded }}
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
