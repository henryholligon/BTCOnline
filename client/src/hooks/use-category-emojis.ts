import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoryWithEmoji } from "@shared/schema";

// Loads the runtime category→emoji map (synced from the spreadsheet) and exposes
// a case-insensitive resolver, falling back to the bare category name when there
// is no entry. Categories that already begin with an emoji are left untouched.
export function useCategoryEmojis() {
  const { data } = useQuery<Record<string, string>>({
    queryKey: ["/api/category-emojis"],
  });

  const emojiMap = data ?? {};

  const getCategoryWithEmoji = useCallback(
    (category: string) => categoryWithEmoji(category, emojiMap),
    [data],
  );

  return { emojiMap, getCategoryWithEmoji };
}
