/**
 * Age-restricted categories — merchants in these categories are hidden from
 * the default feed until the visitor confirms they are 18+.
 */
export const RESTRICTED_CATEGORIES = ["Nicotine", "Cannabis", "Adult", "Alcohol"] as const;

export type RestrictedCategory = (typeof RESTRICTED_CATEGORIES)[number];

export const AGE_VERIFIED_KEY = "btc_age_verified";

/** Returns true when the visitor has confirmed they are 18+ in this browser. */
export function isAgeVerified(): boolean {
  try {
    return localStorage.getItem(AGE_VERIFIED_KEY) === "true";
  } catch {
    return false;
  }
}

/** Persist the age-verified preference to localStorage. */
export function setAgeVerifiedStorage(value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(AGE_VERIFIED_KEY, "true");
    } else {
      localStorage.removeItem(AGE_VERIFIED_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, etc.) — silently ignore
  }
}

/** Returns true when a merchant belongs to at least one restricted category. */
export function hasRestrictedCategory(categories: string[]): boolean {
  return categories.some(c =>
    (RESTRICTED_CATEGORIES as readonly string[]).includes(c)
  );
}
