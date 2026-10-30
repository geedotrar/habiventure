"use client";

import React, { useEffect } from "react";
import { Mascot, MascotCharacter } from "./Mascot";
import { StreakFlame, getStreakTier } from "./StreakFlame";
import { gameFeedback } from "@/utils/gameFeedback";
import { XIcon, SparkleIcon, ShieldIcon } from "./Icons";

interface StreakCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  character?: MascotCharacter;
  userName?: string;
  isTeamStreak?: boolean;
  protectsRemaining?: number;
  maxProtects?: number;
}

export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  isOpen,
  onClose,
  streakCount,
  character = "together",
  userName = "Adventurer",
  isTeamStreak = false,
  protectsRemaining = 3,
  maxProtects = 3,
}) => {
  const tier = getStreakTier(streakCount);

  useEffect(() => {
    if (isOpen) {
      gameFeedback.playStreakFanfare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "390px",
          background: "linear-gradient(180deg, #18261E 0%, #0D1612 100%)",
          borderRadius: "32px",
          padding: "clamp(36px, 6vh, 48px) 18px 24px 18px",
          textAlign: "center",
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          boxShadow: `0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px ${tier.glowColor.idle}`,
          border: `1.5px solid ${tier.borderColor}`,
        }}
      >
        <div className="streak-sunburst-rays" />

        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            fontSize: "14px",
            fontWeight: "900",
            color: "rgba(255, 255, 255, 0.8)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          aria-label="Close"
        >
          <XIcon size={16} />
        </button>

        <div style={{ position: "relative", zIndex: 2, marginBottom: "14px" }}>
          <div style={{ display: "inline-block" }}>
            <Mascot
              character={character}
              mood="celebrating"
              animation="celebrate"
              size={130}
              particles="confetti"
              speechText={`AWESOME, ${userName.toUpperCase()}!`}
            />
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", justifyContent: "center", marginBottom: "14px" }}>
          <div
            style={{
              background: tier.badgeBg,
              border: `1.5px solid ${tier.borderColor}`,
              borderRadius: "24px",
              padding: "10px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: `0 8px 24px ${tier.glowColor.idle}, inset 0 1px 0 rgba(255, 255, 255, 0.1)`,
            }}
          >
            <StreakFlame streak={streakCount} size="lg" showLabel={false} isTodayCompleted={true} />
            <div style={{ textAlign: "left" }}>
              <div className="num-font" style={{ fontSize: "36px", fontWeight: "900", color: tier.textColor, lineHeight: 1 }}>
                {streakCount}
              </div>
              <div style={{ fontSize: "10px", fontWeight: "900", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
                {isTeamStreak ? "TEAM" : "ACTIVE"} DAY STREAK • {tier.name.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 2, marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-0.4px", marginBottom: "6px" }}>
            {isTeamStreak
              ? "Team Synergy Growing Stronger!"
              : streakCount === 1
              ? "Daily Streak Started Today!"
              : streakCount > 1
              ? "Daily Streak Extended Today!"
              : "Daily Streak Flame"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.45, fontWeight: "600", maxWidth: "290px", margin: "0 auto" }}>
            {isTeamStreak
              ? "Both of you completed goals today! Your duo accountability flame is shining bright!"
              : streakCount >= 7
              ? "7 Days of consistency achieved! You are at peak performance this week!"
              : streakCount === 1
              ? "1 goal completed today! Your daily habit flame is officially burning. Complete 1 goal tomorrow to keep it alive!"
              : streakCount > 1
              ? "Awesome job! You kept your momentum going. Keep your daily flame burning strong!"
              : "Complete at least 1 goal today to ignite your daily habit flame!"}
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(129, 140, 248, 0.35)",
              borderRadius: "16px",
              padding: "7px 14px",
              marginTop: "12px",
            }}
          >
            <ShieldIcon size={14} color="#818CF8" />
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#C7D2FE" }}>
              Streak Shield: <strong>{protectsRemaining}/{maxProtects}</strong> available this cycle
            </span>
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "600" }}>
            Streak carries over indefinitely across cycles • 3x shields refresh each cycle
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="neo-btn neo-btn-emerald"
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            fontSize: "14px",
            padding: "15px",
            borderRadius: "20px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <SparkleIcon size={16} />
          <span>Continue Adventure</span>
        </button>
      </div>
    </div>
  );
};
