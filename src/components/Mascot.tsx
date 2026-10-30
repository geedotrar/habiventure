"use client";

import React from "react";
import Image from "next/image";
import { gameFeedback } from "@/utils/gameFeedback";
import {
  MascotAnimation,
  MascotAnimationState,
  MascotCharacterType,
} from "./MascotAnimation";
import { CrownIcon } from "./Icons";

export type { MascotAnimationState, MascotCharacterType };
export { MascotAnimation };

export type MascotMood =
  | "excited"
  | "thumbsup"
  | "wave"
  | "idle"
  | "working"
  | "proud"
  | "confident"
  | "behind"
  | "running"
  | "sad"
  | "crying"
  | "angry"
  | "celebrating"
  | "winner"
  | "champion"
  | "podium"
  | "sleeping"
  | "tired"
  | "tie"
  | "stars"
  | "toast"
  | "jump"
  | "idea"
  | "confused"
  | "surprised"
  | "peeking"
  | "shrug"
  | "happy"
  | "medal";

export type MascotCharacter = "male" | "female" | "user_a" | "user_b" | "together";

export type MascotAnimationType =
  | "idle"
  | "jump"
  | "bounce"
  | "celebrate"
  | "wave"
  | "cheer"
  | "surprise"
  | "sleep"
  | "peeking"
  | "point"
  | "float"
  | "none";

export interface MascotProps {
  character?: MascotCharacter;
  mood?: MascotMood;
  state?: MascotAnimationState;
  size?: number;
  variant?: "full" | "avatar";
  speechText?: string;
  speechStyle?: React.CSSProperties;
  speechPlacement?: "center" | "left" | "right";
  showCrown?: boolean;
  className?: string;
  style?: React.CSSProperties;
  animation?: MascotAnimationType;
  particles?: "none" | "stars" | "confetti" | "fire" | "hearts" | "zzz";
  interactive?: boolean;
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

export function getMascotSprite(character: MascotCharacter = "together", mood: MascotMood = "excited"): string {
  if (character === "female" || character === "user_b") {
    return "/mascots/avatar_female.png";
  }
  if (character === "male" || character === "user_a") {
    return "/mascots/avatar_male.png";
  }

  switch (mood) {
    case "celebrating":
    case "winner":
    case "champion":
    case "podium":
    case "medal":
      return "/mascots/mascot_celebrate.png";
    case "jump":
      return "/mascots/mascot_jump.png";
    case "excited":
    case "happy":
      return "/mascots/mascot_yay.png";
    case "wave":
    case "tie":
    case "toast":
      return "/mascots/mascot_wave.png";
    case "confident":
    case "proud":
    case "working":
      return "/mascots/mascot_encourage.png";
    case "sad":
    case "behind":
    case "running":
    case "angry":
      return "/mascots/mascot_sad.png";
    case "crying":
      return "/mascots/mascot_crying.png";
    case "idea":
    case "confused":
    case "surprised":
    case "peeking":
    case "shrug":
      return "/mascots/mascot_thinking.png";
    case "thumbsup":
    case "stars":
      return "/mascots/mascot_wink.png";
    case "idle":
    case "sleeping":
    case "tired":
    default:
      return "/mascots/mascot_idle.png";
  }
}

function mapToAnimationState(animation?: MascotAnimationType, mood?: MascotMood, explicitState?: MascotAnimationState): MascotAnimationState {
  if (explicitState) return explicitState;
  if (animation === "jump" || mood === "jump") return "jump";
  if (animation === "celebrate" || mood === "celebrating" || mood === "winner") return "celebrate";
  if (animation === "cheer" || mood === "happy") return "happy";
  if (animation === "wave" || mood === "wave") return "wave";
  if (animation === "surprise") return "surprised";
  if (animation === "point" || mood === "confident" || mood === "proud") return "encourage";
  if (mood === "sad" || mood === "crying" || mood === "angry" || mood === "behind") return "sad";
  if (mood === "idea" || mood === "confused") return "thinking";
  if (mood === "champion" || mood === "podium" || mood === "medal") return "success";
  if (mood === "excited" || mood === "running") return "excited";
  if (animation === "bounce") return "happy";
  if (animation === "sleep") return "idle";
  return "idle";
}

export const Mascot: React.FC<MascotProps> = ({
  character = "together",
  mood = "excited",
  state,
  size = 110,
  variant = "full",
  speechText,
  speechStyle,
  speechPlacement = "center",
  showCrown = false,
  className = "",
  style = {},
  animation = "float",
  particles = "none",
  interactive = false,
  onPoke,
}) => {
  const isFemale = character === "female" || character === "user_b";
  const isTogether = character === "together";
  const shouldShowCrown = showCrown;

  const handleAvatarPoke = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();

    gameFeedback.playPop();
    gameFeedback.haptic(20);

    const randomQuote = MOTIVATION_QUOTES[Math.floor(Math.random() * MOTIVATION_QUOTES.length)];
    if (onPoke) onPoke(randomQuote);
  };

  if (variant === "avatar") {
    const avatarSrc = isTogether
      ? "/mascots/avatar_team.png"
      : isFemale
      ? "/mascots/avatar_female.png"
      : "/mascots/avatar_male.png";

    const characterName = isTogether
      ? "Our Team"
      : isFemale
      ? "User B"
      : "User A";

    return (
      <div
        className={`neo-avatar-mascot ${className}`}
        onClick={handleAvatarPoke}
        style={{
          position: "relative",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: isTogether
            ? "rgba(245, 158, 11, 0.15)"
            : isFemale
            ? "rgba(255, 87, 51, 0.15)"
            : "rgba(16, 185, 129, 0.15)",
          border: shouldShowCrown && !isTogether
            ? "2px solid #f59e0b"
            : `1.5px solid ${
                isTogether
                  ? "rgba(245, 158, 11, 0.45)"
                  : isFemale
                  ? "rgba(255, 87, 51, 0.45)"
                  : "rgba(16, 185, 129, 0.45)"
              }`,
          boxShadow: shouldShowCrown && !isTogether
            ? "0 0 14px rgba(245, 158, 11, 0.45)"
            : "0 4px 12px rgba(0, 0, 0, 0.4)",
          overflow: "visible",
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: interactive ? "pointer" : "default",
          ...style,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            src={avatarSrc}
            alt={characterName}
            width={size}
            height={size}
            style={{
              width: "82%",
              height: "82%",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              userSelect: "none",
              pointerEvents: "none",
            }}
          />
        </div>

        {shouldShowCrown && !isTogether && size >= 32 && (
          <div
            style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              fontSize: size <= 38 ? "9px" : "11px",
              borderRadius: "50%",
              width: size <= 38 ? "16px" : "18px",
              height: size <= 38 ? "16px" : "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 5px rgba(0,0,0,0.25)",
              border: "1.5px solid white",
              zIndex: 3,
            }}
            title="Champion"
          >
            <CrownIcon size={size <= 38 ? 9 : 11} color="#FFFFFF" />
          </div>
        )}
      </div>
    );
  }

  const animState = mapToAnimationState(animation, mood, state);

  return (
    <MascotAnimation
      state={animState}
      character="together"
      size={size}
      interactive={interactive}
      showFx={particles !== "none"}
      speechText={speechText}
      speechStyle={speechStyle}
      speechPlacement={speechPlacement}
      showCrown={shouldShowCrown}
      className={className}
      style={style}
      onPoke={onPoke}
    />
  );
};

export default Mascot;
