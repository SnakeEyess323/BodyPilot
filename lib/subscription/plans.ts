export type PlanType = "free" | "pro";

export const PLAN_LIMITS = {
  free: {
    dailyAiMessages: 3,
    weeklyWorkoutCreation: 1,
    weeklyMealCreation: 1,
    advancedDiet: false,
    calendar: false,
    progressTracking: false,
  },
  pro: {
    dailyAiMessages: Infinity,
    weeklyWorkoutCreation: Infinity,
    weeklyMealCreation: Infinity,
    advancedDiet: true,
    calendar: true,
    progressTracking: true,
  },
} as const;

export function canAccess(
  plan: PlanType,
  feature: keyof (typeof PLAN_LIMITS)["free"]
): boolean {
  const value = PLAN_LIMITS[plan][feature];
  if (typeof value === "boolean") return value;
  return value === Infinity || value > 0;
}

export function getPlanDisplayName(plan: PlanType): string {
  switch (plan) {
    case "free":
      return "Ücretsiz";
    case "pro":
      return "Pro";
    default:
      return "Ücretsiz";
  }
}
