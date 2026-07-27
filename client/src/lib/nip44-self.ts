/**
 * NIP-44 self-encryption helpers.
 *
 * "Self-encryption" means we use our own keypair for both sender and receiver
 * of the ECDH handshake.  The resulting conversation key is derived purely from
 * the user's own secret key, so only the owner can decrypt.
 *
 * Supports two key sources:
 *  1. Direct secret key (generated / custodial logins) — fastest, works offline.
 *  2. NIP-07 browser extension with nip44 support (Alby, etc.)     — async round-trip.
 */

import { getConversationKey, encrypt, decrypt } from 'nostr-tools/nip44';
import { getPublicKey } from 'nostr-tools';

/** Returns true if the current session is capable of NIP-44 encryption. */
export function canEncrypt(secretKey: Uint8Array | null): boolean {
  if (secretKey) return true;
  if (typeof window !== 'undefined' && (window.nostr as any)?.nip44) return true;
  return false;
}

/** Encrypt `plaintext` so that only the current user can decrypt it. */
export async function encryptForSelf(
  plaintext: string,
  secretKey: Uint8Array | null,
): Promise<string> {
  if (secretKey) {
    const pubkeyHex = getPublicKey(secretKey);
    const convKey = getConversationKey(secretKey, pubkeyHex);
    return encrypt(plaintext, convKey);
  }
  // Fall back to NIP-07 extension
  const ext = typeof window !== 'undefined' ? (window.nostr as any) : null;
  if (ext?.nip44?.encrypt) {
    const pubkey = await window.nostr!.getPublicKey();
    return ext.nip44.encrypt(pubkey, plaintext);
  }
  throw new Error(
    'Private lists require a Nostr extension with NIP-44 support (e.g. Alby).',
  );
}

/** Decrypt a ciphertext produced by `encryptForSelf`. */
export async function decryptForSelf(
  ciphertext: string,
  secretKey: Uint8Array | null,
): Promise<string> {
  if (secretKey) {
    const pubkeyHex = getPublicKey(secretKey);
    const convKey = getConversationKey(secretKey, pubkeyHex);
    return decrypt(ciphertext, convKey);
  }
  const ext = typeof window !== 'undefined' ? (window.nostr as any) : null;
  if (ext?.nip44?.decrypt) {
    const pubkey = await window.nostr!.getPublicKey();
    return ext.nip44.decrypt(pubkey, ciphertext);
  }
  throw new Error('Cannot decrypt: no key available.');
}
