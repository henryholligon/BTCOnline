import { db } from "./db";
import { merchants } from "@shared/schema";
import { syncFromCSV } from "./sync-csv";

export async function seed() {
  console.log("Seeding database from CSV...");

  const existing = await db.select().from(merchants);
  if (existing.length > 0) {
    console.log(`Database already has ${existing.length} merchants. Skipping seed.`);
    return;
  }

  await syncFromCSV();
}

const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  seed()
    .then(() => {
      console.log("Seed complete.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
