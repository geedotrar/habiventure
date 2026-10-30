"use client";

import { useEffect } from "react";
import { Mascot } from "@/components/Mascot";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="app-viewport-container">
      <div
        className="app-mobile-shell"
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <div
          className="neo-card"
          style={{
            maxWidth: "360px",
            width: "100%",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Mascot
            character="together"
            mood="behind"
            size={110}
            animation="bounce"
            style={{ margin: "0 auto" }}
          />
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#FFFFFF",
              marginTop: "16px",
            }}
          >
            Something went wrong!
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginTop: "8px",
              marginBottom: "20px",
              lineHeight: "1.5",
            }}
          >
            {error?.message || "An unexpected error occurred while loading this page."}
          </p>

          <div style={{ display: "flex", gap: "10px", width: "100%" }}>
            <button
              onClick={() => reset()}
              className="neo-btn neo-btn-emerald"
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="neo-btn"
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: "13px",
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                background: "var(--bg-surface-elevated)",
                color: "var(--text-primary)",
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
