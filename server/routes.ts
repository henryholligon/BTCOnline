import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertMerchantSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "client", "public", "assets");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-');
    const destDir = path.join(process.cwd(), "client", "public", "assets");
    const candidate = `${name}${ext}`;
    if (fs.existsSync(path.join(destDir, candidate))) {
      const uniqueSuffix = Date.now().toString(36);
      cb(null, `${name}-${uniqueSuffix}${ext}`);
    } else {
      cb(null, candidate);
    }
  },
});

const upload = multer({
  storage: logoStorage,
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
  app.get("/api/merchants", async (_req, res) => {
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

  app.post("/api/upload-logos", upload.array("logos", 100), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }
    const uploaded = files.map(f => ({
      originalName: f.originalname,
      savedAs: f.filename,
      path: `/assets/${f.filename}`,
    }));
    res.json({ uploaded });
  });

  app.post("/api/merchants/import", async (req, res) => {
    try {
      const { merchants: merchantRows } = req.body;
      if (!Array.isArray(merchantRows) || merchantRows.length === 0) {
        return res.status(400).json({ message: "No merchant data provided" });
      }

      const results: { success: number; errors: Array<{ row: number; message: string }> } = {
        success: 0,
        errors: [],
      };

      for (let i = 0; i < merchantRows.length; i++) {
        const row = merchantRows[i];
        try {
          const prepared = {
            name: String(row.name || "").trim(),
            description: String(row.description || "").trim(),
            logo: String(row.logo || "").trim(),
            categories: parseArrayField(row.categories),
            shippingCountries: parseArrayField(row.shippingCountries || row.shipping_countries),
            website: String(row.website || "").trim(),
            lightningSupported: parseBool(row.lightningSupported || row.lightning_supported || row.lightning),
            onchainSupported: parseBool(row.onchainSupported || row.onchain_supported || row.onchain),
            paymentProvider: row.paymentProvider || row.payment_provider || null,
            featured: false,
            countryMadeIn: row.countryMadeIn || row.country_made_in || null,
            countryShippedFrom: row.countryShippedFrom || row.country_shipped_from || null,
            lastSurveyed: row.lastSurveyed || row.last_surveyed || new Date().toISOString().split('T')[0],
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

  app.get("/api/uploaded-logos", (_req, res) => {
    const dir = path.join(process.cwd(), "client", "public", "assets");
    if (!fs.existsSync(dir)) {
      return res.json({ logos: [] });
    }
    const files = fs.readdirSync(dir)
      .filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f))
      .map(f => ({ name: f, path: `/assets/${f}` }));
    res.json({ logos: files });
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
