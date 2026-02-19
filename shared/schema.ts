import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, serial } from "drizzle-orm/pg-core";
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
  "Cellular": "📱",
  "Cellular, Privacy": "📱",
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
  "Insurance": "🛡️",
  "Jewellery": "💎",
  "Lifestyle": "✨",
  "Niccotine": "🚬",
  "Open-source": "🔓",
  "Password Manager": "🔑",
  "Passwords": "🔑",
  "Payments": "💳",
  "Privacy": "🛡️",
  "Publication": "📰",
  "Real Estate": "🏡",
  "Social Media": "💬",
  "Storage": "💾",
  "Supplement": "💊",
  "Toys & Boardgames": "🧸",
  "Travel": "✈️",
  "VPN": "🛡️",
  "Vehicle": "🚗",
  "Vehicles": "🚗",
};

export function getCategoryWithEmoji(category: string): string {
  const emoji = CATEGORY_EMOJIS[category];
  if (emoji) return `${emoji} ${category}`;
  return category;
}

export const CATEGORIES = Object.keys(CATEGORY_EMOJIS);

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
