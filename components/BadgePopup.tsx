"use client";

import { useEffect, useState } from "react";
import { useGamification } from "@/context/GamificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { BADGES } from "@/lib/gamification";
import type { BadgeId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { X, Sparkles } from "lucide-react";

export function BadgePopup() {
  const { newlyUnlockedBadge, clearNewBadge } = useGamification();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (newlyUnlockedBadge) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [newlyUnlockedBadge]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      clearNewBadge();
    }, 300);
  };

  if (!isVisible || !newlyUnlockedBadge) return null;

  const badge = BADGES[newlyUnlockedBadge];
  const badgeName = t.gamification.badgeNames[newlyUnlockedBadge as BadgeId];
  const badgeDescription = t.gamification.badgeDescriptions[newlyUnlockedBadge as BadgeId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Popup */}
      <div
        className={cn(
          "relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/30 shadow-2xl transition-all duration-300",
          isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6 text-center">
          {/* Sparkles animation */}
          <div className="relative mx-auto mb-4">
            <div className="absolute inset-0 animate-ping">
              <div className="mx-auto h-24 w-24 rounded-full bg-yellow-500/30" />
            </div>
            <div className="relative flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg">
              <span className="text-5xl">{badge.icon}</span>
            </div>
            {/* Floating sparkles */}
            <Sparkles className="absolute -right-2 -top-2 h-6 w-6 text-yellow-400 animate-bounce" />
            <Sparkles className="absolute -left-2 top-4 h-4 w-4 text-orange-400 animate-bounce delay-100" />
            <Sparkles className="absolute -bottom-1 right-0 h-5 w-5 text-red-400 animate-bounce delay-200" />
          </div>

          {/* Title */}
          <h2 className="mb-1 text-xl font-bold text-foreground">
            🎉 {t.gamification.badgeUnlocked}
          </h2>

          {/* Badge name */}
          <h3 className="mb-2 text-2xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
            {badgeName}
          </h3>

          {/* Description */}
          <p className="mb-4 text-sm text-muted-foreground">{badgeDescription}</p>

          {/* XP Reward */}
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2 border border-yellow-500/30">
            <span className="text-lg">⭐</span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400">
              +{badge.xpReward} XP
            </span>
          </div>

          {/* Congratulations */}
          <p className="mt-4 text-sm font-medium text-foreground">
            {t.gamification.congratulations}
          </p>
        </div>

        {/* Decorative gradient */}
        <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
      </div>
    </div>
  );
}
