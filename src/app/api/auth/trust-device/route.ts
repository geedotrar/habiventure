import { NextResponse } from "next/server";
import {
  generateDeviceToken,
  verifyDeviceToken,
  isValidSecretKey,
  TRUSTED_DEVICE_COOKIE_NAME,
  TRUSTED_DEVICE_MAX_AGE_SECONDS,
} from "@/utils/trustedDevice";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|; )${TRUSTED_DEVICE_COOKIE_NAME}=([^;]*)`));
  const token = match ? decodeURIComponent(match[1]) : null;

  const isTrusted = await verifyDeviceToken(token);

  const response = NextResponse.json({
    trusted: isTrusted,
  });

  if (isTrusted) {
    const newToken = await generateDeviceToken();
    response.cookies.set({
      name: TRUSTED_DEVICE_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
    });
  }

  return response;
}

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const pairingRateLimitStore = new Map<string, RateLimitRecord>();
const MAX_PAIRING_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;
const LOCK_DURATION_MS = 30 * 1000;

function checkPairingRateLimit(clientIp: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = pairingRateLimitStore.get(clientIp);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (now - record.firstAttemptAt > WINDOW_MS) {
    pairingRateLimitStore.delete(clientIp);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedPairingAttempt(clientIp: string): { isLocked: boolean; waitSeconds?: number } {
  const now = Date.now();
  let record = pairingRateLimitStore.get(clientIp);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { attempts: 1, firstAttemptAt: now, lockedUntil: 0 };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_PAIRING_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    pairingRateLimitStore.set(clientIp, record);
    return { isLocked: true, waitSeconds: Math.ceil(LOCK_DURATION_MS / 1000) };
  }

  pairingRateLimitStore.set(clientIp, record);
  return { isLocked: false };
}

function clearPairingRateLimit(clientIp: string) {
  pairingRateLimitStore.delete(clientIp);
}

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "default_client";

    const rateCheck = checkPairingRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Too many failed pairing attempts. Please wait ${rateCheck.waitSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { key } = body;

    if (!isValidSecretKey(key)) {
      const failStatus = recordFailedPairingAttempt(clientIp);
      if (failStatus.isLocked) {
        return NextResponse.json(
          { error: `Too many failed pairing attempts. Security lockout active for ${failStatus.waitSeconds}s.` },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Invalid secret key. Pairing failed." },
        { status: 401 }
      );
    }

    clearPairingRateLimit(clientIp);


    const token = await generateDeviceToken();
    const response = NextResponse.json({
      success: true,
      trusted: true,
      message: "Device successfully authorized for 365 days with rolling renewal.",
    });

    response.cookies.set({
      name: TRUSTED_DEVICE_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TRUSTED_DEVICE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to pair device";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    trusted: false,
    message: "Device pairing removed.",
  });

  response.cookies.delete(TRUSTED_DEVICE_COOKIE_NAME);
  return response;
}
