"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle,
  Crown,
  ArrowRight,
  Loader2,
  Dumbbell,
  Utensils,
  MessageSquare,
  CalendarDays,
  TrendingUp,
  Sparkles,
  Brain,
  Salad,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/context/SubscriptionContext"

const PRO_FEATURES = [
  {
    icon: MessageSquare,
    title: "Sınırsız AI Sohbet",
    description: "Kişisel fitness asistanınıza istediğiniz kadar soru sorun",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Dumbbell,
    title: "Sınırsız Antrenman Programı",
    description: "Hedefinize özel AI destekli antrenman programları oluşturun",
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    icon: Utensils,
    title: "Sınırsız Yemek Programı",
    description: "Kişiselleştirilmiş beslenme planları ile hedeflerinize ulaşın",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Salad,
    title: "Gelişmiş Beslenme Takibi",
    description: "Kalori ve makro besin değerlerini detaylı takip edin",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Brain,
    title: "AI Yemek Analizi",
    description: "Fotoğraf çekerek yemeklerin besin değerlerini anında öğrenin",
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    icon: CalendarDays,
    title: "Antrenman Takvimi",
    description: "Antrenmanlarınızı takvim üzerinde planlayın ve takip edin",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: TrendingUp,
    title: "İlerleme Takibi",
    description: "Gelişiminizi grafikler ve istatistiklerle görün",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Detaylı İstatistikler",
    description: "Haftalık ve aylık performans raporlarınıza erişin",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
]

function OdemeBasariliContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get("checkout_id")
  const { refreshUsage } = useSubscription()
  const [isVerifying, setIsVerifying] = useState(true)
  const [showFeatures, setShowFeatures] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      await refreshUsage()
      setIsVerifying(false)
      // Stagger feature cards animation
      setTimeout(() => setShowFeatures(true), 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [refreshUsage])

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative gradient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -left-20 w-[300px] h-[300px] rounded-full bg-blue-500/8 blur-[80px]" />
        <div className="absolute top-1/2 -right-20 w-[300px] h-[300px] rounded-full bg-pink-500/8 blur-[80px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-20">
        {isVerifying ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                <Loader2 className="h-12 w-12 text-violet-600 dark:text-violet-400 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Ödemeniz İşleniyor...
            </h1>
            <p className="text-muted-foreground text-lg max-w-md">
              Lütfen bekleyin, aboneliğiniz aktifleştiriliyor.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Hero Section */}
            <div className="text-center space-y-6">
              {/* Animated success icon */}
              <div className="relative mx-auto w-fit">
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping [animation-duration:2s]" />
                <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25">
                  <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
                </div>
              </div>

              {/* Thank you message */}
              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                  Teşekkürler!
                </h1>
                <p className="text-xl sm:text-2xl font-semibold text-foreground/80">
                  Ödemeniz başarıyla alındı
                </p>
              </div>

              {/* Welcome card */}
              <div className="mx-auto max-w-lg rounded-2xl border border-violet-200 dark:border-violet-800/60 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/30 p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Crown className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                  <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                    BodyPilot Pro&apos;ya Hoş Geldiniz!
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Artık tüm Pro özelliklere sınırsız erişiminiz var. 
                  Hedeflerinize en kısa yoldan ulaşmak için her şey hazır!
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground text-center">
                  Artık Kullanabileceğiniz Özellikler
                </h2>
                <Sparkles className="h-5 w-5 text-violet-500" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {PRO_FEATURES.map((feature, i) => (
                  <div
                    key={feature.title}
                    className={cn(
                      "group flex items-start gap-4 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 hover:-translate-y-0.5",
                      showFeatures
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    )}
                    style={{
                      transitionDelay: showFeatures ? `${i * 80}ms` : "0ms",
                    }}
                  >
                    <div className={cn("flex-shrink-0 rounded-xl p-2.5", feature.bg)}>
                      <feature.icon className={cn("h-5 w-5", feature.color)} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Section */}
            <div className="mx-auto max-w-md space-y-3 pt-2">
              <Button
                onClick={() => router.push("/dashboard")}
                className={cn(
                  "w-full h-13 gap-2 text-base font-semibold",
                  "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300"
                )}
              >
                Dashboard&apos;a Git
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/program/antrenman")}
                  className="h-11 gap-2 text-sm"
                >
                  <Dumbbell className="h-4 w-4" />
                  Program Oluştur
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/asistan")}
                  className="h-11 gap-2 text-sm"
                >
                  <MessageSquare className="h-4 w-4" />
                  AI Asistan
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OdemeBasariliPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <Loader2 className="h-10 w-10 text-violet-600 animate-spin" />
        </div>
      }
    >
      <OdemeBasariliContent />
    </Suspense>
  )
}
