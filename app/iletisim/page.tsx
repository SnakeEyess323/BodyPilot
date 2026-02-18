"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Send, CheckCircle2, AlertCircle, ChevronDown, Bug, Lightbulb, HelpCircle, Sparkles, MoreHorizontal } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { AnimateIn, StaggerContainer, StaggerItem } from "@/components/ui/animate-in";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "bug", icon: Bug, color: "text-red-500" },
  { value: "suggestion", icon: Lightbulb, color: "text-amber-500" },
  { value: "question", icon: HelpCircle, color: "text-blue-500" },
  { value: "ux", icon: Sparkles, color: "text-violet-500" },
  { value: "general", icon: MoreHorizontal, color: "text-muted-foreground" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];

const CATEGORY_LABEL_KEYS: Record<CategoryValue, string> = {
  bug: "categoryBug",
  suggestion: "categorySuggestion",
  question: "categoryQuestion",
  ux: "categoryUx",
  general: "categoryGeneral",
};

export default function IletisimPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const fb = t.feedback;

  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState<CategoryValue>("suggestion");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (message.trim().length < 10) {
      setErrorMsg(fb.minLength);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          message: message.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, category, message, fb.minLength]);

  const handleReset = useCallback(() => {
    setMessage("");
    setStatus("idle");
    setErrorMsg("");
  }, []);

  if (status === "success") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <AnimateIn type="scale-in" duration={0.5}>
          <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center dark:border-green-800 dark:bg-green-950/30">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 dark:text-green-300">
              {fb.successTitle}
            </h2>
            <p className="mt-2 text-green-700 dark:text-green-400">
              {fb.successMessage}
            </p>
            <button
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {fb.sendAnother}
            </button>
          </div>
        </AnimateIn>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Başlık */}
      <AnimateIn type="fade-down" duration={0.5}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <MessageCircle className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{fb.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            {fb.subtitle}
          </p>
        </div>
      </AnimateIn>

      {/* Hata mesajı */}
      {status === "error" && (
        <AnimateIn type="scale-in" duration={0.3}>
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">{fb.errorTitle}</p>
              <p className="text-xs mt-0.5">{fb.errorMessage}</p>
            </div>
          </div>
        </AnimateIn>
      )}

      {/* Form */}
      <AnimateIn type="fade-up" delay={0.15}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ad ve E-posta */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {fb.name}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={fb.namePlaceholder}
                required
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {fb.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={fb.emailPlaceholder}
                required
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              />
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {fb.category}
            </label>
            <StaggerContainer className="grid grid-cols-2 gap-2 sm:grid-cols-5" staggerDelay={0.05}>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const label = (fb as Record<string, string>)[CATEGORY_LABEL_KEYS[cat.value]] || cat.value;
                const isActive = category === cat.value;
                return (
                  <StaggerItem key={cat.value} type="scale-in">
                    <button
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "flex w-full flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                        isActive
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/30"
                          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-primary" : cat.color)} />
                      <span className="line-clamp-1">{label}</span>
                    </button>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>

          {/* Mesaj */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {fb.message}
            </label>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setErrorMsg(""); }}
              placeholder={fb.messagePlaceholder}
              required
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition resize-none"
            />
            {errorMsg && (
              <p className="mt-1 text-xs text-red-500">{errorMsg}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {message.length} / 2000
            </p>
          </div>

          {/* Gönder */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !email.trim() || !message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                {fb.sending}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {fb.send}
              </>
            )}
          </button>
        </form>
      </AnimateIn>
    </div>
  );
}
