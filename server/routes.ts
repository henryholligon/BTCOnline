import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema, insertBadgePresetSchema, insertDirectoryOptionSchema, users } from "@shared/schema";
import multer from "multer";
import path from "path";
import { createChallenge, verifySolution } from "altcha-lib";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { runSheetSync } from "./sheetSync";
import { uploadLogoBuffer, listLogos, cloudinaryConfigured } from "./cloudinary";
import bcrypt from "bcrypt";
import { db } from "./db";
import { eq } from "drizzle-orm";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const ALTCHA_HMAC_KEY = process.env.ALTCHA_HMAC_KEY || "btconline-altcha-secret-key-2025";

  app.post("/api/auth/register", async (req, res) => {
    const { email, passwordHash, pubkey, encryptedNsec, salt, iv } = req.body;
    if (!email || !passwordHash || !pubkey || !encryptedNsec || !salt || !iv) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length > 0) return res.status(409).json({ message: "Email already registered" });
    const serverHash = await bcrypt.hash(passwordHash, 10);
    await db.insert(users).values({
      email: email.toLowerCase(), passwordHash: serverHash,
      pubkey, encryptedNsec, salt, iv,
      createdAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, passwordHash } = req.body;
    if (!email || !passwordHash) return res.status(400).json({ message: "Missing fields" });
    const rows = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (rows.length === 0) return res.status(401).json({ message: "Invalid email or password" });
    const user = rows[0];
    const valid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ encryptedNsec: user.encryptedNsec, salt: user.salt, iv: user.iv, pubkey: user.pubkey });
  });

  app.get("/api/altcha-challenge", async (_req, res) => {
    try {
      const challenge = await createChallenge({
        hmacKey: ALTCHA_HMAC_KEY,
        maxNumber: 50000,
      });
      res.json(challenge);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to generate challenge" });
    }
  });

  app.post("/api/submit-merchant", async (req, res) => {
    const { altcha, businessName, businessUrl, businessCategories, paymentMethods, notes, dataSource, publicContact } = req.body;

    // Verify captcha
    if (!altcha) {
      return res.status(400).json({ message: "Captcha verification required" });
    }
    try {
      const ok = await verifySolution(altcha, ALTCHA_HMAC_KEY);
      if (!ok) return res.status(400).json({ message: "Invalid captcha" });
    } catch {
      return res.status(400).json({ message: "Captcha verification failed" });
    }

    // Validate required fields
    if (!businessName?.trim()) return res.status(400).json({ message: "Merchant name is required" });
    if (!businessUrl?.trim()) return res.status(400).json({ message: "Website URL is required" });
    if (!paymentMethods?.length) return res.status(400).json({ message: "At least one payment method is required" });

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
      console.error("GITHUB_TOKEN not set");
      return res.status(500).json({ message: "Submission service not configured" });
    }

    // Build issue body
    const categoriesStr = businessCategories?.length ? businessCategories.join(", ") : "Not specified";
    const paymentStr = paymentMethods.join(", ");
    const dataSourceLabel = dataSource === "owner" ? "I am the business owner" : dataSource === "customer" ? "I visited as a customer" : dataSource || "Not specified";

    const issueBody = `## Merchant Submission

| Field | Value |
|---|---|
| **Website** | ${businessUrl.trim()} |
| **Categories** | ${categoriesStr} |
| **Payment Methods** | ${paymentStr} |
| **Submitted by** | ${dataSourceLabel} |
| **Contact** | ${publicContact?.trim() || "—"} |

${notes?.trim() ? `### Notes\n${notes.trim()}\n` : ""}
---
*Submitted via the BTCOnline web form*`;

    try {
      const response = await fetch("https://api.github.com/repos/henryholligon/BTCOnline/issues", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
          "User-Agent": "BTCOnline-App",
        },
        body: JSON.stringify({
          title: `Merchant submission: ${businessName.trim()}`,
          body: issueBody,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("GitHub API error:", response.status, err);
        return res.status(502).json({ message: "Failed to create submission — please try again" });
      }

      const issue = await response.json() as { html_url: string; number: number };
      return res.json({ ok: true, issueUrl: issue.html_url, issueNumber: issue.number });
    } catch (err) {
      console.error("GitHub issue creation failed:", err);
      return res.status(502).json({ message: "Failed to reach submission service — please try again" });
    }
  });

  app.get("/api/merchants", async (_req, res) => {
    res.set("Cache-Control", "no-store");
    const merchants = await storage.getMerchants();
    res.json(merchants);
  });

  app.get("/api/merchants/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid merchant ID" });
    }
    const merchant = await storage.getMerchant(id);
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }
    res.json(merchant);
  });

  app.post("/api/merchants", async (req, res) => {
    const result = insertMerchantSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid merchant data", errors: result.error.issues });
    }
    const merchant = await storage.createMerchant(result.data);
    res.status(201).json(merchant);
  });

  app.put("/api/merchants/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid merchant ID" });
    const result = insertMerchantSchema.partial().safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid merchant data", errors: result.error.issues });
    const updated = await storage.updateMerchant(id, result.data);
    if (!updated) return res.status(404).json({ message: "Merchant not found" });
    res.json(updated);
  });

  app.delete("/api/merchants/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid merchant ID" });
    await storage.deleteMerchant(id);
    res.status(204).end();
  });

  app.get("/api/badge-presets", async (_req, res) => {
    const presets = await storage.getBadgePresets();
    res.json(presets);
  });

  app.post("/api/badge-presets", async (req, res) => {
    const result = insertBadgePresetSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid badge preset data", errors: result.error.issues });
    const preset = await storage.createBadgePreset(result.data);
    res.status(201).json(preset);
  });

  app.delete("/api/badge-presets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteBadgePreset(id);
    res.status(204).end();
  });

  app.get("/api/directory-options", async (req, res) => {
    const type = req.query.type as string | undefined;
    const options = await storage.getDirectoryOptions(type);
    res.json(options);
  });

  app.post("/api/directory-options", async (req, res) => {
    const result = insertDirectoryOptionSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ message: "Invalid data", errors: result.error.issues });
    const option = await storage.createDirectoryOption(result.data);
    res.status(201).json(option);
  });

  app.delete("/api/directory-options/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteDirectoryOption(id);
    res.status(204).end();
  });

  app.post("/api/upload-logos", upload.array("logos", 100), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    if (!cloudinaryConfigured()) {
      return res.status(500).json({ message: "Cloudinary is not configured" });
    }

    try {
      const uploaded = await Promise.all(files.map(async (f) => {
        const ext = path.extname(f.originalname).toLowerCase();
        const filenameBase = path.basename(f.originalname, ext)
          .replace(/[^a-zA-Z0-9-_ ]/g, '')
          .trim() || 'logo';

        const { secureUrl, publicId: savedId } = await uploadLogoBuffer(f.buffer, filenameBase);
        return { originalName: f.originalname, savedAs: savedId, path: secureUrl };
      }));
      res.json({ uploaded });
    } catch (err: any) {
      console.error("Logo upload to Cloudinary failed:", err);
      res.status(500).json({ message: "Upload failed: " + (err.message || "Unknown error") });
    }
  });

  app.post("/api/merchants/import", async (req, res) => {
    try {
      const { merchants: merchantRows, replaceAll } = req.body;
      if (!Array.isArray(merchantRows) || merchantRows.length === 0) {
        return res.status(400).json({ message: "No merchant data provided" });
      }

      if (replaceAll) {
        await storage.deleteAllMerchants();
      }

      const results: { success: number; errors: Array<{ row: number; message: string }> } = {
        success: 0,
        errors: [],
      };

      for (let i = 0; i < merchantRows.length; i++) {
        const row = normalizeKeys(merchantRows[i]);
        try {
          const name = String(row.name || "").trim();
          if (!name) continue;

          const prepared = {
            name,
            description: String(row.description || "").trim(),
            logo: String(row.logo || row.logourl || row.logolink || row.image || row.imageurl || "").trim(),
            categories: parseArrayField(row.categories),
            shippingCountries: parseArrayField(row.shippingcountries || row.shipping_countries),
            website: String(row.website || "").trim(),
            lightningSupported: parseBool(row.lightningsupported || row.lightning_supported || row.lightning),
            onchainSupported: parseBool(row.onchainsupported || row.onchain_supported || row.onchain),
            paymentProvider: row.paymentprovider || row.payment_provider || null,
            featured: false,
            countryMadeIn: row.countrymadein || row.country_made_in || null,
            countryShippedFrom: row.countryshippedfrom || row.country_shipped_from || null,
            lastSurveyed: row.lastsurveyed || row.last_surveyed || new Date().toISOString().split('T')[0],
            bitcoinDiscount: row.bitcoindiscount || row.bitcoin_discount || null,
          };

          const validated = insertMerchantSchema.safeParse(prepared);
          if (!validated.success) {
            const issues = validated.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
            results.errors.push({ row: i + 1, message: issues });
            continue;
          }

          await storage.createMerchant(validated.data);
          results.success++;
        } catch (err: any) {
          results.errors.push({ row: i + 1, message: err.message || "Unknown error" });
        }
      }

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Import failed" });
    }
  });

  app.get("/api/uploaded-logos", async (_req, res) => {
    try {
      const logos = await listLogos();
      res.json({ logos });
    } catch (err: any) {
      console.error("Failed to list logos from Cloudinary:", err);
      res.json({ logos: [] });
    }
  });

  app.get("/api/sheet-sync", async (_req, res) => {
    try {
      const config = await storage.getSheetSyncConfig();
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/sheet-sync", async (req, res) => {
    try {
      const { csvUrl, emojiCsvUrl, countryEmojiCsvUrl, enabled } = req.body;
      const update: Record<string, unknown> = {};
      if (csvUrl !== undefined) update.csvUrl = csvUrl;
      if (emojiCsvUrl !== undefined) update.emojiCsvUrl = emojiCsvUrl;
      if (countryEmojiCsvUrl !== undefined) update.countryEmojiCsvUrl = countryEmojiCsvUrl;
      if (enabled !== undefined) update.enabled = enabled;
      const config = await storage.updateSheetSyncConfig(update);
      res.json(config);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/category-emojis", async (_req, res) => {
    try {
      const rows = await storage.getCategoryEmojis();
      const map: Record<string, string> = {};
      for (const row of rows) {
        map[row.category.trim().toLowerCase()] = row.emoji;
      }
      res.json(map);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/country-emojis", async (_req, res) => {
    try {
      const rows = await storage.getCountryEmojis();
      const map: Record<string, string> = {};
      for (const row of rows) {
        map[row.country.trim().toLowerCase()] = row.emoji;
      }
      res.json(map);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/sheet-sync/trigger", async (_req, res) => {
    try {
      const { count, errors, removed, emojis } = await runSheetSync();
      await storage.updateSheetSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: errors > 0 ? `ok-with-errors` : "ok",
        lastSyncCount: count,
      });
      res.json({ success: true, count, errors, removed, emojis });
    } catch (err: any) {
      await storage.updateSheetSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: `error: ${err.message}`,
        lastSyncCount: 0,
      }).catch(() => {});
      res.status(500).json({ success: false, message: err.message });
    }
  });

  registerObjectStorageRoutes(app);

  return httpServer;
}

function parseArrayField(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    return value.split(/[;|]/).map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function parseBool(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return ["true", "yes", "1", "y"].includes(value.toLowerCase().trim());
  }
  return false;
}

function normalizeKeys(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalized = key.toLowerCase().replace(/[\s_-]+/g, '').replace(/_\d+$/, '');
    if (!result[normalized]) {
      result[normalized] = value;
    }
    result[key] = value;
  }
  return result;
}
