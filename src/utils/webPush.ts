import { setVapidDetails, sendNotification } from "web-push";

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BFR87eEC-0ciIox8k6SzesCQYC5n_w_8p0uQPh4Azqh733NOfdDIMpYvyxF-NY8mcMAzAVkYq7FiAvNORwcNOss";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "h_34MzkzO6mMErrcrqH3dpPT0-U9uODMYW_psQ-Xnjg";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:admin@habiventure.local";

let isVapidConfigured = false;

export function configureWebPush(): void {
  if (!isVapidConfigured && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    try {
      setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      isVapidConfigured = true;
    } catch (error) {
      console.error("Failed to configure web-push VAPID details:", error);
    }
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export interface SendPushResult {
  success: boolean;
  endpoint: string;
  statusCode?: number;
  expired?: boolean;
  error?: string;
}

export async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
): Promise<SendPushResult> {
  configureWebPush();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationData = {
    title: payload.title || "HabiVenture",
    body: payload.body || "",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
    url: payload.url || "/?tab=today",
    tag: payload.tag || "habiventure-reminder",
    data: {
      url: payload.url || "/?tab=today",
      ...payload.data,
    },
  };

  try {
    const result = await sendNotification(
      pushSubscription,
      JSON.stringify(notificationData)
    );
    return {
      success: true,
      endpoint: subscription.endpoint,
      statusCode: result.statusCode,
    };
  } catch (err: any) {
    const statusCode = err?.statusCode || err?.status;
    const isExpired = statusCode === 404 || statusCode === 410;
    return {
      success: false,
      endpoint: subscription.endpoint,
      statusCode,
      expired: isExpired,
      error: err?.message || "Push dispatch failed",
    };
  }
}

