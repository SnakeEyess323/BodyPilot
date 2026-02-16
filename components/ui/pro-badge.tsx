"use client";

import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ProBadge({ size = "sm", className }: ProBadgeProps) {
  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[10px] gap-0.5",
    md: "px-2 py-0.5 text-xs gap-1",
    lg: "px-3 py-1 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold",
        "bg-violet-100 dark:bg-violet-900/30",
        "text-violet-700 dark:text-violet-300",
        sizeStyles[size],
        className
      )}
    >
      <Crown className={iconSizes[size]} />
      PRO
    </span>
  );
}
