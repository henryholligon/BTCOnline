/**
 * Server-side AES-256-GCM encryption for custodial user Nostr keys.
 *
 * Each custodial user gets a random 32-byte per-user keySalt stored in the DB.
 * The actual AES key is derived via HKDF-SHA256:
 *
 *   key = HKDF(ikm=USER_KEY_ENCRYPTION_SECRET, salt=keySalt, info="nostr-custodial-key", len=32)
 *
 * This means leaking one row's salt gives no advantage for any other row, and a
 * database-only breach (without the server secret) reveals nothing.
 *
 * Legacy rows written before this change have keySalt=null and are handled by
 * the old SHA-256 derivation path; they are re-encrypted with a fresh salt on
 * first login to migrate them forward transparently.
 *
 * Encrypted format: hex(ciphertext || 16-byte GCM auth tag)
 * IV is stored separately as hex in the users.iv column.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, hkdfSync } from "crypto";

function getMasterSecret(): Buffer {
  const secret =
    process.env.USER_KEY_ENCRYPTION_SECRET ||
    process.env.SESSION_SECRET ||
    "dev-fallback-key-do-not-use-in-prod";

  if (!process.env.USER_KEY_ENCRYPTION_SECRET && !process.env.SESSION_SECRET) {
    console.warn("[userKeyEncryption] WARNING: No key secret configured — using insecure fallback");
  }

  return Buffer.from(secret, "utf8");
}

/**
 * Derive a 32-byte AES key for a specific user.
 *
 * keySalt — the per-user random salt (hex string from the DB).
 *           Pass undefined only for legacy rows; they will be re-encrypted on login.
 */
function deriveKey(keySalt?: string | null): Buffer {
  const ikm = getMasterSecret();

  if (!keySalt) {
    // Legacy path: plain SHA-256 of the secret (pre-salt scheme).
    // Only used to decrypt old rows; new rows always get a salt.
    return createHash("sha256").update(ikm).digest();
  }

  // HKDF-SHA256: per-user salt → unique 32-byte key
  return Buffer.from(
    hkdfSync("sha256", ikm, Buffer.from(keySalt, "hex"), "nostr-custodial-key", 32)
  );
}

/**
 * Encrypt a raw 32-byte Nostr secret key.
 * Generates a fresh per-user keySalt and random IV automatically.
 * Returns all three values — store keySalt and iv alongside the encryptedNsec.
 */
export function encryptNsecServerSide(sk: Uint8Array): {
  encryptedNsec: string;
  iv: string;
  keySalt: string;
} {
  const keySalt = randomBytes(32).toString("hex"); // 256-bit per-user salt
  const key = deriveKey(keySalt);
  const iv = randomBytes(12); // 96-bit IV for AES-GCM

  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(sk)), cipher.final()]);
  const authTag = cipher.getAuthTag(); // always 16 bytes

  return {
    encryptedNsec: Buffer.concat([encrypted, authTag]).toString("hex"),
    iv: iv.toString("hex"),
    keySalt,
  };
}

/**
 * Decrypt a server-side encrypted nsec back to its raw 32 bytes.
 * Pass keySalt=null only for legacy rows (pre-salt scheme) — they decrypt with
 * the old key and should be re-encrypted immediately after.
 * Throws if the auth tag fails (tampered data or wrong key).
 */
export function decryptNsecServerSide(
  encryptedNsecHex: string,
  ivHex: string,
  keySalt?: string | null
): Uint8Array {
  const key = deriveKey(keySalt);
  const iv = Buffer.from(ivHex, "hex");
  const combined = Buffer.from(encryptedNsecHex, "hex");

  const authTag = combined.slice(-16);
  const ciphertext = combined.slice(0, -16);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}
