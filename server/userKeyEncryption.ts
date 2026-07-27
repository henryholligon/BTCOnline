/**
 * Server-side AES-256-GCM encryption for custodial user Nostr keys.
 *
 * The master key is derived from USER_KEY_ENCRYPTION_SECRET (preferred) or
 * SESSION_SECRET (fallback). Neither value is ever returned to clients.
 *
 * Encrypted format: hex(ciphertext || 16-byte GCM auth tag)
 * IV is stored separately as hex in the users.iv column.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

function getMasterKey(): Buffer {
  const secret =
    process.env.USER_KEY_ENCRYPTION_SECRET ||
    process.env.SESSION_SECRET ||
    "dev-fallback-key-do-not-use-in-prod";

  if (!process.env.USER_KEY_ENCRYPTION_SECRET && !process.env.SESSION_SECRET) {
    console.warn("[userKeyEncryption] WARNING: No key secret configured — using insecure fallback");
  }

  // Derive a fixed-length 32-byte key from whatever secret is configured.
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a raw 32-byte Nostr secret key with the server master key.
 * Returns the encrypted bytes (+ auth tag) as hex, and the random IV as hex.
 */
export function encryptNsecServerSide(sk: Uint8Array): { encryptedNsec: string; iv: string } {
  const key = getMasterKey();
  const iv = randomBytes(12); // 96-bit IV for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(Buffer.from(sk)), cipher.final()]);
  const authTag = cipher.getAuthTag(); // always 16 bytes

  return {
    encryptedNsec: Buffer.concat([encrypted, authTag]).toString("hex"),
    iv: iv.toString("hex"),
  };
}

/**
 * Decrypt a server-side encrypted nsec back to its raw 32 bytes.
 * Throws if the auth tag fails (tampered data or wrong key).
 */
export function decryptNsecServerSide(encryptedNsecHex: string, ivHex: string): Uint8Array {
  const key = getMasterKey();
  const iv = Buffer.from(ivHex, "hex");
  const combined = Buffer.from(encryptedNsecHex, "hex");

  // Last 16 bytes are the GCM auth tag.
  const authTag = combined.slice(-16);
  const ciphertext = combined.slice(0, -16);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return new Uint8Array(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}
