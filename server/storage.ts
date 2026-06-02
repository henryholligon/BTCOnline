import { type Merchant, type InsertMerchant, merchants, type BadgePreset, type InsertBadgePreset, badgePresets, type DirectoryOption, type InsertDirectoryOption, directoryOptions, sheetSyncConfig, type SheetSyncConfig } from "@shared/schema";
import { db } from "./db";
import { eq, asc, count } from "drizzle-orm";

export interface IStorage {
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  getMerchantByName(name: string): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  updateMerchant(id: number, merchant: Partial<InsertMerchant>): Promise<Merchant | undefined>;
  updateMerchantByName(name: string, merchant: Partial<InsertMerchant>): Promise<Merchant | undefined>;
  deleteMerchant(id: number): Promise<void>;
  getMerchantCount(): Promise<number>;
  deleteAllMerchants(): Promise<void>;
  getBadgePresets(): Promise<BadgePreset[]>;
  createBadgePreset(preset: InsertBadgePreset): Promise<BadgePreset>;
  deleteBadgePreset(id: number): Promise<void>;
  getDirectoryOptions(type?: string): Promise<DirectoryOption[]>;
  createDirectoryOption(option: InsertDirectoryOption): Promise<DirectoryOption>;
  deleteDirectoryOption(id: number): Promise<void>;
  getSheetSyncConfig(): Promise<SheetSyncConfig>;
  updateSheetSyncConfig(config: Partial<Omit<SheetSyncConfig, "id">>): Promise<SheetSyncConfig>;
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

  async getMerchantByName(name: string): Promise<Merchant | undefined> {
    const [exact] = await db.select().from(merchants).where(eq(merchants.name, name));
    if (exact) return exact;
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const target = normalize(name);
    const all = await db.select().from(merchants).orderBy(asc(merchants.id));
    return all.find(m => normalize(m.name) === target);
  }

  async updateMerchantByName(name: string, merchant: Partial<InsertMerchant>): Promise<Merchant | undefined> {
    const [updated] = await db.update(merchants).set(merchant).where(eq(merchants.name, name)).returning();
    return updated;
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

  async getDirectoryOptions(type?: string): Promise<DirectoryOption[]> {
    if (type) {
      return await db.select().from(directoryOptions).where(eq(directoryOptions.type, type)).orderBy(asc(directoryOptions.id));
    }
    return await db.select().from(directoryOptions).orderBy(asc(directoryOptions.id));
  }

  async createDirectoryOption(option: InsertDirectoryOption): Promise<DirectoryOption> {
    const [created] = await db.insert(directoryOptions).values(option).returning();
    return created;
  }

  async deleteDirectoryOption(id: number): Promise<void> {
    await db.delete(directoryOptions).where(eq(directoryOptions.id, id));
  }

  async getSheetSyncConfig(): Promise<SheetSyncConfig> {
    const [row] = await db.select().from(sheetSyncConfig).where(eq(sheetSyncConfig.id, 1));
    if (row) return row;
    const [created] = await db.insert(sheetSyncConfig).values({ id: 1, csvUrl: "", enabled: false }).returning();
    return created;
  }

  async updateSheetSyncConfig(config: Partial<Omit<SheetSyncConfig, "id">>): Promise<SheetSyncConfig> {
    await this.getSheetSyncConfig();
    const [updated] = await db.update(sheetSyncConfig).set(config).where(eq(sheetSyncConfig.id, 1)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
