import { type Merchant, type InsertMerchant, merchants, type BadgePreset, type InsertBadgePreset, badgePresets } from "@shared/schema";
import { db } from "./db";
import { eq, asc, count } from "drizzle-orm";

export interface IStorage {
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant | undefined>;
  deleteMerchant(id: number): Promise<void>;
  getMerchantCount(): Promise<number>;
  deleteAllMerchants(): Promise<void>;
  getBadgePresets(): Promise<BadgePreset[]>;
  createBadgePreset(preset: InsertBadgePreset): Promise<BadgePreset>;
  deleteBadgePreset(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants).orderBy(asc(merchants.id));
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [created] = await db.insert(merchants).values(merchant).returning();
    return created;
  }

  async updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant | undefined> {
    const [updated] = await db.update(merchants).set(merchant).where(eq(merchants.id, id)).returning();
    return updated;
  }

  async deleteMerchant(id: number): Promise<void> {
    await db.delete(merchants).where(eq(merchants.id, id));
  }

  async getMerchantCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(merchants);
    return result.value;
  }

  async deleteAllMerchants(): Promise<void> {
    await db.delete(merchants);
  }

  async getBadgePresets(): Promise<BadgePreset[]> {
    return await db.select().from(badgePresets).orderBy(asc(badgePresets.id));
  }

  async createBadgePreset(preset: InsertBadgePreset): Promise<BadgePreset> {
    const [created] = await db.insert(badgePresets).values(preset).returning();
    return created;
  }

  async deleteBadgePreset(id: number): Promise<void> {
    await db.delete(badgePresets).where(eq(badgePresets.id, id));
  }
}

export const storage = new DatabaseStorage();
