"use client";

import { useState } from "react";
import { LockIcon, ShieldIcon, CheckCircleIcon, AlertTriangleIcon, XIcon, SpinnerIcon } from "@/components/Icons";
import { gameFeedback } from "@/utils/gameFeedback";

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PairDeviceModal({ isOpen, onClose, onSuccess }: PairDeviceModalProps) {
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      setError("Please enter the secret master pairing key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/trust-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: secretKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Invalid secret key. Pairing failed.");
        gameFeedback.haptic([100, 50, 100]);
        return;
      }

      gameFeedback.playSuccessChime();
      gameFeedback.haptic([40, 60]);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch {
      setError("Network error while verifying device pairing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        zIndex: 50000,
      }}
    >
      <div
        className="neo-card"
        style={{
          width: "100%",
          maxWidth: "380px",
          backgroundColor: "#0D1310",
          border: "1px solid rgba(16, 185, 129, 0.4)",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)",
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            padding: "4px",
          }}
          aria-label="Close"
        >
          <XIcon size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              backgroundColor: success ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.15)",
              border: `1px solid ${success ? "var(--emerald-primary)" : "rgba(139, 92, 246, 0.4)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
            }}
          >
            {success ? (
              <CheckCircleIcon size={26} color="var(--emerald-glow)" />
            ) : (
              <ShieldIcon size={26} color="#A78BFA" />
            )}
          </div>

          <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginBottom: "6px" }}>
            {success ? "Device Paired!" : "Pair Trusted Device"}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            {success
              ? "Live database connection authorized. Refreshing app..."
              : "Authorize this device for real Supabase database access with 365-day rolling auto-renewal."}
          </p>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "12px",
              padding: "10px 12px",
              marginBottom: "16px",
              color: "#FCA5A5",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            <AlertTriangleIcon size={16} color="#EF4444" />
            <span>{error}</span>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "18px" }}>
              <label
                htmlFor="pairKeyInput"
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "rgba(255, 255, 255, 0.7)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Master Secret Key
              </label>
              <input
                id="pairKeyInput"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter pair secret key"
                disabled={loading}
                autoFocus
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="neo-btn"
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "700",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="neo-btn neo-btn-emerald"
                style={{
                  flex: 2,
                  padding: "12px",
                  fontSize: "13px",
                  fontWeight: "800",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {loading ? <SpinnerIcon size={14} color="#FFFFFF" /> : <LockIcon size={14} />}
                <span>{loading ? "Verifying..." : "Authorize Device"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
