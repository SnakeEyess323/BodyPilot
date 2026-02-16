import { createClient } from "./client";

function getSupabase() {
  return createClient();
}

/**
 * Generic key-value data operations for the user_data table.
 * Each key corresponds to a former localStorage key.
 */

export async function getUserData<T = any>(key: string): Promise<T | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_data")
    .select("value")
    .eq("user_id", user.id)
    .eq("key", key)
    .single();

  if (error || !data) return null;
  return data.value as T;
}

export async function setUserData(key: string, value: any): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("user_data").upsert(
    {
      user_id: user.id,
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" }
  );
}

/**
 * Profile-specific operations
 */

export async function getProfile(): Promise<any | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function updateProfile(updates: Record<string, any>): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id);
}

/**
 * Migrate localStorage data to Supabase for first-time login.
 * Only migrates if data exists in localStorage and not in Supabase.
 */

const MIGRATION_KEYS = [
  "spor-asistan-profil",
  "spor-asistan-haftalik-program",
  "spor-asistan-yemek-programi",
  "bodypilot-gamification",
  "spor-asistan-favori-yemekler",
  "bodypilot-language",
  "spor-asistan-antrenman-gecmisi",
  "spor-asistan-yemek-gecmisi",
  "spor-asistan-manual-food",
];

/**
 * Migrate old (pre user-scoped) localStorage data to Supabase.
 * Only migrates if data exists in old unscoped localStorage keys
 * AND user has no data in Supabase yet.
 *
 * NOTE: We intentionally do NOT copy old unscoped localStorage data
 * into user-scoped localStorage keys, because we cannot determine
 * which user the old data belongs to. Supabase (with RLS) is the
 * source of truth for user-specific data.
 */
export async function migrateLocalStorageToSupabase(): Promise<void> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // ─── ALWAYS clean up old unscoped localStorage keys first ───
  // This prevents any leftover data from a previous user being
  // accidentally migrated to a different account.
  const unscopedData: Record<string, string> = {};
  for (const key of MIGRATION_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        unscopedData[key] = raw;
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  }

  // Check if user already has data in Supabase
  const { count } = await supabase
    .from("user_data")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // If user already has data, no migration needed (keys already cleaned above)
  if (count && count > 0) return;

  // Migrate collected unscoped data to Supabase for this user
  for (const [key, raw] of Object.entries(unscopedData)) {
    try {
      let value: any;
      try {
        value = JSON.parse(raw);
      } catch {
        // For plain string values (like yemek-programi)
        value = raw;
      }
      await setUserData(key, value);
    } catch {
      // Continue with next key if one fails
    }
  }

  // Also migrate profile data to profiles table
  const profilRaw = unscopedData["spor-asistan-profil"];
  if (profilRaw) {
    try {
      const profilData = JSON.parse(profilRaw);
      await updateProfile({ data: profilData });
    } catch {
      // ignore
    }
  }
}

/**
 * Get the current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
