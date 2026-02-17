"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAuth } from "@/context/AuthContext";
import {
  Crown,
  ArrowLeft,
  CalendarDays,
  CreditCard,
  AlertTriangle,
  Check,
  Loader2,
  Sparkles,
  MessageSquare,
  Dumbbell,
  UtensilsCrossed,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SubDetails {
  plan: string;
  subscription: {
    status: string;
    billing_cycle: string;
    current_period_start: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    amount: number;
    currency: string;
  } | null;
}

export default function AbonelikPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isPro, refreshUsage } = useSubscription();
  const { user } = useAuth();
  const [details, setDetails] = useState<SubDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState<"success" | "error" | null>(null);

  const fetchDetails = useCallback(async () => {
    try {
      const res = await fetch("/api/polar/subscription");
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchDetails();
    else setLoading(false);
  }, [user, fetchDetails]);

  async function handleCancel() {
    setCancelling(true);
    setCancelResult(null);
    try {
      const res = await fetch("/api/polar/cancel", { method: "POST" });
      if (res.ok) {
        setCancelResult("success");
        setShowCancelConfirm(false);
        await fetchDetails();
        await refreshUsage();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCancelResult("error");
      }
    } catch {
      setCancelResult("error");
    } finally {
      setCancelling(false);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatAmount(amount: number, currency: string): string {
    const val = amount / 100;
    const symbol = currency === "TRY" ? "₺" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
    return `${val.toFixed(2)} ${symbol}`;
  }

  const sub = details?.subscription;
  const isCancelScheduled = sub?.cancel_at_period_end === true;

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/profil")}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.profile.backToProfile}
        </button>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isPro
              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}>
            <Crown className="h-5 w-5" />
          </div>
          {t.profile.subscriptionManagement}
        </h1>
      </div>

      {/* Result messages */}
      {cancelResult === "success" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div className="text-sm text-green-700 dark:text-green-400">
            <p>{t.profile.cancelSuccess}</p>
            {sub?.current_period_end && (
              <p className="mt-1 font-medium">
                {t.profile.activeUntil}: {formatDate(sub.current_period_end)}
              </p>
            )}
          </div>
        </div>
      )}
      {cancelResult === "error" && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{t.profile.cancelError}</p>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">{t.profile.currentPlan}</p>
            <p className={cn(
              "text-2xl font-bold",
              isPro ? "text-violet-600 dark:text-violet-400" : "text-foreground"
            )}>
              {isPro ? "Pro" : t.profile.freePlan}
            </p>
          </div>
          {isPro && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Pro Features */}
        {isPro && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {[
              { icon: MessageSquare, text: t.profile.unlimitedAi },
              { icon: Dumbbell, text: t.profile.unlimitedWorkout },
              { icon: UtensilsCrossed, text: t.profile.unlimitedMeal },
              { icon: Shield, text: t.profile.allFeatures },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-violet-50 dark:bg-violet-950/30 p-3">
                <item.icon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <span className="text-xs text-violet-700 dark:text-violet-300">{item.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Subscription Details */}
        {sub && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                {t.profile.billingCycle}
              </div>
              <span className="text-sm font-medium text-foreground">
                {sub.billing_cycle === "yearly" ? t.profile.yearly : t.profile.monthly}
                {sub.amount > 0 && (
                  <span className="ml-2 text-muted-foreground">
                    ({formatAmount(sub.amount, sub.currency)})
                  </span>
                )}
              </span>
            </div>

            {sub.current_period_end && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {isCancelScheduled ? t.profile.activeUntil : t.profile.nextBilling}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(sub.current_period_end)}
                </span>
              </div>
            )}

            {isCancelScheduled && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  {t.profile.scheduledCancel}
                </span>
              </div>
            )}
          </div>
        )}

        {/* No subscription info for free users */}
        {!isPro && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-4">{t.profile.noSubscription}</p>
            <button
              onClick={() => router.push("/fiyatlandirma")}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 text-sm font-medium transition"
            >
              <Crown className="h-4 w-4" />
              {t.profile.upgradeToPro}
            </button>
          </div>
        )}
      </div>

      {/* Cancel Section */}
      {isPro && !isCancelScheduled && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t.profile.cancelSubscription}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t.profile.cancelConfirmDesc}
          </p>

          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              {t.profile.cancelSubscription}
            </button>
          ) : (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-4">
                {t.profile.cancelConfirm}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  {cancelling ? t.profile.cancelling : t.profile.cancelSubscription}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resubscribe Section - shown when cancellation is scheduled */}
      {isPro && isCancelScheduled && (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-900/50 bg-card p-6 shadow-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">
            {t.profile.resubscribeDesc}
          </p>
          <button
            onClick={() => router.push("/fiyatlandirma")}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 text-sm font-medium transition"
          >
            <Crown className="h-4 w-4" />
            {t.profile.resubscribe}
          </button>
        </div>
      )}
    </div>
  );
}
