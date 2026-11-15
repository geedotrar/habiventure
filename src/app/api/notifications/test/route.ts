import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import { sendWebPush } from "@/utils/webPush";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, message } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const subscriptions = dataStore.getPushSubscriptionsByUserId
      ? await dataStore.getPushSubscriptionsByUserId(Number(userId))
      : [];

    if (subscriptions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          sentCount: 0,
          message: "No active push subscription found for this user on this device.",
        },
        { status: 404 }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      const res = await sendWebPush(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        {
          title: title || "HabiVenture Test Notification",
          body:
            message ||
          "Your reminder notifications are active! Daily and weekly goal reminders will appear here.",
          url: "/?tab=today",
          tag: `test-notif-${Date.now()}`,
        }
      );

      if (res.success) {
        sent++;
      } else {
        failed++;
        if (res.expired && dataStore.deletePushSubscription) {
          await dataStore.deletePushSubscription(sub.endpoint);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sentCount: sent,
      failedCount: failed,
      message: `Notification sent successfully to ${sent} device(s).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to dispatch test notification" },
      { status: 500 }
    );
  }
}

