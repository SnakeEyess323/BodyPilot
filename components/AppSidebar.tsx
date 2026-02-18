"use client";

import React, { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Dumbbell,
  Utensils,
  Weight,
  Trophy,
  MessageSquare,
  CreditCard,
  MessageCircle,
  User,
  LogOut,
  Crown,
  Sun,
  Moon,
  ChevronDown,
  Users,
  Check,
  Copy,
  Share2,
  Crosshair,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { languages } from "@/lib/translations";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { generateReferralCode, getReferralLink, copyToClipboard, shareInvite } from "@/lib/invite";
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar";

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname === "/" || pathname === "/giris" || pathname === "/kayit") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-6 border-r border-border bg-background">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <SidebarLogo />
            <div className="mt-6 flex flex-col gap-0.5">
              <NavLinks pathname={pathname} />
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <SidebarSettings />
            <SidebarProfile />
          </div>
        </SidebarBody>
      </Sidebar>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

function SidebarLogo() {
  const { open, animate } = useSidebar();
  return (
    <Link href="/dashboard" className="flex items-center gap-3 py-2 px-1 relative z-20">
      <Image
        src="/logo.png"
        alt="BodyPilot"
        width={32}
        height={32}
        className="rounded-lg flex-shrink-0"
        style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
      />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="font-bold text-xl text-primary whitespace-pre"
        style={{ fontFamily: '"Cinematografica", sans-serif', letterSpacing: "0.08em" }}
      >
        BODYPILOT
      </motion.span>
    </Link>
  );
}

function NavLinks({ pathname }: { pathname: string }) {
  const { t } = useLanguage();
  const { setOpen } = useSidebar();

  const links = [
    { label: t.nav.dashboard, href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: t.nav.workoutProgram, href: "/program/antrenman", icon: <Dumbbell className="h-5 w-5" /> },
    { label: t.nav.mealProgram, href: "/program/yemek", icon: <Utensils className="h-5 w-5" /> },
    { label: t.nav.weightTracking, href: "/program/kilo-takip", icon: <Weight className="h-5 w-5" /> },
    { label: t.nav.muscleSelector, href: "/program/kas-secici", icon: <Crosshair className="h-5 w-5" /> },
    { label: t.nav.exerciseGallery, href: "/program/egzersizler", icon: <BookOpen className="h-5 w-5" /> },
    { label: t.nav.challenges, href: "/challenge", icon: <Trophy className="h-5 w-5" /> },
    { label: t.nav.bodypilot, href: "/asistan", icon: <MessageSquare className="h-5 w-5" /> },
    { label: t.nav.pricing, href: "/fiyatlandirma", icon: <CreditCard className="h-5 w-5" /> },
    { label: t.feedback.navTitle, href: "/iletisim", icon: <MessageCircle className="h-5 w-5" /> },
  ];

  return (
    <>
      {links.map((link) => (
        <SidebarLink
          key={link.href}
          link={link}
          active={pathname === link.href || pathname?.startsWith(link.href + "/")}
          onClick={() => setOpen(false)}
        />
      ))}
    </>
  );
}

function SidebarSettings() {
  const { open, animate } = useSidebar();
  const { setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <motion.div
      animate={{
        display: animate ? (open ? "block" : "none") : "block",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className="space-y-2 px-1"
    >
      <div className="flex gap-1 rounded-lg bg-muted p-0.5">
        <button
          onClick={() => setTheme("light")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
            resolvedTheme === "light"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sun className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition",
            resolvedTheme === "dark"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Moon className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex w-full items-center justify-between rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs hover:bg-accent"
        >
          <span className="flex items-center gap-1.5">
            <span>{languages.find((l) => l.code === language)?.flag}</span>
            <span>{languages.find((l) => l.code === language)?.name}</span>
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", langOpen && "rotate-180")} />
        </button>
        {langOpen && (
          <ul className="absolute left-0 right-0 bottom-full z-50 mb-1 rounded-lg border border-border bg-popover py-1 shadow-lg">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                  className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent", language === lang.code && "bg-accent")}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function SidebarProfile() {
  const { open, animate, setOpen } = useSidebar();
  const { user, signOut, loading: authLoading } = useAuth();
  const { isPro } = useSubscription();
  const { t } = useLanguage();

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U";
  const userAvatarUrl = user?.user_metadata?.avatar_url;
  const userName = user?.user_metadata?.full_name || user?.email || "";

  if (authLoading) return null;

  if (!user) {
    return (
      <SidebarLink
        link={{
          label: "Giriş Yap",
          href: "/giris",
          icon: <User className="h-5 w-5" />,
        }}
        onClick={() => setOpen(false)}
      />
    );
  }

  const profileIcon = userAvatarUrl ? (
    <Image
      src={userAvatarUrl}
      alt={userName}
      width={32}
      height={32}
      className="rounded-full object-cover flex-shrink-0"
      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground flex-shrink-0"
      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
    >
      {userInitials}
    </div>
  );

  return (
    <div className="space-y-1">
      <InviteButton />
      <Link
        href="/profil"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-accent transition-colors group/sidebar"
      >
        {profileIcon}
        <motion.div
          animate={{
            display: animate ? (open ? "flex" : "none") : "flex",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="flex items-center gap-2 min-w-0"
        >
          <span className="text-sm font-medium text-foreground truncate group-hover/sidebar:translate-x-1 transition duration-150">
            {userName}
          </span>
          {isPro && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300 flex-shrink-0">
              <Crown className="h-3 w-3" /> PRO
            </span>
          )}
          {!isPro && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 flex-shrink-0">
              <Crown className="h-3 w-3" /> Pro
            </span>
          )}
        </motion.div>
      </Link>
      <button
        onClick={async () => { await signOut(); }}
        className="flex w-full items-center gap-3 py-2 px-1.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="whitespace-pre text-sm"
        >
          Çıkış Yap
        </motion.span>
      </button>
    </div>
  );
}

function InviteButton() {
  const { open, animate } = useSidebar();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? generateReferralCode(user.id) : "";

  const handleCopy = useCallback(async () => {
    if (!referralCode) return;
    const link = getReferralLink(referralCode);
    await copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [referralCode]);

  const handleShare = useCallback(async () => {
    if (!referralCode) return;
    await shareInvite(referralCode, "BodyPilot", t.invite?.inviteDesc || "Join me on BodyPilot!");
  }, [referralCode, t]);

  if (!user) return null;

  return (
    <motion.div
      animate={{
        display: animate ? (open ? "block" : "none") : "block",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className="px-1"
    >
      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5">
        <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <span className="flex-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 truncate">
          {language === "tr" ? "Davet Et" : language === "en" ? "Invite" : language === "de" ? "Einladen" : "Пригласить"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded transition-all flex-shrink-0",
            copied ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30"
          )}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex-shrink-0"
        >
          <Share2 className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
