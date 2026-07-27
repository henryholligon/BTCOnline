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
      const key = countryName.toLowerCase().trim();
      return dbMap[key] ?? dbMap[countryName] ?? "";
    },
    [data],
  );

  // Returns "🇧🇿 Belize" — or just "Belize" if no emoji is known yet
  const getCountryWithFlag = useCallback(
    (countryName: string): string => {
      const emoji = getCountryEmoji(countryName);
      return emoji ? `${emoji} ${countryName}` : countryName;
    },
    [getCountryEmoji],
  );

  return { dbMap, getCountryEmoji, getCountryWithFlag };
}
