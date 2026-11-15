import { NextResponse } from "next/server";
import { dispatchReminders } from "@/services/reminderEngine";
import type { ReminderType } from "@/types/domain";

export const dynamic = "force-dynamic";

function verifyCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.replace(/^Bearer\s+/i, "") === secret) {
    return true;
  }

  const customHeader = request.headers.get("x-cron-secret");
  if (customHeader === secret) {
    return true;
  }

  const url = new URL(request.url);
  const keyParam = url.searchParams.get("key");
  if (keyParam === secret) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  return handleReminders(request);
}

export async function POST(request: Request) {
  return handleReminders(request);
}

async function handleReminders(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const type = (url.searchParams.get("type") || "all") as ReminderType;
    const slot = url.searchParams.get("slot") || undefined;
    const dryRun = url.searchParams.get("dryRun") === "true";
    const userIdParam = url.searchParams.get("userId");
    const userId = userIdParam ? Number(userIdParam) : undefined;

    const result = await dispatchReminders({
      type,
      slot,
      dryRun,
      userId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to execute reminder job" },
      { status: 500 }
    );
  }
}

