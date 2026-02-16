/**
 * User-scoped localStorage utility.
 *
 * Every key is prefixed with the authenticated user's ID so that
 * two users on the same browser never share cached data.
 *
 * Format: `${baseKey}::${userId}`
 */

// ─── helpers ────────────────────────────────────────────────────────────────

function scopedKey(baseKey: string, userId: string): string {
  return `${baseKey}::${userId}`;
}

// ─── public API ─────────────────────────────────────────────────────────────

export function getUserStorage(baseKey: string, userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(scopedKey(baseKey, userId));
  } catch {
    return null;
  }
}

export function setUserStorage(baseKey: string, userId: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(scopedKey(baseKey, userId), value);
  } catch {
    // quota exceeded or private mode – ignore
  }
}

export function removeUserStorage(baseKey: string, userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(scopedKey(baseKey, userId));
  } catch {
    // ignore
  }
}

// ─── JSON wrappers ──────────────────────────────────────────────────────────

export function getUserStorageJSON<T>(baseKey: string, userId: string): T | null {
  const raw = getUserStorage(baseKey, userId);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setUserStorageJSON(baseKey: string, userId: string, value: unknown): void {
  setUserStorage(baseKey, userId, JSON.stringify(value));
}

// ─── migration helper ───────────────────────────────────────────────────────

/**
 * One-time migration: copies old (un-scoped) localStorage value
 * into the user-scoped key, then deletes the old key.
 * Returns true if a migration happened.
 */
export function migrateUnscopedKey(baseKey: string, userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const scoped = scopedKey(baseKey, userId);
    // Already migrated – skip
    if (localStorage.getItem(scoped) !== null) return false;

    const old = localStorage.getItem(baseKey);
    if (old === null) return false;

    localStorage.setItem(scoped, old);
    localStorage.removeItem(baseKey);
    return true;
  } catch {
    return false;
  }
}
