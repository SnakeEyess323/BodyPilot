"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl drop-shadow-lg">
          {t.home.title}
        </h1>
        <p className="mb-8 max-w-lg text-center text-gray-200 drop-shadow">
          {t.home.description}
        </p>
        <Link
          href="/onboarding"
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-primary/90 shadow-lg"
        >
          {t.home.startButton}
        </Link>
      </div>
    </div>
  );
}
