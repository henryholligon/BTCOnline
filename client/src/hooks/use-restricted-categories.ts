import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

// Fallback used while the query is loading so the gate is never inadvertently
// open during a cold start (before the first API response arrives).
const FALLBACK_RESTRICTED = new Set(["Nicotine", "Cannabis", "Adult", "Alcohol"]);

/**
 * Returns the live set of age-restricted category names, sourced from the
 * category emoji sheet tab (the "restricted" column). Falls back to the
 * hardcoded list while loading so restricted merchants stay hidden.
 */
export function useRestrictedCategories(): Set<string> {
  const { data } = useQuery<string[]>({
    queryKey: ["/api/restricted-categories"],
  });

  return useMemo(
    () => (data !== undefined ? new Set(data) : FALLBACK_RESTRICTED),
    [data],
  );
}
