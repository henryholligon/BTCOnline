import { storage } from "../server/storage";
import { MOCK_MERCHANTS } from "../client/src/lib/mock-data";

async function seed() {
  console.log("Seeding merchants...");
  for (const merchant of MOCK_MERCHANTS) {
    const { reviews, id, ...merchantData } = merchant;
    const created = await storage.createMerchant(merchantData);
    
    for (const review of reviews) {
      const { id: _, ...reviewData } = review;
      await storage.createReview({ ...reviewData, merchantId: created.id });
    }
  }
  console.log("Seed complete!");
}

seed().catch(console.error);
