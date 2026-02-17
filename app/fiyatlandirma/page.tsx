"use client"

import { Zap, Crown, Dumbbell, Utensils, Bot, TrendingUp, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/context/LanguageContext"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { useSubscription } from "@/context/SubscriptionContext"

export default function FiyatlandirmaPage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { isPro } = useSubscription()
  const router = useRouter()
  const [isYearly, setIsYearly] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const pricingTiers = [
    {
      name: t.pricing.free,
      price: { monthly: 0, yearly: 0 },
      description: t.pricing.freeDesc,
      icon: <Zap className="w-7 h-7 text-gray-500 dark:text-gray-400" />,
      planType: "free" as const,
      features: [
        { name: t.pricing.features.basicWorkout, description: t.pricing.features.basicWorkoutDesc, included: true },
        { name: t.pricing.features.mealSuggestions, description: t.pricing.features.mealSuggestionsDesc, included: true },
        { name: t.pricing.features.chatLimit, description: t.pricing.features.chatLimitDesc, included: true },
        { name: t.pricing.features.advancedDiet, description: t.pricing.features.advancedDietDesc, included: false },
        { name: t.pricing.features.calendar, description: t.pricing.features.calendarDesc, included: false },
      ],
    },
    {
      name: t.pricing.pro,
      price: { monthly: 9.99, yearly: 99 },
      description: t.pricing.proDesc,
      highlight: true,
      badge: t.pricing.mostPopular,
      planType: "pro" as const,
      icon: <Crown className="w-7 h-7 text-violet-600 dark:text-violet-400" />,
      features: [
        { name: t.pricing.features.unlimitedWorkout, description: t.pricing.features.unlimitedWorkoutDesc, included: true },
        { name: t.pricing.features.advancedMeal, description: t.pricing.features.advancedMealDesc, included: true },
        { name: t.pricing.features.unlimitedChat, description: t.pricing.features.unlimitedChatDesc, included: true },
        { name: t.pricing.features.calendarFull, description: t.pricing.features.calendarFullDesc, included: true },
        { name: t.pricing.features.progress, description: t.pricing.features.progressDesc, included: true },
      ],
    },
  ]

  const buttonStyles = {
    default: cn(
      "h-12 bg-white dark:bg-zinc-900",
      "hover:bg-zinc-50 dark:hover:bg-zinc-800",
      "text-zinc-900 dark:text-zinc-100",
      "border border-zinc-200 dark:border-zinc-800",
      "shadow-sm hover:shadow-md",
    ),
    highlight: cn(
      "h-12 bg-zinc-900 dark:bg-zinc-100",
      "hover:bg-zinc-800 dark:hover:bg-zinc-300",
      "text-white dark:text-zinc-900",
      "shadow-lg",
    ),
    currentPlan: cn(
      "h-12 bg-violet-100 dark:bg-violet-900/30",
      "text-violet-700 dark:text-violet-300",
      "border border-violet-200 dark:border-violet-800",
      "cursor-default",
    ),
  }

  async function handlePlanClick(planType: "free" | "pro") {
    if (!user) {
      // Not logged in -> redirect to register
      if (planType === "pro") {
        router.push("/kayit?plan=pro")
      } else {
        router.push("/kayit")
      }
      return
    }

    if (planType === "free") {
      // Already logged in, go to dashboard
      router.push("/dashboard")
      return
    }

    if (isPro) {
      // Already pro, do nothing
      return
    }

    // Pro plan - Polar Checkout'a yönlendir
    setIsLoading(true)
    try {
      const res = await fetch("/api/polar/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingCycle: isYearly ? "yearly" : "monthly",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t.extra.paymentError)
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error("Checkout error:", error)
      alert(error instanceof Error ? error.message : t.extra.genericError)
    } finally {
      setIsLoading(false)
    }
  }

  function getButtonLabel(tier: typeof pricingTiers[0]) {
    if (user && isPro && tier.planType === "pro") {
      return t.extra.currentPlan
    }
    if (user && !isPro && tier.planType === "free") {
      return t.extra.currentPlan
    }
    return tier.highlight ? t.pricing.startNow : t.pricing.tryFree
  }

  function isCurrentPlan(tier: typeof pricingTiers[0]) {
    if (!user) return false
    if (isPro && tier.planType === "pro") return true
    if (!isPro && tier.planType === "free") return true
    return false
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="text-center pt-12 pb-4 px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          {t.pricing.title}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.pricing.description}
        </p>
      </div>

      {/* Pricing Section */}
      <section className="py-12 px-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-12">
            <h2 className="text-3xl font-bold text-foreground">
              {t.pricing.sectionTitle}
            </h2>
            <p className="text-muted-foreground">{t.pricing.sectionDesc}</p>
            <div className="inline-flex items-center p-1.5 bg-white dark:bg-zinc-800/50 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  !isYearly
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {t.pricing.monthly}
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300",
                  isYearly
                    ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {t.pricing.yearly}
                <span className="ml-1 text-xs text-violet-500 dark:text-violet-400">{t.pricing.yearlyDiscount}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  "relative group backdrop-blur-sm rounded-3xl transition-all duration-300 flex flex-col border",
                  tier.highlight
                    ? "bg-gradient-to-b from-zinc-100/80 to-transparent dark:from-zinc-400/[0.15] border-zinc-400/50 dark:border-zinc-400/20 shadow-xl"
                    : "bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 shadow-md"
                )}
              >
                {tier.badge && tier.highlight && (
                  <div className="absolute -top-4 left-6">
                    <Badge className="px-4 py-1.5 text-sm font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none shadow-lg">
                      {tier.badge}
                    </Badge>
                  </div>
                )}

                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {tier.icon}
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-foreground">{tier.name}</h3>
                      {isCurrentPlan(tier) && (
                        <span className="rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                          Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">
                        ${isYearly ? tier.price.yearly : tier.price.monthly}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {isYearly ? t.pricing.perYear : t.pricing.perMonth}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
                  </div>

                  <div className="space-y-4">
                    {tier.features.map((feature) => (
                      <div key={feature.name} className="flex gap-4">
                        <div className={cn(
                          "mt-1 p-0.5 rounded-full",
                          feature.included ? "text-violet-600 dark:text-violet-400" : "text-zinc-400 dark:text-zinc-600"
                        )}>
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{feature.name}</div>
                          <div className="text-sm text-muted-foreground">{feature.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <Button
                    className={cn(
                      "w-full",
                      isCurrentPlan(tier)
                        ? buttonStyles.currentPlan
                        : tier.highlight
                          ? buttonStyles.highlight
                          : buttonStyles.default
                    )}
                    onClick={() => handlePlanClick(tier.planType)}
                    disabled={isCurrentPlan(tier) || (isLoading && tier.planType === "pro")}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isLoading && tier.planType === "pro" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Yönlendiriliyor...
                        </>
                      ) : (
                        <>
                          {isCurrentPlan(tier) && <Check className="w-4 h-4" />}
                          {getButtonLabel(tier)}
                          {!isCurrentPlan(tier) && <ArrowRight className="w-4 h-4" />}
                        </>
                      )}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-12">
          {t.pricing.allPlansTitle}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Dumbbell className="w-6 h-6" />, title: t.pricing.smartWorkout, description: t.pricing.smartWorkoutDesc },
            { icon: <Utensils className="w-6 h-6" />, title: t.pricing.nutritionGuide, description: t.pricing.nutritionGuideDesc },
            { icon: <Bot className="w-6 h-6" />, title: t.pricing.aiCoaching, description: t.pricing.aiCoachingDesc },
            { icon: <TrendingUp className="w-6 h-6" />, title: t.pricing.progressTracking, description: t.pricing.progressTrackingDesc },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow">
              <div className="p-3 rounded-xl bg-primary/10 text-primary mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-foreground mb-12">
          {t.pricing.faqTitle}
        </h2>
        <div className="space-y-6">
          {t.pricing.faq.map((faq, i) => (
            <div key={i} className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <h2 className="text-2xl font-bold text-foreground mb-4">{t.pricing.ctaTitle}</h2>
          <p className="text-muted-foreground mb-6">{t.pricing.ctaDesc}</p>
          <Link
            href={user ? "/dashboard" : "/kayit"}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            {t.pricing.ctaButton}
          </Link>
        </div>
      </section>
    </div>
  )
}
