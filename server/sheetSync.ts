import { storage } from "./storage";
import { insertMerchantSchema } from "@shared/schema";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

function parseArrayField(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value.split(/[;|,]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseBool(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true","yes","1","y"].includes(value.toLowerCase().trim());
  return false;
}

function normalizeKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalized = key.toLowerCase().replace(/[\s_\-]+/g, "");
    if (!result[normalized]) result[normalized] = value;
    result[key] = value;
  }
  return result;
}

function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = "";
    let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { values.push(cur); cur = ""; }
      else { cur += ch; }
    }
    values.push(cur);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim().replace(/^"|"$/g, ""); });
    return row;
  });
}

export async function runSheetSync(): Promise<{ count: number; errors: number }> {
  const config = await storage.getSheetSyncConfig();
  if (!config.csvUrl) throw new Error("No Google Sheet URL configured");

  const res = await fetch(config.csvUrl);
  if (!res.ok) throw new Error(`Failed to fetch sheet: HTTP ${res.status}`);
  const csvText = await res.text();

  const rows = parseCSV(csvText);
  if (rows.length === 0) throw new Error("Sheet appears to be empty");

  let count = 0;
  let errors = 0;

  for (const rawRow of rows) {
    const row = normalizeKeys(rawRow);
    const name = String(row.name || "").trim();
    if (!name) continue;

    const prepared = {
      name,
      description: String(row.description || "").trim(),
      logo: String(row.logo || "").trim(),
      categories: parseArrayField(row.categories),
      shippingCountries: parseArrayField(row.shippingcountries || row.shippingcountry || row.shipping_countries || ""),
      website: String(row.website || "").trim(),
      lightningSupported: parseBool(row.lightningsupported || row.lightning_supported || row.lightning),
      onchainSupported: parseBool(row.onchainsupported || row.onchain_supported || row.onchain),
      paymentProvider: row.paymentprovider || row.payment_provider || null,
      featured: false,
      countryMadeIn: row.countrymadein || row.country_made_in || null,
      countryShippedFrom: row.countryshippedfrom || row.country_shipped_from || null,
      lastSurveyed: row.lastsurveyed || row.last_surveyed || new Date().toISOString().split("T")[0],
      bitcoinDiscount: row.bitcoindiscount || row.bitcoin_discount || null,
    };

    const validated = insertMerchantSchema.safeParse(prepared);
    if (!validated.success) { errors++; continue; }

    const existing = await storage.getMerchantByName(name);
    if (existing) {
      await storage.updateMerchantByName(name, validated.data);
    } else {
      await storage.createMerchant(validated.data);
    }
    count++;
  }

  return { count, errors };
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

export async function startSheetSyncPoller() {
  const tick = async () => {
    try {
      const config = await storage.getSheetSyncConfig();
      if (!config.enabled || !config.csvUrl) return;
      console.log("[sheet-sync] Syncing from Google Sheet…");
      const { count, errors } = await runSheetSync();
      await storage.updateSheetSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: errors > 0 ? `ok-with-errors` : "ok",
        lastSyncCount: count,
      });
      console.log(`[sheet-sync] Done — ${count} upserted, ${errors} errors`);
    } catch (err: any) {
      console.error("[sheet-sync] Error:", err.message);
      try {
        await storage.updateSheetSyncConfig({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: `error: ${err.message}`,
          lastSyncCount: 0,
        });
      } catch {}
    }
  };

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(tick, POLL_INTERVAL_MS);
  tick();
}
