import { generateSecretKey, getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@/lib/nostr';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateEmailKeypair(password: string) {
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, sk);
  return {
    sk,
    pubkey,
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    encryptedNsec: bytesToHex(new Uint8Array(encrypted)),
  };
}

export async function decryptEmailNsec(encryptedNsec: string, salt: string, iv: string, password: string): Promise<Uint8Array> {
  const key = await deriveKey(password, hexToBytes(salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: hexToBytes(iv) },
    key,
    hexToBytes(encryptedNsec),
  );
  return new Uint8Array(decrypted);
}
