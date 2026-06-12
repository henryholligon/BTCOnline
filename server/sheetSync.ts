import { storage } from "./storage";
import { insertMerchantSchema, type InsertCategoryEmoji, type InsertCountryEmoji } from "@shared/schema";
import { getLogoUrlMap, cloudinaryConfigured } from "./cloudinary";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

// Default published Google Sheet CSV — used to bootstrap a fresh DB (e.g. production)
// so the directory auto-syncs without manual setup. Only applied when no URL is configured.
const DEFAULT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRTDjKqx5LRxgvpFjtEvFfVF8bNFMoCHWS8JBiEXQhYSb08XFQZEcHUC7ZxmuyrORco1x765AfPHYpt/pub?output=csv";

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

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Parse the emoji tab CSV into {category, emoji} entries. Tolerant of header
// naming and blank rows; rows with a blank/invalid emoji are skipped so the
// category renders with no emoji rather than breaking.
function parseEmojiRows(csvText: string): InsertCategoryEmoji[] {
  const rows = parseCSV(csvText);
  const out: InsertCategoryEmoji[] = [];
  const seen = new Set<string>();
  for (const rawRow of rows) {
    const row = normalizeKeys(rawRow);
    const category = String(
      row.category ?? row.categoryname ?? row.name ?? row.label ?? row.tag ?? "",
    ).trim();
    const emoji = String(row.emoji ?? row.icon ?? row.symbol ?? row.emojis ?? "").trim();
    if (!category || !emoji) continue;
    const key = category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ category, emoji });
  }
  return out;
}

// Sync the country→emoji map from its dedicated CSV tab. Tolerant of header
// naming: "country"/"name"/"label" + "emoji"/"flag"/"icon".
async function syncCountryEmojis(countryEmojiCsvUrl: string): Promise<number> {
  if (!countryEmojiCsvUrl) return 0;
  const res = await fetch(countryEmojiCsvUrl);
  if (!res.ok) throw new Error(`Failed to fetch country emoji sheet: HTTP ${res.status}`);
  const csvText = await res.text();
  const rows = parseCSV(csvText);
  const out: InsertCountryEmoji[] = [];
  const seen = new Set<string>();
  for (const rawRow of rows) {
    const row = normalizeKeys(rawRow);
    const country = String(
      row.country ?? row.name ?? row.label ?? row.countryname ?? "",
    ).trim();
    const emoji = String(row.emoji ?? row.flag ?? row.icon ?? row.symbol ?? "").trim();
    if (!country || !emoji) continue;
    const key = country.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ country, emoji });
  }
  if (out.length === 0) throw new Error("Country emoji sheet has no usable rows");
  await storage.setCountryEmojis(out);
  return out.length;
}

// Sync the category→emoji map from its dedicated CSV tab. The tab is the source
// of truth, but on any failure (unreachable/empty/parse error) we keep the last
// known-good map rather than wiping it.
async function syncCategoryEmojis(emojiCsvUrl: string): Promise<number> {
  if (!emojiCsvUrl) return 0;
  const res = await fetch(emojiCsvUrl);
  if (!res.ok) throw new Error(`Failed to fetch emoji sheet: HTTP ${res.status}`);
  const csvText = await res.text();
  const entries = parseEmojiRows(csvText);
  if (entries.length === 0) {
    throw new Error("Emoji sheet has no usable rows");
  }
  await storage.setCategoryEmojis(entries);
  return entries.length;
}

export async function runSheetSync(): Promise<{ count: number; errors: number; removed: number; emojis: number; countryEmojis: number }> {
  const config = await storage.getSheetSyncConfig();
  if (!config.csvUrl) throw new Error("No Google Sheet URL configured");

  const res = await fetch(config.csvUrl);
  if (!res.ok) throw new Error(`Failed to fetch sheet: HTTP ${res.status}`);
  const csvText = await res.text();

  const rows = parseCSV(csvText);
  if (rows.length === 0) throw new Error("Sheet appears to be empty");

  let count = 0;
  let errors = 0;
  const seen = new Set<string>();

  // Cloudinary folder is the source of truth for logos (sheet has no logo column).
  const logoMap = cloudinaryConfigured()
    ? await getLogoUrlMap().catch((e: any) => {
        console.error("[sheet-sync] Cloudinary logo lookup failed:", e.message);
        return new Map<string, string>();
      })
    : new Map<string, string>();

  for (const rawRow of rows) {
    const row = normalizeKeys(rawRow);
    const name = String(row.name || "").trim();
    if (!name) continue;

    const prepared = {
      name,
      description: String(row.description || "").trim(),
      logo: String(row.logo || row.logourl || row.logolink || row.image || row.imageurl || "").trim(),
      categories: parseArrayField(row.categories || row.category),
      shippingCountries: parseArrayField(row.shippingcountries || row.shippingcountry || row.shipping_countries || row.deliveryto || row.delivery_to || row.shipping || ""),
      website: String(row.website || "").trim(),
      lightningSupported: parseBool(row.lightningsupported || row.lightning_supported || row.lightning),
      onchainSupported: parseBool(row.onchainsupported || row.onchain_supported || row.onchain),
      paymentProvider: row.paymentprovider || row.payment_provider || null,
      featured: false,
      countryMadeIn: row.countrymadein || row.country_made_in || row.madein || row.made_in || null,
      countryShippedFrom: row.countryshippedfrom || row.country_shipped_from || null,
      lastSurveyed: row.lastsurveyed || row.last_surveyed || new Date().toISOString().split("T")[0],
      bitcoinDiscount: row.bitcoindiscount || row.bitcoin_discount || row.btcdiscount || row.btc_discount || row.badge || row.btcbadge || row.btc_badge || row.discount || row.promo || row.promotion || null,
    };

    const validated = insertMerchantSchema.safeParse(prepared);
    if (!validated.success) { errors++; continue; }

    const cloudLogo = logoMap.get(normalizeName(name));
    const existing = await storage.getMerchantByName(name);
    if (existing) {
      const merged = { ...validated.data };
      // Logo priority when sheet row has none: Cloudinary folder > existing logo
      if (!merged.logo) merged.logo = cloudLogo || existing.logo || "";
      if (!merged.bitcoinDiscount && existing.bitcoinDiscount) merged.bitcoinDiscount = existing.bitcoinDiscount;
      // Update by id so normalized name matches (e.g. "NIC NAC" vs "NICNAC") don't create duplicates
      await storage.updateMerchant(existing.id, merged);
    } else {
      const created = { ...validated.data };
      if (!created.logo) created.logo = cloudLogo || "";
      await storage.createMerchant(created);
    }
    seen.add(normalizeName(name));
    count++;
  }

  // Prune: CSV is the source of truth — remove merchants not present in the sheet
  let removed = 0;
  const all = await storage.getMerchants();
  const toDelete = all.filter((m) => !seen.has(normalizeName(m.name)));

  // Safety guardrail: refuse to prune if a single sync would wipe out a large
  // share of the directory (e.g. a malformed/partial CSV). Prevents mass data loss.
  const wouldGutDirectory =
    all.length >= 10 && toDelete.length > Math.floor(all.length * 0.5);
  if (wouldGutDirectory) {
    console.warn(
      `[sheet-sync] Prune aborted: would delete ${toDelete.length}/${all.length} merchants ` +
        `(>50%). Treating CSV as suspect; keeping existing data.`,
    );
  } else {
    for (const m of toDelete) {
      await storage.deleteMerchant(m.id);
      removed++;
    }
  }

  // Sync category emojis from their dedicated tab. Independent of the merchant
  // sync — a failure here must never break merchant data; we keep the last map.
  let emojis = 0;
  try {
    emojis = await syncCategoryEmojis(config.emojiCsvUrl || "");
  } catch (e: any) {
    console.error("[sheet-sync] Emoji sync failed (keeping last known-good map):", e.message);
  }

  // Sync country emojis from their dedicated tab. Same fault-isolation rule.
  let countryEmojis = 0;
  try {
    countryEmojis = await syncCountryEmojis(config.countryEmojiCsvUrl || "");
  } catch (e: any) {
    console.error("[sheet-sync] Country emoji sync failed (keeping last known-good map):", e.message);
  }

  return { count, errors, removed, emojis, countryEmojis };
}


let pollTimer: ReturnType<typeof setInterval> | null = null;

export async function startSheetSyncPoller() {
  // Bootstrap a fresh/unconfigured DB (e.g. production) so it auto-syncs.
  // Only on a DB that has never synced — so clearing the URL later (to intentionally
  // disable sync) is respected and not reverted on restart.
  try {
    const cfg = await storage.getSheetSyncConfig();
    if (!cfg.csvUrl && !cfg.lastSyncAt) {
      await storage.updateSheetSyncConfig({ csvUrl: DEFAULT_CSV_URL, enabled: true });
      console.log("[sheet-sync] Fresh DB with no CSV URL — bootstrapped default + enabled");
    }
  } catch (e: any) {
    console.error("[sheet-sync] Config bootstrap failed:", e.message);
  }

  const tick = async () => {
    try {
      const config = await storage.getSheetSyncConfig();
      if (!config.enabled || !config.csvUrl) return;
      console.log("[sheet-sync] Syncing from Google Sheet…");
      const { count, errors, removed, emojis } = await runSheetSync();
      await storage.updateSheetSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: errors > 0 ? `ok-with-errors` : "ok",
        lastSyncCount: count,
      });
      console.log(`[sheet-sync] Done — ${count} upserted, ${removed} removed, ${emojis} emojis, ${errors} errors`);
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
