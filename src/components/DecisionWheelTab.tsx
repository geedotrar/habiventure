"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mascot } from "./Mascot";
import { gameFeedback } from "@/utils/gameFeedback";
import {
  DiceIcon,
  PlusIcon,
  TrashIcon,
  RefreshIcon,
  MessageCircleIcon,
  CompassIcon,
  SpinnerIcon,
} from "./Icons";
import type { User, DecisionOption } from "@/types/domain";

export interface WheelOption {
  id: number;
  name: string;
}

const DEFAULT_OPTIONS: WheelOption[] = [
  { id: 1, name: "Dine Out / Restaurant" },
  { id: 2, name: "Cook Together at Home" },
  { id: 3, name: "Movie Night / Cinema" },
  { id: 4, name: "Cafe & Coffee Chill" },
  { id: 5, name: "Casual Walk / Mall Trip" },
  { id: 6, name: "Your Treat" },
  { id: 7, name: "Partner's Treat" },
  { id: 8, name: "Rock Paper Scissors" },
];

const LEGACY_ID_TO_EN_MAP: Record<string, string> = {
  "Makan di Luar / Resto": "Dine Out / Restaurant",
  "Masak Bareng di Rumah": "Cook Together at Home",
  "Nonton Film / Bioskop": "Movie Night / Cinema",
  "Cafe & Coffee Chill": "Cafe & Coffee Chill",
  "Jalan Santai / Mall Walk": "Casual Walk / Mall Trip",
  "Kamu yang Traktir": "Your Treat",
  "Partner yang Traktir": "Partner's Treat",
  "Suit Gunting Batu Kertas": "Rock Paper Scissors",
};

const normalizeOptionName = (name: string): string => {
  return LEGACY_ID_TO_EN_MAP[name] || name;
};

const SEGMENT_COLORS = [
  "#10B981",
  "#FF7A59",
  "#0284C7",
  "#8B5CF6",
  "#F59E0B",
  "#EC4899",
  "#06B6D4",
  "#E11D48",
];

interface DecisionWheelTabProps {
  currentUser?: User | null;
  partnerUser?: User | null;
}

let memoryWheelCache: WheelOption[] | null = null;

export function DecisionWheelTab({ currentUser, partnerUser }: DecisionWheelTabProps) {
  const [options, setOptions] = useState<WheelOption[]>(() => {
    if (memoryWheelCache && memoryWheelCache.length > 0) {
      return memoryWheelCache;
    }
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("habiventure_decision_wheel_options_single");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cached = parsed.map((o: WheelOption) => ({ id: o.id, name: normalizeOptionName(o.name) }));
            memoryWheelCache = cached;
            return cached;
          }
        }
      } catch {
      }
    }
    return DEFAULT_OPTIONS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedResult, setSelectedResult] = useState<WheelOption | null>(null);

  const lastSoundDegRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("habiventure_decision_wheel_options_single");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const cached = parsed.map((o: WheelOption) => ({ id: o.id, name: normalizeOptionName(o.name) }));
            memoryWheelCache = cached;
            if (isMounted) setOptions(cached);
          }
        }
      } catch {
      }
    }

    async function syncFromDB() {
      try {
        const res = await fetch(`/api/decision?_t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.options) && data.options.length > 0) {
            if (isMounted) {
              const fresh = data.options.map((o: DecisionOption) => ({ id: o.id, name: normalizeOptionName(o.name) }));
              memoryWheelCache = fresh;
              setOptions(fresh);
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem("habiventure_decision_wheel_options_single", JSON.stringify(fresh));
                } catch {
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to sync options from DB, staying with local cache", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    syncFromDB();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveToLocalCache = (newOptions: WheelOption[]) => {
    memoryWheelCache = newOptions;
    setOptions(newOptions);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("habiventure_decision_wheel_options_single", JSON.stringify(newOptions));
      } catch {
      }
    }
  };

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newOptionText.trim();
    if (!trimmed || isSaving) return;

    gameFeedback.playPop();
    setIsSaving(true);

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.option) {
          const created: WheelOption = {
            id: data.option.id,
            name: data.option.name,
          };
          saveToLocalCache([...options, created]);
          setNewOptionText("");
          gameFeedback.playSuccessChime();
          return;
        }
      }

      const fallbackOpt: WheelOption = { id: Date.now() % 1000000, name: trimmed };
      saveToLocalCache([...options, fallbackOpt]);
      setNewOptionText("");
    } catch (err) {
      console.error("Could not save option to DB:", err);
      const fallbackOpt: WheelOption = { id: Date.now() % 1000000, name: trimmed };
      saveToLocalCache([...options, fallbackOpt]);
      setNewOptionText("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOption = async (optId: number) => {
    if (options.length <= 2) {
      gameFeedback.haptic([50, 50, 50]);
      alert("At least 2 options are required on the decision wheel!");
      return;
    }

    gameFeedback.playPop();
    const nextOptions = options.filter((o) => o.id !== optId);
    saveToLocalCache(nextOptions);

    if (selectedResult?.id === optId) {
      setSelectedResult(null);
    }

    try {
      await fetch("/api/decision", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: optId }),
      });
    } catch (err) {
      console.warn("Could not delete option from DB:", err);
    }
  };

  const handleResetToDefaults = async () => {
    gameFeedback.playPop();
    setSelectedResult(null);

    try {
      const res = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.options)) {
          saveToLocalCache(data.options.map((o: DecisionOption) => ({ id: o.id, name: o.name })));
          gameFeedback.playSuccessChime();
          return;
        }
      }

      saveToLocalCache(DEFAULT_OPTIONS);
    } catch (err) {
      console.warn("Could not reset options in DB:", err);
      saveToLocalCache(DEFAULT_OPTIONS);
    }
  };

  const spinTheWheel = () => {
    if (isSpinning || options.length < 2) return;

    setIsSpinning(true);
    setSelectedResult(null);
    gameFeedback.haptic(25);
    gameFeedback.playPop();

    const totalSlices = options.length;
    const winningIndex = Math.floor(Math.random() * totalSlices);
    const sliceAngle = 360 / totalSlices;

    const sliceCenterAngle = winningIndex * sliceAngle + sliceAngle / 2;

    const targetAngleAtTop = (270 - sliceCenterAngle + 360) % 360;

    const extraSpins = 360 * (6 + Math.floor(Math.random() * 3));
    const currentBase = wheelRotation - (wheelRotation % 360);
    const finalRotation = currentBase + extraSpins + targetAngleAtTop;

    setWheelRotation(finalRotation);

    const spinDuration = 4200;
    const startTime = Date.now();
    lastSoundDegRef.current = wheelRotation;

    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= spinDuration) {
        clearInterval(tickInterval);
        return;
      }
      gameFeedback.haptic(10);
    }, 180);

    setTimeout(() => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setSelectedResult(options[winningIndex]);
      gameFeedback.playSuccessChime();
      gameFeedback.playStreakFanfare();
    }, spinDuration);
  };

  const handleSendWhatsApp = () => {
    if (!selectedResult) return;
    const partnerName = partnerUser?.name || "Partner";

    const text = encodeURIComponent(
      `Hey ${partnerName}!\n\n` +
      `The Decision Wheel has decided for us:\n` +
      `*${selectedResult.name}*\n\n` +
      `The decision is final, no more saying "up to you"!`
    );

    const cleanPhone = (partnerUser?.phone || "").replace(/[^0-9]/g, "");
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${text}`
      : `https://wa.me/?text=${text}`;

    window.open(waUrl, "_blank");
  };

  const handleOpenGoogleMaps = () => {
    if (!selectedResult) return;
    const query = encodeURIComponent(`${selectedResult.name} near me`);
    window.open(`https://www.google.com/maps/search/${query}`, "_blank");
  };

  return (
    <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div
        className="neo-card"
        style={{
          border: "1.5px solid rgba(255, 122, 89, 0.4)",
          background: "linear-gradient(135deg, #1C221B 0%, #121813 100%)",
          display: "flex",
          alignItems: "center",
          gap: "14px",
        }}
      >
        <Mascot
          character="together"
          mood="toast"
          animation="float"
          size={54}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "900", color: "#FF7A59", letterSpacing: "1px", textTransform: "uppercase" }}>
            <DiceIcon size={13} color="#FF7A59" />
            <span>DECISION WHEEL</span>
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
            Decision Wheel
          </h2>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.4 }}>
            Can&apos;t decide what to eat, what to do, or whose turn it is? Spin the wheel to make any decision fair &amp; fun!
          </p>
        </div>
      </div>

      <div
        className="neo-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "20px 16px",
          background: "linear-gradient(180deg, rgba(20, 27, 22, 0.95) 0%, rgba(13, 19, 15, 0.98) 100%)",
        }}
      >
        <div style={{ fontSize: "11px", fontWeight: "900", color: "#10B981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
          TOTAL {options.length} DECISION OPTIONS
        </div>

        <div style={{ position: "relative", width: "min(270px, 78vw)", height: "min(270px, 78vw)", margin: "10px 0 20px" }}>
          <div
            style={{
              position: "absolute",
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: "0",
              height: "0",
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "20px solid #FF7A59",
              filter: "drop-shadow(0 4px 10px rgba(255, 122, 89, 0.8))",
            }}
          />

          <div
            style={{
              position: "absolute",
              inset: "-6px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
              border: "2px solid rgba(16, 185, 129, 0.35)",
              pointerEvents: "none",
            }}
          />

          <svg
            viewBox="0 0 300 300"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              transform: `rotate(${wheelRotation}deg)`,
              transition: isSpinning
                ? "transform 4.2s cubic-bezier(0.12, 0.85, 0.22, 1)"
                : "none",
              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.7), inset 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            <circle cx="150" cy="150" r="148" fill="#131B15" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="3" />

            {options.map((opt, i) => {
              const total = options.length;
              const anglePerSlice = 360 / total;
              const startAngle = i * anglePerSlice;
              const endAngle = (i + 1) * anglePerSlice;

              const x1 = 150 + 145 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 150 + 145 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 150 + 145 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 150 + 145 * Math.sin((Math.PI * endAngle) / 180);

              const largeArc = anglePerSlice > 180 ? 1 : 0;
              const pathData = `M 150 150 L ${x1} ${y1} A 145 145 0 ${largeArc} 1 ${x2} ${y2} Z`;

              const sliceColor = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
              const textAngle = startAngle + anglePerSlice / 2;

              return (
                <g key={opt.id}>
                  <path
                    d={pathData}
                    fill={sliceColor}
                    opacity="0.88"
                    stroke="rgba(0, 0, 0, 0.4)"
                    strokeWidth="1.5"
                  />
                  <g transform={`rotate(${textAngle}, 150, 150)`}>
                    <text
                      x="230"
                      y="154"
                      fill="#FFFFFF"
                      fontSize={total > 8 ? "9" : "11"}
                      fontWeight="900"
                      textAnchor="middle"
                      style={{
                        textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                        letterSpacing: "-0.2px",
                      }}
                    >
                      {opt.name.length > 14 ? `${opt.name.slice(0, 12)}…` : opt.name}
                    </text>
                  </g>
                </g>
              );
            })}

            <circle cx="150" cy="150" r="32" fill="#1A241D" stroke="#FF7A59" strokeWidth="3" />
            <circle cx="150" cy="150" r="18" fill="#FF7A59" opacity="0.25" />
            <text
              x="150"
              y="154"
              fill="#FFFFFF"
              textAnchor="middle"
              fontSize="11"
              fontWeight="900"
              style={{ letterSpacing: "1px" }}
            >
              SPIN
            </text>
          </svg>
        </div>

        <button
          type="button"
          className="neo-btn neo-btn-coral"
          disabled={isSpinning || options.length < 2}
          onClick={spinTheWheel}
          style={{
            width: "100%",
            maxWidth: "280px",
            fontSize: "14px",
            padding: "14px",
            fontWeight: "900",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 8px 24px rgba(255, 122, 89, 0.4)",
          }}
        >
          <DiceIcon size={18} />
          <span>{isSpinning ? "SPINNING WHEEL..." : "SPIN DECISION WHEEL!"}</span>
        </button>

        {selectedResult && !isSpinning && (
          <div
            className="animate-pop"
            style={{
              marginTop: "20px",
              width: "100%",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.12) 100%)",
              border: "1.5px solid var(--emerald-glow)",
              borderRadius: "20px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.25)",
            }}
          >
            <Mascot character="together" mood="winner" animation="celebrate" size={60} />
            <div style={{ fontSize: "11px", fontWeight: "900", color: "var(--emerald-glow)", textTransform: "uppercase", letterSpacing: "1px" }}>
              TODAY&apos;S DECISION RESULT:
            </div>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
              {selectedResult.name}
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", maxWidth: "260px" }}>
              The Wheel has spoken! No more saying &quot;up to you&quot;!
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", width: "100%", marginTop: "6px" }}>
              <button
                type="button"
                className="neo-btn neo-btn-emerald"
                onClick={handleSendWhatsApp}
                style={{ fontSize: "10.5px", padding: "9px 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", whiteSpace: "nowrap" }}
              >
                <MessageCircleIcon size={13} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                className="neo-btn neo-btn-glass"
                onClick={handleOpenGoogleMaps}
                style={{ fontSize: "10.5px", padding: "9px 6px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px", whiteSpace: "nowrap" }}
              >
                <CompassIcon size={13} color="var(--sky-primary)" />
                <span>Search Maps</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="neo-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
              Wheel Options List
            </h3>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Add or remove any options to customize your wheel.
            </div>
          </div>

          <button
            type="button"
            className="neo-btn neo-btn-glass"
            style={{ fontSize: "10px", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
            onClick={handleResetToDefaults}
            title="Reset options to default list"
          >
            <RefreshIcon size={11} />
            <span>Reset to Default</span>
          </button>
        </div>

        <form onSubmit={handleAddOption} style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
          <input
            type="text"
            placeholder="Add new option... (e.g. Movie Night, Eat Sushi)"
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            disabled={isSaving}
            style={{
              flex: 1,
              background: "var(--bg-surface-input)",
              border: "1px solid var(--border-glass)",
              borderRadius: "14px",
              padding: "10px 14px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: "700",
            }}
          />
          <button
            type="submit"
            className="neo-btn neo-btn-emerald"
            style={{ padding: "10px 14px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
            disabled={!newOptionText.trim() || isSaving}
          >
            {isSaving ? <SpinnerIcon size={14} color="#FFFFFF" /> : <PlusIcon size={14} />}
            <span>{isSaving ? "Saving..." : "Add"}</span>
          </button>
        </form>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {options.map((opt, i) => {
            const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
            return (
              <div
                key={opt.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "12px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  fontWeight: "800",
                  color: "#FFFFFF",
                }}
              >
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "9px",
                    fontWeight: "900",
                    color: "#FFFFFF",
                  }}
                >
                  {i + 1}
                </span>
                <span>{opt.name}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteOption(opt.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Delete option"
                >
                  <TrashIcon size={12} color="#EF4444" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
