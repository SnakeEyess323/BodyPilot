"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useHaftalikProgram } from "@/context/HaftalikProgramContext";
import { useYemekProgram } from "@/context/YemekProgramContext";
import { useLanguage } from "@/context/LanguageContext";
import { useChallenge } from "@/context/ChallengeContext";
import { WorkoutStickyNotes } from "@/components/ui/workout-sticky-notes";
import { AntrenmanGecmis } from "@/components/ui/antrenman-gecmis";
import { ManualFoodTracker } from "@/components/ui/manual-food-tracker";
import { YemekStickyNotesSection } from "@/components/ui/yemek-program-section";
import { GamificationSection } from "@/components/GamificationWidget";
import {
  getChallengeTitle,
  getChallengeStatus,
  getDaysRemaining,
  getProgressPercent,
} from "@/lib/challenges";
import { Trophy, Flame, ChevronRight, Zap, Target } from "lucide-react";

export default function DashboardPage() {
  const { program, displayProgram, isTranslating } = useHaftalikProgram();
  const { content: yemekContent, displayContent: yemekDisplayContent } = useYemekProgram();
  const { t, language } = useLanguage();
  const { challenges, myParticipations } = useChallenge();

  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Program boş mu kontrol et
  const hasWorkoutProgram = useMemo(
    () => Object.values(program).some((v) => v && v.trim() !== ""),
    [program]
  );

  // Active challenge participations
  const activeParticipations = useMemo(() => {
    return myParticipations
      .filter((p) => p.status === "active")
      .map((p) => {
        const ch = challenges.find((c) => c.id === p.challenge_id);
        return ch ? { participation: p, challenge: ch } : null;
      })
      .filter(Boolean) as { participation: typeof myParticipations[0]; challenge: typeof challenges[0] }[];
  }, [myParticipations, challenges]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-foreground">{t.dashboard.title}</h1>

      {/* Gamification Section */}
      <section className="mb-10">
        <GamificationSection />
      </section>

      {/* Challenge Section */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-orange-500" />
            {t.challenge?.title || "Challenge'lar"}
          </h2>
          <Link
            href="/challenge"
            className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
          >
            {t.challenge?.filterAll || "Tümü"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {activeParticipations.length > 0 ? (
          <div className="space-y-3">
            {activeParticipations.map(({ participation, challenge }) => {
              const title = getChallengeTitle(challenge, language);
              const status = getChallengeStatus(challenge);
              const daysLeft = getDaysRemaining(challenge);
              const progress = getProgressPercent(
                participation.completed_days,
                challenge.duration_days
              );

              return (
                <Link
                  key={challenge.id}
                  href={`/challenge/${challenge.id}`}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40 hover:shadow-md group"
                >
                  <span className="text-3xl flex-shrink-0">{challenge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {title}
                      </p>
                      {status === "active" && (
                        <span className="flex-shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                          {t.challenge?.active || "Aktif"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {participation.completed_days.length}/{challenge.duration_days} {t.challenge?.days || "Gün"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {participation.points} {t.challenge?.points || "Puan"}
                      </span>
                      {status === "active" && daysLeft > 0 && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {daysLeft} {t.challenge?.daysRemaining || "gün kaldı"}
                        </span>
                      )}
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${Math.max(progress, 2)}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <Link
            href="/challenge"
            className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 p-6 transition hover:border-primary/40 hover:bg-card group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
              <Trophy className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-0.5">
                {t.challenge?.title || "Challenge'lar"}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.challenge?.subtitle || "Toplulukla birlikte hedefe ulaş!"}
              </p>
            </div>
            <span className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground group-hover:bg-primary/90 transition flex-shrink-0">
              {t.challenge?.join || "Katıl"}
            </span>
          </Link>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t.dashboard.weeklyWorkout || "Haftalık Antrenman"}
          </h2>
          <Link
            href="/program/antrenman"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            {t.dashboard.editProgram || "Programı Düzenle"}
          </Link>
        </div>
        {hasWorkoutProgram ? (
          <WorkoutStickyNotes
            program={program}
            displayProgram={displayProgram}
            isTranslating={isTranslating}
            onComplete={() => setHistoryRefresh((c) => c + 1)}
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mb-4 text-4xl">🏋️</div>
            <p className="mb-4 text-muted-foreground">
              {t.dashboard.noWorkoutProgram || "Henüz antrenman programınız yok."}
            </p>
            <Link
              href="/program/antrenman"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {t.dashboard.createWorkout}
            </Link>
          </div>
        )}
        {/* Antrenman Gecmisi */}
        <AntrenmanGecmis className="mt-6" refreshTrigger={historyRefresh} />
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t.dashboard.mealProgram}
          </h2>
          <Link
            href="/program/yemek"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            {t.dashboard.newProgram}
          </Link>
        </div>
        {!yemekContent.trim() ? (
          <div className="space-y-4">
            <ManualFoodTracker />
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="mb-4 text-4xl">🍽️</div>
              <p className="mb-4 text-muted-foreground">
                {t.dashboard.noMealProgram}
              </p>
              <Link
                href="/program/yemek"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                {t.dashboard.createMealProgram}
              </Link>
            </div>
          </div>
        ) : (
          <YemekStickyNotesSection content={yemekDisplayContent} />
        )}
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/program/antrenman"
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t.dashboard.workoutProgramCard}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.dashboard.workoutProgramDesc}
          </p>
        </Link>
        <Link
          href="/program/yemek"
          className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/50 hover:shadow-md"
        >
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t.dashboard.mealProgramCard}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.dashboard.mealProgramDesc}
          </p>
        </Link>
      </div>
      <div className="mt-10">
        <Link
          href="/asistan"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          {t.dashboard.chatWithAssistant}
        </Link>
      </div>
    </div>
  );
}

