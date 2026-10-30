"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#0a0a0f",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "380px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            padding: "32px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
            <svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "800", marginBottom: "8px" }}>
            Application Error
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "rgba(255, 255, 255, 0.7)",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}
          >
            {error?.message || "A critical error occurred while loading the application."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "#10b981",
              color: "#0a0a0f",
              border: "none",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
