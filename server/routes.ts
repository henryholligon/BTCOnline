import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { createChallenge, verifySolution } from "altcha-lib";
import { objectStorageClient } from "./replit_integrations/object_storage/objectStorage";

const LOGO_FOLDER = "logos";

function getLogoBucket() {
  const searchPaths = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!searchPaths.length) throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
  const bucketName = searchPaths[0].replace(/^\//, "").split("/")[0];
  return objectStorageClient.bucket(bucketName);
}

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

  app.get("/api/merchants", async (_req, res) => {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
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

  app.post("/api/upload-logos", upload.array("logos", 100), async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    try {
      const bucket = getLogoBucket();
      const uploaded = await Promise.all(files.map(async (f) => {
        const ext = path.extname(f.originalname).toLowerCase();
        const name = path.basename(f.originalname, ext)
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-');
        const objectName = `${LOGO_FOLDER}/${name}-${Date.now().toString(36)}${ext}`;
        const gcsFile = bucket.file(objectName);
        await gcsFile.save(f.buffer, {
          contentType: f.mimetype,
          metadata: { cacheControl: "public, max-age=31536000" },
        });
        await gcsFile.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectName}`;
        return { originalName: f.originalname, savedAs: objectName, path: publicUrl };
      }));
      res.json({ uploaded });
    } catch (err: any) {
      console.error("Logo upload to object storage failed:", err);
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
            logo: String(row.logo || "").trim(),
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
      const bucket = getLogoBucket();
      const [files] = await bucket.getFiles({ prefix: `${LOGO_FOLDER}/` });
      const logos = files
        .filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f.name))
        .map(f => ({
          name: path.basename(f.name),
          path: `https://storage.googleapis.com/${bucket.name}/${f.name}`,
        }));
      res.json({ logos });
    } catch (err: any) {
      console.error("Failed to list logos from object storage:", err);
      res.json({ logos: [] });
    }
  });

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
