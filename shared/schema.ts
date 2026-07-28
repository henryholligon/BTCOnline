import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  pubkey: text("pubkey").notNull(),
  encryptedNsec: text("encrypted_nsec").notNull(),
  // salt is null for custodial users (key encrypted with server master key, not password).
  salt: text("salt"),
  iv: text("iv").notNull(),
  // 'custodial' = server holds the key; 'self-custody' = client-side password encryption.
  keyCustody: text("key_custody").notNull().default("custodial"),
  // Per-user HKDF salt for custodial key encryption. Null for legacy rows (pre-salt scheme)
  // and for self-custody users (whose key is encrypted client-side, not server-side).
  keySalt: text("key_salt"),
  // One-time password reset token (hashed SHA-256) and its expiry ISO timestamp.
  resetToken: text("reset_token"),
  resetTokenExpires: text("reset_token_expires"),
  createdAt: text("created_at").notNull().default(""),
});

export type User = typeof users.$inferSelect;

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
  cashuSupported: boolean("cashu_supported").notNull().default(false),
  liquidSupported: boolean("liquid_supported").notNull().default(false),
  paymentProvider: text("payment_provider"),
  featured: boolean("featured").default(false),
  countryMadeIn: text("country_made_in"),
  countryShippedFrom: text("country_shipped_from"),
  lastSurveyed: text("last_surveyed"),
  bitcoinDiscount: text("bitcoin_discount"),
  nostrEventId: text("nostr_event_id"),
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

// Resolve a category label to "<emoji> <label>" using a runtime, case-insensitive
// emoji map. Categories that already begin with an emoji are returned untouched.
export function categoryWithEmoji(category: string, map: Record<string, string>): string {
  const trimmed = category.trim();
  if (/^\p{Extended_Pictographic}/u.test(trimmed)) return category;
  const emoji = map[trimmed.toLowerCase()];
  if (emoji) return `${emoji} ${category}`;
  return category;
}

export const CATEGORIES = [
  "AI", "Adult", "Art", "Browser", "Cellular", "Cellular, Privacy", "Charity",
  "Delivery", "Digital Privacy", "Documents", "Electronics", "Email", "Fashion",
  "Food & Drink", "Foundation", "Gambling", "Gaming", "Giftcard", "Giftcards",
  "Health", "Home Goods", "Hosting", "Insurance", "Jewellery", "Lifestyle",
  "Niccotine", "Open-source", "Password Manager", "Passwords", "Payments",
  "Privacy", "Publication", "Real Estate", "Skateboarding", "Social Media",
  "Storage", "Supplement", "Toys", "Toys & Boardgames", "Travel", "VPN",
  "Vehicle", "Vehicles",
];

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
  emojiCsvUrl: text("emoji_csv_url").notNull().default(""),
  countryEmojiCsvUrl: text("country_emoji_csv_url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(false),
  lastSyncAt: text("last_sync_at"),
  lastSyncStatus: text("last_sync_status"),
  lastSyncCount: integer("last_sync_count"),
});

export type SheetSyncConfig = typeof sheetSyncConfig.$inferSelect;

// Category → emoji map, sourced from a dedicated published CSV tab and synced
// alongside the merchant sheet so emojis are editable without code changes.
export const categoryEmojis = pgTable("category_emojis", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  emoji: text("emoji").notNull(),
});

export const insertCategoryEmojiSchema = createInsertSchema(categoryEmojis).omit({ id: true });
export type InsertCategoryEmoji = z.infer<typeof insertCategoryEmojiSchema>;
export type CategoryEmoji = typeof categoryEmojis.$inferSelect;

export const countryEmojis = pgTable("country_emojis", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  emoji: text("emoji").notNull(),
});

export const insertCountryEmojiSchema = createInsertSchema(countryEmojis).omit({ id: true });
export type InsertCountryEmoji = z.infer<typeof insertCountryEmojiSchema>;
export type CountryEmoji = typeof countryEmojis.$inferSelect;

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchants.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
  // 1–5 star rating, optional (null = no rating given).
  rating: integer("rating"),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true }).extend({
  rating: z.number().int().min(1).max(5).nullable().optional(),
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

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
