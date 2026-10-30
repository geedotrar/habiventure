import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import {
  generateAdminSessionToken,
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "@/utils/trustedDevice";
import { authenticateAdminRequest } from "@/utils/adminAuth";


export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000;
const LOCK_DURATION_MS = 30 * 1000;

function checkRateLimit(clientIp: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIp);
  if (!record) return { allowed: true };

  if (record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.delete(clientIp);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(clientIp: string): { isLocked: boolean; waitSeconds?: number } {
  const now = Date.now();
  let record = rateLimitStore.get(clientIp);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { attempts: 1, firstAttemptAt: now, lockedUntil: 0 };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_DURATION_MS;
    rateLimitStore.set(clientIp, record);
    return { isLocked: true, waitSeconds: Math.ceil(LOCK_DURATION_MS / 1000) };
  }

  rateLimitStore.set(clientIp, record);
  return { isLocked: false };
}

function clearRateLimit(clientIp: string) {
  rateLimitStore.delete(clientIp);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "change_pin") {
      return await handleChangePin(body, request);
    }

    const { pin } = body;

    if (!pin || typeof pin !== "string") {
      return jsonResponse(
        { error: "PIN is required." },
        { status: 400 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded ? forwarded.split(",")[0].trim() : "default_client";

    const rateCheck = checkRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return jsonResponse(
        { error: `Too many failed attempts. Please wait ${rateCheck.waitSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    const trimmedPin = pin.trim();

    const matchedUser = await dataStore.getUserByPin?.(trimmedPin);

    if (!matchedUser) {
      const failStatus = recordFailedAttempt(clientIp);
      if (failStatus.isLocked) {
        return jsonResponse(
          { error: `Too many failed attempts. Security lockout active for ${failStatus.waitSeconds}s.` },
          { status: 429 }
        );
      }
      return jsonResponse(
        { error: "Invalid PIN or account not found." },
        { status: 401 }
      );
    }

    clearRateLimit(clientIp);

    const res = jsonResponse({
      success: true,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        gender: matchedUser.gender || (matchedUser.id === 3 ? "female" : "male"),
        role: matchedUser.role || "user",
      },
    });

    if (matchedUser.role === "superadmin") {
      try {
        const adminToken = await generateAdminSessionToken(matchedUser.id);
        res.cookies.set({
          name: ADMIN_SESSION_COOKIE_NAME,
          value: adminToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
        });
      } catch (err) {
        console.warn("Failed to generate admin session token:", err);
      }
    }

    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify PIN.";
    return jsonResponse(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return await handleChangePin(body, request);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to change PIN.";
    return jsonResponse(
      { error: message },
      { status: 500 }
    );
  }
}

async function handleChangePin(
  body: {
    userId?: number;
    currentPin?: string;
    newPin?: string;
    targetUserId?: number;
    isAdmin?: boolean;
  },
  request?: Request
) {
  const { userId, newPin, targetUserId } = body;

  const targetId = targetUserId ? Number(targetUserId) : Number(userId);
  if (!targetId || isNaN(targetId)) {
    return jsonResponse(
      { error: "Invalid user ID." },
      { status: 400 }
    );
  }

  if (!newPin || typeof newPin !== "string") {
    return jsonResponse(
      { error: "New PIN is required." },
      { status: 400 }
    );
  }

  const trimmedNewPin = newPin.trim();

  if (!/^\d{4}$/.test(trimmedNewPin)) {
    return jsonResponse(
      { error: "New PIN must consist of exactly 4 numeric digits (0-9)." },
      { status: 400 }
    );
  }

  // Authenticate admin caller via session cookie or fallback
  if (request) {
    const auth = await authenticateAdminRequest(request, userId ? Number(userId) : null);
    if (!auth.authorized) {
      return jsonResponse(
        { error: auth.error || "Super Admin authorization required." },
        { status: auth.status || 403 }
      );
    }
  } else {
    if (!userId) {
      return jsonResponse(
        { error: "Super Admin authentication required to change account PIN." },
        { status: 401 }
      );
    }
    const requester = await dataStore.getUserById(Number(userId));
    if (!requester || requester.role !== "superadmin" || !requester.active) {
      return jsonResponse(
        { error: "Access denied. Only Super Admin is authorized to change account PINs or user data." },
        { status: 403 }
      );
    }
  }

  const isTaken = await dataStore.isPinTaken?.(trimmedNewPin, targetId);
  if (isTaken) {
    return jsonResponse(
      { error: "This PIN is already in use by another account. Please choose a unique PIN." },
      { status: 400 }
    );
  }

  await dataStore.updateUserPin?.(targetId, trimmedNewPin);

  return jsonResponse({
    success: true,
    message: "PIN updated successfully!",
  });
}

