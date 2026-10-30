"use client";

import React, { useEffect, useState, useRef, useId } from "react";
import { AnimatedNumber } from "./AnimatedNumber";

export interface StreakTier {
  tier: number;
  name: string;
  minDays: number;
  maxDays: number | null;
  textColor: string;
  outerGradient: {
    start: string;
    middle?: string;
    end: string;
  };
  coreGradient: {
    start: string;
    end: string;
  };
  glowColor: {
    idle: string;
    active: string;
  };
  sparkColors: [string, string, string, string];
  badgeBg: string;
  borderColor: string;
}

export const STREAK_TIERS: StreakTier[] = [
  {
    tier: 1,
    name: "Classic Ember",
    minDays: 0,
    maxDays: 29,
    textColor: "#FF7A59",
    outerGradient: {
      start: "#EA580C",
      middle: "#F97316",
      end: "#FBBF24",
    },
    coreGradient: {
      start: "#F59E0B",
      end: "#FEF08A",
    },
    glowColor: {
      idle: "rgba(255, 107, 74, 0.35)",
      active: "rgba(255, 107, 74, 0.7)",
    },
    sparkColors: ["#FCD34D", "#F59E0B", "#EF4444", "#FBBF24"],
    badgeBg: "rgba(255, 87, 51, 0.12)",
    borderColor: "rgba(255, 107, 74, 0.4)",
  },
  {
    tier: 2,
    name: "Blue Hyperdrive",
    minDays: 30,
    maxDays: 59,
    textColor: "#38BDF8",
    outerGradient: {
      start: "#0284C7",
      middle: "#06B6D4",
      end: "#38BDF8",
    },
    coreGradient: {
      start: "#67E8F9",
      end: "#E0F2FE",
    },
    glowColor: {
      idle: "rgba(56, 189, 248, 0.35)",
      active: "rgba(56, 189, 248, 0.75)",
    },
    sparkColors: ["#38BDF8", "#06B6D4", "#A5F3FC", "#FFFFFF"],
    badgeBg: "rgba(56, 189, 248, 0.12)",
    borderColor: "rgba(56, 189, 248, 0.4)",
  },
  {
    tier: 3,
    name: "Amethyst Plasma",
    minDays: 60,
    maxDays: 89,
    textColor: "#C084FC",
    outerGradient: {
      start: "#7C3AED",
      middle: "#8B5CF6",
      end: "#C084FC",
    },
    coreGradient: {
      start: "#D8B4FE",
      end: "#F3E8FF",
    },
    glowColor: {
      idle: "rgba(168, 85, 247, 0.35)",
      active: "rgba(168, 85, 247, 0.75)",
    },
    sparkColors: ["#C084FC", "#A855F7", "#E9D5FF", "#F43F5E"],
    badgeBg: "rgba(168, 85, 247, 0.12)",
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  {
    tier: 4,
    name: "Emerald Radiant",
    minDays: 90,
    maxDays: 119,
    textColor: "#34D399",
    outerGradient: {
      start: "#059669",
      middle: "#10B981",
      end: "#34D399",
    },
    coreGradient: {
      start: "#6EE7B7",
      end: "#D1FAE5",
    },
    glowColor: {
      idle: "rgba(16, 185, 129, 0.35)",
      active: "rgba(16, 185, 129, 0.75)",
    },
    sparkColors: ["#34D399", "#10B981", "#6EE7B7", "#FCD34D"],
    badgeBg: "rgba(16, 185, 129, 0.12)",
    borderColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    tier: 5,
    name: "Solar Gold",
    minDays: 120,
    maxDays: 149,
    textColor: "#FBBF24",
    outerGradient: {
      start: "#D97706",
      middle: "#F59E0B",
      end: "#FDE047",
    },
    coreGradient: {
      start: "#FEF08A",
      end: "#FFFFFF",
    },
    glowColor: {
      idle: "rgba(251, 191, 36, 0.35)",
      active: "rgba(251, 191, 36, 0.75)",
    },
    sparkColors: ["#FDE047", "#F59E0B", "#FEF08A", "#FFFFFF"],
    badgeBg: "rgba(245, 158, 11, 0.12)",
    borderColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    tier: 6,
    name: "Crimson Phoenix",
    minDays: 150,
    maxDays: 179,
    textColor: "#FB7185",
    outerGradient: {
      start: "#BE123C",
      middle: "#E11D48",
      end: "#FB7185",
    },
    coreGradient: {
      start: "#FDA4AF",
      end: "#FFF1F2",
    },
    glowColor: {
      idle: "rgba(244, 63, 94, 0.35)",
      active: "rgba(244, 63, 94, 0.75)",
    },
    sparkColors: ["#FB7185", "#E11D48", "#FDA4AF", "#FDE047"],
    badgeBg: "rgba(244, 63, 94, 0.12)",
    borderColor: "rgba(244, 63, 94, 0.4)",
  },
  {
    tier: 7,
    name: "Cosmic Aurora",
    minDays: 180,
    maxDays: null,
    textColor: "#F472B6",
    outerGradient: {
      start: "#EC4899",
      middle: "#8B5CF6",
      end: "#06B6D4",
    },
    coreGradient: {
      start: "#34D399",
      end: "#FEF08A",
    },
    glowColor: {
      idle: "rgba(236, 72, 153, 0.35)",
      active: "rgba(236, 72, 153, 0.85)",
    },
    sparkColors: ["#F472B6", "#38BDF8", "#34D399", "#FCD34D"],
    badgeBg: "rgba(236, 72, 153, 0.12)",
    borderColor: "rgba(236, 72, 153, 0.4)",
  },
];

export function getStreakTier(streak: number): StreakTier {
  const safeStreak = Math.max(0, Math.floor(streak || 0));
  const tierIndex = Math.min(STREAK_TIERS.length - 1, Math.floor(safeStreak / 30));
  return STREAK_TIERS[tierIndex];
}

interface StreakFlameProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  showNumber?: boolean;
  className?: string;
  isTodayCompleted?: boolean;
}

export function StreakFlame({
  streak,
  size = "md",
  showLabel = true,
  showNumber,
  className = "",
  isTodayCompleted = false,
}: StreakFlameProps) {
  const shouldShowNumber = showNumber !== undefined ? showNumber : showLabel;
  const [isCelebrating, setIsCelebrating] = useState(false);
  const prevStreakRef = useRef(streak);
  const rawId = useId();
  const gradientId = rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outerGradId = `flameGradOuter_${gradientId}`;
  const coreGradId = `flameGradCore_${gradientId}`;

  const tier = getStreakTier(streak);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevStreakRef.current = streak;
      return;
    }

    let timer: NodeJS.Timeout | null = null;
    if (streak > prevStreakRef.current) {
      setIsCelebrating(true);
      timer = setTimeout(() => {
        setIsCelebrating(false);
      }, 850);
    }
    prevStreakRef.current = streak;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [streak]);

  const flameSize = size === "lg" ? "36px" : size === "md" ? "24px" : "18px";
  const numSize = size === "lg" ? "26px" : size === "md" ? "18px" : "13px";

  return (
    <div
      className={`streak-flame-wrapper ${className} ${isCelebrating ? "celebrating" : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size === "lg" ? "8px" : "5px",
        position: "relative",
      }}
    >
      {isCelebrating && (
        <div className="streak-sparks-container" aria-hidden="true">
          <svg className="spark spark-1" width="10" height="10" viewBox="0 0 24 24" fill={tier.sparkColors[0]}><path d="M12 2l2.4 6.6L21 11l-5.4 4.4L17 22l-5-3.8L7 22l1.4-6.6L3 11l6.6-2.4L12 2z"/></svg>
          <svg className="spark spark-2" width="8" height="8" viewBox="0 0 24 24" fill={tier.sparkColors[1]}><path d="M12 2l2.4 6.6L21 11l-5.4 4.4L17 22l-5-3.8L7 22l1.4-6.6L3 11l6.6-2.4L12 2z"/></svg>
          <svg className="spark spark-3" width="9" height="9" viewBox="0 0 24 24" fill={tier.sparkColors[2]}><path d="M12 2l2.4 6.6L21 11l-5.4 4.4L17 22l-5-3.8L7 22l1.4-6.6L3 11l6.6-2.4L12 2z"/></svg>
          <svg className="spark spark-4" width="10" height="10" viewBox="0 0 24 24" fill={tier.sparkColors[3]}><path d="M12 2l2.4 6.6L21 11l-5.4 4.4L17 22l-5-3.8L7 22l1.4-6.6L3 11l6.6-2.4L12 2z"/></svg>
        </div>
      )}

      <span
        className={`streak-flame-icon ${isCelebrating ? "animate-flame-ignite" : isTodayCompleted ? "animate-flame-glow" : "animate-flame-idle"}`}
        style={{
          width: flameSize,
          height: flameSize,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          transformOrigin: "center bottom",
          filter: isTodayCompleted
            ? `drop-shadow(0 0 8px ${tier.glowColor.active})`
            : `drop-shadow(0 0 3px ${tier.glowColor.idle})`,
        }}
        aria-label={`${tier.name} (${streak} days)`}
      >
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id={outerGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={tier.outerGradient.start} />
              {tier.outerGradient.middle && (
                <stop offset="50%" stopColor={tier.outerGradient.middle} />
              )}
              <stop offset="100%" stopColor={tier.outerGradient.end} />
            </linearGradient>
            <linearGradient id={coreGradId} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={tier.coreGradient.start} />
              <stop offset="100%" stopColor={tier.coreGradient.end} />
            </linearGradient>
          </defs>
          <path
            d="M12 2c.5 3-1.5 5-1.5 7.5 0 2.2 1.8 3.5 1.5 6-.3-1.5-1.5-2.5-1.5-4C8.5 14 6 15.5 6 18c0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-3.5-7.5-4-10-.5-2.5-1-4-2-6z"
            fill={`url(#${outerGradId})`}
          />
          <path
            d="M12 14c-.8 0-1.5.7-1.5 1.5 0 1 .5 1.5 0 2.5 1 0 2-.8 2-2 0-.8-.5-2-.5-2z"
            fill={`url(#${coreGradId})`}
          />
        </svg>
      </span>

      {shouldShowNumber && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: "3.5px",
          }}
        >
          <span
            className="num-font"
            style={{
              fontSize: numSize,
              fontWeight: 900,
              color: tier.textColor,
            }}
          >
            <AnimatedNumber value={streak} />
          </span>
          {showLabel && (
            <span
              style={{
                fontSize: size === "lg" ? "15px" : size === "md" ? "12px" : "11px",
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              Days
            </span>
          )}
        </div>
      )}
    </div>
  );
}
