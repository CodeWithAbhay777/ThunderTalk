"use client";

const PBKDF2_ITERATIONS = 600_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const ENTRY_SALT_PREFIX = "thunder-talk-entry:";
const LEGACY_ENTRY_SALT_PREFIX = "memento-entry:";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new Error("The encrypted entry has an invalid encoding.");
  }
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function kdfSalt(entryDate?: string, prefix = ENTRY_SALT_PREFIX): Uint8Array {
  const salt = process.env.NEXT_PUBLIC_DIARY_KDF_SALT_BASE64;
  if (!salt) throw new Error("Diary encryption is not configured. Set NEXT_PUBLIC_DIARY_KDF_SALT_BASE64.");
  const baseSalt = base64ToBytes(salt);
  if (!entryDate) return baseSalt;

  // A date-specific salt prevents a key for one entry from decrypting another.
  const prefixBytes = encoder.encode(prefix);
  const entryDateBytes = encoder.encode(entryDate);
  const scopedSalt = new Uint8Array(baseSalt.length + prefixBytes.length + entryDateBytes.length);
  scopedSalt.set(baseSalt);
  scopedSalt.set(prefixBytes, baseSalt.length);
  scopedSalt.set(entryDateBytes, baseSalt.length + prefixBytes.length);
  return scopedSalt;
}

async function deriveKey(password: string, entryDate?: string, prefix = ENTRY_SALT_PREFIX): Promise<CryptoKey> {
  if (!password) throw new Error("A password is required to unlock your diary.");
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: asArrayBuffer(kdfSalt(entryDate, prefix)), iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function deriveDiaryKey(password: string, entryDate?: string): Promise<CryptoKey> { return deriveKey(password, entryDate); }

// Compatibility only: permits reading entries written before the rename.
export function deriveLegacyScopedDiaryKey(password: string, entryDate: string): Promise<CryptoKey> { return deriveKey(password, entryDate, LEGACY_ENTRY_SALT_PREFIX); }

export async function encryptDiaryContent(key: CryptoKey, content: string): Promise<{ encryptedContent: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(content));
  return { encryptedContent: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptDiaryContent(key: CryptoKey, encryptedContent: string, iv: string): Promise<string> {
  try {
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: asArrayBuffer(base64ToBytes(iv)), }, key, asArrayBuffer(base64ToBytes(encryptedContent)));
    return decoder.decode(plaintext);
  } catch {
    throw new Error("Unable to decrypt this entry. Your password may be incorrect or the encrypted data was modified.");
  }
}
