"use client"

import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function OdemeIptalPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Cancel Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
          <XCircle className="h-10 w-10 text-orange-600 dark:text-orange-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground">
          Ödeme İptal Edildi
        </h1>

        {/* Description */}
        <p className="text-muted-foreground text-lg">
          Ödeme işlemi tamamlanmadı. Herhangi bir ücret yansıtılmadı.
          İstediğiniz zaman tekrar deneyebilirsiniz.
        </p>

        {/* Info Box */}
        <div className="bg-card rounded-2xl border border-border p-6 text-left">
          <h3 className="font-semibold text-foreground mb-3">
            Endişelenmeyin!
          </h3>
          <p className="text-sm text-muted-foreground">
            Ücretsiz plan ile uygulamayı kullanmaya devam edebilirsiniz. 
            Pro plana istediğiniz zaman geçebilirsiniz.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={() => router.push("/fiyatlandirma")}
            className={cn(
              "w-full h-12 gap-2",
              "bg-violet-600 hover:bg-violet-700 text-white"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Tekrar Dene
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="w-full h-12 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard&apos;a Dön
          </Button>
        </div>
      </div>
    </div>
  )
}
