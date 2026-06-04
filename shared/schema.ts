import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const merchants = pgTable("merchants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logo: text("logo").notNull(),
  categories: text("categories").array().notNull(),
  shippingCountries: text("shipping_countries").array().notNull(),
  website: text("website").notNull(),
  lightningSupported: boolean("lightning_supported").notNull().default(false),
  onchainSupported: boolean("onchain_supported").notNull().default(false),
  paymentProvider: text("payment_provider"),
  featured: boolean("featured").default(false),
  countryMadeIn: text("country_made_in"),
  countryShippedFrom: text("country_shipped_from"),
  lastSurveyed: text("last_surveyed"),
  bitcoinDiscount: text("bitcoin_discount"),
});

export const insertMerchantSchema = createInsertSchema(merchants).omit({
  id: true,
});

export type InsertMerchant = z.infer<typeof insertMerchantSchema>;
export type Merchant = typeof merchants.$inferSelect;

export const PAYMENT_PROVIDERS = [
  "BTCPay Server",
  "Bitcashier",
  "COINPAYMENTS",
  "CoinCorner",
  "Coingate",
  "CoinsPaid",
  "NOWPayments",
  "Open Node",
  "Self-hosted",
  "Speed",
  "Strike",
  "The Giving Block",
  "Triple A",
  "Zaprite",
];

export const CATEGORY_EMOJIS: Record<string, string> = {
  "AI": "🤖",
  "Adult": "🔞",
  "Art": "🎨",
  "Browser": "🧭",
  "Cellular": "📱",
  "Cellular, Privacy": "📲",
  "Charity": "❤️",
  "Delivery": "🚚",
  "Digital Privacy": "🔒",
  "Documents": "📄",
  "Electronics": "💻",
  "Email": "📧",
  "Fashion": "👗",
  "Food & Drink": "🍴",
  "Foundation": "🏛️",
  "Gambling": "🎰",
  "Gaming": "🎮",
  "Giftcard": "🎁",
  "Giftcards": "🎁",
  "Health": "🏥",
  "Home Goods": "🏠",
  "Hosting": "🌐",
  "Insurance": "🏦",
  "Jewellery": "💎",
  "Lifestyle": "✨",
  "Niccotine": "🚬",
  "Open-source": "🔓",
  "Password Manager": "🔑",
  "Passwords": "🔐",
  "Payments": "💳",
  "Privacy": "🔒",
  "Publication": "📰",
  "Real Estate": "🏡",
  "Skateboarding": "🛹",
  "Social Media": "💬",
  "Storage": "💾",
  "Supplement": "💊",
  "Toys": "🧸",
  "Toys & Boardgames": "🧸",
  "Travel": "✈️",
  "VPN": "🛡️",
  "Vehicle": "🚗",
  "Vehicles": "🚗",
};

const CATEGORY_EMOJIS_NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_EMOJIS).map(([key, emoji]) => [key.trim().toLowerCase(), emoji]),
);

// Generic icon used when no explicit mapping or keyword rule matches a category.
export const GENERIC_CATEGORY_EMOJI = "🏷️";

// Keyword → emoji rules for auto-assigning an icon to categories not in the
// explicit CATEGORY_EMOJIS map. Single-word entries match whole tokens (and their
// singular form); multi-word entries match as a substring. Earlier rules win, so
// list more specific rules before broader ones.
const KEYWORD_EMOJI_RULES: { match: string[]; emoji: string }[] = [
  { match: ["real estate", "property", "properties", "realty"], emoji: "🏡" },
  { match: ["skate", "skateboard", "skateboarding"], emoji: "🛹" },
  { match: ["gift card", "giftcard", "giftcards", "gift"], emoji: "🎁" },
  { match: ["password", "passwords"], emoji: "🔑" },
  { match: ["vpn", "privacy", "security", "encryption", "anonymity"], emoji: "🔒" },
  { match: ["shoe", "shoes", "footwear", "sneaker", "sneakers"], emoji: "👟" },
  { match: ["watch", "watches", "timepiece"], emoji: "⌚" },
  { match: ["bag", "bags", "handbag", "backpack", "luggage"], emoji: "👜" },
  { match: ["clothing", "clothes", "apparel", "fashion", "wear", "garment"], emoji: "👗" },
  { match: ["jewel", "jewelry", "jewellery"], emoji: "💎" },
  { match: ["coffee", "cafe", "tea"], emoji: "☕" },
  { match: ["wine", "beer", "alcohol", "spirits", "liquor", "brewery"], emoji: "🍷" },
  { match: ["food", "grocery", "groceries", "restaurant", "snack", "snacks", "drink", "drinks"], emoji: "🍴" },
  { match: ["tobacco", "nicotine", "vape", "cigar", "smoke", "smoking", "niccotine"], emoji: "🚬" },
  { match: ["supplement", "supplements", "vitamin", "vitamins", "nutrition"], emoji: "💊" },
  { match: ["health", "medical", "medicine", "pharmacy", "wellness", "clinic"], emoji: "🏥" },
  { match: ["beauty", "cosmetic", "cosmetics", "makeup", "skincare"], emoji: "💄" },
  { match: ["sport", "sports", "fitness", "gym", "outdoor", "outdoors", "athletic"], emoji: "🏅" },
  { match: ["gambling", "casino", "bet", "betting", "poker", "lottery"], emoji: "🎰" },
  { match: ["toy", "toys", "boardgame", "boardgames", "board game", "puzzle"], emoji: "🧸" },
  { match: ["game", "games", "gaming"], emoji: "🎮" },
  { match: ["book", "books", "publication", "publications", "magazine", "news", "reading"], emoji: "📚" },
  { match: ["music", "audio", "vinyl", "record", "records", "headphone", "headphones"], emoji: "🎵" },
  { match: ["art", "arts", "painting", "gallery", "artwork"], emoji: "🎨" },
  { match: ["photo", "photos", "photography", "camera", "cameras"], emoji: "📷" },
  { match: ["video", "film", "films", "movie", "movies", "streaming", "cinema"], emoji: "🎬" },
  { match: ["email", "mail"], emoji: "📧" },
  { match: ["hosting", "server", "servers", "domain", "domains", "cloud"], emoji: "🌐" },
  { match: ["software", "saas", "app", "apps", "application", "applications"], emoji: "💾" },
  { match: ["storage"], emoji: "💾" },
  { match: ["phone", "phones", "mobile", "cellular", "smartphone"], emoji: "📱" },
  { match: ["electronic", "electronics", "gadget", "gadgets", "tech", "technology", "hardware"], emoji: "💻" },
  { match: ["ai", "artificial intelligence"], emoji: "🤖" },
  { match: ["vehicle", "vehicles", "car", "cars", "auto", "automotive", "motorcycle"], emoji: "🚗" },
  { match: ["travel", "flight", "flights", "hotel", "hotels", "tourism", "vacation"], emoji: "✈️" },
  { match: ["shipping", "delivery", "logistics", "courier"], emoji: "🚚" },
  { match: ["furniture", "decor", "home", "household", "homeware", "homewares", "kitchen"], emoji: "🏠" },
  { match: ["garden", "gardening", "plant", "plants", "nursery"], emoji: "🌱" },
  { match: ["tool", "tools", "diy"], emoji: "🛠️" },
  { match: ["charity", "donation", "donations", "nonprofit", "foundation", "fundraising"], emoji: "❤️" },
  { match: ["crypto", "bitcoin", "wallet", "wallets", "exchange"], emoji: "🪙" },
  { match: ["payment", "payments", "finance", "financial", "bank", "banking", "money"], emoji: "💳" },
  { match: ["adult", "xxx", "nsfw"], emoji: "🔞" },
  { match: ["pet", "pets", "animal", "animals", "dog", "cat"], emoji: "🐾" },
  { match: ["education", "course", "courses", "learn", "learning", "school", "training", "tutorial"], emoji: "🎓" },
  { match: ["energy", "solar", "power", "electricity"], emoji: "⚡" },
  { match: ["insurance"], emoji: "🏦" },
  { match: ["legal", "law", "lawyer", "attorney"], emoji: "⚖️" },
  { match: ["ticket", "tickets", "event", "events", "concert"], emoji: "🎟️" },
  { match: ["baby", "kids", "children", "toddler"], emoji: "🍼" },
  { match: ["print", "printing", "printer"], emoji: "🖨️" },
  { match: ["office", "stationery", "stationary"], emoji: "📎" },
  { match: ["social", "social media", "community", "messaging", "chat"], emoji: "💬" },
  { match: ["document", "documents"], emoji: "📄" },
  { match: ["browser", "browsers"], emoji: "🧭" },
];

function singularize(token: string): string {
  return token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;
}

// Picks an appropriate emoji for a category using keyword rules; falls back to a
// generic icon. Used for categories without an explicit CATEGORY_EMOJIS entry.
export function autoEmojiForCategory(category: string): string {
  const norm = category.trim().toLowerCase();
  if (!norm) return GENERIC_CATEGORY_EMOJI;
  const tokens = norm.split(/[^a-z0-9]+/).filter(Boolean);
  const tokenSet = new Set<string>();
  for (const t of tokens) {
    tokenSet.add(t);
    tokenSet.add(singularize(t));
  }
  for (const rule of KEYWORD_EMOJI_RULES) {
    for (const kw of rule.match) {
      if (kw.includes(" ")) {
        if (norm.includes(kw)) return rule.emoji;
      } else if (tokenSet.has(kw)) {
        return rule.emoji;
      }
    }
  }
  return GENERIC_CATEGORY_EMOJI;
}

export function getCategoryWithEmoji(category: string): string {
  const trimmed = category.trim();
  // Already emoji-prefixed (e.g. admin custom categories like "🎭 Theater") — leave as-is.
  if (/^(\p{Extended_Pictographic}|\p{Regional_Indicator})/u.test(trimmed)) return category;
  const explicit = CATEGORY_EMOJIS_NORMALIZED[trimmed.toLowerCase()];
  const emoji = explicit || autoEmojiForCategory(category);
  return `${emoji} ${category}`;
}

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

export const directoryOptions = pgTable("directory_options", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  emoji: text("emoji"),
});

export const insertDirectoryOptionSchema = createInsertSchema(directoryOptions).omit({ id: true });
export type InsertDirectoryOption = z.infer<typeof insertDirectoryOptionSchema>;
export type DirectoryOption = typeof directoryOptions.$inferSelect;

export const badgePresets = pgTable("badge_presets", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  style: text("style").notNull().default("green"),
});

export const insertBadgePresetSchema = createInsertSchema(badgePresets).omit({ id: true });
export type InsertBadgePreset = z.infer<typeof insertBadgePresetSchema>;
export type BadgePreset = typeof badgePresets.$inferSelect;

export const BADGE_STYLES = ["rainbow", "green", "gold", "red", "orange", "blue", "purple"] as const;
export type BadgeStyle = typeof BADGE_STYLES[number];

export const sheetSyncConfig = pgTable("sheet_sync_config", {
  id: serial("id").primaryKey(),
  csvUrl: text("csv_url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  lastSyncAt: text("last_sync_at"),
  lastSyncStatus: text("last_sync_status"),
  lastSyncCount: integer("last_sync_count"),
});

export type SheetSyncConfig = typeof sheetSyncConfig.$inferSelect;

export const COUNTRIES = [
  "🌍 Worldwide",
  "🇺🇸 USA",
  "🇪🇺 Europe",
  "🇨🇦 Canada",
  "🇬🇧 UK",
  "🇦🇺 Australia",
  "🇸🇻 El Salvador",
  "🇸🇪 Sweden",
  "🇳🇱 Netherlands",
  "🇳🇴 Norway",
  "🇮🇹 Italy",
  "🇭🇷 Croatia",
  "🇱🇹 Lithuania",
  "🇦🇹 Austria",
  "🇩🇪 Germany",
  "🇮🇪 Ireland",
  "🇸🇬 Singapore",
  "🇿🇦 South Africa",
];
