"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

type AnimationType = "fade-up" | "fade-down" | "fade-in" | "scale-in" | "slide-left" | "slide-right";

interface AnimateInProps {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number;
  as?: "div" | "section" | "span" | "p" | "h1" | "h2" | "h3";
}

const variants: Record<AnimationType, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -24 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-in": {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  "scale-in": {
    hidden: { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1 },
  },
  "slide-left": {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  "slide-right": {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
};

export function AnimateIn({
  children,
  type = "fade-up",
  delay = 0,
  duration = 0.5,
  className,
  once = true,
  amount = 0.15,
  as = "div",
}: AnimateInProps) {
  const Component = motion[as];

  return (
    <Component
      variants={variants[type]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  as?: "div" | "section" | "ul";
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  as = "div",
}: StaggerContainerProps) {
  const Component = motion[as];

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </Component>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  type?: AnimationType;
  duration?: number;
}

export function StaggerItem({
  children,
  className,
  type = "fade-up",
  duration = 0.5,
}: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        ...variants[type],
        visible: {
          ...variants[type].visible,
          transition: { duration, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
