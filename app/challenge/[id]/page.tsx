"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Flame,
  Gift,
  Info,
  KeyRound,
  LogIn,
  Medal,
  Share2,
  Shield,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/invite";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useChallenge } from "@/context/ChallengeContext";
import { InviteSection } from "@/components/ui/invite-section";
import type { Challenge, ChallengeParticipant } from "@/lib/types";
import {
  getChallengeTitle,
  getChallengeDescription,
  getChallengeMotivation,
  getChallengeStatus,
  getDaysRemaining,
  getDaysUntilStart,
  getElapsedDays,
  getProgressPercent,
  formatDateRange,
} from "@/lib/challenges";

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const {
    challenges,
    joinChallenge,
    leaveChallenge,
    completeDay,
    getParticipants,
    getMyParticipation,
  } = useChallenge();

  const challengeId = params.id as string;
  const challenge = challenges.find((c) => c.id === challengeId);
  const participation = getMyParticipation(challengeId);

  const [leaderboard, setLeaderboard] = useState<ChallengeParticipant[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  // Load leaderboard
  useEffect(() => {
    async function load() {
      setLoadingLeaderboard(true);
      const data = await getParticipants(challengeId);
      setLeaderboard(data);
      setLoadingLeaderboard(false);
    }
    load();
  }, [challengeId, getParticipants, participation?.points]);

  const status = challenge ? getChallengeStatus(challenge) : "ended";
  const daysRemaining = challenge ? getDaysRemaining(challenge) : 0;
  const daysUntilStart = challenge ? getDaysUntilStart(challenge) : 0;
  const elapsed = challenge ? getElapsedDays(challenge) : 0;
  const progress = participation
    ? getProgressPercent(
        participation.completed_days,
        challenge?.duration_days || 1
      )
    : 0;

  const todayDone =
    participation?.completed_days.includes(getToday()) || false;

  const handleJoin = useCallback(async () => {
    if (!user) {
      router.push("/giris");
      return;
    }
    setJoining(true);
    setFeedback(null);
    try {
      const ok = await joinChallenge(challengeId);
      if (ok) {
        setFeedback({
          type: "success",
          msg: t.challenge?.joinSuccess || "Challenge'a katıldın!",
        });
        const data = await getParticipants(challengeId);
        setLeaderboard(data);
      } else {
        setFeedback({
          type: "error",
          msg: t.challenge?.joinError || "Katılım sırasında bir hata oluştu.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        msg: t.challenge?.joinError || "Katılım sırasında bir hata oluştu.",
      });
    }
    setJoining(false);
    setTimeout(() => setFeedback(null), 4000);
  }, [challengeId, joinChallenge, getParticipants, user, router, t]);

  const handleCheckIn = useCallback(async () => {
    if (todayDone || checkingIn) return;
    setCheckingIn(true);
    await completeDay(challengeId);
    setCheckingIn(false);
    setJustCheckedIn(true);
    const data = await getParticipants(challengeId);
    setLeaderboard(data);
    setTimeout(() => setJustCheckedIn(false), 3000);
  }, [challengeId, completeDay, todayDone, checkingIn, getParticipants]);

  const handleLeave = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    setFeedback(null);
    const ok = await leaveChallenge(challengeId);
    if (ok) {
      setFeedback({
        type: "success",
        msg: t.challenge?.leaveSuccess || "Challenge'dan ayrıldın.",
      });
      const data = await getParticipants(challengeId);
      setLeaderboard(data);
    }
    setLeaving(false);
    setTimeout(() => setFeedback(null), 3000);
  }, [challengeId, leaveChallenge, getParticipants, leaving, t]);

  // Find user rank
  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = leaderboard.findIndex((p) => p.user_id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, user]);

  if (!challenge) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Challenge bulunamadı.</p>
        <Link
          href="/challenge"
          className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.challenge?.title || "Challenge'lar"}
        </Link>
      </div>
    );
  }

  const isCustom = !!challenge.creator_id;
  const title = getChallengeTitle(challenge, language);
  const description = isCustom
    ? (challenge.rules_text || getChallengeDescription(challenge, language))
    : getChallengeDescription(challenge, language);
  const motivation = isCustom
    ? (challenge.reward_text || getChallengeMotivation(challenge, language))
    : getChallengeMotivation(challenge, language);

  const rules = [
    {
      icon: <Zap className="h-4 w-4 text-yellow-500" />,
      text:
        (t.challenge?.rule1 ||
          "Her gün antrenmanını tamamla ve günlük puan kazan.") +
        ` (+${challenge.points_per_day} ${t.challenge?.pointsPerDay || "puan/gün"})`,
    },
    {
      icon: <Calendar className="h-4 w-4 text-rose-400" />,
      text:
        t.challenge?.rule2 || "Kaçırılan günler için puan kazanılamaz.",
    },
    {
      icon: <Gift className="h-4 w-4 text-violet-500" />,
      text:
        (t.challenge?.rule3 ||
          "Challenge'ı tamamen bitirenlere ekstra bonus puan verilir.") +
        ` (+${challenge.bonus_points})`,
    },
    {
      icon: <Trophy className="h-4 w-4 text-amber-500" />,
      text:
        t.challenge?.rule4 ||
        "Challenge sonunda en yüksek puanı alan katılımcı 1. olur.",
    },
    {
      icon: <Medal className="h-4 w-4 text-emerald-500" />,
      text:
        t.challenge?.rule5 ||
        "Kazananlara ve tamamlayanlara özel rozet verilir.",
    },
    {
      icon: <Shield className="h-4 w-4 text-blue-500" />,
      text:
        t.challenge?.rule6 ||
        "Katılım ücretsizdir, herkes katılabilir.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Back Button */}
      <Link
        href="/challenge"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.challenge?.title || "Challenge'lar"}
      </Link>

      {/* Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 via-rose-500/10 to-violet-500/10 border border-orange-500/20 p-6">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{challenge.icon}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {title}
              </h1>
              {isCustom && (
                <span className="rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2.5 py-0.5 text-[10px] font-medium">
                  {t.challenge?.customChallenge || "Özel Challenge"}
                </span>
              )}
            </div>
            {isCustom && challenge.creator_name && (
              <p className="text-xs text-muted-foreground mb-1">
                {t.challenge?.createdBy || "Oluşturan"}: {challenge.creator_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-3">{description}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateRange(
                  challenge.start_date,
                  challenge.end_date,
                  language
                )}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Target className="h-3.5 w-3.5" />
                {challenge.duration_days} {t.challenge?.days || "Gün"}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {leaderboard.length} {t.challenge?.participants || "Katılımcı"}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
                {challenge.points_per_day}{" "}
                {t.challenge?.pointsPerDay || "puan/gün"}
              </span>
            </div>
          </div>
        </div>

        {/* Motivation / Reward */}
        {motivation && (
          <div className="mt-4 rounded-xl bg-background/60 border border-border/50 p-4 text-center text-sm text-foreground/80">
            {isCustom && challenge.reward_text ? (
              <span className="flex items-center justify-center gap-2">
                <Gift className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span className="font-medium">{t.challenge?.formReward || "Ödül"}:</span>
                {motivation}
              </span>
            ) : (
              <span className="italic">&ldquo;{motivation}&rdquo;</span>
            )}
          </div>
        )}

        {/* Invite Code for private challenges */}
        {isCustom && challenge.invite_code && (
          <InviteCodeBox
            code={challenge.invite_code}
            t={t}
          />
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300",
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <Info className="h-5 w-5 flex-shrink-0" />
          )}
          {feedback.msg}
        </div>
      )}

      {/* Two-column layout: Main + Leaderboard sidebar */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">
        {/* LEFT COLUMN: Main content */}
        <div className="space-y-6">
          {/* Countdown / Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Days Counter */}
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              {status === "active" ? (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    {daysRemaining}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.challenge?.daysRemaining || "gün kaldı"}
                  </p>
                </>
              ) : status === "upcoming" ? (
                <>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {daysUntilStart}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.challenge?.daysUntilStart || "gün sonra başlıyor"}
                  </p>
                </>
              ) : (
                <p className="text-xl font-bold text-muted-foreground">
                  {t.challenge?.ended || "Sona Erdi"}
                </p>
              )}
            </div>

            {/* Points Info */}
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                {challenge.points_per_day}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.challenge?.pointsPerDay || "puan/gün"}
              </p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">
                +{challenge.bonus_points}{" "}
                {t.challenge?.completionBonus || "tamamlama bonusu"}
              </p>
            </div>

            {/* My Rank */}
            <div className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-violet-500" />
              </div>
              {myRank ? (
                <>
                  <p className="text-3xl font-bold text-foreground">
                    #{myRank}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.challenge?.rank || "Sıra"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-muted-foreground">-</p>
                  <p className="text-xs text-muted-foreground">
                    {t.challenge?.rank || "Sıra"}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Join / Check-in Button */}
          {!participation && status !== "ended" && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className={cn(
                "w-full rounded-xl py-4 text-lg font-bold shadow-lg transition-all disabled:opacity-60",
                !user
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-xl"
                  : "bg-gradient-to-r from-orange-500 to-rose-500 text-white hover:shadow-xl"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {!user ? (
                  <>
                    <LogIn className="h-5 w-5" />
                    {t.challenge?.loginToJoin || "Katılmak için giriş yapın"}
                  </>
                ) : joining ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ...
                  </span>
                ) : (
                  <>
                    <Flame className="h-5 w-5" />
                    {t.challenge?.join || "Katıl"}
                  </>
                )}
              </span>
            </button>
          )}

          {/* Leave button - only before challenge starts */}
          {participation && status === "upcoming" && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="w-full rounded-xl border-2 border-rose-500/30 bg-rose-500/5 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {leaving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                ) : (
                  t.challenge?.leave || "Ayrıl"
                )}
              </span>
            </button>
          )}

          {participation && status === "active" && (
            <button
              onClick={handleCheckIn}
              disabled={todayDone || checkingIn}
              className={cn(
                "w-full rounded-xl py-4 text-lg font-bold shadow-lg transition-all",
                todayDone || justCheckedIn
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-xl"
              )}
            >
              <span className="flex items-center justify-center gap-2">
                {todayDone || justCheckedIn ? (
                  <>
                    <Check className="h-6 w-6" />
                    {t.challenge?.checkedIn || "Bugün Tamamlandı"}
                  </>
                ) : checkingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ...
                  </span>
                ) : (
                  <>
                    <Flame className="h-6 w-6" />
                    {t.challenge?.checkIn || "Bugünü Tamamla"}
                  </>
                )}
              </span>
            </button>
          )}

          {/* My Progress */}
          {participation && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t.challenge?.yourProgress || "Senin İlerlemen"}
              </h3>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {participation.completed_days.length}/
                    {challenge.duration_days} {t.challenge?.days || "Gün"}
                  </span>
                  <span className="font-bold text-foreground text-lg">{progress}%</span>
                </div>
                <div className="h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-700 relative"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  >
                    {progress > 8 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">
                        {progress}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Daily Streak & Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {/* Current Streak */}
                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {(() => {
                      let streak = 0;
                      const sorted = [...participation.completed_days].sort().reverse();
                      const today = getToday();
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      const yesterdayStr = yesterday.toISOString().split("T")[0];
                      let checkDate = sorted[0] === today ? today : sorted[0] === yesterdayStr ? yesterdayStr : null;
                      if (!checkDate) return 0;
                      for (const day of sorted) {
                        if (day === checkDate) {
                          streak++;
                          const prev = new Date(checkDate);
                          prev.setDate(prev.getDate() - 1);
                          checkDate = prev.toISOString().split("T")[0];
                        }
                      }
                      return streak;
                    })()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Seri
                  </p>
                </div>

                {/* Completed Days */}
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {participation.completed_days.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {t.challenge?.days || "Gün"}
                  </p>
                </div>

                {/* Points */}
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Zap className="h-5 w-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {participation.points}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {t.challenge?.points || "Puan"}
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* Rules - Detailed */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              {t.challenge?.rules || "Kurallar"}
            </h3>

            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-lg bg-muted/30 px-4 py-3"
                >
                  <div className="mt-0.5 flex-shrink-0">{rule.icon}</div>
                  <p className="text-sm text-foreground/80">{rule.text}</p>
                </div>
              ))}
            </div>

            {/* Point breakdown chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 font-medium">
                +{challenge.points_per_day}{" "}
                {t.challenge?.pointsPerDay || "puan/gün"}
              </span>
              <span className="rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-400 px-3 py-1.5 font-medium">
                +{challenge.bonus_points}{" "}
                {t.challenge?.bonusPoints || "Tamamlama Bonusu"}
              </span>
              <span className="ml-auto">
                <InviteSection />
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Leaderboard sidebar */}
        <div className="mt-6 lg:mt-0">
          <div className="rounded-xl border border-border bg-card p-5 lg:sticky lg:top-24">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              {t.challenge?.leaderboard || "Sıralama"}
            </h3>

            {loadingLeaderboard ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-lg bg-muted"
                  />
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {t.challenge?.noParticipants ||
                    "Henüz katılımcı yok. İlk sen ol!"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((p, idx) => {
                  const isMe = user && p.user_id === user.id;
                  const rank = idx + 1;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                        isMe
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/30 hover:bg-muted/50"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-bold text-sm">
                        {rank === 1 ? (
                          <span className="text-lg">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-lg">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-lg">🥉</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-bold text-primary overflow-hidden">
                        {p.user_avatar ? (
                          <img
                            src={p.user_avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          (p.user_name || "A")[0].toUpperCase()
                        )}
                      </div>

                      {/* Name + progress */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            isMe && "text-primary"
                          )}
                        >
                          {p.user_name || "Anonymous"}
                          {isMe && " (sen)"}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (p.completed_days.length /
                                    challenge.duration_days) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {p.completed_days.length}/
                            {challenge.duration_days}
                          </span>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right flex-shrink-0 pl-1">
                        <p className="text-sm font-bold text-foreground flex items-center gap-0.5">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {p.points}
                        </p>
                      </div>

                      {/* Completed badge */}
                      {p.status === "completed" && (
                        <Medal className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Participant count footer */}
            {leaderboard.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {leaderboard.length}{" "}
                  {t.challenge?.participants || "Katılımcı"}
                </span>
                {myRank && (
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <Trophy className="h-3.5 w-3.5" />#{myRank}{" "}
                    {t.challenge?.rank || "Sıra"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteCodeBox({ code, t }: { code: string; t: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 rounded-xl bg-violet-500/5 border border-violet-500/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-violet-500 flex-shrink-0" />
          <span className="text-xs font-medium text-muted-foreground">
            {t.challenge?.yourInviteCode || "Davet Kodu"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">
            {code}
          </span>
          <button
            onClick={handleCopy}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              copied
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20"
            )}
          >
            {copied ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" />
                {t.invite?.copied || "Kopyalandı!"}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                {t.invite?.copyLink || "Kopyala"}
              </span>
            )}
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground text-center">
        {t.challenge?.shareCode || "Bu kodu arkadaşlarınla paylaş"}
      </p>
    </div>
  );
}
