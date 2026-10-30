import Link from "next/link";
import { Mascot } from "@/components/Mascot";
import { HomeIcon } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="app-viewport-container">
      <div className="app-mobile-shell" style={{ justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div
          className="neo-card"
          style={{
            maxWidth: "340px",
            width: "100%",
            padding: "32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Mascot character="together" mood="behind" size={115} animation="bounce" style={{ margin: "0 auto" }} />
          <h1 className="num-font" style={{ fontSize: "28px", fontWeight: "900", color: "#FFFFFF", marginTop: "16px" }}>
            404
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", marginBottom: "20px" }}>
            Page not found. Let&apos;s head back to the habit arena!
          </p>
          <Link href="/" className="neo-btn neo-btn-emerald" style={{ padding: "12px 24px", fontSize: "13px", width: "100%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <HomeIcon size={16} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
