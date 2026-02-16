"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, Crown, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSubscription } from "@/context/SubscriptionContext"

export default function OdemeBasariliPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get("checkout_id")
  const { refreshUsage } = useSubscription()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    // Kısa bir süre bekle ve kullanıcı verilerini yenile
    // Webhook'un işlenmesi için zaman tanı
    const timer = setTimeout(async () => {
      await refreshUsage()
      setIsVerifying(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [refreshUsage])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {isVerifying ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <Loader2 className="h-10 w-10 text-violet-600 dark:text-violet-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Ödemeniz İşleniyor...
            </h1>
            <p className="text-muted-foreground">
              Lütfen bekleyin, aboneliğiniz aktifleştiriliyor.
            </p>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 animate-in zoom-in duration-500">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-foreground">
              Ödeme Başarılı!
            </h1>

            {/* Description */}
            <p className="text-muted-foreground text-lg">
              Pro planınız başarıyla aktifleştirildi. Artık tüm özelliklere
              sınırsız erişiminiz var!
            </p>

            {/* Pro Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-900/30 px-6 py-3 border border-violet-200 dark:border-violet-800">
              <Crown className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <span className="font-semibold text-violet-700 dark:text-violet-300">
                Pro Üye
              </span>
            </div>

            {/* Features unlocked */}
            <div className="bg-card rounded-2xl border border-border p-6 text-left space-y-3">
              <h3 className="font-semibold text-foreground mb-4">
                Açılan Özellikler:
              </h3>
              {[
                "Sınırsız AI sohbet",
                "Sınırsız antrenman programı oluşturma",
                "Sınırsız yemek programı oluşturma",
                "Gelişmiş beslenme programı",
                "Takvim özelliği",
                "İlerleme takibi",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={() => router.push("/dashboard")}
                className={cn(
                  "w-full h-12 gap-2",
                  "bg-violet-600 hover:bg-violet-700 text-white"
                )}
              >
                Dashboard'a Git
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/asistan")}
                className="w-full h-12"
              >
                AI Asistanı Dene
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
