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
  "Privacy": "🕶️",
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

export function getCategoryWithEmoji(category: string): string {
  const emoji = CATEGORY_EMOJIS_NORMALIZED[category.trim().toLowerCase()];
  if (emoji) return `${emoji} ${category}`;
  return category;
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
