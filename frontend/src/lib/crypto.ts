/**
 * Client-side AES-256-GCM encryption using Web Crypto API
 * Implements Zero-Knowledge architecture (BR-001, NFR-001)
 *
 * Flow:
 * 1. Owner's master password → PBKDF2 → masterKey
 * 2. masterKey → encrypt asset plaintext → ciphertext (sent to server)
 * 3. Server stores only ciphertext + salt — never sees plaintext
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const SALT_LENGTH = 32;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

const enc = new TextEncoder();
const dec = new TextDecoder();

// ─── Key Derivation ────────────────────────────────────────────────

/**
 * Derive an AES-256-GCM key from a password using PBKDF2
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  return bufferToHex(salt);
}

/**
 * Generate a random IV for AES-GCM
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// ─── Encryption ────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string with a password
 * @param plaintext - The text to encrypt
 * @param password - Master password
 * @param saltHex - Hex salt (from generateSalt or server)
 * @returns Base64-encoded ciphertext (format: salt:iv:ciphertext)
 */
export async function encrypt(
  plaintext: string,
  password: string,
  saltHex: string
): Promise<string> {
  const salt = hexToBuffer(saltHex);
  const key = await deriveKey(password, salt);
  const iv = generateIV();

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    enc.encode(plaintext)
  );

  // Format: hex(iv) + ":" + base64(ciphertext)
  const ciphertext = bufferToBase64(encrypted);
  const ivHex = bufferToHex(iv);

  return `${saltHex}:${ivHex}:${ciphertext}`;
}

/**
 * Decrypt a ciphertext string with a password
 * @param combined - Format: salt:iv:ciphertext
 * @param password - Master password
 * @returns Decrypted plaintext
 */
export async function decrypt(combined: string, password: string): Promise<string> {
  const parts = combined.split(":");
  if (parts.length < 3) {
    throw new Error("Định dạng dữ liệu mã hóa không hợp lệ.");
  }

  const [saltHex, ivHex, ciphertext] = parts;
  const salt = hexToBuffer(saltHex);
  const iv = hexToBuffer(ivHex);
  const key = await deriveKey(password, salt);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      base64ToBuffer(ciphertext)
    );
    return dec.decode(decrypted);
  } catch {
    throw new Error("Giải mã thất bại. Mật khẩu không đúng hoặc dữ liệu bị hỏng.");
  }
}

// ─── Master Key Management ─────────────────────────────────────────

/**
 * Create a new vault master key and encrypt it with user password.
 * Returns the key material to store on server.
 */
export async function createVaultMasterKey(password: string): Promise<{
  masterKeySalt: string;
  encryptedMasterKey: string;
}> {
  const masterKeySalt = generateSalt();
  // Generate a random 256-bit master key
  const masterKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const masterKeyHex = bufferToHex(masterKeyBytes);

  // Encrypt master key with password
  const encryptedMasterKey = await encrypt(masterKeyHex, password, masterKeySalt);

  return { masterKeySalt, encryptedMasterKey };
}

/**
 * Decrypt vault master key using owner password
 */
export async function decryptMasterKey(
  encryptedMasterKey: string,
  password: string
): Promise<string> {
  return decrypt(encryptedMasterKey, password);
}

/**
 * Encrypt asset payload using the vault master key
 */
export async function encryptAsset(payload: object, masterKeyHex: string): Promise<string> {
  const assetSalt = generateSalt();
  return encrypt(JSON.stringify(payload), masterKeyHex, assetSalt);
}

/**
 * Decrypt asset payload using the vault master key
 */
export async function decryptAsset(
  encryptedPayload: string,
  masterKeyHex: string
): Promise<object> {
  const plaintext = await decrypt(encryptedPayload, masterKeyHex);
  return JSON.parse(plaintext);
}

// ─── Utilities ─────────────────────────────────────────────────────

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, 2 + i), 16);
  }
  return bytes;
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
