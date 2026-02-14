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
  "Zaprite",
  "Strike",
  "Open Node",
  "Self-hosted",
  "CoinCorner",
  "Coingate",
  "Triple A",
  "COINPAYMENTS",
  "The Giving Block",
  "NOWPayments",
  "Speed",
  "CoinsPaid",
  "Bitcashier",
];

export const CATEGORIES = [
  "💻 Electronics",
  "🍴 Food & Drink",
  "✈️ Travel",
  "🎁 Gift Cards",
  "🛡️ VPN & Privacy",
  "🌐 Hosting",
  "🎨 Art",
  "❤️ Charity",
  "👗 Fashion",
  "✨ Lifestyle",
  "🎮 Gaming",
  "📱 Social Media",
  "🎰 Gambling",
  "🏠 Real Estate",
  "🚗 Vehicle",
  "👟 Footwear",
  "📡 Cellular",
  "🤖 AI",
  "📰 Magazine",
  "🎓 Education",
  "🏠 Home Goods",
  "✈️ Airplanes",
  "🛥️ Yachts",
  "🚬 Nicotine",
  "🛁 Hot Tubs",
  "🎲 Games",
  "VPN",
];

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
