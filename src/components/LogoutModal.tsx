"use client";

import React, { useEffect } from "react";
import { Mascot } from "./Mascot";
import { LogOutIcon, XIcon } from "./Icons";
import { gameFeedback } from "@/utils/gameFeedback";
import type { User } from "@/types/domain";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  user,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const effectiveGender = user?.gender || (user?.id === 3 ? "female" : "male");
  const mascotChar = user?.role === "superadmin" ? "together" : (effectiveGender === "female" ? "female" : "male");

  return (
    <div
      className="neo-modal-backdrop"
      onClick={() => {
        gameFeedback.playPop();
        onClose();
      }}
      style={{
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="animate-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "360px",
          width: "100%",
          background: "linear-gradient(180deg, #18261E 0%, #0E1612 100%)",
          borderRadius: "28px",
          padding: "26px 22px 22px 22px",
          textAlign: "center",
          position: "relative",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.12)",
          border: "1.5px solid rgba(255, 87, 51, 0.35)",
        }}
      >
        <button
          type="button"
          onClick={() => {
            gameFeedback.playPop();
            onClose();
          }}
          className="neo-btn neo-btn-glass"
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            minWidth: "44px",
            minHeight: "44px",
            borderRadius: "50%",
            padding: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
          }}
          aria-label="Close dialog"
        >
          <XIcon size={16} />
        </button>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px", marginTop: "4px" }}>
          <Mascot
            character={mascotChar}
            mood="behind"
            size={88}
            animation="bounce"
          />
        </div>

        <h3
          id="logout-modal-title"
          style={{
            fontSize: "18px",
            fontWeight: "900",
            color: "#FFFFFF",
            margin: "6px 0 6px 0",
            letterSpacing: "-0.3px",
          }}
        >
          Log Out?
        </h3>

        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            margin: "0 0 20px 0",
            lineHeight: "1.4",
          }}
        >
          Are you sure you want to log out,{" "}
          <strong style={{ color: "#FFFFFF" }}>{user?.name || "Adventurer"}</strong>?
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            type="button"
            onClick={() => {
              gameFeedback.playPop();
              onClose();
            }}
            className="neo-btn neo-btn-glass"
            style={{
              padding: "11px 14px",
              fontSize: "12px",
              fontWeight: "800",
              borderRadius: "14px",
              whiteSpace: "nowrap",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              gameFeedback.haptic([40, 70]);
              onConfirm();
            }}
            className="neo-btn neo-btn-coral"
            style={{
              padding: "11px 14px",
              fontSize: "12px",
              fontWeight: "800",
              borderRadius: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <LogOutIcon size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
