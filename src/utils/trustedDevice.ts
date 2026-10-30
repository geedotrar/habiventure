export const TRUSTED_DEVICE_COOKIE_NAME = "habiventure_device_token";
export const TRUSTED_DEVICE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function getSecretKey(): string {
  return (process.env.TRUSTED_DEVICE_SECRET || "").trim();
}

function getSubtleCrypto(): SubtleCrypto {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return crypto.subtle;
  }
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.subtle) {
    return (globalThis as any).crypto.subtle as SubtleCrypto;
  }
  throw new Error("Web Crypto API (crypto.subtle) is not available in this environment.");
}

async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const subtle = getSubtleCrypto();
  const enc = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await subtle.sign("HMAC", key, enc.encode(message));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function generateDeviceToken(): Promise<string> {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("TRUSTED_DEVICE_SECRET environment variable is not configured.");
  }
  const timestamp = Date.now().toString();
  const payload = `habiventure_trusted_${timestamp}`;
  const signature = await computeHmacSha256(secret, payload);
  return `${timestamp}.${signature}`;
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const aLen = a.length;
  const bLen = b.length;
  let mismatch = aLen === bLen ? 0 : 1;
  const len = Math.max(aLen, bLen);
  for (let i = 0; i < len; i++) {
    const charA = i < aLen ? a.charCodeAt(i) : 0;
    const charB = i < bLen ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

export async function verifyDeviceToken(token: string | undefined | null): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestampStr, signature] = parts;
  const timestamp = Number(timestampStr);
  if (isNaN(timestamp)) return false;

  const maxAgeMs = TRUSTED_DEVICE_MAX_AGE_SECONDS * 1000;
  if (Date.now() - timestamp > maxAgeMs) return false;

  const secret = getSecretKey();
  if (!secret) return false;

  const payload = `habiventure_trusted_${timestampStr}`;
  const expectedSignature = await computeHmacSha256(secret, payload);

  return constantTimeEqual(signature, expectedSignature);
}

export function isValidSecretKey(key: string | undefined | null): boolean {
  if (!key || typeof key !== "string") return false;
  const secret = getSecretKey();
  if (!secret) return false;
  const trimmed = key.trim();
  return trimmed.length > 0 && constantTimeEqual(trimmed, secret);
}

export const ADMIN_SESSION_COOKIE_NAME = "habiventure_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 4 * 60 * 60; // 4 hours admin session

export async function generateAdminSessionToken(adminUserId: number): Promise<string> {
  const secret = getSecretKey();
  if (!secret) {
    throw new Error("TRUSTED_DEVICE_SECRET environment variable is not configured.");
  }
  const timestamp = Date.now().toString();
  const payload = `habiventure_admin_${adminUserId}_${timestamp}`;
  const signature = await computeHmacSha256(secret, payload);
  return `${adminUserId}.${timestamp}.${signature}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<{ valid: boolean; adminUserId?: number }> {
  if (!token || typeof token !== "string") return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false };

  const [userIdStr, timestampStr, signature] = parts;
  const adminUserId = Number(userIdStr);
  const timestamp = Number(timestampStr);
  if (isNaN(adminUserId) || isNaN(timestamp) || !adminUserId) return { valid: false };

  const maxAgeMs = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  if (Date.now() - timestamp > maxAgeMs) return { valid: false };

  const secret = getSecretKey();
  if (!secret) return { valid: false };

  const payload = `habiventure_admin_${userIdStr}_${timestampStr}`;
  const expectedSignature = await computeHmacSha256(secret, payload);

  if (constantTimeEqual(signature, expectedSignature)) {
    return { valid: true, adminUserId };
  }
  return { valid: false };
}


