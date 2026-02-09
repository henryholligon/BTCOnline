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
  "OpenNode",
  "IBEX",
  "CoinCorner",
  "CoinGate"
];

export const CATEGORIES = [
  "💻 Electronics",
  "👕 Clothing",
  "🍴 Food & Drink",
  "✈️ Travel",
  "🎁 Gift Cards",
  "🛡️ VPN & Privacy",
  "🌐 Hosting",
  "📚 Books",
  "🎨 Art",
  "❤️ Charity"
];

export const COUNTRIES = [
  "🌍 Worldwide",
  "🇺🇸 USA",
  "🇪🇺 Europe",
  "🇨🇦 Canada",
  "🇬🇧 UK",
  "🇦🇺 Australia",
  "🇸🇻 El Salvador",
  "🇸🇪 Sweden"
];
