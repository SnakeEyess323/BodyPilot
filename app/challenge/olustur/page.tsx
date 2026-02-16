"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Gift,
  Sparkles,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useChallenge } from "@/context/ChallengeContext";

const ICONS = ["🎯", "🔥", "💪", "🏃", "🧘", "🏋️", "⚡", "🏔️", "🚀", "💎", "🌟", "🏆"];

const DURATION_OPTIONS = [7, 10, 14, 21, 30];

export default function CreateChallengePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { createChallenge } = useChallenge();

  const [title, setTitle] = useState("");
  const [durationDays, setDurationDays] = useState(21);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [rulesText, setRulesText] = useState("");
  const [rewardText, setRewardText] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [creating, setCreating] = useState(false);

  const isValid = title.trim().length >= 3 && rulesText.trim().length >= 5;

  const handleCreate = async () => {
    if (!isValid || creating) return;
    if (!user) {
      router.push("/giris");
      return;
    }

    setCreating(true);
    const id = await createChallenge({
      title: title.trim(),
      duration_days: durationDays,
      start_date: startDate,
      rules_text: rulesText.trim(),
      reward_text: rewardText.trim(),
      icon,
      points_per_day: 10,
      bonus_points: 50,
    });

    setCreating(false);

    if (id) {
      router.push(`/challenge/${id}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Back */}
      <Link
        href="/challenge"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.challenge?.title || "Challenge'lar"}
      </Link>

      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 shadow-lg">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          {t.challenge?.createTitle || "Yeni Challenge Oluştur"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.challenge?.createSubtitle || "Arkadaşlarınla özel bir challenge başlat!"}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Icon Selection */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Trophy className="h-4 w-4 text-amber-500" />
            {t.challenge?.formIcon || "İkon"}
          </label>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all",
                  icon === ic
                    ? "bg-primary/15 border-2 border-primary shadow-sm scale-110"
                    : "bg-muted/50 border border-transparent hover:bg-muted hover:scale-105"
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-blue-500" />
            {t.challenge?.formTitle || "Başlık"}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.challenge?.formTitlePlaceholder || "Challenge'ına bir isim ver"}
            maxLength={60}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
          <p className="mt-1.5 text-xs text-muted-foreground text-right">
            {title.length}/60
          </p>
        </div>

        {/* Duration */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Clock className="h-4 w-4 text-orange-500" />
            {t.challenge?.formDuration || "Kaç Gün?"}
          </label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDurationDays(d)}
                className={cn(
                  "rounded-xl px-5 py-2.5 text-sm font-medium transition-all",
                  durationDays === d
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {d} {t.challenge?.days || "Gün"}
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Calendar className="h-4 w-4 text-emerald-500" />
            {t.challenge?.formStartDate || "Başlangıç Tarihi"}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Rules */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <FileText className="h-4 w-4 text-violet-500" />
            {t.challenge?.formRules || "Kurallar"}
          </label>
          <textarea
            value={rulesText}
            onChange={(e) => setRulesText(e.target.value)}
            placeholder={
              t.challenge?.formRulesPlaceholder ||
              "Challenge kurallarını yaz... (Örn: Her gün 30 dakika koşu yap)"
            }
            rows={4}
            maxLength={500}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground text-right">
            {rulesText.length}/500
          </p>
        </div>

        {/* Reward */}
        <div className="rounded-xl border border-border bg-card p-5">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Gift className="h-4 w-4 text-rose-500" />
            {t.challenge?.formReward || "Ödül"}
          </label>
          <input
            type="text"
            value={rewardText}
            onChange={(e) => setRewardText(e.target.value)}
            placeholder={
              t.challenge?.formRewardPlaceholder ||
              "Kazanan ne kazanır? (Örn: Başarı rozeti + Topluluk saygısı)"
            }
            maxLength={200}
            className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          />
        </div>

        {/* Preview */}
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5">
          <p className="text-xs font-medium text-primary mb-3">Önizleme</p>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-semibold text-foreground">
                {title || "Challenge Başlığı"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {durationDays} {t.challenge?.days || "Gün"} · {startDate}
              </p>
              {rulesText && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {rulesText}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={!isValid || creating}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 py-4 text-lg font-bold text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {creating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.challenge?.formCreating || "Oluşturuluyor..."}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              {t.challenge?.formCreate || "Oluştur ve Başla"}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
