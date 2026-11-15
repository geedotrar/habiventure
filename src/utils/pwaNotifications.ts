import { demoStore } from "@/services/demoStore";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIOSDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function requestPushSubscription(userId: number): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushSupported()) {
    if (isIOSDevice() && !isStandaloneMode()) {
      return {
        success: false,
        error:
        "On iPhone/iPad, please add HabiVenture to your Home Screen (Add to Home Screen) first to enable reminder notifications.",
      };
    }
    return {
      success: false,
      error: "This browser or device does not support Web Push Notifications.",
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        success: false,
        error: "Notification permission was denied by user or system.",
      };
    }

    let publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      try {
        const keyRes = await fetch("/api/notifications/vapid-public-key");
        if (keyRes.ok) {
          const keyJson = await keyRes.json();
          publicKey = keyJson.publicKey;
        }
      } catch {
      }
    }

    if (!publicKey) {
      publicKey =
        "BFR87eEC-0ciIox8k6SzesCQYC5n_w_8p0uQPh4Azqh733NOfdDIMpYvyxF-NY8mcMAzAVkYq7FiAvNORwcNOss";
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    const isDemo = localStorage.getItem("habiventure_demo_mode_v1") === "true";

    if (isDemo && subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
      await demoStore.savePushSubscription({
        userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
      });
    }

    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription: subJson,
        userAgent: navigator.userAgent,
      }),
    });

    return {
      success: true,
      subscription,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to enable notifications.",
    };
  }
}

export async function removePushSubscription(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      const isDemo = localStorage.getItem("habiventure_demo_mode_v1") === "true";
      if (isDemo) {
        await demoStore.deletePushSubscription(endpoint);
      }
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Failed to disable notifications.",
    };
  }
}

export async function triggerTestPush(userId: number): Promise<{ success: boolean; message: string }> {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && Notification.permission === "granted") {
      try {
        const reg = await navigator.serviceWorker.ready;
          await reg.showNotification("HabiVenture Test Notification", {
            body: "Reminder notification successful! Reminders will appear when goals are pending.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            tag: "habiventure-test",
          });
        } catch {
        }
      }

    const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "HabiVenture Test Notification",
          message: "Reminder notification successful! Reminders will appear when goals are pending.",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          message: json.message || json.error || "Failed to send test notification.",
        };
      }

      return {
        success: true,
        message: json.message || "Test notification sent successfully!",
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || "An error occurred while sending test notification.",
      };
    }
  }
