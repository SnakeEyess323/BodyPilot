"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useProfil } from "@/context/ProfilContext";
import { useHaftalikProgram } from "@/context/HaftalikProgramContext";
import { useYemekProgram } from "@/context/YemekProgramContext";
import { useGamification } from "@/context/GamificationContext";
import { useAuth } from "@/context/AuthContext";
import ChatMessage from "@/components/ChatMessage";
import type { ChatMessage as ChatMessageType, GunAdi } from "@/lib/types";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { cx } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Send, X, Crown, Tv } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import { getUserStorageJSON } from "@/lib/user-storage";

const SPEED_FACTOR = 1;
const FORM_WIDTH = 420;
const FORM_HEIGHT = 180;

// Animated Color Orb Component
interface OrbProps {
  dimension?: string;
  className?: string;
  tones?: {
    base?: string;
    accent1?: string;
    accent2?: string;
    accent3?: string;
  };
  spinDuration?: number;
}

const ColorOrb: React.FC<OrbProps> = ({
  dimension = "192px",
  className,
  tones,
  spinDuration = 20,
}) => {
  const fallbackTones = {
    base: "oklch(95% 0.02 264.695)",
    accent1: "oklch(75% 0.15 350)",
    accent2: "oklch(80% 0.12 200)",
    accent3: "oklch(78% 0.14 280)",
  };

  const palette = { ...fallbackTones, ...tones };
  const dimValue = parseInt(dimension.replace("px", ""), 10);
  const blurStrength = dimValue < 50 ? Math.max(dimValue * 0.008, 1) : Math.max(dimValue * 0.015, 4);
  const contrastStrength = dimValue < 50 ? Math.max(dimValue * 0.004, 1.2) : Math.max(dimValue * 0.008, 1.5);
  const pixelDot = dimValue < 50 ? Math.max(dimValue * 0.004, 0.05) : Math.max(dimValue * 0.008, 0.1);
  const shadowRange = dimValue < 50 ? Math.max(dimValue * 0.004, 0.5) : Math.max(dimValue * 0.008, 2);
  const maskRadius = dimValue < 30 ? "0%" : dimValue < 50 ? "5%" : dimValue < 100 ? "15%" : "25%";
  const adjustedContrast = dimValue < 30 ? 1.1 : dimValue < 50 ? Math.max(contrastStrength * 1.2, 1.3) : contrastStrength;

  return (
    <div
      className={cn("color-orb", className)}
      style={{
        width: dimension,
        height: dimension,
        "--base": palette.base,
        "--accent1": palette.accent1,
        "--accent2": palette.accent2,
        "--accent3": palette.accent3,
        "--spin-duration": `${spinDuration}s`,
        "--blur": `${blurStrength}px`,
        "--contrast": adjustedContrast,
        "--dot": `${pixelDot}px`,
        "--shadow": `${shadowRange}px`,
        "--mask": maskRadius,
      } as React.CSSProperties}
    >
      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        .color-orb {
          display: grid;
          grid-template-areas: "stack";
          overflow: hidden;
          border-radius: 50%;
          position: relative;
          transform: scale(1.1);
        }
        .color-orb::before,
        .color-orb::after {
          content: "";
          display: block;
          grid-area: stack;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform: translateZ(0);
        }
        .color-orb::before {
          background:
            conic-gradient(from calc(var(--angle) * 2) at 25% 70%, var(--accent3), transparent 20% 80%, var(--accent3)),
            conic-gradient(from calc(var(--angle) * 2) at 45% 75%, var(--accent2), transparent 30% 60%, var(--accent2)),
            conic-gradient(from calc(var(--angle) * -3) at 80% 20%, var(--accent1), transparent 40% 60%, var(--accent1)),
            conic-gradient(from calc(var(--angle) * 2) at 15% 5%, var(--accent2), transparent 10% 90%, var(--accent2)),
            conic-gradient(from calc(var(--angle) * 1) at 20% 80%, var(--accent1), transparent 10% 90%, var(--accent1)),
            conic-gradient(from calc(var(--angle) * -2) at 85% 10%, var(--accent3), transparent 20% 80%, var(--accent3));
          box-shadow: inset var(--base) 0 0 var(--shadow) calc(var(--shadow) * 0.2);
          filter: blur(var(--blur)) contrast(var(--contrast));
          animation: spin var(--spin-duration) linear infinite;
        }
        .color-orb::after {
          background-image: radial-gradient(circle at center, var(--base) var(--dot), transparent var(--dot));
          background-size: calc(var(--dot) * 2) calc(var(--dot) * 2);
          backdrop-filter: blur(calc(var(--blur) * 2)) contrast(calc(var(--contrast) * 2));
          mix-blend-mode: overlay;
        }
        .color-orb[style*="--mask: 0%"]::after {
          mask-image: none;
        }
        .color-orb:not([style*="--mask: 0%"])::after {
          mask-image: radial-gradient(black var(--mask), transparent 75%);
        }
        @keyframes spin {
          to {
            --angle: 360deg;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .color-orb::before {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// ============ Helper: Bugünün gün adını al ============
function getTodayGunAdi(): GunAdi {
  const days: GunAdi[] = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return days[new Date().getDay()];
}

// ============ Helper: Bu haftanın key'i ============
function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${weekNumber}`;
}

// ============ Helper: Kullanıcı bağlamını oluştur ============
function buildUserContext(opts: {
  haftalikProgram: Record<string, string>;
  yemekProgrami: string;
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  level: number;
  levelTitle: string;
  totalWorkouts: number;
  totalMealDaysFollowed: number;
  userId: string;
}): string {
  const parts: string[] = [];
  const bugun = getTodayGunAdi();
  const bugunTarih = new Date().toLocaleDateString("tr-TR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  parts.push(`📅 Bugün: ${bugunTarih}`);

  // ---- Haftalık Antrenman Programı ----
  const program = opts.haftalikProgram;
  const hasProgramData = Object.values(program).some((v) => v && v.trim() !== "");
  if (hasProgramData) {
    parts.push("\n🏋️ HAFTALIK ANTRENMAN PROGRAMI:");
    const gunSirasi: GunAdi[] = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
    for (const gun of gunSirasi) {
      const icerik = program[gun] || "Dinlenme";
      const isBugun = gun === bugun;
      parts.push(`  ${isBugun ? "👉 " : ""}${gun}: ${icerik}${isBugun ? " (BUGÜN)" : ""}`);
    }

    // Tamamlanan antrenmanlar (bu hafta) - user-scoped
    try {
      if (opts.userId) {
        const data = getUserStorageJSON<Record<string, string[]>>("bodypilot-completed-workouts", opts.userId);
        if (data) {
          const weekKey = getWeekKey();
          const completedDays: string[] = data[weekKey] || [];
          if (completedDays.length > 0) {
            parts.push(`  ✅ Bu hafta tamamlanan günler: ${completedDays.join(", ")}`);
          }

          // Bugünün durumu
          const bugunTamamlandi = completedDays.includes(bugun);
          const bugunIcerik = program[bugun] || "";
          const isDinlenme = !bugunIcerik || bugunIcerik.toLowerCase().includes("dinlen") || bugunIcerik === "-";
          if (isDinlenme) {
            parts.push("  💤 Bugün dinlenme günü.");
          } else if (bugunTamamlandi) {
            parts.push("  ✅ Bugünkü antrenman TAMAMLANDI.");
          } else {
            parts.push("  ⏳ Bugünkü antrenman henüz yapılmadı.");
          }
        }
      }
    } catch { /* ignore localStorage errors */ }
  } else {
    parts.push("\n🏋️ Henüz bir antrenman programı oluşturulmamış.");
  }

  // ---- Yemek Programı ----
  if (opts.yemekProgrami && opts.yemekProgrami.trim()) {
    // Kısa özet - max 800 karakter
    const yemekOzet = opts.yemekProgrami.trim().slice(0, 800);
    parts.push(`\n🍽️ YEMEK PROGRAMI (özet):\n${yemekOzet}${opts.yemekProgrami.length > 800 ? "\n..." : ""}`);
  } else {
    parts.push("\n🍽️ Henüz bir yemek programı oluşturulmamış.");
  }

  // ---- Bugün ne yedi (manuel yemek takibi) - user-scoped ----
  try {
    if (opts.userId) {
      const manuelData = getUserStorageJSON<{ tarih: string; ogunler: Record<string, Array<{ baslik: string; kalori: number; protein: number; karbonhidrat: number; yag: number }>> }>("spor-asistan-manuel-ogun-yemekler", opts.userId);
      if (manuelData) {
        const bugunStr = new Date().toISOString().split("T")[0];
        if (manuelData.tarih === bugunStr && manuelData.ogunler) {
          const ogunler = manuelData.ogunler;
          const ogunNames: Record<string, string> = {
            kahvalti: "Kahvaltı",
            ogle: "Öğle",
            aksam: "Akşam",
            ara: "Ara Öğün",
          };
          const yenilenYemekler: string[] = [];
          let toplamKalori = 0;
          let toplamProtein = 0;
          let toplamKarb = 0;
          let toplamYag = 0;

          for (const [ogun, yemekler] of Object.entries(ogunler)) {
            const arr = yemekler;
            if (arr && arr.length > 0) {
              for (const y of arr) {
                yenilenYemekler.push(`${ogunNames[ogun] || ogun}: ${y.baslik} (~${y.kalori} kcal)`);
                toplamKalori += y.kalori || 0;
                toplamProtein += y.protein || 0;
                toplamKarb += y.karbonhidrat || 0;
                toplamYag += y.yag || 0;
              }
            }
          }

          if (yenilenYemekler.length > 0) {
            parts.push(`\n🥗 BUGÜN YENİLEN YEMEKLER:`);
            for (const y of yenilenYemekler) {
              parts.push(`  - ${y}`);
            }
            parts.push(`  📊 Toplam: ~${toplamKalori} kcal | P: ${toplamProtein}g | K: ${toplamKarb}g | Y: ${toplamYag}g`);
          }
        }
      }
    }
  } catch { /* ignore */ }

  // ---- Gamification İstatistikleri ----
  parts.push(`\n📈 İSTATİSTİKLER:`);
  parts.push(`  🔥 Seri: ${opts.currentStreak} gün (en uzun: ${opts.longestStreak})`);
  parts.push(`  ⭐ Seviye: ${opts.level} (${opts.levelTitle}) - ${opts.totalXP} XP`);
  parts.push(`  💪 Toplam antrenman: ${opts.totalWorkouts}`);
  parts.push(`  🥗 Yemek planına uyulan gün: ${opts.totalMealDaysFollowed}`);

  return parts.join("\n");
}

export default function AsistanPage() {
  const { profil } = useProfil();
  const { program } = useHaftalikProgram();
  const { content: yemekProgrami } = useYemekProgram();
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const {
    currentStreak,
    longestStreak,
    totalXP,
    level,
    levelTitle,
    totalWorkouts,
    totalMealDaysFollowed,
  } = useGamification();
  const { t } = useLanguage();
  const { remainingAiMessages, isPro, refreshUsage, watchAdAvailable, adBonuses } = useSubscription();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Kullanıcı bağlam bilgisini oluştur
  const userContext = useMemo(() => {
    return buildUserContext({
      haftalikProgram: program,
      yemekProgrami,
      currentStreak,
      longestStreak,
      totalXP,
      level,
      levelTitle,
      totalWorkouts,
      totalMealDaysFollowed,
      userId,
    });
  }, [program, yemekProgrami, currentStreak, longestStreak, totalXP, level, levelTitle, totalWorkouts, totalMealDaysFollowed, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const triggerClose = useCallback(() => {
    setShowForm(false);
    textareaRef.current?.blur();
  }, []);

  const triggerOpen = useCallback(() => {
    setShowForm(true);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  }, []);

  // Click outside to close
  useEffect(() => {
    function clickOutsideHandler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node) && showForm) {
        triggerClose();
      }
    }
    document.addEventListener("mousedown", clickOutsideHandler);
    return () => document.removeEventListener("mousedown", clickOutsideHandler);
  }, [showForm, triggerClose]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // Check rate limit for free users
    if (!isPro && remainingAiMessages <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setError("");
    setInput("");
    triggerClose();
    const newMessages: ChatMessageType[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, profil, userContext }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429 && data.limitReached) {
          setShowUpgradeModal(true);
          // Remove the last user message since we couldn't process it
          setMessages((prev) => prev.slice(0, -1));
          setLoading(false);
          return;
        }
        throw new Error(data.error || t.common.error);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.content || "" }]);
      // Refresh usage counts after successful message
      refreshUsage();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
      setMessages((prev) => [...prev, { role: "assistant", content: t.assistant.errorMessage }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeys(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Escape") triggerClose();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-80px)] max-w-3xl flex-col px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {t.assistant.title}
        </h1>
        {!isPro && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {remainingAiMessages > 0
                ? `${remainingAiMessages}/${3 + adBonuses.ai * 3} mesaj kaldı`
                : "Mesaj hakkınız bitti"}
            </span>
            {remainingAiMessages <= 0 && watchAdAvailable && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition"
              >
                <Tv className="h-3 w-3" />
                Reklam İzle
              </button>
            )}
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-xs font-bold text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition"
            >
              <Crown className="h-3 w-3" />
              PRO
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason="ai_chat"
      />
      
      {/* Chat Messages Container */}
      <div className="flex flex-1 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
              <motion.button
                type="button"
                onClick={triggerOpen}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 ring-2 ring-primary/10 hover:ring-primary/30 transition-all duration-300 cursor-pointer"
              >
                <Image
                  src="/logo-full.png"
                  alt="BodyPilot AI"
                  width={180}
                  height={180}
                  className="rounded-3xl"
                  priority
                />
              </motion.button>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <p className="text-lg font-medium text-foreground">{t.assistant.greeting}</p>
                <p className="text-muted-foreground mt-1">
                  {t.assistant.greetingDesc}
                </p>
              </motion.div>
            </div>
          )}
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role === "assistant" ? "assistant" : "user"}
              content={msg.content}
            />
          ))}
          {loading && (
            <div className="flex justify-start items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/logo-full.png" alt="..." width={28} height={28} className="rounded-md" />
              </motion.div>
              <div className="rounded-2xl bg-muted px-4 py-2.5 text-muted-foreground">
                {t.assistant.thinking}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        
        {error && (
          <p className="px-4 pb-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Morphing AI Input Panel */}
      <div className="flex items-center justify-center pt-6">
        <motion.div
          ref={wrapperRef}
          className={cx(
            "bg-card relative z-10 flex flex-col items-center overflow-hidden border border-border shadow-lg",
            "w-full max-w-md"
          )}
          initial={false}
          animate={{
            height: showForm ? FORM_HEIGHT : 52,
            borderRadius: showForm ? 16 : 26,
          }}
          transition={{
            type: "spring",
            stiffness: 550 / SPEED_FACTOR,
            damping: 45,
            mass: 0.7,
            delay: showForm ? 0 : 0.08,
          }}
        >
          {/* Dock Bar - Shown when form is closed */}
          <AnimatePresence mode="wait">
            {!showForm && (
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-[52px] w-full items-center justify-between px-4 select-none"
              >
                <button
                  type="button"
                  onClick={triggerOpen}
                  className="flex items-center gap-3 flex-1"
                >
                  <Image src="/logo-full.png" alt="BodyPilot AI" width={32} height={32} className="rounded-lg" />
                  <span className="text-muted-foreground text-sm">{t.assistant.askBodypilot}</span>
                </button>
                <button
                  type="button"
                  onClick={triggerOpen}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                  {t.assistant.askQuestion}
                </button>
              </motion.footer>
            )}
          </AnimatePresence>

          {/* Expanded Form */}
          <AnimatePresence>
            {showForm && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 550 / SPEED_FACTOR, damping: 45, mass: 0.7 }}
                onSubmit={handleSubmit}
                className="flex h-full w-full flex-col p-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Image src="/logo-full.png" alt="BodyPilot AI" width={24} height={24} className="rounded-md" />
                    <span className="text-foreground font-medium text-sm">{t.assistant.bodypilotAI}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="text-muted-foreground text-xs border border-border rounded px-1.5 py-0.5">
                      {t.assistant.enter}
                    </kbd>
                    <span className="text-muted-foreground text-xs">{t.assistant.sendHint}</span>
                    <button
                      type="button"
                      onClick={triggerClose}
                      className="ml-2 p-1 rounded-full hover:bg-muted transition"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.assistant.placeholder}
                  className="flex-1 w-full resize-none rounded-lg border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  onKeyDown={handleKeys}
                  spellCheck={false}
                  disabled={loading}
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {t.assistant.shiftEnter}
                  </p>
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    {t.assistant.send}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
