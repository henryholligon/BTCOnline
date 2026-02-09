import { type Merchant, type InsertMerchant, merchants } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getMerchants(): Promise<Merchant[]>;
  getMerchant(id: number): Promise<Merchant | undefined>;
  createMerchant(merchant: InsertMerchant): Promise<Merchant>;
  getMerchantCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getMerchants(): Promise<Merchant[]> {
    return await db.select().from(merchants);
  }

  async getMerchant(id: number): Promise<Merchant | undefined> {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.id, id));
    return merchant;
  }

  async createMerchant(merchant: InsertMerchant): Promise<Merchant> {
    const [created] = await db.insert(merchants).values(merchant).returning();
    return created;
  }

  async getMerchantCount(): Promise<number> {
    const result = await db.select().from(merchants);
    return result.length;
  }
}

export const storage = new DatabaseStorage();
