import { db } from "./db";
import { merchants } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

function parseCSV(content: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(field);
        field = "";
      } else if (char === '\n' || (char === '\r' && content[i + 1] === '\n')) {
        if (char === '\r') i++;
        row.push(field);
        field = "";
        if (row.length > 1 || row[0] !== "") {
          rows.push(row);
        }
        row = [];
      } else {
        field += char;
      }
    }
  }
  row.push(field);
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  const headers = rows[0];
  return rows.slice(1).map(values => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = values[i] || "";
    });
    return record;
  });
}

function csvRowToMerchant(row: Record<string, string>) {
  const categories = row.categories ? row.categories.split("|").map(c => c.trim()).filter(Boolean) : [];
  const shippingCountries = row.shipping_countries ? row.shipping_countries.split("|").map(c => c.trim()).filter(Boolean) : [];

  const logoField = row.logo?.trim() || "";
  let logo = "";
  if (logoField) {
    if (logoField.startsWith("http") || logoField.startsWith("/")) {
      logo = logoField;
    } else {
      logo = `/logos/${logoField}`;
    }
  }

  return {
    name: row.name.trim(),
    description: row.description?.trim() || "",
    website: row.website?.trim() || "",
    categories,
    shippingCountries,
    lightningSupported: row.lightning_supported?.toLowerCase() === "true",
    onchainSupported: row.onchain_supported?.toLowerCase() === "true",
    paymentProvider: row.payment_provider?.trim() || null,
    countryMadeIn: row.country_made_in?.trim() || null,
    countryShippedFrom: row.country_shipped_from?.trim() || null,
    lastSurveyed: row.last_surveyed?.trim() || null,
    featured: row.featured?.toLowerCase() === "true",
    logo,
  };
}

export async function syncFromCSV(csvPath?: string) {
  const filePath = csvPath || path.resolve(process.cwd(), "data/merchants.csv");

  if (!fs.existsSync(filePath)) {
    console.error(`CSV file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const rows = parseCSV(content);
  console.log(`Parsed ${rows.length} merchants from CSV`);

  const csvMerchants = rows.map(csvRowToMerchant);
  const existing = await db.select().from(merchants);
  const existingByName = new Map(existing.map(m => [m.name, m]));
  const csvNames = new Set(csvMerchants.map(m => m.name));

  let added = 0;
  let updated = 0;
  let deleted = 0;

  const toDelete = existing.filter(m => !csvNames.has(m.name));
  for (const m of toDelete) {
    await db.delete(merchants).where(eq(merchants.id, m.id));
    console.log(`  Deleted: ${m.name}`);
    deleted++;
  }

  for (const csvMerchant of csvMerchants) {
    const existingMerchant = existingByName.get(csvMerchant.name);

    if (!existingMerchant) {
      await db.insert(merchants).values(csvMerchant);
      console.log(`  Added: ${csvMerchant.name}`);
      added++;
    } else {
      await db.update(merchants).set(csvMerchant).where(eq(merchants.id, existingMerchant.id));
      updated++;
    }
  }

  console.log(`\nSync complete: ${added} added, ${updated} updated, ${deleted} deleted`);
  console.log(`Total merchants: ${csvMerchants.length}`);
}

const isDirectRun = process.argv[1]?.includes("sync-csv");
if (isDirectRun) {
  syncFromCSV()
    .then(() => {
      console.log("CSV sync complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Sync failed:", err);
      process.exit(1);
    });
}
