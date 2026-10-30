"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { DownloadIcon, XIcon, SparkleIcon } from "./Icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(true);
  const [isIosSafari, setIsIosSafari] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check standalone mode (already installed & launched from home screen)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((navigator as any).standalone) ||
      document.referrer.includes("android-app://");

    setIsStandalone(standalone);
    if (standalone) return;

    // Check dismissal cooldown (7 days)
    try {
      const dismissedTime = localStorage.getItem("habiventure_pwa_dismissed");
      if (dismissedTime) {
        const diff = Date.now() - Number(dismissedTime);
        if (diff < 7 * 24 * 60 * 60 * 1000) {
          setIsDismissed(true);
          return;
        }
      }
    } catch {}

    setIsDismissed(false);

    // Detect iOS Safari
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isSafari = /Safari/i.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/i.test(ua);
    if (isIos && isSafari) {
      setIsIosSafari(true);
    }

    // Capture Android/Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("habiventure_pwa_dismissed", String(Date.now()));
    } catch {}
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsDismissed(true);
      }
    } catch (err) {
      console.warn("[PWA] Installation prompt failed:", err);
    } finally {
      setDeferredPrompt(null);
    }
  };

  // Do not render if app is running in standalone mode or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Chromium / Android beforeinstallprompt banner
  if (deferredPrompt) {
    return (
      <section
        aria-label="PWA installation prompt"
        style={{
          width: "100%",
          maxWidth: "440px",
          margin: "0 auto 14px auto",
          padding: "12px 14px",
          borderRadius: "18px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(13, 20, 16, 0.88) 100%)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          boxSizing: "border-box",
          animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#070B09",
            }}
          >
            <Image src="/icons/icon-192x192.png" alt="App Icon" width={36} height={36} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF" }}>
                Install HabiVenture
              </span>
              <SparkleIcon size={12} color="var(--emerald-glow)" />
            </div>
            <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Full-screen app &amp; offline habit tracking
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleInstallClick}
            className="neo-btn neo-btn-emerald"
            style={{
              padding: "7px 12px",
              fontSize: "11px",
              fontWeight: "800",
              borderRadius: "10px",
              boxShadow: "0 0 12px rgba(16, 185, 129, 0.4)",
            }}
          >
            <DownloadIcon size={13} />
            Install
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Dismiss install banner"
          >
            <XIcon size={16} />
          </button>
        </div>
      </section>
    );
  }

  // iOS Safari "Add to Home Screen" guide
  if (isIosSafari) {
    return (
      <section
        aria-label="iOS Add to Home Screen instructions"
        style={{
          width: "100%",
          maxWidth: "440px",
          margin: "0 auto 14px auto",
          padding: "10px 14px",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(13, 20, 16, 0.9) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.35)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: "16px", flexShrink: 0 }}>📲</span>
          <p style={{ fontSize: "10.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.35 }}>
            <strong style={{ color: "#FFFFFF" }}>Install on iPhone:</strong> Tap Share <span style={{ color: "var(--sky-primary)" }}>⎋</span> then select <strong style={{ color: "var(--sky-primary)" }}>&apos;Add to Home Screen&apos; ⊞</strong>
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Dismiss iOS guide"
        >
          <XIcon size={14} />
        </button>
      </section>
    );
  }

  return null;
}
