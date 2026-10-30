"use client";

import React, { useState, useEffect } from "react";
import { ZapIcon, RefreshIcon, XIcon } from "./Icons";

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for Service Worker update found from ServiceWorkerRegister
    const handleSwUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ worker?: ServiceWorker }>;
      if (customEvent.detail?.worker) {
        setWaitingWorker(customEvent.detail.worker);
      }
      setSwUpdateAvailable(true);
    };

    window.addEventListener("habiventure-sw-update", handleSwUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("habiventure-sw-update", handleSwUpdate);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  if (swUpdateAvailable) {
    return (
      <aside
        aria-label="App update announcement"
        role="alert"
        style={{
          position: "fixed",
          top: "max(10px, env(safe-area-inset-top, 10px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 24px)",
          maxWidth: "420px",
          zIndex: 11000,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))",
          backdropFilter: "blur(12px)",
          color: "#FFFFFF",
          borderRadius: "16px",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ZapIcon size={16} color="#FFFFFF" />
          <span style={{ fontSize: "12px", fontWeight: "700" }}>
            New update available!
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleApplyUpdate}
            style={{
              background: "#FFFFFF",
              color: "#065F46",
              border: "none",
              borderRadius: "8px",
              padding: "5px 12px",
              fontSize: "11px",
              fontWeight: "800",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            }}
          >
            <RefreshIcon size={12} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setSwUpdateAvailable(false)}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255, 255, 255, 0.8)",
              cursor: "pointer",
              padding: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Dismiss update banner"
          >
            <XIcon size={14} />
          </button>
        </div>
      </aside>
    );
  }

  if (!isOnline) {
    return (
      <aside
        aria-label="Network status warning"
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          top: "max(10px, env(safe-area-inset-top, 10px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 24px)",
          maxWidth: "420px",
          zIndex: 11000,
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(185, 28, 28, 0.95))",
          backdropFilter: "blur(12px)",
          color: "#FFFFFF",
          borderRadius: "14px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5), 0 0 15px rgba(239, 68, 68, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#FCA5A5",
            boxShadow: "0 0 8px #FFFFFF",
            animation: "pulse 1.5s infinite",
          }}
        />
        <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.2px" }}>
          Offline Mode • Cached habits and progress remain accessible
        </span>
      </aside>
    );
  }

  if (showReconnected) {
    return (
      <aside
        aria-label="Network status update"
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          top: "max(10px, env(safe-area-inset-top, 10px))",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 24px)",
          maxWidth: "420px",
          zIndex: 11000,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))",
          backdropFilter: "blur(12px)",
          color: "#FFFFFF",
          borderRadius: "14px",
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.2px" }}>
          ✓ Back Online • Synchronizing data...
        </span>
      </aside>
    );
  }

  return null;
}
