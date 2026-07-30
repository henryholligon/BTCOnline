/**
 * Age-restricted category helpers.
 *
 * The live list of restricted category names comes from the Google Sheet
 * (via the `restricted` column on the emoji tab) and is served by
 * /api/restricted-categories. Use the `useRestrictedCategories` hook in
 * React components to get that live set.
 *
 * This module retains the localStorage helpers used by home.tsx, filters.tsx,
 * and account.tsx to remember the visitor's 18+ confirmation.
 */

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
