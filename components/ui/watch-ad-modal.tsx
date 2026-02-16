"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Play, CheckCircle2, Tv, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdRewardType = "ai_chat" | "workout" | "meal";

interface WatchAdModalProps {
  open: boolean;
  onClose: () => void;
  onRewardGranted: () => void;
  adType: AdRewardType;
  translations?: {
    watchAd?: string;
    watching?: string;
    secondsLeft?: string;
    rewardGranted?: string;
    close?: string;
    startWatching?: string;
    adTitle?: string;
    adDescription?: string;
    bonusAiChat?: string;
    bonusWorkout?: string;
    bonusMeal?: string;
  };
}

const AD_DURATION_SECONDS = 15;

const AD_BONUS_DESCRIPTIONS: Record<AdRewardType, { defaultText: string; translationKey: string }> = {
  ai_chat: { defaultText: "+3 AI mesaj hakkı kazanacaksınız", translationKey: "bonusAiChat" },
  workout: { defaultText: "+1 antrenman programı oluşturma hakkı", translationKey: "bonusWorkout" },
  meal: { defaultText: "+1 yemek programı oluşturma hakkı", translationKey: "bonusMeal" },
};

export function WatchAdModal({
  open,
  onClose,
  onRewardGranted,
  adType,
  translations: t,
}: WatchAdModalProps) {
  const [phase, setPhase] = useState<"idle" | "watching" | "granting" | "done">("idle");
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SECONDS);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const grantRewardRef = useRef<() => void>(() => {});

  const resetState = useCallback(() => {
    setPhase("idle");
    setSecondsLeft(AD_DURATION_SECONDS);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Keep ref in sync so interval callback always calls latest version
  useEffect(() => {
    grantRewardRef.current = async () => {
      setPhase("granting");
      try {
        const res = await fetch("/api/ad-reward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adType }),
        });
        if (res.ok) {
          setPhase("done");
          setTimeout(() => {
            onRewardGranted();
            onClose();
          }, 1500);
        } else {
          setPhase("idle");
        }
      } catch {
        setPhase("idle");
      }
    };
  }, [adType, onRewardGranted, onClose]);

  const startWatching = useCallback(() => {
    setPhase("watching");
    setSecondsLeft(AD_DURATION_SECONDS);

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          grantRewardRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  if (!open) return null;

  const bonusInfo = AD_BONUS_DESCRIPTIONS[adType];
  const bonusText = t?.[bonusInfo.translationKey as keyof typeof t] || bonusInfo.defaultText;
  const progressPercent = ((AD_DURATION_SECONDS - secondsLeft) / AD_DURATION_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={phase === "idle" ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl">
        {phase === "idle" && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="text-center space-y-4">
          {/* Phase: Idle - Ready to start */}
          {phase === "idle" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <Tv className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {t?.watchAd || "Reklam İzle"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t?.adDescription || "Kısa bir reklam izleyerek ek hak kazanın."}
              </p>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {bonusText}
                </p>
              </div>
              <Button
                onClick={startWatching}
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Play className="h-4 w-4" />
                {t?.startWatching || "Reklamı İzle"} ({AD_DURATION_SECONDS}sn)
              </Button>
            </>
          )}

          {/* Phase: Watching - Countdown */}
          {phase === "watching" && (
            <>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                <span className="text-2xl font-bold">{secondsLeft}</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t?.watching || "Reklam İzleniyor..."}
              </h2>

              {/* Simulated ad content */}
              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-3">
                <div className="h-3 bg-muted-foreground/20 rounded-full w-3/4 mx-auto animate-pulse" />
                <div className="h-20 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Tv className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
                </div>
                <div className="h-3 bg-muted-foreground/20 rounded-full w-1/2 mx-auto animate-pulse" />
              </div>

              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {secondsLeft} {t?.secondsLeft || "saniye kaldı"}
              </p>
            </>
          )}

          {/* Phase: Granting */}
          {phase === "granting" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <Loader2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
              <p className="text-muted-foreground">{t?.watching || "Bonus yükleniyor..."}</p>
            </>
          )}

          {/* Phase: Done */}
          {phase === "done" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {t?.rewardGranted || "Bonus Kazanıldı!"}
              </h2>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                {bonusText}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
