import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReviewSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/merchants", async (_req, res) => {
    try {
      const merchants = await storage.getMerchants();
      const merchantsWithReviews = await Promise.all(
        merchants.map(async (m) => ({
          ...m,
          reviews: await storage.getReviewsByMerchant(m.id),
        }))
      );
      res.json(merchantsWithReviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch merchants" });
    }
  });

  app.get("/api/merchants/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const merchant = await storage.getMerchant(id);
      if (!merchant) return res.status(404).json({ error: "Merchant not found" });
      
      const reviews = await storage.getReviewsByMerchant(id);
      res.json({ ...merchant, reviews });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch merchant" });
    }
  });

  app.post("/api/merchants/:id/reviews", async (req, res) => {
    try {
      const merchantId = parseInt(req.params.id);
      const validation = insertReviewSchema.safeParse({ ...req.body, merchantId });
      
      if (!validation.success) {
        return res.status(400).json({ error: validation.error });
      }

      const review = await storage.createReview(validation.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  return httpServer;
}
