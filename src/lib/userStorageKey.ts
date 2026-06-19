/** Scope localStorage keys per user (Phase 2: presets & prefs per user). */
export function userStorageKey(base: string, userId?: number | null) {
  return userId ? `${base}_u${userId}` : base;
}
