'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { LayoutDashboard, Dumbbell, Utensils, MessageSquare, Trophy, Weight, MessageCircle, CreditCard } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface NavItem {
  icon: React.ReactNode;
  labelKey: string;
  href: string;
  gradient: string;
  iconColor: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    labelKey: 'dashboard',
    href: '/dashboard',
    gradient: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(124,58,237,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
  },
  {
    icon: <Dumbbell className="h-5 w-5" />,
    labelKey: 'workoutProgram',
    href: '/program/antrenman',
    gradient: 'radial-gradient(circle, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-orange-500 dark:group-hover:text-orange-400',
  },
  {
    icon: <Utensils className="h-5 w-5" />,
    labelKey: 'mealProgram',
    href: '/program/yemek',
    gradient: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(22,163,74,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
  },
  {
    icon: <Weight className="h-5 w-5" />,
    labelKey: 'weightTracking',
    href: '/program/kilo-takip',
    gradient: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(37,99,235,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    labelKey: 'challenges',
    href: '/challenge',
    gradient: 'radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(217,119,6,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    labelKey: 'bodypilot',
    href: '/asistan',
    gradient: 'radial-gradient(circle, rgba(147,51,234,0.18) 0%, rgba(126,34,206,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
  },
  {
    icon: <CreditCard className="h-5 w-5" />,
    labelKey: 'pricing',
    href: '/fiyatlandirma',
    gradient: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(219,39,119,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-pink-500 dark:group-hover:text-pink-400',
  },
  {
    icon: <MessageCircle className="h-5 w-5" />,
    labelKey: 'feedback',
    href: '/iletisim',
    gradient: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, rgba(13,148,136,0.06) 50%, transparent 100%)',
    iconColor: 'group-hover:text-teal-500 dark:group-hover:text-teal-400',
  },
];

const itemVariants: Variants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
};

const backVariants: Variants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
};

const glowVariants: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: 'spring', stiffness: 300, damping: 25 },
    },
  },
};

const sharedTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20,
  duration: 0.5,
};

export default function HoverGradientNavBar(): React.JSX.Element | null {
  const { t } = useLanguage();
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/giris' || pathname === '/kayit') {
    return null;
  }

  const navLabels: Record<string, string> = {
    dashboard: t.nav.dashboard,
    workoutProgram: t.nav.workoutProgram,
    mealProgram: t.nav.mealProgram,
    weightTracking: t.nav.weightTracking,
    challenges: t.nav.challenges,
    bodypilot: t.nav.bodypilot,
    pricing: t.nav.pricing,
    feedback: t.feedback.navTitle,
  };

  return (
    <div className="fixed bottom-0 left-0 w-full md:bottom-4 md:left-1/2 md:-translate-x-1/2 z-50">
      <motion.nav
        className="w-full md:w-fit mx-auto px-1 md:px-4 py-1.5 md:py-3 rounded-none md:rounded-3xl
        bg-background/90 backdrop-blur-lg
        border-t md:border border-border/80
        shadow-lg md:shadow-xl relative"
        initial="initial"
        whileHover="hover"
      >
        <ul className="flex items-center justify-around md:justify-center gap-0.5 md:gap-2 relative z-10">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <motion.li key={item.labelKey} className="relative flex-1 md:flex-none">
                <motion.div
                  className="block rounded-xl md:rounded-2xl overflow-visible group relative"
                  style={{ perspective: '600px' }}
                  whileHover="hover"
                  initial="initial"
                >
                  <motion.div
                    className="absolute inset-0 z-0 pointer-events-none rounded-xl md:rounded-2xl"
                    variants={glowVariants}
                    style={{ background: item.gradient, opacity: 0 }}
                  />
                  {/* Front */}
                  <motion.div
                    variants={itemVariants}
                    transition={sharedTransition}
                    style={{ transformStyle: 'preserve-3d', transformOrigin: 'center bottom' }}
                  >
                    <Link
                      href={item.href}
                      className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2
                      px-1.5 py-1.5 md:px-3 md:py-2 relative z-10
                      transition-colors rounded-xl md:rounded-2xl text-[10px] md:text-sm
                      ${isActive
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <span className={`transition-colors duration-300 ${isActive ? 'text-primary' : item.iconColor}`}>
                        {item.icon}
                      </span>
                      <span className="hidden lg:inline font-medium truncate max-w-[80px]">
                        {navLabels[item.labelKey]}
                      </span>
                    </Link>
                  </motion.div>
                  {/* Back */}
                  <motion.div
                    className="absolute inset-0 z-10"
                    variants={backVariants}
                    transition={sharedTransition}
                    style={{ transformStyle: 'preserve-3d', transformOrigin: 'center top', transform: 'rotateX(90deg)' }}
                  >
                    <Link
                      href={item.href}
                      className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2
                      px-1.5 py-1.5 md:px-3 md:py-2 h-full
                      transition-colors rounded-xl md:rounded-2xl text-[10px] md:text-sm
                      ${isActive
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    >
                      <span className={`transition-colors duration-300 ${isActive ? 'text-primary' : item.iconColor}`}>
                        {item.icon}
                      </span>
                      <span className="hidden lg:inline font-medium truncate max-w-[80px]">
                        {navLabels[item.labelKey]}
                      </span>
                    </Link>
                  </motion.div>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary md:hidden"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
}
