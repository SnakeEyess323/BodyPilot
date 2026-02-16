"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { Challenge, ChallengeParticipant } from "@/lib/types";
import { DEFAULT_CHALLENGES } from "@/lib/challenges";
import { useAuth } from "@/context/AuthContext";
import { useGamification } from "@/context/GamificationContext";
import { createClient } from "@/lib/supabase/client";

interface CreateChallengeInput {
  title: string;
  duration_days: number;
  start_date: string;
  rules_text: string;
  reward_text: string;
  icon?: string;
  points_per_day?: number;
  bonus_points?: number;
}

interface ChallengeContextValue {
  challenges: Challenge[];
  myParticipations: ChallengeParticipant[];
  isLoaded: boolean;
  joinChallenge: (challengeId: string) => Promise<boolean>;
  joinByCode: (code: string) => Promise<{ success: boolean; challengeId?: string; error?: string }>;
  leaveChallenge: (challengeId: string) => Promise<boolean>;
  completeDay: (challengeId: string) => Promise<boolean>;
  createChallenge: (input: CreateChallengeInput) => Promise<string | null>;
  getParticipants: (challengeId: string) => Promise<ChallengeParticipant[]>;
  getMyParticipation: (challengeId: string) => ChallengeParticipant | undefined;
  refreshParticipations: () => Promise<void>;
}

const ChallengeContext = createContext<ChallengeContextValue | undefined>(
  undefined
);

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function ChallengeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addXP, data: gamData } = useGamification();
  const [challenges, setChallenges] = useState<Challenge[]>(DEFAULT_CHALLENGES);
  const [myParticipations, setMyParticipations] = useState<ChallengeParticipant[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const supabase = createClient();

  // Load challenges from Supabase (fallback to defaults)
  useEffect(() => {
    let cancelled = false;

    async function loadChallenges() {
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .order("start_date", { ascending: true });

        if (!cancelled && data && !error && data.length > 0) {
          setChallenges(data as Challenge[]);
        }
      } catch {
        // Keep defaults
      }
    }

    loadChallenges();
    return () => { cancelled = true; };
  }, []);

  // Public challenges: filter out private ones unless user is creator or participant
  const publicChallenges = useMemo(() => {
    return challenges.filter((c) => {
      if (!c.is_private) return true;
      if (user && c.creator_id === user.id) return true;
      if (myParticipations.some((p) => p.challenge_id === c.id)) return true;
      return false;
    });
  }, [challenges, user, myParticipations]);

  // Load user participations
  useEffect(() => {
    if (!user) {
      setMyParticipations([]);
      setIsLoaded(true);
      return;
    }

    let cancelled = false;

    async function loadParticipations() {
      try {
        const { data, error } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("user_id", user!.id);

        if (!cancelled && data && !error) {
          const parsed = data.map((p: any) => ({
            ...p,
            completed_days: Array.isArray(p.completed_days) ? p.completed_days : [],
          }));
          setMyParticipations(parsed);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    }

    loadParticipations();
    return () => { cancelled = true; };
  }, [user]);

  const refreshParticipations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("user_id", user.id);

      if (data && !error) {
        const parsed = data.map((p: any) => ({
          ...p,
          completed_days: Array.isArray(p.completed_days) ? p.completed_days : [],
        }));
        setMyParticipations(parsed);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const joinChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!user) return false;

      // Check if already joined
      const existing = myParticipations.find(
        (p) => p.challenge_id === challengeId
      );
      if (existing) return true;

      try {
        const { data, error } = await supabase
          .from("challenge_participants")
          .insert({
            challenge_id: challengeId,
            user_id: user.id,
            points: 0,
            completed_days: [],
            status: "active",
          })
          .select()
          .single();

        if (error) {
          console.error("joinChallenge error:", error);
          // Fallback: create participation locally so the UI is responsive
          const fallback: ChallengeParticipant = {
            id: `local-${Date.now()}`,
            challenge_id: challengeId,
            user_id: user.id,
            joined_at: new Date().toISOString(),
            points: 0,
            completed_days: [],
            status: "active",
          };
          setMyParticipations((prev) => [...prev, fallback]);
          return true;
        }

        if (data) {
          const newP: ChallengeParticipant = {
            ...data,
            completed_days: Array.isArray(data.completed_days)
              ? data.completed_days
              : [],
          };
          setMyParticipations((prev) => [...prev, newP]);
          return true;
        }
        return false;
      } catch (err) {
        console.error("joinChallenge exception:", err);
        // Fallback: create participation locally
        const fallback: ChallengeParticipant = {
          id: `local-${Date.now()}`,
          challenge_id: challengeId,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          points: 0,
          completed_days: [],
          status: "active",
        };
        setMyParticipations((prev) => [...prev, fallback]);
        return true;
      }
    },
    [user, myParticipations]
  );

  const leaveChallenge = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!user) return false;

      const participation = myParticipations.find(
        (p) => p.challenge_id === challengeId
      );
      if (!participation) return false;

      // Remove locally first (optimistic)
      setMyParticipations((prev) =>
        prev.filter((p) => p.challenge_id !== challengeId)
      );

      // Remove from Supabase
      try {
        const { error } = await supabase
          .from("challenge_participants")
          .delete()
          .eq("id", participation.id);

        if (error) {
          console.error("leaveChallenge error:", error);
        }
      } catch (err) {
        console.error("leaveChallenge exception:", err);
      }

      return true;
    },
    [user, myParticipations]
  );

  const completeDay = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!user) return false;

      const participation = myParticipations.find(
        (p) => p.challenge_id === challengeId
      );
      if (!participation) return false;

      const today = getToday();
      if (participation.completed_days.includes(today)) return true;

      const challenge = challenges.find((c) => c.id === challengeId);
      if (!challenge) return false;

      const newCompletedDays = [...participation.completed_days, today];
      const dailyPoints = challenge.points_per_day;
      let newPoints = participation.points + dailyPoints;
      let newStatus = participation.status;

      // Check if challenge is now fully completed
      if (newCompletedDays.length >= challenge.duration_days) {
        newPoints += challenge.bonus_points;
        newStatus = "completed";
      }

      // Optimistically update UI first
      setMyParticipations((prev) =>
        prev.map((p) =>
          p.id === participation.id
            ? {
                ...p,
                completed_days: newCompletedDays,
                points: newPoints,
                status: newStatus as any,
              }
            : p
        )
      );

      // Award XP
      addXP(dailyPoints);
      if (newStatus === "completed") {
        addXP(challenge.bonus_points);
      }

      try {
        const { error } = await supabase
          .from("challenge_participants")
          .update({
            completed_days: newCompletedDays,
            points: newPoints,
            status: newStatus,
          })
          .eq("id", participation.id);

        if (error) {
          console.error("completeDay error:", error);
        }
      } catch (err) {
        console.error("completeDay exception:", err);
      }

      return true;
    },
    [user, myParticipations, challenges, addXP]
  );

  const createChallenge = useCallback(
    async (input: CreateChallengeInput): Promise<string | null> => {
      if (!user) return null;

      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const startDate = new Date(input.start_date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + input.duration_days - 1);
      endDate.setHours(23, 59, 59);

      const creatorName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      // Generate a short invite code (6 chars, uppercase)
      const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

      const newChallenge: Challenge = {
        id,
        title_tr: input.title,
        title_en: input.title,
        title_de: input.title,
        title_ru: input.title,
        description_tr: input.rules_text,
        description_en: input.rules_text,
        description_de: input.rules_text,
        description_ru: input.rules_text,
        motivation_tr: input.reward_text,
        motivation_en: input.reward_text,
        motivation_de: input.reward_text,
        motivation_ru: input.reward_text,
        duration_days: input.duration_days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        icon: input.icon || "🎯",
        points_per_day: input.points_per_day || 10,
        bonus_points: input.bonus_points || 50,
        created_at: new Date().toISOString(),
        creator_id: user.id,
        rules_text: input.rules_text,
        reward_text: input.reward_text,
        creator_name: creatorName,
        is_private: true,
        invite_code: inviteCode,
      };

      try {
        const { error } = await supabase
          .from("challenges")
          .insert(newChallenge);

        if (error) {
          console.error("createChallenge error:", error);
        }
      } catch (err) {
        console.error("createChallenge exception:", err);
      }

      // Add to local state regardless
      setChallenges((prev) => [...prev, newChallenge]);

      // Auto-join the creator
      await joinChallenge(id);

      return id;
    },
    [user, joinChallenge]
  );

  const joinByCode = useCallback(
    async (code: string): Promise<{ success: boolean; challengeId?: string; error?: string }> => {
      if (!user) return { success: false, error: "not_logged_in" };

      const trimmed = code.trim().toUpperCase();
      if (!trimmed || trimmed.length < 4) return { success: false, error: "invalid_code" };

      // First check local challenges
      let found = challenges.find(
        (c) => c.invite_code?.toUpperCase() === trimmed
      );

      // If not found locally, try Supabase
      if (!found) {
        try {
          const { data, error } = await supabase
            .from("challenges")
            .select("*")
            .eq("invite_code", trimmed)
            .single();

          if (data && !error) {
            found = data as Challenge;
            // Add to local state so it's visible
            setChallenges((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              return [...prev, data as Challenge];
            });
          }
        } catch {
          // ignore
        }
      }

      if (!found) return { success: false, error: "not_found" };

      // Check if already joined
      const existing = myParticipations.find(
        (p) => p.challenge_id === found!.id
      );
      if (existing) return { success: true, challengeId: found.id };

      // Join the challenge
      const ok = await joinChallenge(found.id);
      if (ok) {
        return { success: true, challengeId: found.id };
      }
      return { success: false, error: "join_failed" };
    },
    [user, challenges, myParticipations, joinChallenge]
  );

  const getParticipants = useCallback(
    async (challengeId: string): Promise<ChallengeParticipant[]> => {
      let results: ChallengeParticipant[] = [];

      try {
        // Step 1: Fetch participants (without join to avoid FK issues)
        const { data: partData, error: partError } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("points", { ascending: false });

        if (partData && !partError && partData.length > 0) {
          // Step 2: Fetch profile info for all participant user_ids
          const userIds = partData.map((p: any) => p.user_id);
          let profileMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

          try {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, full_name, avatar_url")
              .in("id", userIds);

            if (profileData && !profileError) {
              for (const prof of profileData) {
                profileMap[prof.id] = {
                  full_name: prof.full_name || undefined,
                  avatar_url: prof.avatar_url || undefined,
                };
              }
            }
          } catch {
            // Profiles fetch failed, continue without names
          }

          // Step 3: Merge participants with profile data
          results = partData.map((p: any) => ({
            ...p,
            completed_days: Array.isArray(p.completed_days) ? p.completed_days : [],
            user_name: profileMap[p.user_id]?.full_name || "Anonymous",
            user_avatar: profileMap[p.user_id]?.avatar_url || undefined,
          }));
        }
      } catch {
        // Supabase unavailable
      }

      // Merge local participations so the current user always appears
      if (user) {
        const myLocal = myParticipations.find(
          (p) => p.challenge_id === challengeId
        );
        if (myLocal) {
          const alreadyInResults = results.some(
            (r) => r.user_id === user.id
          );
          if (!alreadyInResults) {
            const userName =
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Anonymous";
            const userAvatar = user.user_metadata?.avatar_url || undefined;
            results.push({
              ...myLocal,
              user_name: userName,
              user_avatar: userAvatar,
            });
            // Re-sort by points descending
            results.sort((a, b) => b.points - a.points);
          }
        }
      }

      return results;
    },
    [user, myParticipations]
  );

  const getMyParticipation = useCallback(
    (challengeId: string): ChallengeParticipant | undefined => {
      return myParticipations.find((p) => p.challenge_id === challengeId);
    },
    [myParticipations]
  );

  return (
    <ChallengeContext.Provider
      value={{
        challenges: publicChallenges,
        myParticipations,
        isLoaded,
        joinChallenge,
        joinByCode,
        leaveChallenge,
        completeDay,
        createChallenge,
        getParticipants,
        getMyParticipation,
        refreshParticipations,
      }}
    >
      {children}
    </ChallengeContext.Provider>
  );
}

export function useChallenge() {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error("useChallenge must be used within ChallengeProvider");
  }
  return context;
}
