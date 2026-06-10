import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

const STATIC_MAP: Record<string, string> = {
  "USA": "🇺🇸", "United States": "🇺🇸", "Canada": "🇨🇦", "Sweden": "🇸🇪",
  "UK": "🇬🇧", "United Kingdom": "🇬🇧", "Germany": "🇩🇪", "Japan": "🇯🇵",
  "Portugal": "🇵🇹", "Netherlands": "🇳🇱", "Worldwide": "🌍", "Europe": "🇪🇺",
  "Australia": "🇦🇺", "El Salvador": "🇸🇻", "South Africa": "🇿🇦", "Italy": "🇮🇹",
  "France": "🇫🇷", "Spain": "🇪🇸", "Brazil": "🇧🇷", "Mexico": "🇲🇽",
  "Colombia": "🇨🇴", "Columbia": "🇨🇴", "Argentina": "🇦🇷", "India": "🇮🇳",
  "China": "🇨🇳", "South Korea": "🇰🇷", "Singapore": "🇸🇬", "Thailand": "🇹🇭",
  "Vietnam": "🇻🇳", "Indonesia": "🇮🇩", "Philippines": "🇵🇭", "Malaysia": "🇲🇾",
  "New Zealand": "🇳🇿", "Ireland": "🇮🇪", "Switzerland": "🇨🇭", "Austria": "🇦🇹",
  "Belgium": "🇧🇪", "Denmark": "🇩🇰", "Finland": "🇫🇮", "Norway": "🇳🇴",
  "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Romania": "🇷🇴", "Greece": "🇬🇷",
  "Turkey": "🇹🇷", "Israel": "🇮🇱", "United Arab Emirates": "🇦🇪", "UAE": "🇦🇪",
  "Saudi Arabia": "🇸🇦", "Nigeria": "🇳🇬", "Kenya": "🇰🇪", "Egypt": "🇪🇬",
  "Morocco": "🇲🇦", "Chile": "🇨🇱", "Peru": "🇵🇪", "Costa Rica": "🇨🇷",
  "Panama": "🇵🇦", "Lithuania": "🇱🇹", "Latvia": "🇱🇻", "Estonia": "🇪🇪",
  "Monaco": "🇲🇨", "Curacao": "🇨🇼", "Curacoa": "🇨🇼", "Iceland": "🇮🇸",
  "Luxembourg": "🇱🇺", "Malta": "🇲🇹", "Croatia": "🇭🇷", "Hungary": "🇭🇺",
  "Slovakia": "🇸🇰", "Slovenia": "🇸🇮", "Bulgaria": "🇧🇬", "Serbia": "🇷🇸",
  "Ukraine": "🇺🇦", "Russia": "🇷🇺", "Belarus": "🇧🇾", "Georgia": "🇬🇪",
  "Armenia": "🇦🇲", "Kazakhstan": "🇰🇿", "Pakistan": "🇵🇰", "Bangladesh": "🇧🇩",
  "Sri Lanka": "🇱🇰", "Nepal": "🇳🇵", "Iran": "🇮🇷", "Iraq": "🇮🇶",
  "Lebanon": "🇱🇧", "Jordan": "🇯🇴", "Kuwait": "🇰🇼", "Qatar": "🇶🇦",
  "Bahrain": "🇧🇭", "Oman": "🇴🇲", "Algeria": "🇩🇿", "Tunisia": "🇹🇳",
  "Libya": "🇱🇾", "Sudan": "🇸🇩", "Ethiopia": "🇪🇹", "Ghana": "🇬🇭",
  "Tanzania": "🇹🇿", "Uganda": "🇺🇬", "Zimbabwe": "🇿🇼", "Zambia": "🇿🇲",
  "Mozambique": "🇲🇿", "Angola": "🇦🇴", "Cameroon": "🇨🇲", "Ivory Coast": "🇨🇮",
  "Senegal": "🇸🇳", "Venezuela": "🇻🇪", "Ecuador": "🇪🇨", "Bolivia": "🇧🇴",
  "Paraguay": "🇵🇾", "Uruguay": "🇺🇾", "Guatemala": "🇬🇹", "Honduras": "🇭🇳",
  "Nicaragua": "🇳🇮", "Cuba": "🇨🇺", "Dominican Republic": "🇩🇴", "Puerto Rico": "🇵🇷",
  "Jamaica": "🇯🇲", "Trinidad": "🇹🇹", "Barbados": "🇧🇧",
};

// Loads the runtime country→emoji map from the DB (synced from a CSV tab),
// merging over the static fallback so any country not in the sheet still gets a flag.
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
        STATIC_MAP[pure] ??
        STATIC_MAP[countryName] ??
        "🏳️"
      );
    },
    [data],
  );

  return { getCountryEmoji };
}
