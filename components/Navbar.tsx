"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, User, Moon, Sun, LogOut, Crown, Globe, Users, Check, Copy, Share2, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { languages } from "@/lib/translations";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { generateReferralCode, getReferralLink, copyToClipboard, shareInvite } from "@/lib/invite";

export default function Navbar() {
  const pathname = usePathname();
  const [programsOpen, setProgramsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPro } = useSubscription();

  const programsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const profileMobileRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProgramsOpen(false);
    setProfileOpen(false);
    setLangOpen(false);
  }, [pathname]);

  // Dışarı tıklandığında dropdown'ları kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (programsOpen && programsRef.current && !programsRef.current.contains(target)) {
        setProgramsOpen(false);
      }

      if (profileOpen) {
        const insideDesktop = profileRef.current && profileRef.current.contains(target);
        const insideMobile = profileMobileRef.current && profileMobileRef.current.contains(target);
        if (!insideDesktop && !insideMobile) {
          setProfileOpen(false);
          setLangOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [programsOpen, profileOpen]);

  const navLink =
    "rounded px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground";
  const navLinkActive = "bg-accent text-foreground";

  // Don't render navbar on landing and auth pages
  if (pathname === "/" || pathname === "/giris" || pathname === "/kayit") {
    return null;
  }

  // Get user initials for avatar
  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";

  const userAvatarUrl = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || user?.email || "";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-primary">
          <Image src="/logo.png" alt="BodyPilot" width={38} height={38} className="rounded-lg" />
          <span className="text-2xl sm:text-3xl md:text-4xl" style={{ fontFamily: '"Cinematografica", sans-serif', letterSpacing: "0.1em" }}>
            BODYPILOT
          </span>
        </Link>

        {/* Desktop Nav Links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`${navLink} ${pathname === "/dashboard" ? navLinkActive : ""}`}
          >
            {t.nav.dashboard}
          </Link>

          {/* Programlar Dropdown */}
          <div className="relative" ref={programsRef}>
            <button
              type="button"
              onClick={() => {
                setProgramsOpen(!programsOpen);
                setProfileOpen(false);
              }}
              className={`${navLink} flex items-center gap-1 ${
                pathname?.startsWith("/program") ? navLinkActive : ""
              }`}
            >
              {t.nav.programs}
              <ChevronDown className={cn("h-4 w-4 transition-transform", programsOpen && "rotate-180")} />
            </button>
            {programsOpen && (
              <ul className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-border bg-popover py-1 shadow-lg">
                <li>
                  <Link
                    href="/program/kas-secici"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => setProgramsOpen(false)}
                  >
                    {t.nav.muscleSelector}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/program/egzersizler"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => setProgramsOpen(false)}
                  >
                    {t.nav.exerciseGallery}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/program/antrenman"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => setProgramsOpen(false)}
                  >
                    {t.nav.workoutProgram}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/program/yemek"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => setProgramsOpen(false)}
                  >
                    {t.nav.mealProgram}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/program/kilo-takip"
                    className="block px-4 py-2 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => setProgramsOpen(false)}
                  >
                    {t.nav.weightTracking}
                  </Link>
                </li>
              </ul>
            )}
          </div>

          <Link
            href="/challenge"
            className={`${navLink} ${pathname?.startsWith("/challenge") ? navLinkActive : ""}`}
          >
            {t.nav.challenges}
          </Link>

          <Link
            href="/fiyatlandirma"
            className={`${navLink} ${pathname === "/fiyatlandirma" ? navLinkActive : ""}`}
          >
            {t.nav.pricing}
          </Link>

          <Link
            href="/asistan"
            className={`${navLink} ${pathname === "/asistan" ? navLinkActive : ""}`}
          >
            {t.nav.bodypilot}
          </Link>

          {/* Profil Butonu - Desktop */}
          <div className="relative ml-2 border-l border-border pl-3" ref={profileRef}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setProgramsOpen(false);
                  setLangOpen(false);
                }}
                className="flex items-center gap-2 rounded-full p-0.5 transition hover:ring-2 hover:ring-primary/30"
              >
                {userAvatarUrl ? (
                  <Image
                    src={userAvatarUrl}
                    alt={userName}
                    width={34}
                    height={34}
                    className="h-[34px] w-[34px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {userInitials}
                  </div>
                )}
                {isPro && (
                  <span className="flex items-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                    <Crown className="h-3 w-3" />
                    PRO
                  </span>
                )}
              </button>
            ) : (
              !authLoading ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setProgramsOpen(false);
                    setLangOpen(false);
                  }}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-accent hover:text-foreground hover:ring-2 hover:ring-primary/30"
                >
                  <User className="h-4 w-4" />
                </button>
              ) : null
            )}

            {/* Birlesik Dropdown: Profil + Ayarlar */}
            {profileOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[260px] rounded-lg border border-border bg-popover py-2 shadow-lg">
                {/* User Info (sadece giris yapilmissa) */}
                {user && (
                  <>
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {isPro && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                          <Crown className="h-3 w-3" />
                          Pro Plan
                        </span>
                      )}
                    </div>

                    {/* Profil Link */}
                    <Link
                      href="/profil"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      {t.nav.profile}
                    </Link>

                    {/* Davet Et - Inline buttons (no dialog) */}
                    <NavbarInviteButton />

                    {!isPro && (
                      <Link
                        href="/fiyatlandirma"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-accent"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Crown className="h-4 w-4" />
                        Pro&apos;ya Yükselt
                      </Link>
                    )}

                    <div className="my-1 border-t border-border" />
                  </>
                )}

                {/* Giris yapmamissa giris butonu */}
                {!user && (
                  <>
                    <Link
                      href="/giris"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Giriş Yap
                    </Link>
                    <div className="my-1 border-t border-border" />
                  </>
                )}

                {/* Tema Degistirici */}
                <div className="px-4 py-2.5">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t.nav.theme}</p>
                  <div className="flex gap-1 rounded-lg bg-muted p-1">
                    <button
                      onClick={() => setTheme("light")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                        resolvedTheme === "light"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Sun className="h-3.5 w-3.5" />
                      {t.nav.themeLight}
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                        resolvedTheme === "dark"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Moon className="h-3.5 w-3.5" />
                      {t.nav.themeDark}
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-border" />

                {/* Dil Secimi */}
                <div className="px-4 py-2.5">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t.nav.language}</p>
                  <div className="relative">
                    <button
                      onClick={() => setLangOpen(!langOpen)}
                      className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <span>{languages.find(l => l.code === language)?.flag}</span>
                        <span>{languages.find(l => l.code === language)?.name}</span>
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", langOpen && "rotate-180")} />
                    </button>
                    {langOpen && (
                      <ul className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-border bg-popover py-1 shadow-lg">
                        {languages.map((lang) => (
                          <li key={lang.code}>
                            <button
                              onClick={() => {
                                setLanguage(lang.code);
                                setLangOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent",
                                language === lang.code && "bg-accent"
                              )}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Cikis Yap (sadece giris yapilmissa) */}
                {user && (
                  <>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={async () => {
                        await signOut();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-accent"
                    >
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Profile + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Profile Button */}
          <div className="relative" ref={profileMobileRef}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1.5 rounded-full p-0.5 transition hover:ring-2 hover:ring-primary/30"
              >
                {userAvatarUrl ? (
                  <Image
                    src={userAvatarUrl}
                    alt={userName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {userInitials}
                  </div>
                )}
              </button>
            ) : (
              !authLoading ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setMobileMenuOpen(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <User className="h-4 w-4" />
                </button>
              ) : null
            )}

            {/* Mobile Profile Dropdown - same content as desktop */}
            {profileOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[260px] rounded-lg border border-border bg-popover py-2 shadow-lg">
                {user && (
                  <>
                    <div className="px-4 py-2.5 border-b border-border">
                      <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      {isPro && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                          <Crown className="h-3 w-3" />
                          Pro Plan
                        </span>
                      )}
                    </div>
                    <Link href="/profil" className="flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent" onClick={() => setProfileOpen(false)}>
                      <User className="h-4 w-4" />
                      {t.nav.profile}
                    </Link>
                    <NavbarInviteButton />
                    {!isPro && (
                      <Link href="/fiyatlandirma" className="flex items-center gap-3 px-4 py-2.5 text-sm text-violet-600 dark:text-violet-400 hover:bg-accent" onClick={() => setProfileOpen(false)}>
                        <Crown className="h-4 w-4" />
                        Pro&apos;ya Yükselt
                      </Link>
                    )}
                    <div className="my-1 border-t border-border" />
                  </>
                )}
                {!user && (
                  <>
                    <Link href="/giris" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent" onClick={() => setProfileOpen(false)}>
                      <User className="h-4 w-4" />
                      Giriş Yap
                    </Link>
                    <div className="my-1 border-t border-border" />
                  </>
                )}
                <div className="px-4 py-2.5">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t.nav.theme}</p>
                  <div className="flex gap-1 rounded-lg bg-muted p-1">
                    <button onClick={() => setTheme("light")} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition", resolvedTheme === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      <Sun className="h-3.5 w-3.5" />
                      {t.nav.themeLight}
                    </button>
                    <button onClick={() => setTheme("dark")} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition", resolvedTheme === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                      <Moon className="h-3.5 w-3.5" />
                      {t.nav.themeDark}
                    </button>
                  </div>
                </div>
                <div className="my-1 border-t border-border" />
                <div className="px-4 py-2.5">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">{t.nav.language}</p>
                  <div className="relative">
                    <button onClick={() => setLangOpen(!langOpen)} className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                      <span className="flex items-center gap-2">
                        <span>{languages.find(l => l.code === language)?.flag}</span>
                        <span>{languages.find(l => l.code === language)?.name}</span>
                      </span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", langOpen && "rotate-180")} />
                    </button>
                    {langOpen && (
                      <ul className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-border bg-popover py-1 shadow-lg">
                        {languages.map((lang) => (
                          <li key={lang.code}>
                            <button onClick={() => { setLanguage(lang.code); setLangOpen(false); }} className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent", language === lang.code && "bg-accent")}>
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {user && (
                  <>
                    <div className="my-1 border-t border-border" />
                    <button onClick={async () => { await signOut(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-accent">
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger Button */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setProfileOpen(false);
              setProgramsOpen(false);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto max-w-6xl px-4 py-3 space-y-1">
            <Link
              href="/dashboard"
              className={cn("block rounded-lg px-4 py-3 text-sm font-medium transition", pathname === "/dashboard" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              {t.nav.dashboard}
            </Link>

            {/* Programs - expanded list on mobile */}
            <div className="space-y-1">
              <p className="px-4 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t.nav.programs}
              </p>
              <Link
                href="/program/kas-secici"
                className={cn("block rounded-lg px-4 py-2.5 text-sm font-medium transition pl-8", pathname === "/program/kas-secici" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t.nav.muscleSelector}
              </Link>
              <Link
                href="/program/egzersizler"
                className={cn("block rounded-lg px-4 py-2.5 text-sm font-medium transition pl-8", pathname === "/program/egzersizler" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t.nav.exerciseGallery}
              </Link>
              <Link
                href="/program/antrenman"
                className={cn("block rounded-lg px-4 py-2.5 text-sm font-medium transition pl-8", pathname === "/program/antrenman" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t.nav.workoutProgram}
              </Link>
              <Link
                href="/program/yemek"
                className={cn("block rounded-lg px-4 py-2.5 text-sm font-medium transition pl-8", pathname === "/program/yemek" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t.nav.mealProgram}
              </Link>
              <Link
                href="/program/kilo-takip"
                className={cn("block rounded-lg px-4 py-2.5 text-sm font-medium transition pl-8", pathname === "/program/kilo-takip" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
              >
                {t.nav.weightTracking}
              </Link>
            </div>

            <Link
              href="/challenge"
              className={cn("block rounded-lg px-4 py-3 text-sm font-medium transition", pathname?.startsWith("/challenge") ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              {t.nav.challenges}
            </Link>

            <Link
              href="/fiyatlandirma"
              className={cn("block rounded-lg px-4 py-3 text-sm font-medium transition", pathname === "/fiyatlandirma" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              {t.nav.pricing}
            </Link>

            <Link
              href="/asistan"
              className={cn("block rounded-lg px-4 py-3 text-sm font-medium transition", pathname === "/asistan" ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground")}
            >
              {t.nav.bodypilot}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function NavbarInviteButton() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? generateReferralCode(user.id) : "";

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!referralCode) return;
    const link = getReferralLink(referralCode);
    await copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!referralCode) return;
    await shareInvite(
      referralCode,
      "BodyPilot",
      t.invite?.inviteDesc || "Join me on BodyPilot!"
    );
  }, [referralCode, t]);

  if (!user) return null;

  return (
    <div className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="flex-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
          {language === "tr" ? "Davet Et" : language === "en" ? "Invite" : language === "de" ? "Einladen" : "Пригласить"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md transition-all flex-shrink-0",
            copied
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30"
          )}
          title={t.invite?.copyLink || "Linki Kopyala"}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex-shrink-0"
          title={t.invite?.share || "Paylaş"}
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
