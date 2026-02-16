"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, X, Zap, MessageSquare, Dumbbell, Utensils, Loader2, Tv } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WatchAdModal, type AdRewardType } from "@/components/ui/watch-ad-modal";
import { useSubscription } from "@/context/SubscriptionContext";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  reason?: "ai_chat" | "create_workout" | "create_meal" | "feature";
  remaining?: number;
}

const REASON_MESSAGES: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
  ai_chat: {
    title: "AI Mesaj Limitine Ulaştınız",
    description: "Günlük mesaj hakkınızı kullandınız. Pro planla sınırsız AI sohbet yapabilirsiniz veya reklam izleyerek ek hak kazanabilirsiniz.",
    icon: <MessageSquare className="h-6 w-6" />,
  },
  create_workout: {
    title: "Antrenman Programı Limitine Ulaştınız",
    description: "Bu hafta program oluşturdunuz. Pro ile sınırsız program oluşturun veya reklam izleyerek ek hak kazanın.",
    icon: <Dumbbell className="h-6 w-6" />,
  },
  create_meal: {
    title: "Yemek Programı Limitine Ulaştınız",
    description: "Bu hafta yemek programı oluşturdunuz. Pro ile sınırsız oluşturun veya reklam izleyerek ek hak kazanın.",
    icon: <Utensils className="h-6 w-6" />,
  },
  feature: {
    title: "Pro Özellik",
    description: "Bu özellik Pro plana özeldir. Hemen yükseltin ve tüm özelliklerin keyfini çıkarın.",
    icon: <Zap className="h-6 w-6" />,
  },
};

const REASON_TO_AD_TYPE: Record<string, AdRewardType> = {
  ai_chat: "ai_chat",
  create_workout: "workout",
  create_meal: "meal",
};

export function UpgradeModal({ open, onClose, reason = "feature" }: UpgradeModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const { watchAdAvailable, refreshUsage } = useSubscription();
  const msg = REASON_MESSAGES[reason] || REASON_MESSAGES.feature;
  const adType = REASON_TO_AD_TYPE[reason];
  const canWatchAd = watchAdAvailable && !!adType;

  async function handleUpgrade() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingCycle: "monthly" }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ödeme başlatılamadı");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      onClose();
      router.push("/fiyatlandirma");
    } finally {
      setIsLoading(false);
    }
  }

  function handleWatchAd() {
    setShowAdModal(true);
  }

  function handleAdRewardGranted() {
    refreshUsage();
    setShowAdModal(false);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-border bg-background p-6 shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
              {msg.icon}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground">{msg.title}</h2>

            {/* Description */}
            <p className="text-muted-foreground text-sm">{msg.description}</p>

            {/* Watch Ad Option */}
            {canWatchAd && (
              <button
                onClick={handleWatchAd}
                className="w-full flex items-center gap-3 rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 hover:bg-emerald-500/10 transition-all group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <Tv className="h-5 w-5" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-foreground">Reklam İzle</p>
                  <p className="text-xs text-muted-foreground">
                    {adType === "ai_chat"
                      ? "15 saniyelik reklam izleyerek +3 mesaj hakkı kazan"
                      : adType === "workout"
                        ? "15 saniyelik reklam izleyerek +1 program hakkı kazan"
                        : "15 saniyelik reklam izleyerek +1 program hakkı kazan"}
                  </p>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase">
                  Ücretsiz
                </span>
              </button>
            )}

            {/* Divider */}
            {canWatchAd && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">veya</span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Features */}
            <div className="space-y-2 text-left">
              {[
                "Sınırsız AI sohbet",
                "Sınırsız antrenman programı",
                "Sınırsız yemek programı",
                "Gelişmiş yemek programı",
                "İlerleme takibi",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Crown className="h-4 w-4 text-violet-500 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 p-4">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-3xl font-bold text-foreground">$9.99</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Yıllık planda $99/yıl (%17 indirim)
              </p>
            </div>

            {/* CTA */}
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Vazgeç
              </Button>
              <Button
                className={cn(
                  "flex-1 gap-2",
                  "bg-violet-600 hover:bg-violet-700 text-white"
                )}
                onClick={handleUpgrade}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Pro&apos;ya Yükselt
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Ad Modal */}
      {canWatchAd && (
        <WatchAdModal
          open={showAdModal}
          onClose={() => setShowAdModal(false)}
          onRewardGranted={handleAdRewardGranted}
          adType={adType}
        />
      )}
    </>
  );
}
