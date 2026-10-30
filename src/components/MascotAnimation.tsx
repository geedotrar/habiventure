"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import NextImage from "next/image";
import { gameFeedback } from "@/utils/gameFeedback";
import { CrownIcon, FlameIcon, ZapIcon, SparkleIcon } from "./Icons";

export type MascotAnimationState =
  | "idle"
  | "blink"
  | "happy"
  | "wave"
  | "jump"
  | "celebrate"
  | "excited"
  | "surprised"
  | "thinking"
  | "encourage"
  | "success"
  | "sad";

export type MascotCharacterType = "male" | "female" | "user_a" | "user_b" | "together";

export interface MascotAnimationFrame {
  sprite: string;
  duration: number;
  transform?: string;
  fx?: "none" | "spark" | "confetti" | "lightbulb" | "question" | "exclamation" | "star" | "flame" | "heart";
}

export interface MascotAnimationProps {
  state?: MascotAnimationState;
  character?: MascotCharacterType;
  size?: number;
  loop?: boolean;
  interactive?: boolean;
  showFx?: boolean;
  speechText?: string;
  speechStyle?: React.CSSProperties;
  speechPlacement?: "center" | "left" | "right";
  showCrown?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
  onPoke?: (quote: string) => void;
}

const MOTIVATION_QUOTES = [
  "Keep it up! You've got this!",
  "Our streak is on fire!",
  "Small steps, huge results!",
  "Focus one step at a time!",
  "You're doing amazing today!",
  "Remember to stay hydrated!",
  "The adventure continues!",
];

const preloadedSprites = new Set<string>();
function preloadImage(src: string) {
  if (typeof window === "undefined" || !src || preloadedSprites.has(src)) return;
  preloadedSprites.add(src);
  const img = new Image();
  img.src = src;
}

function getFrameSequence(
  _character: MascotCharacterType,
  state: MascotAnimationState,
  _showCrown?: boolean
): MascotAnimationFrame[] {
  switch (state) {
    case "celebrate":
    case "success":
      return [
        { sprite: "/mascots/mascot_yay.png", duration: 380, transform: "scale(1.03) translateY(-4px)", fx: "confetti" },
        { sprite: "/mascots/mascot_celebrate.png", duration: 750, transform: "scale(1.07) translateY(-8px)", fx: "star" },
        { sprite: "/mascots/mascot_jump.png", duration: 600, transform: "scale(1.05) translateY(-14px)", fx: "confetti" },
        { sprite: "/mascots/mascot_celebrate.png", duration: 650, transform: "scale(1.03)", fx: "confetti" },
      ];
    case "jump":
    case "excited":
      return [
        { sprite: "/mascots/mascot_encourage.png", duration: 160, transform: "scale(1.05, 0.94) translateY(4px)" },
        { sprite: "/mascots/mascot_jump.png", duration: 520, transform: "scale(1.0, 1.05) translateY(-20px)", fx: "spark" },
        { sprite: "/mascots/mascot_yay.png", duration: 420, transform: "scale(1.04) translateY(-8px)", fx: "confetti" },
        { sprite: "/mascots/mascot_idle.png", duration: 300, transform: "scale(1.0, 1.0) translateY(0)" },
      ];
    case "thinking":
    case "surprised":
      return [
        { sprite: "/mascots/mascot_thinking.png", duration: 700, transform: "scale(1.02) rotate(-2deg)", fx: "question" },
        { sprite: "/mascots/mascot_thinking.png", duration: 700, transform: "scale(1.04) rotate(2deg)", fx: "star" },
      ];
    case "happy":
      return [
        { sprite: "/mascots/mascot_yay.png", duration: 500, transform: "scale(1.03) translateY(-4px)", fx: "star" },
        { sprite: "/mascots/mascot_wave.png", duration: 550, transform: "scale(1.02) rotate(2deg)" },
      ];
    case "wave":
      return [
        { sprite: "/mascots/mascot_wave.png", duration: 450, transform: "rotate(-3deg)" },
        { sprite: "/mascots/mascot_wave.png", duration: 500, transform: "scale(1.03) rotate(3deg)", fx: "spark" },
        { sprite: "/mascots/mascot_wave.png", duration: 450, transform: "rotate(-1deg)" },
      ];
    case "encourage":
      return [
        { sprite: "/mascots/mascot_encourage.png", duration: 650, transform: "scale(1.05) translateY(-3px)", fx: "flame" },
        { sprite: "/mascots/mascot_yay.png", duration: 550, transform: "scale(1.03) translateY(-4px)", fx: "star" },
      ];
    case "sad":
      return [
        { sprite: "/mascots/mascot_sad.png", duration: 2000, transform: "scale(0.98, 0.98) translateY(3px)" },
        { sprite: "/mascots/mascot_crying.png", duration: 1600, transform: "scale(0.97, 0.97) translateY(4px)" },
      ];
    case "blink":
      return [
        { sprite: "/mascots/mascot_idle.png", duration: 300 },
        { sprite: "/mascots/mascot_wink.png", duration: 600, transform: "scale(1.02)", fx: "star" },
        { sprite: "/mascots/mascot_idle.png", duration: 400 },
      ];
    case "idle":
    default:
      return [
        { sprite: "/mascots/mascot_idle.png", duration: 3000, transform: "scale(1.0, 1.0)" },
        { sprite: "/mascots/mascot_wink.png", duration: 450, transform: "scale(1.01)" },
        { sprite: "/mascots/mascot_idle.png", duration: 2400, transform: "scale(1.0, 1.0)" },
      ];
  }
}

export const MascotAnimation: React.FC<MascotAnimationProps> = ({
  state = "idle",
  character = "together",
  size = 120,
  loop = true,
  interactive = false,
  showFx = true,
  speechText,
  speechStyle,
  speechPlacement = "center",
  showCrown = false,
  className = "",
  style = {},
  onComplete,
  onPoke,
}) => {
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [pokeQuote, setPokeQuote] = useState<string | null>(null);
  const [isPoked, setIsPoked] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const activeState: MascotAnimationState = isPoked ? "jump" : state;

  const frames = useMemo(
    () => getFrameSequence(character, activeState, showCrown),
    [character, activeState, showCrown]
  );

  useEffect(() => {
    frames.forEach((f) => preloadImage(f.sprite));
  }, [frames]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentFrameIndex(0);
      return;
    }

    const currentFrame = frames[currentFrameIndex] || frames[0];
    const duration = currentFrame?.duration || 500;

    const timeoutId = setTimeout(() => {
      if (currentFrameIndex < frames.length - 1) {
        setCurrentFrameIndex((prev) => prev + 1);
      } else {
        if (loop) {
          setCurrentFrameIndex(0);
        } else if (onComplete) {
          onComplete();
        }
      }
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [currentFrameIndex, frames, loop, onComplete, prefersReducedMotion]);

  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [activeState, character]);

  const handlePoke = useCallback(
    (e: React.MouseEvent) => {
      if (!interactive) return;
      e.stopPropagation();

      gameFeedback.playPop();
      gameFeedback.haptic(25);
      setIsPoked(true);

      const quote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
      setPokeQuote(quote);
      if (onPoke) onPoke(quote);

      setTimeout(() => {
        setIsPoked(false);
        setTimeout(() => setPokeQuote(null), 1800);
      }, 1050);
    },
    [interactive, onPoke]
  );

  const activeFrame = frames[currentFrameIndex] || frames[0];
  const activeSprite = activeFrame?.sprite || "/mascots/mascot_idle.png";
  const frameTransform = prefersReducedMotion ? undefined : activeFrame?.transform;
  const activeFx = showFx ? activeFrame?.fx : "none";

  const displaySpeech = pokeQuote || speechText;

  return (
    <div
      className={`mascot-performance-container ${className}`}
      onClick={handlePoke}
      style={{
        position: "relative",
        width: `${size}px`,
        height: `${size}px`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        cursor: interactive ? "pointer" : "default",
        userSelect: "none",
        ...style,
      }}
    >
      {(activeState === "excited" || activeState === "celebrate" || activeState === "success") && (
        <div
          style={{
            position: "absolute",
            width: "80%",
            height: "80%",
            borderRadius: "50%",
            background:
              activeState === "excited"
                ? "radial-gradient(circle, rgba(255, 87, 51, 0.28) 0%, transparent 70%)"
                : activeState === "success"
                ? "radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)"
                : "radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)",
            filter: "blur(8px)",
            pointerEvents: "none",
            animation: "pulseGlow 1.8s infinite alternate",
          }}
        />
      )}

      <NextImage
        src={activeSprite}
        alt={`${character} mascot ${activeState}`}
        width={size}
        height={size}
        unoptimized
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.45))",
          transform: frameTransform,
          transition: "transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1)",
          willChange: "transform",
        }}
      />

      {showCrown && character !== "together" && (
        <div
          style={{
            position: "absolute",
            top: "-12px",
            filter: "drop-shadow(0 2px 8px rgba(245, 158, 11, 0.7))",
            animation: "bounce 2s infinite ease-in-out",
            pointerEvents: "none",
          }}
        >
          <CrownIcon size={Math.round(size * 0.28)} color="#F59E0B" />
        </div>
      )}

      {activeFx === "confetti" && (
        <div
          style={{
            position: "absolute",
            inset: "-10px",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <span style={{ position: "absolute", top: "10%", left: "5%", display: "inline-block", animation: "mascotPop 0.8s infinite" }}>
            <SparkleIcon size={14} color="#EF4444" />
          </span>
          <span style={{ position: "absolute", top: "5%", right: "8%", display: "inline-block", animation: "mascotPop 0.9s 0.2s infinite" }}>
            <SparkleIcon size={13} color="#FBBF24" />
          </span>
          <span style={{ position: "absolute", bottom: "15%", left: "8%", display: "inline-block", animation: "mascotPop 0.7s 0.4s infinite" }}>
            <SparkleIcon size={10} color="#10B981" />
          </span>
          <span style={{ position: "absolute", bottom: "12%", right: "6%", display: "inline-block", animation: "mascotPop 0.85s 0.1s infinite" }}>
            <SparkleIcon size={14} color="#3B82F6" />
          </span>
        </div>
      )}

      {activeFx === "lightbulb" && (
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "2px",
            pointerEvents: "none",
            animation: "mascotPop 0.6s infinite alternate",
            filter: "drop-shadow(0 0 10px rgba(253, 224, 71, 0.9))",
          }}
        >
          <ZapIcon size={18} color="#FBBF24" />
        </div>
      )}

      {activeFx === "question" && (
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "12px",
            pointerEvents: "none",
            fontSize: "18px",
            fontWeight: "900",
            color: "#60a5fa",
            textShadow: "0 0 10px rgba(96, 165, 250, 0.8)",
            animation: "mascotPop 0.9s infinite ease-in-out",
          }}
        >
          ?
        </div>
      )}

      {activeFx === "exclamation" && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            right: "10px",
            pointerEvents: "none",
            fontSize: "20px",
            fontWeight: "900",
            color: "#f59e0b",
            textShadow: "0 0 12px rgba(245, 158, 11, 0.9)",
            animation: "mascotPop 0.5s ease-out 1",
          }}
        >
          !
        </div>
      )}

      {activeFx === "flame" && (
        <div
          style={{
            position: "absolute",
            inset: "-6px",
            pointerEvents: "none",
          }}
        >
          <span style={{ position: "absolute", top: "15%", left: "4%", display: "inline-block", animation: "mascotPop 0.7s infinite" }}>
            <FlameIcon size={14} color="#EA580C" />
          </span>
          <span style={{ position: "absolute", top: "10%", right: "6%", display: "inline-block", animation: "mascotPop 0.8s 0.25s infinite" }}>
            <ZapIcon size={13} color="#FBBF24" />
          </span>
        </div>
      )}

      {activeFx === "star" && (
        <div
          style={{
            position: "absolute",
            inset: "-6px",
            pointerEvents: "none",
          }}
        >
          <span style={{ position: "absolute", top: "8%", left: "8%", display: "inline-block", animation: "mascotPop 1s infinite" }}>
            <SparkleIcon size={14} color="#FCD34D" />
          </span>
          <span style={{ position: "absolute", top: "12%", right: "8%", display: "inline-block", animation: "mascotPop 1s 0.5s infinite" }}>
            <SparkleIcon size={13} color="#F59E0B" />
          </span>
        </div>
      )}

      {displaySpeech && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: speechPlacement === "left" ? "0" : speechPlacement === "right" ? "auto" : "50%",
            right: speechPlacement === "right" ? "0" : "auto",
            transform: speechPlacement === "left" || speechPlacement === "right" ? "none" : "translateX(-50%)",
            marginBottom: "6px",
            backgroundColor: "rgba(19, 30, 24, 0.96)",
            color: "#FFFFFF",
            padding: "6px 12px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: 700,
            whiteSpace: "normal",
            width: "max-content",
            maxWidth: "min(280px, calc(100vw - 36px))",
            textAlign: speechPlacement === "right" ? "right" : speechPlacement === "left" ? "left" : "center",
            lineHeight: 1.35,
            wordBreak: "break-word",
            boxSizing: "border-box",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            zIndex: 30,
            pointerEvents: "none",
            transformOrigin: speechPlacement === "left" ? "bottom left" : speechPlacement === "right" ? "bottom right" : "bottom center",
            animation: speechPlacement === "left" || speechPlacement === "right"
              ? "mascotSpeechPopEdge 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards"
              : "mascotSpeechPopCenter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            ...speechStyle,
          }}
        >
          {displaySpeech}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: speechPlacement === "left" ? `${Math.min(22, Math.max(12, Math.round(size * 0.45)))}px` : speechPlacement === "right" ? "auto" : "50%",
              right: speechPlacement === "right" ? `${Math.min(22, Math.max(12, Math.round(size * 0.45)))}px` : "auto",
              transform: speechPlacement === "left" || speechPlacement === "right" ? "none" : "translateX(-50%)",
              borderWidth: "6px 6px 0 6px",
              borderStyle: "solid",
              borderColor: "rgba(19, 30, 24, 0.96) transparent transparent transparent",
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes mascotPop {
          0%, 100% {
            transform: scale(0.9) translateY(0);
            opacity: 0.85;
          }
          50% {
            transform: scale(1.15) translateY(-4px);
            opacity: 1;
          }
        }
        @keyframes mascotSpeechPopCenter {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.75) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1) translateY(0);
          }
        }
        @keyframes mascotSpeechPopEdge {
          0% {
            opacity: 0;
            transform: scale(0.75) translateY(6px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes pulseGlow {
          0% {
            opacity: 0.6;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
};
