"use client";

import React, { useState, useEffect } from "react";
import type { Task, TaskFrequency } from "@/types/domain";
import {
  TargetIcon,
  SparkleIcon,
  ClockIcon,
  XIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SpinnerIcon,
} from "@/components/Icons";
import { SearchableSelect } from "@/components/SearchableSelect";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  currentUserId: number;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: number) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  currentUserId,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<TaskFrequency>("daily");
  const [targetDays, setTargetDays] = useState<number>(7);
  const [baseScore, setBaseScore] = useState<number>(10);
  const [active, setActive] = useState<boolean>(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description || "");
      const freq = task.frequency || "daily";
      setFrequency(freq);
      if (freq === "cycle") {
        setTargetDays(1);
        setBaseScore(task.base_score || 50);
      } else if (freq === "daily") {
        setTargetDays(7);
        setBaseScore(task.base_score || 10);
      } else if (freq === "weekly_2x") {
        setTargetDays(2);
        setBaseScore(task.base_score || 15);
      } else {
        setTargetDays(Math.max(1, Math.min(7, task.target_days_per_week || 3)));
        setBaseScore(task.base_score || 15);
      }
      setActive(task.active !== false);
      setShowDeleteConfirm(false);
      setErrorMessage(null);
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleFrequencyChange = (newFreq: TaskFrequency) => {
    setFrequency(newFreq);
    if (newFreq === "cycle") {
      setTargetDays(1);
      if (baseScore === 10 || baseScore === 15) setBaseScore(50);
    } else if (newFreq === "daily") {
      setTargetDays(7);
      if (baseScore === 15 || baseScore === 50) setBaseScore(10);
    } else if (newFreq === "weekly_2x") {
      setTargetDays(2);
      if (baseScore === 10 || baseScore === 50) setBaseScore(15);
    } else if (newFreq === "weekly_custom") {
      setTargetDays((prev) => (prev === 7 || prev === 2 || prev === 1 ? 3 : Math.max(1, Math.min(7, prev))));
      if (baseScore === 10 || baseScore === 50) setBaseScore(15);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Goal name cannot be empty.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const finalTargetDays =
        frequency === "cycle"
          ? 1
          : frequency === "daily"
          ? 7
          : frequency === "weekly_2x"
          ? 2
          : Math.max(1, Math.min(7, Number(targetDays) || 3));

      const updates = {
        name: name.trim(),
        description: description.trim(),
        frequency,
        target_days_per_week: finalTargetDays,
        base_score: baseScore,
        active,
      };

      if (task) {
        const res = await fetch("/api/admin/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            taskId: task.id,
            updates,
          }),
        });

        const resJson = await res.json().catch(() => null);
        if (!res.ok || !resJson?.success) {
          throw new Error(resJson?.error || "Failed to update goal.");
        }

        onTaskUpdated(resJson.task || { ...task, ...updates });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update goal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setErrorMessage(null);

      const res = await fetch(`/api/admin/tasks?userId=${currentUserId}&taskId=${task.id}`, {
        method: "DELETE",
      });

      const resJson = await res.json().catch(() => null);
      if (!res.ok || !resJson?.success) {
        throw new Error(resJson?.error || "Failed to delete goal.");
      }

      onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete goal.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20000,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="neo-card tab-content-enter"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-modal-title"
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#161D15",
          border: "1.5px solid rgba(139, 92, 246, 0.4)",
          borderRadius: "24px",
          padding: "20px 16px",
          position: "relative",
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "16px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: "#A78BFA", letterSpacing: "1px", textTransform: "uppercase" }}>
              ADMIN GOAL SETTINGS
            </span>
            <h2 id="edit-task-modal-title" style={{ fontSize: "17px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Edit Shared Goal #{task.id}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              borderRadius: "50%",
              minWidth: "44px",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Close dialog"
          >
            <XIcon size={16} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "rgba(255, 87, 51, 0.15)",
              border: "1px solid rgba(255, 87, 51, 0.35)",
              borderRadius: "12px",
              padding: "10px 12px",
              marginBottom: "14px",
              color: "#FF7A59",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertTriangleIcon size={15} color="#FF7A59" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
              <TargetIcon size={13} color="var(--emerald-primary)" />
              <span>GOAL NAME:</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Workout (30 Mins)"
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "12px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
              }}
            />
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
              <span>DESCRIPTION:</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes or instructions"
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "12px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "900", color: "var(--sky-primary)", marginBottom: "5px" }}>
                <ClockIcon size={13} color="var(--sky-primary)" />
                <span>FREQUENCY:</span>
              </label>
              <SearchableSelect
                value={frequency}
                onChange={(val) => handleFrequencyChange(val as TaskFrequency)}
                options={[
                  { value: "daily", label: "Every Day (Daily)", sublabel: "7 days / week" },
                  { value: "weekly_2x", label: "2x Weekly", sublabel: "2 days / week" },
                  { value: "weekly_custom", label: "Custom Weekly Target", sublabel: "1 - 7 days" },
                  { value: "cycle", label: "Cycle Quest (Monthly)", sublabel: "1x per cycle • Highest Reward" },
                ]}
                searchPlaceholder="Search frequency..."
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "900", color: "#A78BFA", marginBottom: "5px" }}>
                <span>TARGET DAYS:</span>
              </label>
              <input
                type="number"
                min="1"
                max="7"
                disabled={frequency === "daily" || frequency === "weekly_2x" || frequency === "cycle"}
                value={frequency === "daily" ? 7 : frequency === "weekly_2x" ? 2 : frequency === "cycle" ? 1 : targetDays}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setTargetDays(isNaN(val) ? 1 : Math.max(1, Math.min(7, val)));
                }}
                style={{
                  width: "100%",
                  background: (frequency === "daily" || frequency === "weekly_2x" || frequency === "cycle") ? "rgba(255, 255, 255, 0.04)" : "var(--bg-surface-input)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                  color: (frequency === "daily" || frequency === "weekly_2x" || frequency === "cycle") ? "var(--text-muted)" : "#FFFFFF",
                  fontSize: "13px",
                  fontWeight: "800",
                  opacity: (frequency === "daily" || frequency === "weekly_2x") ? 0.7 : 1,
                  cursor: (frequency === "daily" || frequency === "weekly_2x") ? "not-allowed" : "text",
                }}
              />
              <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "600" }}>
                {frequency === "daily"
                  ? "Fixed: 7 days/week (Daily)"
                  : frequency === "weekly_2x"
                  ? "Fixed: 2 days/week"
                  : frequency === "cycle"
                  ? "Fixed: 1x / Cycle (Milestone)"
                  : "Custom Target: 1 to 7 days/week (Max 7)"}
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", fontWeight: "900", color: "var(--emerald-glow)", marginBottom: "5px" }}>
              <SparkleIcon size={13} color="var(--emerald-glow)" />
              <span>REWARD POINTS:</span>
            </label>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                type="number"
                min="1"
                max="100"
                value={baseScore}
                onChange={(e) => setBaseScore(Number(e.target.value))}
                style={{
                  width: "100%",
                  background: "var(--bg-surface-input)",
                  border: "1px solid var(--border-emerald)",
                  borderRadius: "14px",
                  padding: "12px 55px 12px 14px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: "800",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "var(--emerald-surface)",
                  color: "var(--emerald-glow)",
                  border: "1px solid var(--border-emerald)",
                  borderRadius: "8px",
                  padding: "3px 6px",
                  fontSize: "9px",
                  fontWeight: "900",
                  pointerEvents: "none",
                }}
              >
                PTS
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-surface-input)",
              border: "1px solid var(--border-glass)",
              borderRadius: "14px",
              padding: "12px 14px",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF" }}>
                Active for Players
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Inactive goals are hidden from players but preserved in history
              </div>
            </div>
            <label style={{ position: "relative", display: "inline-block", width: "42px", height: "24px" }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: "absolute",
                  cursor: "pointer",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: active ? "var(--emerald-primary)" : "rgba(255, 255, 255, 0.15)",
                  borderRadius: "24px",
                  transition: "0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    height: "18px",
                    width: "18px",
                    left: active ? "20px" : "3px",
                    bottom: "3px",
                    background: "#FFFFFF",
                    borderRadius: "50%",
                    transition: "0.2s",
                  }}
                />
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="neo-btn neo-btn-emerald"
              style={{ flex: 1, padding: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {isSaving ? <SpinnerIcon size={16} color="#FFFFFF" /> : <CheckCircleIcon size={16} />}
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="neo-btn"
                style={{
                  background: "rgba(255, 87, 51, 0.12)",
                  border: "1px solid rgba(255, 87, 51, 0.35)",
                  color: "#FF7A59",
                  padding: "12px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <TrashIcon size={15} />
                <span>Delete</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="neo-btn neo-btn-coral"
                style={{
                  padding: "12px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {isDeleting ? <SpinnerIcon size={15} color="#FFFFFF" /> : <TrashIcon size={15} />}
                <span>{isDeleting ? "Deleting..." : "Confirm Delete"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
