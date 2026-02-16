"use client";

import Link from "next/link";
import { Calendar, Users, ChevronRight, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import type { Challenge, ChallengeParticipant } from "@/lib/types";
import {
  getChallengeTitle,
  getChallengeDescription,
  getChallengeStatus,
  getDaysRemaining,
  getDaysUntilStart,
  getProgressPercent,
  formatDateRange,
} from "@/lib/challenges";

interface ChallengeCardProps {
  challenge: Challenge;
  participation?: ChallengeParticipant;
  participantCount?: number;
  className?: string;
}

const STATUS_COLORS = {
  upcoming: {
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
    accent: "from-amber-500 to-orange-500",
    ring: "ring-amber-500/20",
  },
  active: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    accent: "from-emerald-500 to-cyan-500",
    ring: "ring-emerald-500/20",
  },
  ended: {
    badge: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
    accent: "from-slate-400 to-slate-500",
    ring: "ring-slate-500/20",
  },
};

const DURATION_COLORS: Record<number, string> = {
  10: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  21: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  30: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
};

export function ChallengeCard({
  challenge,
  participation,
  participantCount = 0,
  className,
}: ChallengeCardProps) {
  const { t, language } = useLanguage();
  const status = getChallengeStatus(challenge);
  const colors = STATUS_COLORS[status];
  const title = getChallengeTitle(challenge, language);
  const description = getChallengeDescription(challenge, language);
  const daysRemaining = getDaysRemaining(challenge);
  const daysUntilStart = getDaysUntilStart(challenge);
  const progress = participation
    ? getProgressPercent(participation.completed_days, challenge.duration_days)
    : 0;

  const durationColor =
    DURATION_COLORS[challenge.duration_days] ||
    "bg-primary/10 text-primary";

  return (
    <Link
      href={`/challenge/${challenge.id}`}
      className={cn(
        "group relative block rounded-2xl border-2 bg-card p-5 transition-all duration-200",
        "hover:shadow-lg hover:-translate-y-1",
        status === "active"
          ? "border-emerald-500/30 hover:border-emerald-500/50"
          : status === "upcoming"
            ? "border-amber-500/20 hover:border-amber-500/40"
            : "border-border hover:border-border/80",
        className
      )}
    >
      {/* Top Accent Bar */}
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-1 rounded-b-full bg-gradient-to-r",
          colors.accent
        )}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{challenge.icon}</span>
          <div>
            <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border",
                  colors.badge
                )}
              >
                {status === "active"
                  ? (t.challenge?.active || "Aktif")
                  : status === "upcoming"
                    ? (t.challenge?.upcoming || "Yakında")
                    : (t.challenge?.ended || "Sona Erdi")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  durationColor
                )}
              >
                {challenge.duration_days} {t.challenge?.days || "Gün"}
              </span>
              {challenge.creator_id && (
                <span className="inline-flex items-center rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 text-[10px] font-semibold">
                  {t.challenge?.customChallenge || "Özel"}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
        {description}
      </p>

      {/* Progress Bar (if joined) */}
      {participation && status !== "ended" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {t.challenge?.progress || "İlerleme"}
            </span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                colors.accent
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {participation.completed_days.length}/{challenge.duration_days} {t.challenge?.days || "Gün"}
            </span>
            <span className="text-[10px] font-medium text-primary">
              {participation.points} {t.challenge?.points || "Puan"}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateRange(challenge.start_date, challenge.end_date, language)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {participantCount} {t.challenge?.participants || "Katılımcı"}
          </span>
        </div>

        {/* Time indicator */}
        {status === "active" && daysRemaining > 0 && (
          <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <Clock className="h-3.5 w-3.5" />
            {daysRemaining} {t.challenge?.daysRemaining || "gün kaldı"}
          </span>
        )}
        {status === "upcoming" && daysUntilStart > 0 && (
          <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            {daysUntilStart} {t.challenge?.daysUntilStart || "gün sonra başlıyor"}
          </span>
        )}
        {participation?.status === "completed" && (
          <span className="flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400">
            <Trophy className="h-3.5 w-3.5" />
            {t.challenge?.completed || "Tamamlandı"}
          </span>
        )}
      </div>
    </Link>
  );
}
