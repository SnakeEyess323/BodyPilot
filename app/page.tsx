"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Dumbbell,
  Utensils,
  MessageSquare,
  Images,
  Trophy,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Dumbbell,
    title: "AI Antrenman Programı",
    description:
      "Seviyenize, hedefinize ve müsaitliğinize göre kişiselleştirilmiş haftalık antrenman programı oluşturun.",
    gradient: "from-orange-500 to-rose-500",
    bgGlow: "bg-orange-500/10",
  },
  {
    icon: Utensils,
    title: "Kişisel Yemek Programı",
    description:
      "Kalori ve makro hedeflerinize uygun, öğün bazlı beslenme planı alın.",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10",
  },
  {
    icon: MessageSquare,
    title: "AI Fitness Asistanı",
    description:
      "Antrenman, beslenme ve sağlık hakkında her şeyi sorabileceğiniz akıllı sohbet asistanı.",
    gradient: "from-violet-500 to-purple-500",
    bgGlow: "bg-violet-500/10",
  },
  {
    icon: Images,
    title: "Egzersiz Galerisi",
    description:
      "Kas gruplarına göre filtrelenmiş, görsellerle desteklenmiş geniş egzersiz kütüphanesi.",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
  },
  {
    icon: Trophy,
    title: "Challenge Sistemi",
    description:
      "Toplulukla birlikte challenge'lara katılın, yarışın ve motivasyonunuzu artırın.",
    gradient: "from-amber-500 to-orange-500",
    bgGlow: "bg-amber-500/10",
  },
  {
    icon: TrendingUp,
    title: "İlerleme Takibi",
    description:
      "XP kazanın, seviye atlayın, rozetler toplayın ve fitness yolculuğunuzu takip edin.",
    gradient: "from-rose-500 to-pink-500",
    bgGlow: "bg-rose-500/10",
  },
];

const stats = [
  { value: "AI", label: "Destekli Programlar" },
  { value: "7/24", label: "Fitness Asistanı" },
  { value: "100+", label: "Egzersiz Hareketi" },
  { value: "4", label: "Dil Desteği" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-500/10 rounded-full blur-3xl opacity-50" />

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="BodyPilot"
                width={56}
                height={56}
                className="rounded-xl shadow-lg"
              />
              <span
                className="text-4xl sm:text-5xl font-bold text-primary"
                style={{
                  fontFamily: '"Cinematografica", sans-serif',
                  letterSpacing: "0.1em",
                }}
              >
                BODYPILOT
              </span>
            </div>
          </div>

          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
              <Sparkles className="h-4 w-4" />
              AI Destekli Fitness Koçun
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Hedeflerine{" "}
            <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
              Yapay Zeka
            </span>{" "}
            ile Ulaş
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-center text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Kişiselleştirilmiş antrenman programları, beslenme planları ve akıllı
            fitness asistanı ile sağlıklı yaşam yolculuğuna başla.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/kayit"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Ücretsiz Başla
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/giris"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-accent hover:-translate-y-0.5"
            >
              Giriş Yap
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Zap className="h-4 w-4" />
              Özellikler
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-4">
              Fitness Yolculuğun İçin Her Şey
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
              Yapay zeka teknolojisi ile desteklenen kapsamlı araçlar.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/30"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    feature.bgGlow
                  )}
                >
                  <feature.icon
                    className={cn(
                      "h-6 w-6 bg-gradient-to-r bg-clip-text",
                      feature.gradient === "from-orange-500 to-rose-500" && "text-orange-500",
                      feature.gradient === "from-emerald-500 to-teal-500" && "text-emerald-500",
                      feature.gradient === "from-violet-500 to-purple-500" && "text-violet-500",
                      feature.gradient === "from-blue-500 to-cyan-500" && "text-blue-500",
                      feature.gradient === "from-amber-500 to-orange-500" && "text-amber-500",
                      feature.gradient === "from-rose-500 to-pink-500" && "text-rose-500"
                    )}
                  />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-rose-500/10 border border-violet-500/20 p-10 sm:p-16">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25 mb-6">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Hemen Başla, Ücretsiz!
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
              Kredi kartı gerekmez. Ücretsiz planla AI antrenman programı, yemek
              programı ve fitness asistanını dene.
            </p>
            <Link
              href="/kayit"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-0.5"
            >
              Ücretsiz Hesap Oluştur
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="BodyPilot"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span
              className="text-sm font-bold text-muted-foreground"
              style={{
                fontFamily: '"Cinematografica", sans-serif',
                letterSpacing: "0.08em",
              }}
            >
              BODYPILOT
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} BodyPilot. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
