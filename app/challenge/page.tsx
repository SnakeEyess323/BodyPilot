"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Flame,
  Filter,
  Plus,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useChallenge } from "@/context/ChallengeContext";
import { ChallengeCard } from "@/components/ui/challenge-card";
import { InviteSection } from "@/components/ui/invite-section";
import { getChallengeStatus } from "@/lib/challenges";

type FilterTab = "all" | "active" | "ended";

export default function ChallengePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { challenges, myParticipations, isLoaded, joinByCode } = useChallenge();
  const [filter, setFilter] = useState<FilterTab>("all");

  // Join by code state
  const [code, setCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeFeedback, setCodeFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const filteredChallenges = useMemo(() => {
    if (filter === "all") return challenges;
    return challenges.filter((c) => {
      const status = getChallengeStatus(c);
      if (filter === "active")
        return status === "active" || status === "upcoming";
      if (filter === "ended") return status === "ended";
      return true;
    });
  }, [challenges, filter]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: t.challenge?.filterAll || "Tümü" },
    { key: "active", label: t.challenge?.filterActive || "Aktif" },
    { key: "ended", label: t.challenge?.filterCompleted || "Bitti" },
  ];

  const handleJoinByCode = useCallback(async () => {
    if (!code.trim() || codeLoading) return;
    setCodeLoading(true);
    setCodeFeedback(null);

    const result = await joinByCode(code.trim());

    if (result.success && result.challengeId) {
      setCodeFeedback({
        type: "success",
        msg: t.challenge?.codeSuccess || "Challenge'a katıldın!",
      });
      setCode("");
      setTimeout(() => {
        router.push(`/challenge/${result.challengeId}`);
      }, 800);
    } else {
      const errorMsg =
        result.error === "not_found"
          ? t.challenge?.codeNotFound ||
            "Bu kodla eşleşen challenge bulunamadı."
          : result.error === "not_logged_in"
            ? t.challenge?.loginToJoin || "Katılmak için giriş yapın"
            : t.challenge?.codeInvalid || "Geçersiz kod.";
      setCodeFeedback({ type: "error", msg: errorMsg });
    }

    setCodeLoading(false);
    setTimeout(() => setCodeFeedback(null), 4000);
  }, [code, codeLoading, joinByCode, router, t]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg flex-shrink-0">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t.challenge?.title || "Challenge'lar"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t.challenge?.subtitle || "Toplulukla birlikte hedefe ulaş!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/challenge/olustur"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="h-4 w-4" />
            {t.challenge?.createChallenge || "Challenge Oluştur"}
          </Link>
          <InviteSection />
        </div>
      </div>

      {/* Join with Invite Code */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
            <KeyRound className="h-5 w-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {t.challenge?.joinWithCode || "Davet Kodu ile Katıl"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.challenge?.enterCode || "Davet kodunu gir"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              placeholder={t.challenge?.codePlaceholder || "Örn: ABC123"}
              maxLength={10}
              className="w-32 sm:w-40 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest text-foreground placeholder:text-muted-foreground/50 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition uppercase"
            />
            <button
              onClick={handleJoinByCode}
              disabled={!code.trim() || codeLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {codeLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {t.challenge?.codeJoin || "Katıl"}
            </button>
          </div>
        </div>

        {/* Feedback */}
        {codeFeedback && (
          <div
            className={cn(
              "mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200",
              codeFeedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-700 dark:text-rose-400"
            )}
          >
            {codeFeedback.type === "success" ? (
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            {codeFeedback.msg}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              filter === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenge Grid */}
      {!isLoaded ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : filteredChallenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Flame className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            {t.challenge?.noChallenges || "Henüz challenge bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => {
            const participation = myParticipations.find(
              (p) => p.challenge_id === challenge.id
            );
            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                participation={participation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
