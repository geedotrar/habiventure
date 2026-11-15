"use client";

import React, { useState, useEffect } from "react";
import { BellIcon, BellOffIcon, CheckIcon, XIcon } from "@/components/Icons";
import {
  isPushSupported,
  isIOSDevice,
  isStandaloneMode,
  getExistingPushSubscription,
  requestPushSubscription,
  removePushSubscription,
  triggerTestPush,
} from "@/utils/pwaNotifications";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
}

export function NotificationSettingsModal({
  isOpen,
  onClose,
  userId,
  userName,
}: NotificationSettingsModalProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setFeedbackMsg(null);
    const supported = isPushSupported();
    const ios = isIOSDevice();
    const standalone = isStandaloneMode();

    setIsSupported(supported);
    setIsIOS(ios);
    setIsStandalone(standalone);

    const checkSubscription = async () => {
      const sub = await getExistingPushSubscription();
      setIsSubscribed(Boolean(sub));
    };

    checkSubscription();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    setFeedbackMsg(null);

    const res = await requestPushSubscription(userId);
    setLoading(false);

    if (res.success) {
      setIsSubscribed(true);
      setFeedbackMsg({
        type: "success",
        text: "Reminder notifications enabled successfully!",
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: res.error || "Failed to enable notifications.",
      });
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setFeedbackMsg(null);

    const res = await removePushSubscription();
    setLoading(false);

    if (res.success) {
      setIsSubscribed(false);
      setFeedbackMsg({
        type: "success",
        text: "Reminder notifications disabled.",
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: res.error || "Failed to disable notifications.",
      });
    }
  };

  const handleTestPush = async () => {
    setTestLoading(true);
    setFeedbackMsg(null);

    const res = await triggerTestPush(userId);
    setTestLoading(false);

    if (res.success) {
      setFeedbackMsg({
        type: "success",
        text: res.message || "Test notification sent! Check your device banner or lock screen.",
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: res.message,
      });
    }
  };

  return (
    <div className="neo-modal-backdrop" onClick={() => !loading && onClose()}>
      <div
        className="neo-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "430px",
          width: "92%",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(16, 185, 129, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <BellIcon size={20} color="var(--emerald-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: "800", color: "#FFFFFF", margin: 0 }}>
                Reminder Notifications
              </h2>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                For {userName}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neo-btn neo-btn-glass"
            style={{ width: "32px", height: "32px", borderRadius: "50%", padding: 0 }}
          >
            <XIcon size={14} color="var(--text-secondary)" />
          </button>
        </div>

        {isIOS && !isStandalone && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              fontSize: "12px",
              color: "#FDE68A",
              lineHeight: 1.4,
              marginBottom: "14px",
            }}
          >
            <strong>iPhone / Apple Notice:</strong>
            <div style={{ marginTop: "4px" }}>
              iOS Web Push requires the app to be installed on your Home Screen. Tap the <em>Share</em> button in Safari, then choose <strong>&quot;Add to Home Screen&quot;</strong> before enabling notifications.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
            }}
          >
            <span style={{ fontSize: "16px" }}>🔔</span>
            <div style={{ fontSize: "12px", lineHeight: 1.35 }}>
              <strong style={{ color: "#FFFFFF" }}>Daily Goals</strong>
              <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                Sent at 12:00 PM WIB. If still incomplete, a second reminder is sent at 8:00 PM WIB.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
            }}
          >
            <span style={{ fontSize: "16px" }}>📅</span>
            <div style={{ fontSize: "12px", lineHeight: 1.35 }}>
              <strong style={{ color: "#FFFFFF" }}>Weekly Goals</strong>
              <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                Sent Saturday at 6:00 AM WIB. If still incomplete by Sunday at 6:00 AM WIB, a follow-up reminder is sent.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--border-glass)",
            }}
          >
            <span style={{ fontSize: "16px" }}>🎯</span>
            <div style={{ fontSize: "12px", lineHeight: 1.35 }}>
              <strong style={{ color: "#FFFFFF" }}>Cycle / Monthly Goals</strong>
              <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
                Sent every Saturday at 12:00 PM WIB weekly until targets are completed.
              </p>
            </div>
          </div>
        </div>

        {feedbackMsg && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              marginBottom: "14px",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background:
                feedbackMsg.type === "success"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
              border:
                feedbackMsg.type === "success"
                  ? "1px solid rgba(16, 185, 129, 0.3)"
                  : "1px solid rgba(239, 68, 68, 0.3)",
              color: feedbackMsg.type === "success" ? "#A7F3D0" : "#FCA5A5",
            }}
          >
            {feedbackMsg.type === "success" ? (
              <CheckIcon size={14} color="#10B981" />
            ) : (
              <BellOffIcon size={14} color="#EF4444" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {isSubscribed ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--emerald-primary)",
                      boxShadow: "0 0 8px var(--emerald-primary)",
                    }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "#A7F3D0" }}>
                    Reminder Notifications Active
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestPush}
                disabled={testLoading || loading}
                className="neo-btn neo-btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "10px 14px", fontSize: "13px" }}
              >
                <BellIcon size={16} />
                <span>{testLoading ? "Sending..." : "Send Test Notification"}</span>
              </button>

              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={loading || testLoading}
                className="neo-btn neo-btn-glass"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "9px 14px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                }}
              >
                <BellOffIcon size={14} />
                <span>{loading ? "Processing..." : "Disable Reminders"}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={loading || (!isSupported && !isIOS)}
              className="neo-btn neo-btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px 16px",
                fontSize: "13px",
                fontWeight: "800",
              }}
            >
              <BellIcon size={16} />
              <span>{loading ? "Enabling..." : "Enable Reminder Notifications"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
