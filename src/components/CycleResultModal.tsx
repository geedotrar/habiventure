"use client";

import { useState, useEffect } from "react";
import { Mascot } from "./Mascot";
import { gameFeedback } from "@/utils/gameFeedback";
import { formatCycleDateRange } from "@/utils/dateFormatter";
import type { Punishment } from "@/types/domain";
import {
  XIcon,
  WheelIcon,
  DiceIcon,
  LockIcon,
  UnlockIcon,
  ShieldIcon,
  CheckIcon,
  TargetIcon,
  FlameIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CrownIcon,
  SpinnerIcon,
} from "./Icons";

interface CycleResultData {
  cycle: {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  punishments: Punishment[];
  result: {
    cycle_id: string;
    winner_user_id: string | null;
    loser_user_id: string | null;
    winner_score: number;
    loser_score: number;
    score_diff: number;
    selected_punishment_id?: string | null;
    closed_at: string;
  };
  winnerUser?: { id: string | number; name: string; gender?: string } | null;
  loserUser?: { id: string | number; name: string; gender?: string } | null;
  players?: Array<{ id: string | number; name: string; score: number; gender?: string }>;
  selectedPunishment?: Punishment | null;
  isClosed: boolean;
}

interface CycleResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number | string;
  isSuperAdmin?: boolean;
  onCycleUpdated?: () => void;
  onStartNewCycle?: () => void;
}

const SEGMENT_COLORS = [
  "#10b981",
  "#f97316",
  "#0284c7",
  "#8b5cf6",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#f43f5e",
];

export function CycleResultModal({
  isOpen,
  onClose,
  currentUserId,
  isSuperAdmin = false,
  onCycleUpdated,
  onStartNewCycle,
}: CycleResultModalProps) {
  const [data, setData] = useState<CycleResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [chosenPunishment, setChosenPunishment] = useState<Punishment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Punishment | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [itemLoading, setItemLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchCycleData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cycle?_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        if (json.selectedPunishment) {
          setChosenPunishment(json.selectedPunishment);
        }
      }
    } catch (e) {
      console.error("Failed to load cycle data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCycleData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isTie = (data?.result?.score_diff ?? 0) === 0;
  const isWinner = !isTie && Boolean(data?.winnerUser) && Number(data?.winnerUser?.id) === Number(currentUserId);
  const isLoser = !isTie && Boolean(data?.loserUser) && Number(data?.loserUser?.id) === Number(currentUserId);
  const canEdit = isWinner || isSuperAdmin;
  const isCycleClosed = Boolean(data?.isClosed || data?.cycle?.status === "closed" || (data as any)?.status === "closed");
  const punishments = data?.punishments || [];
  const numSegments = punishments.length || 5;
  const segmentAngle = 360 / numSegments;

  const openCreateForm = () => {
    setEditingItem(null);
    setFormName("");
    setFormDescription("");
    setShowItemForm(true);
    setDeleteConfirmId(null);
    setStatusMessage(null);
  };

  const openEditForm = (p: Punishment) => {
    setEditingItem(p);
    setFormName(p.name);
    setFormDescription(p.description || "");
    setShowItemForm(true);
    setDeleteConfirmId(null);
    setStatusMessage(null);
  };

  const handleSavePunishment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim() || !data) return;

    try {
      setItemLoading(true);
      const id = editingItem ? editingItem.id : `p_${Date.now()}`;
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_punishment",
          cycleId: data.cycle.id,
          userId: currentUserId,
          punishment: {
            id,
            name: formName.trim(),
            description: formDescription.trim(),
            active: true,
          },
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setData((prev) => (prev ? { ...prev, punishments: resJson.punishments } : prev));
        setShowItemForm(false);
        setEditingItem(null);
        setStatusMessage(resJson.message || "Punishment option saved successfully!");
        gameFeedback.playPop();
        gameFeedback.haptic(30);
      } else {
        alert(resJson.error || "Failed to save punishment");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save punishment");
    } finally {
      setItemLoading(false);
    }
  };

  const handleDeletePunishment = async (punishmentId: number) => {
    if (!data) return;
    if (punishments.length <= 2) {
      alert("At least 2 punishment options are required on the wheel!");
      return;
    }

    try {
      setItemLoading(true);
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_punishment",
          cycleId: data.cycle.id,
          userId: currentUserId,
          punishmentId,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setData((prev) => (prev ? { ...prev, punishments: resJson.punishments } : prev));
        if (chosenPunishment?.id === punishmentId) {
          setChosenPunishment(null);
        }
        setDeleteConfirmId(null);
        setStatusMessage(resJson.message || "Punishment option removed!");
        gameFeedback.playPop();
      } else {
        alert(resJson.error || "Failed to delete punishment");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete punishment");
    } finally {
      setItemLoading(false);
    }
  };

  const handleResetPunishments = async () => {
    if (!data) return;
    if (!confirm("Reset punishment list to default options?")) return;

    try {
      setItemLoading(true);
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_punishments",
          cycleId: data.cycle.id,
          userId: currentUserId,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setData((prev) => (prev ? { ...prev, punishments: resJson.punishments } : prev));
        setStatusMessage(resJson.message || "Punishment options restored to defaults!");
        gameFeedback.playPop();
      } else {
        alert(resJson.error || "Failed to reset punishments");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reset punishments");
    } finally {
      setItemLoading(false);
    }
  };

  const handleSpinWheel = async () => {
    if (isSpinning || punishments.length === 0 || !data) return;

    setIsSpinning(true);
    setStatusMessage(null);
    gameFeedback.playPop();
    gameFeedback.haptic(40);

    const targetIndex = Math.floor(Math.random() * punishments.length);
    const targetPunishment = punishments[targetIndex];

    const tickInterval = setInterval(() => {
      gameFeedback.playPop();
    }, 420);

    const extraSpins = 360 * 6;
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const finalRotation = wheelRotation + extraSpins + (targetAngle - (wheelRotation % 360));

    setWheelRotation(finalRotation);

    setTimeout(async () => {
      clearInterval(tickInterval);
      setIsSpinning(false);
      setChosenPunishment(targetPunishment);
      setStatusMessage(`The wheel landed on #${targetIndex + 1}: ${targetPunishment.name}!`);
      gameFeedback.playStreakFanfare();
      gameFeedback.haptic([50, 60, 150]);

      try {
        await fetch("/api/cycle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "spin",
            cycleId: data.cycle.id,
            punishmentId: targetPunishment.id,
          }),
        });
        if (onCycleUpdated) onCycleUpdated();
      } catch (err) {
        console.error("Failed to save spun punishment:", err);
      }
    }, 4200);
  };

  const handleToggleCloseCycle = async (shouldClose: boolean) => {
    if (!data) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: shouldClose ? "close" : "reopen",
          cycleId: data.cycle.id,
        }),
      });
      const resJson = await res.json();
      if (resJson.success) {
        setStatusMessage(resJson.message);
        setData((prev) =>
          prev
            ? {
                ...prev,
                isClosed: shouldClose,
                cycle: { ...prev.cycle, status: shouldClose ? "closed" : "active" },
              }
            : null
        );
        await fetchCycleData();
        if (onCycleUpdated) onCycleUpdated();
      }
    } catch (e: any) {
      alert(e.message || "Failed to update cycle status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="neo-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="neo-bottom-sheet"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(180deg, #16241D 0%, #0D1612 100%)",
          borderRadius: "32px",
          padding: "30px 20px 24px",
          maxWidth: "420px",
          width: "100%",
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.12)",
          border: "1.5px solid var(--border-specular)",
          position: "relative",
          color: "#FFFFFF",
        }}
      >
        <div className="sheet-handle" />

        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            fontSize: "13px",
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

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="animate-spin" style={{ display: "inline-flex" }}>
              <WheelIcon size={36} color="#10B981" />
            </div>
            <p style={{ marginTop: "12px", fontWeight: "800", color: "var(--text-secondary)", fontSize: "14px" }}>
              Loading cycle & punishment data...
            </p>
          </div>
        ) : !data ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <p style={{ color: "var(--text-secondary)" }}>Cycle data not found.</p>
          </div>
        ) : (
          <div>
            {(() => {
              const isTie = (data.result.score_diff ?? 0) === 0;
              const p1 = data.players?.[0];
              const p2 = data.players?.[1];
              const p1Character = (p1?.gender ? p1.gender === "female" : Number(p1?.id) === 3) ? "female" : "male";
              const p2Character = (p2?.gender ? p2.gender === "female" : Number(p2?.id) === 3) ? "female" : "male";

              const winnerCharacter = (data.winnerUser?.gender ? data.winnerUser.gender === "female" : Number(data.winnerUser?.id) === 3) ? "female" : "male";
              const loserCharacter = (data.loserUser?.gender ? data.loserUser.gender === "female" : Number(data.loserUser?.id) === 3) ? "female" : "male";
              const activeMascotCharacter = "together";

              return (
                <>
                  <div style={{ textAlign: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginTop: "14px", marginBottom: "8px" }} className="animate-float">
                      <Mascot
                        character={activeMascotCharacter}
                        mood={isTie ? "champion" : isWinner ? "celebrating" : "crying"}
                        size={140}
                        showCrown={isWinner && !isTie}
                        animation={isTie ? "celebrate" : isWinner ? "celebrate" : "bounce"}
                        particles={isWinner || isTie ? "confetti" : "none"}
                        interactive={true}
                        speechText={
                          isTie
                            ? "It's a Tie! Joint Champions!"
                            : isWinner
                            ? "I'm the Cycle Champion!"
                            : "Let's spin the punishment wheel!"
                        }
                      />
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 14px",
                        borderRadius: "16px",
                        backgroundColor: isCycleClosed ? "rgba(255, 87, 51, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: isCycleClosed ? "#FF7A59" : "#34D399",
                        border: `1px solid ${isCycleClosed ? "rgba(255, 87, 51, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
                        fontSize: "10px",
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      {isCycleClosed ? (
                        <>
                          <LockIcon size={12} />
                          <span>CYCLE CLOSED</span>
                        </>
                      ) : (
                        <>
                          <FlameIcon size={12} />
                          <span>CYCLE IN PROGRESS</span>
                        </>
                      )}
                    </span>

                    <h2 style={{ fontSize: "20px", fontWeight: "900", color: "#FFFFFF", marginTop: "10px", letterSpacing: "-0.4px" }}>
                      {isTie
                        ? "IT'S A TIE! JOINT CHAMPIONS"
                        : isWinner
                        ? "YOU ARE LEADING THE CYCLE!"
                        : isLoser
                        ? "YOU ARE FALLING BEHIND!"
                        : "CYCLE SCORE RESULTS"}
                    </h2>

                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", marginTop: "3px" }}>
                      {data.cycle.name} • {formatCycleDateRange(data.cycle.start_date, data.cycle.end_date)}
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(10, 16, 12, 0.8)",
                      borderRadius: "22px",
                      padding: "14px 16px",
                      border: "1px solid var(--border-glass)",
                      boxShadow: "0 6px 18px rgba(0, 0, 0, 0.4)",
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "18px",
                      boxSizing: "border-box",
                    }}
                  >
                    {isTie ? (
                      <>
                        <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.1)", padding: "12px 10px", borderRadius: "18px", border: "1px solid rgba(16, 185, 129, 0.25)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, boxSizing: "border-box" }}>
                          <Mascot character={p1Character} variant="avatar" size={38} style={{ marginBottom: "4px" }} />
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#34D399", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p1?.name || "Player A"}
                          </div>
                          <div className="num-font" style={{ fontSize: "26px", fontWeight: "900", color: "#FFFFFF", lineHeight: 1.1 }}>
                            {p1?.score ?? data.result.winner_score}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PTS</span>
                        </div>

                        <div style={{ fontSize: "11px", fontWeight: "900", color: "#FCD34D", textAlign: "center", letterSpacing: "1px", padding: "0 4px", flexShrink: 0 }}>
                          TIED
                        </div>

                        <div style={{ textAlign: "center", background: "rgba(245, 158, 11, 0.1)", padding: "12px 10px", borderRadius: "18px", border: "1px solid rgba(245, 158, 11, 0.25)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, boxSizing: "border-box" }}>
                          <Mascot character={p2Character} variant="avatar" size={38} style={{ marginBottom: "4px" }} />
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "#FCD34D", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {p2?.name || "Player B"}
                          </div>
                          <div className="num-font" style={{ fontSize: "26px", fontWeight: "900", color: "#FFFFFF", lineHeight: 1.1 }}>
                            {p2?.score ?? data.result.loser_score}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PTS</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.12)", padding: "12px 10px", borderRadius: "18px", border: "1px solid rgba(16, 185, 129, 0.35)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, boxSizing: "border-box" }}>
                          <Mascot character={winnerCharacter} variant="avatar" size={38} showCrown={true} style={{ marginBottom: "4px" }} />
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--emerald-glow)", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {data.winnerUser?.name || "Leader"}
                          </div>
                          <div className="num-font" style={{ fontSize: "26px", fontWeight: "900", color: "#FFFFFF", lineHeight: 1.1 }}>
                            {data.result.winner_score}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PTS</span>
                        </div>

                        <div style={{ fontSize: "11px", fontWeight: "900", color: "var(--text-muted)", textAlign: "center", letterSpacing: "1px", padding: "0 4px", flexShrink: 0 }}>
                          VS
                        </div>

                        <div style={{ textAlign: "center", background: "rgba(255, 87, 51, 0.12)", padding: "12px 10px", borderRadius: "18px", border: "1px solid rgba(255, 87, 51, 0.35)", display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0, boxSizing: "border-box" }}>
                          <Mascot character={loserCharacter} variant="avatar" size={38} style={{ marginBottom: "4px" }} />
                          <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--coral-glow)", width: "100%", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {data.loserUser?.name || "Chaser"}
                          </div>
                          <div className="num-font" style={{ fontSize: "26px", fontWeight: "900", color: "#FF7A59", lineHeight: 1.1 }}>
                            {data.result.loser_score}
                          </div>
                          <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "0.5px" }}>PTS</span>
                        </div>
                      </>
                    )}
                  </div>
                </>
              );
            })()}

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>
                Difference: <span style={{ color: "var(--coral-glow)", fontWeight: "900" }}>{data.result.score_diff} Points</span>
              </div>
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                The loser at the end of the cycle must face one of the punishments!
              </p>
            </div>

            <div
              style={{
                background: "linear-gradient(180deg, #18221B 0%, #101813 100%)",
                borderRadius: "24px",
                padding: "18px 16px",
                border: "1.5px solid rgba(245, 158, 11, 0.35)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                textAlign: "center",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px" }}>
                <WheelIcon size={18} color="#FCD34D" />
                <h3 style={{ fontSize: "15px", fontWeight: "900", color: "#FCD34D" }}>
                  Interactive Punishment Wheel
                </h3>
              </div>

              <div style={{ position: "relative", width: "220px", height: "220px", margin: "0 auto 16px auto" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "12px solid transparent",
                    borderRight: "12px solid transparent",
                    borderTop: "18px solid #EF4444",
                    zIndex: 20,
                    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))",
                  }}
                />

                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: "5px solid #F59E0B",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 14px rgba(0,0,0,0.4)",
                    position: "relative",
                    overflow: "hidden",
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning
                      ? "transform 4s cubic-bezier(0.12, 0.85, 0.22, 1)"
                      : "none",
                    backgroundColor: "#0A100D",
                  }}
                >
                  <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%", display: "block" }}>
                    {punishments.map((p, idx) => {
                      const startAngle = idx * segmentAngle;
                      const endAngle = (idx + 1) * segmentAngle;
                      const startRad = ((startAngle - 90) * Math.PI) / 180;
                      const endRad = ((endAngle - 90) * Math.PI) / 180;

                      const x1 = 100 + 100 * Math.cos(startRad);
                      const y1 = 100 + 100 * Math.sin(startRad);
                      const x2 = 100 + 100 * Math.cos(endRad);
                      const y2 = 100 + 100 * Math.sin(endRad);

                      const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
                      const midAngle = (startAngle + endAngle) / 2;
                      const iconX = 100 + 64 * Math.cos(midRad);
                      const iconY = 100 + 64 * Math.sin(midRad);

                      const pathData = `M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`;
                      const color = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];

                      return (
                        <g key={p.id}>
                          <path d={pathData} fill={color} stroke="#0B120E" strokeWidth="2.5" />
                          <g transform={`rotate(${midAngle - 90}, 100, 100)`}>
                            <text
                              x="126"
                              y="102.5"
                              fill="#FFFFFF"
                              fontSize="7"
                              fontWeight="800"
                              letterSpacing="0.2px"
                              opacity="0.95"
                              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                            >
                              {p.name.length > 11 ? p.name.slice(0, 10) + "…" : p.name}
                            </text>
                          </g>
                          <g transform={`translate(${iconX}, ${iconY})`}>
                            <circle
                              cx="0"
                              cy="0"
                              r="13"
                              fill="rgba(10, 16, 13, 0.85)"
                              stroke="#FFFFFF"
                              strokeWidth="1.6"
                            />
                            <text
                              x="0"
                              y="4.5"
                              textAnchor="middle"
                              fill="#FCD34D"
                              fontSize="12"
                              fontWeight="900"
                              className="num-font"
                            >
                              {idx + 1}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    <circle cx="100" cy="100" r="22" fill="#141E18" stroke="#F59E0B" strokeWidth="3" />
                    <g transform="translate(91, 91)">
                      <TargetIcon size={18} color="#FCD34D" />
                    </g>
                  </svg>
                </div>
              </div>

              {chosenPunishment && (() => {
                const chosenIdx = punishments.findIndex((p) => p.id === chosenPunishment.id);
                const chosenNumber = chosenIdx >= 0 ? chosenIdx + 1 : null;
                const chosenColor = chosenIdx >= 0 ? SEGMENT_COLORS[chosenIdx % SEGMENT_COLORS.length] : "#F59E0B";

                return (
                  <div
                    className="animate-pop"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.15)",
                      borderRadius: "18px",
                      padding: "12px 16px",
                      border: "1.5px solid rgba(245, 158, 11, 0.5)",
                      boxShadow: "0 4px 16px rgba(245, 158, 11, 0.2)",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: "900", color: "#FCD34D", textTransform: "uppercase", letterSpacing: "1px" }}>
                      <TargetIcon size={13} color="#FCD34D" />
                      <span>CHOSEN PUNISHMENT</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "15px", fontWeight: "900", color: "#FFFFFF", marginTop: "4px" }}>
                      {chosenNumber !== null && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "28px",
                            height: "28px",
                            borderRadius: "8px",
                            backgroundColor: `${chosenColor}33`,
                            border: `1.5px solid ${chosenColor}`,
                            color: chosenColor,
                            fontSize: "13px",
                            fontWeight: "900",
                            flexShrink: 0,
                          }}
                        >
                          #{chosenNumber}
                        </span>
                      )}
                      <span>{chosenPunishment.name}</span>
                    </div>
                    {chosenPunishment.description && (
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {chosenPunishment.description}
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                type="button"
                className="neo-btn neo-btn-coral"
                style={{
                  width: "100%",
                  fontSize: "14px",
                  padding: "14px",
                  borderRadius: "18px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                disabled={isSpinning || punishments.length === 0}
                onClick={handleSpinWheel}
              >
                {isSpinning ? (
                  <>
                    <WheelIcon size={18} className="animate-spin" />
                    <span>Wheel is Spinning...</span>
                  </>
                ) : (
                  <>
                    <DiceIcon size={18} />
                    <span>SPIN THE PUNISHMENT WHEEL</span>
                  </>
                )}
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              {canEdit ? (
                <div
                  style={{
                    background: isTie
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, rgba(16, 185, 129, 0.14) 100%)"
                      : "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(245, 158, 11, 0.14) 100%)",
                    border: isTie
                      ? "1.5px solid rgba(245, 158, 11, 0.45)"
                      : "1.5px solid rgba(16, 185, 129, 0.45)",
                    borderRadius: "20px",
                    padding: "12px 14px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CrownIcon size={18} color={isTie ? "#FCD34D" : "#10B981"} />
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "900", color: "#FCD34D" }}>
                          {isWinner
                            ? "Cycle Winner's Privilege"
                            : isTie
                            ? "Admin Override (Tied Cycle)"
                            : "Punishment Admin Control"}
                        </div>
                        <div style={{ fontSize: "10px", color: "rgba(255, 255, 255, 0.8)", fontWeight: "600" }}>
                          {isWinner
                            ? "You have full freedom to add & edit punishment options on the wheel!"
                            : isTie
                            ? "Cycle is tied. As Super Admin, you can configure punishment options."
                            : "Punishment options control."}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={openCreateForm}
                        disabled={itemLoading}
                        className="neo-btn neo-btn-emerald"
                        style={{
                          fontSize: "11px",
                          padding: "6px 12px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: "800",
                        }}
                      >
                        <PlusIcon size={14} />
                        <span>Add</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetPunishments}
                        disabled={itemLoading}
                        title="Reset to default options"
                        className="neo-btn neo-btn-glass"
                        style={{
                          fontSize: "10px",
                          padding: "6px 10px",
                          borderRadius: "12px",
                          fontWeight: "700",
                          color: "rgba(255, 255, 255, 0.7)",
                        }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: isTie
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(255, 255, 255, 0.04) 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                    border: isTie
                      ? "1px dashed rgba(245, 158, 11, 0.35)"
                      : "1px dashed rgba(255, 255, 255, 0.16)",
                    borderRadius: "16px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <LockIcon size={16} color={isTie ? "#FCD34D" : "var(--text-muted)"} />
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    <strong style={{ color: isTie ? "#FCD34D" : "#FFFFFF" }}>
                      {isTie ? "Tied Score — Wheel Locked:" : "Punishment Options Locked:"}
                    </strong>{" "}
                    {isTie
                      ? "The score is currently tied! Wheel editing is locked until a player takes the lead and wins the cycle."
                      : `Only the cycle winner (${data.winnerUser?.name || "Winner"}) can modify punishment options on this wheel.`}
                  </div>
                </div>
              )}

              {showItemForm && (
                <form
                  onSubmit={handleSavePunishment}
                  className="animate-pop"
                  style={{
                    background: "linear-gradient(180deg, #1A2820 0%, #121C16 100%)",
                    border: "1.5px solid rgba(16, 185, 129, 0.5)",
                    borderRadius: "20px",
                    padding: "16px",
                    marginBottom: "16px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "900", color: "var(--emerald-glow)" }}>
                      {editingItem ? <EditIcon size={15} /> : <PlusIcon size={15} />}
                      <span>{editingItem ? "Edit Punishment" : "Add New Punishment"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                    >
                      <XIcon size={16} />
                    </button>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Punishment Name <span style={{ color: "var(--coral-glow)" }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Buy Coffee for 3 Days, Wash Dishes..."
                      maxLength={40}
                      autoFocus
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: "700",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Rules / Details
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Max budget $20, complete during weekend"
                      maxLength={80}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        backgroundColor: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        borderRadius: "12px",
                        color: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: "600",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="neo-btn neo-btn-glass"
                      style={{ fontSize: "12px", padding: "8px 14px", borderRadius: "12px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!formName.trim() || itemLoading}
                      className="neo-btn neo-btn-emerald"
                      style={{ fontSize: "12px", padding: "8px 18px", borderRadius: "12px", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      {itemLoading ? <SpinnerIcon size={14} color="#FFFFFF" /> : <CheckIcon size={14} />}
                      <span>{itemLoading ? "Saving..." : "Save Punishment"}</span>
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF" }}>
                  Options on the Wheel ({punishments.length}):
                </div>
                {canEdit && (
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "600" }}>
                    At least 2 options
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {punishments.map((p, idx) => {
                  const itemColor = SEGMENT_COLORS[idx % SEGMENT_COLORS.length];
                  return (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "16px",
                        backgroundColor: chosenPunishment?.id === p.id ? "rgba(245, 158, 11, 0.14)" : "rgba(255, 255, 255, 0.04)",
                        border: chosenPunishment?.id === p.id ? "1.5px solid #F59E0B" : "1px solid var(--border-subtle)",
                        fontSize: "12px",
                        gap: "10px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "30px",
                            height: "30px",
                            borderRadius: "10px",
                            backgroundColor: `${itemColor}26`,
                            border: `1.5px solid ${itemColor}`,
                            color: itemColor,
                            fontSize: "13px",
                            fontWeight: "900",
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </span>
                      <div style={{ minWidth: 0, overflow: "hidden" }}>
                        <div style={{ fontWeight: "800", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.description || "No details provided"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      {chosenPunishment?.id === p.id && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: "900", color: "#FCD34D", padding: "3px 8px", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.2)" }}>
                          <CheckIcon size={11} />
                          <span>CHOSEN</span>
                        </span>
                      )}

                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditForm(p)}
                            disabled={itemLoading}
                            title="Edit this punishment"
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "8px",
                              backgroundColor: "rgba(255, 255, 255, 0.06)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "rgba(255, 255, 255, 0.8)",
                              cursor: "pointer",
                            }}
                          >
                            <EditIcon size={13} />
                          </button>

                          {deleteConfirmId === p.id ? (
                            <button
                              type="button"
                              onClick={() => handleDeletePunishment(p.id)}
                              disabled={itemLoading}
                              title="Confirm delete"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                                border: "1px solid rgba(239, 68, 68, 0.5)",
                                color: "#F87171",
                                cursor: "pointer",
                                fontSize: "10px",
                                fontWeight: "800",
                              }}
                            >
                              Delete?
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(p.id)}
                              disabled={itemLoading || punishments.length <= 2}
                              title={punishments.length <= 2 ? "At least 2 punishment options required" : "Delete this punishment"}
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "8px",
                                backgroundColor: "rgba(255, 255, 255, 0.06)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: punishments.length <= 2 ? "rgba(255, 255, 255, 0.2)" : "#F87171",
                                cursor: punishments.length <= 2 ? "not-allowed" : "pointer",
                              }}
                            >
                              <TrashIcon size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {isSuperAdmin && (
              <div
                style={{
                  background: "rgba(10, 16, 12, 0.8)",
                  borderRadius: "20px",
                  padding: "16px",
                  border: "1px solid var(--border-glass)",
                  marginTop: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "900", color: "#FFFFFF", marginBottom: "6px" }}>
                  <ShieldIcon size={14} color="#10B981" />
                  <span>Super Admin Controls (Cycle Status)</span>
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4, marginBottom: "12px" }}>
                  {isCycleClosed
                    ? "This cycle is currently closed and scores are frozen. You can reopen it or launch the next month's cycle."
                    : "Closing the cycle will freeze the final scores and lock the winner."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {isCycleClosed ? (
                    <>
                      <button
                        type="button"
                        className="neo-btn neo-btn-glass"
                        style={{ width: "100%", fontSize: "12px", padding: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        disabled={actionLoading}
                        onClick={() => handleToggleCloseCycle(false)}
                      >
                        {actionLoading ? <SpinnerIcon size={14} color="#FFFFFF" /> : <UnlockIcon size={14} />}
                        <span>{actionLoading ? "Reopening Cycle..." : "Reopen This Cycle"}</span>
                      </button>

                      {onStartNewCycle && (
                        <button
                          type="button"
                          className="neo-btn neo-btn-emerald"
                          style={{ width: "100%", fontSize: "12px", padding: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                          onClick={onStartNewCycle}
                        >
                          <PlusIcon size={14} color="#FFFFFF" />
                          <span>Start Next Cycle (New Month)</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="neo-btn neo-btn-coral"
                        style={{ width: "100%", fontSize: "12px", padding: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                        disabled={actionLoading}
                        onClick={() => handleToggleCloseCycle(true)}
                      >
                        {actionLoading ? <SpinnerIcon size={14} color="#FFFFFF" /> : <LockIcon size={14} />}
                        <span>{actionLoading ? "Closing Cycle..." : "Close Cycle & Freeze Scores"}</span>
                      </button>

                      {onStartNewCycle && (
                        <button
                          type="button"
                          className="neo-btn neo-btn-glass"
                          style={{ width: "100%", fontSize: "12px", padding: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                          onClick={onStartNewCycle}
                        >
                          <PlusIcon size={14} color="#FFFFFF" />
                          <span>Start New Cycle</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {statusMessage && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "var(--emerald-glow)",
                  fontSize: "12px",
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {statusMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
