import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subscription, userAgent } = body;

    if (!userId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription payload" },
        { status: 400 }
      );
    }

    if (dataStore.savePushSubscription) {
      await dataStore.savePushSubscription({
        userId: Number(userId),
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || request.headers.get("user-agent") || undefined,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save push subscription" },
      { status: 500 }
    );
  }
}

