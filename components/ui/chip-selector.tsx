"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { useTheme } from "next-themes";

export interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  singleSelect?: boolean;
  className?: string;
}

const transitionProps = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
  mass: 0.5,
};

export default function ChipSelector({
  options,
  value,
  onChange,
  singleSelect = true,
  className = "",
}: ChipSelectorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const selected = Array.isArray(value) ? value : value ? [value] : [];

  const toggle = (optionValue: string) => {
    if (singleSelect) {
      onChange(selected.includes(optionValue) ? "" : optionValue);
    } else {
      onChange(
        selected.includes(optionValue)
          ? selected.filter((v) => v !== optionValue)
          : [...selected, optionValue]
      );
    }
  };

  const isSelected = (optionValue: string) => selected.includes(optionValue);

  // Theme-aware colors for framer-motion animate
  const selectedBg = isDark ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.2)";
  const unselectedBg = isDark ? "rgba(100, 116, 139, 0.3)" : "rgba(148, 163, 184, 0.2)";
  const selectedHoverBg = isDark ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.3)";
  const unselectedHoverBg = isDark ? "rgba(100, 116, 139, 0.4)" : "rgba(148, 163, 184, 0.35)";
  const selectedTapBg = isDark ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.4)";
  const unselectedTapBg = isDark ? "rgba(100, 116, 139, 0.5)" : "rgba(148, 163, 184, 0.45)";

  return (
    <motion.div
      className={`flex flex-wrap gap-3 overflow-visible ${className}`}
      layout
      transition={transitionProps}
    >
      {options.map((option) => {
        const selected_ = isSelected(option.value);
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            layout
            initial={false}
            animate={{
              backgroundColor: selected_ ? selectedBg : unselectedBg,
            }}
            whileHover={{
              backgroundColor: selected_ ? selectedHoverBg : unselectedHoverBg,
            }}
            whileTap={{
              backgroundColor: selected_ ? selectedTapBg : unselectedTapBg,
            }}
            transition={{
              ...transitionProps,
              backgroundColor: { duration: 0.1 },
            }}
            className={`
              inline-flex items-center px-4 py-2.5 rounded-full text-base font-medium
              whitespace-nowrap overflow-hidden ring-1 ring-inset
              ${
                selected_
                  ? "text-primary ring-primary/50"
                  : "text-muted-foreground ring-border"
              }
            `}
          >
            <motion.div
              className="relative flex items-center"
              animate={{
                width: selected_ ? "auto" : "100%",
                paddingRight: selected_ ? "1.5rem" : "0",
              }}
              transition={{
                ease: [0.175, 0.885, 0.32, 1.275],
                duration: 0.3,
              }}
            >
              <span>{option.label}</span>
              <AnimatePresence>
                {selected_ && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={transitionProps}
                    className="absolute right-0"
                  >
                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check
                        className="w-3 h-3 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
