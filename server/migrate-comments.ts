/**
 * Migration script: publish existing DB comments/reviews as Nostr kind-1111
 * events on the canonical relay.
 *
 * Run once after the Nostr comment system (task #101) is deployed:
 *   npx tsx server/migrate-comments.ts
 *
 * Process:
 *   1. Reads all comments from the DB with user + merchant info
 *   2. Builds kind-1111 events matching the encoding decided in task #103
 *   3. Signs with the original author's key (custodial) or master key (non-custodial)
 *   4. Publishes to the canonical relay via WebSocket with NIP-42 AUTH
 *   5. Reports results per comment
 */

import { db } from "./db";
import { comments, users as usersTable, merchants as merchantsTable } from "@shared/schema";
import { eq, sql, asc } from "drizzle-orm";
import { finalizeEvent, getPublicKey } from "nostr-tools";
import { decode } from "nostr-tools/nip19";
import { decryptNsecServerSide } from "./userKeyEncryption";
import WebSocket from "ws";

const RELAY_URL = "wss://nostr-permissioned-host.replit.app/";
const REVIEW_KIND = 1111;
const RATING_TAG = "rating";
const PUBLISH_TIMEOUT_MS = 15_000;

interface CommentRow {
  id: number;
  merchantId: number;
  userId: number;
  body: string;
  createdAt: string;
  rating: number | null;
  parentId: number | null;
  userPubkey: string;
  userEmail: string | null;
  userKeyCustody: string | null;
  userEncryptedNsec: string | null;
  userIv: string | null;
  userKeySalt: string | null;
  merchantName: string;
  merchantWebsite: string;
  merchantNostrEventId: string | null;
}

function getMasterKey(): Uint8Array | null {
  const nsec = process.env.NOSTR_MASTER_NSEC;
  if (!nsec) return null;
  try {
    const decoded = decode(nsec);
    if (decoded.type !== "nsec") {
      console.error("[migrate] NOSTR_MASTER_NSEC is not a valid nsec");
      return null;
    }
    return decoded.data as Uint8Array;
  } catch (e: any) {
    console.error("[migrate] Failed to decode NOSTR_MASTER_NSEC:", e.message);
    return null;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function publishEventToRelay(
  relayUrl: string,
  event: ReturnType<typeof finalizeEvent>,
): Promise<boolean> {
  const masterKey = getMasterKey();

  return new Promise((resolve) => {
    let settled = false;
    let authEventId = "";
    let authComplete = false;

    const settle = (val: boolean) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        clearTimeout(authFallbackTimer);
        try { ws.close(); } catch {}
        resolve(val);
      }
    };

    const timer = setTimeout(() => {
      try { ws.terminate(); } catch {}
      settle(false);
    }, PUBLISH_TIMEOUT_MS);

    const AUTH_GRACE_MS = 3_000;
    const authFallbackTimer = setTimeout(() => {
      if (!authComplete) {
        authComplete = true;
        ws.send(JSON.stringify(["EVENT", event]));
      }
    }, AUTH_GRACE_MS);

    const ws = new WebSocket(relayUrl);

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!Array.isArray(msg)) return;

        if (msg[0] === "AUTH" && typeof msg[1] === "string" && !authComplete && masterKey) {
          clearTimeout(authFallbackTimer);
          const challenge = msg[1] as string;
          const authEvent = finalizeEvent(
            {
              kind: 22242,
              created_at: Math.floor(Date.now() / 1000),
              tags: [["challenge", challenge], ["relay", relayUrl]],
              content: "",
            },
            masterKey,
          );
          authEventId = authEvent.id;
          ws.send(JSON.stringify(["AUTH", authEvent]));
          return;
        }

        if (msg[0] === "OK" && typeof msg[1] === "string") {
          const id = msg[1] as string;
          const ok = msg[2] as boolean;

          if (id === authEventId && !authComplete) {
            if (!ok) { settle(false); return; }
            authComplete = true;
            clearTimeout(authFallbackTimer);
            ws.send(JSON.stringify(["EVENT", event]));
            return;
          }

          if (id === event.id) {
            settle(ok === true);
          }
        }
      } catch {}
    });

    ws.on("open", () => {
      if (!masterKey) {
        authComplete = true;
        clearTimeout(authFallbackTimer);
        ws.send(JSON.stringify(["EVENT", event]));
      }
    });

    ws.on("error", () => settle(false));
    ws.on("close", () => settle(false));
  });
}

async function main() {
  console.log("[migrate] Starting comment migration…");

  const masterKey = getMasterKey();
  if (!masterKey) {
    console.error("[migrate] NOSTR_MASTER_NSEC is required");
    process.exit(1);
  }
  const masterPubkey = getPublicKey(masterKey);
  console.log("[migrate] Master pubkey:", masterPubkey);

  // 1. Fetch all comments with user + merchant info
  const rows = await db
    .select({
      id: comments.id,
      merchantId: comments.merchantId,
      userId: comments.userId,
      body: comments.body,
      createdAt: comments.createdAt,
      rating: comments.rating,
      parentId: comments.parentId,
      userPubkey: usersTable.pubkey,
      userEmail: usersTable.email,
      userKeyCustody: usersTable.keyCustody,
      userEncryptedNsec: usersTable.encryptedNsec,
      userIv: usersTable.iv,
      userKeySalt: usersTable.keySalt,
      merchantName: merchantsTable.name,
      merchantWebsite: merchantsTable.website,
      merchantNostrEventId: merchantsTable.nostrEventId,
    })
    .from(comments)
    .innerJoin(usersTable, eq(comments.userId, usersTable.id))
    .innerJoin(merchantsTable, eq(comments.merchantId, merchantsTable.id))
    .orderBy(asc(comments.createdAt));

  console.log(`[migrate] Found ${rows.length} comments to migrate`);

  if (rows.length === 0) {
    console.log("[migrate] Nothing to migrate.");
    return;
  }

  // 2. First pass: publish top-level comments, building idMap
  //    DB comment id → Nostr event id
  const idMap = new Map<number, string>();
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  // Process in order so parent comment event IDs are known before replies
  for (const row of rows) {
    if (!row.merchantNostrEventId) {
      console.warn(`[migrate] Comment #${row.id}: merchant "${row.merchantName}" has no nostrEventId — skipping`);
      skippedCount++;
      continue;
    }

    // All migrated comments are signed with the master key. This is necessary
    // because non-custodial user keys are unavailable server-side, and custodial
    // user pubkeys are not on the relay allowlist (they were never registered).
    // The ["migrated"] tag records the original author's pubkey so the
    // provenance is not lost.
    const signKey = masterKey;

    const dTag = slugify(row.merchantName);
    const tags: string[][] = [
      ["K", "30402"],
      ["k", "30402"],
      ["E", row.merchantNostrEventId, "", "root"],
      ["r", row.merchantWebsite],
      ["A", `30402:${masterPubkey}:${dTag}`],
      ["a", `30402:${masterPubkey}:${dTag}`],
      ["e", row.merchantNostrEventId, "", "root"],
      ["migrated", `author:${row.userPubkey}`],
    ];

    // Rating tag
    if (row.rating !== null) {
      tags.push([RATING_TAG, String(row.rating)]);
    }

    // Reply threading: resolve parent DB id → parent Nostr event id
    if (row.parentId !== null) {
      const parentEventId = idMap.get(row.parentId);
      if (parentEventId) {
        tags.push(["e", parentEventId, "", "reply"]);
      } else {
        console.warn(`[migrate] Comment #${row.id}: parent #${row.parentId} not yet published — publishing as top-level`);
      }
    }

    const event = finalizeEvent(
      {
        kind: REVIEW_KIND,
        created_at: Math.floor(new Date(row.createdAt).getTime() / 1000),
        tags,
        content: row.body || "",
      },
      signKey,
    );

    console.log(`[migrate] Publishing comment #${row.id} (as master)…`);
    const ok = await publishEventToRelay(RELAY_URL, event);

    if (ok) {
      idMap.set(row.id, event.id);
      successCount++;
      console.log(`[migrate]   ✓ Comment #${row.id} → ${event.id}`);
    } else {
      failCount++;
      console.error(`[migrate]   ✗ Comment #${row.id} failed to publish`);
    }
  }

  console.log("\n[migrate] Migration complete:");
  console.log(`  Published: ${successCount}`);
  console.log(`  Failed:    ${failCount}`);
  console.log(`  Skipped:   ${skippedCount}`);
  console.log(`  Total:     ${rows.length}`);

  if (failCount > 0) {
    process.exit(1);
  }

  // 3. Migration is done. The comments table can now be dropped:
  //    DROP TABLE comments;
  //    But leave it for now in case a rollback is needed.
  console.log("[migrate] After confirming all events are on the relay, run:");
  console.log("  DROP TABLE comments;");
}

main().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
