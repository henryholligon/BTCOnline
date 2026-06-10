import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// Loads the runtime country→emoji map from the DB (synced from a CSV tab).
export function useCountryEmojis() {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["/api/country-emojis"],
  });

  const dbMap = data ?? {};

  const getCountryEmoji = useCallback(
    (countryName: string): string => {
      const pure = countryName.replace(/[^\w\s]/gi, "").trim();
      return (
        dbMap[pure.toLowerCase()] ??
        dbMap[countryName.toLowerCase()] ??
        "🏳️"
      );
    },
    [data],
  );

  return { getCountryEmoji };
}
