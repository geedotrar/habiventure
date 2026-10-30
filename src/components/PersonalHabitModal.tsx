"use client";

import React, { useState, useEffect } from "react";
import {
  SproutIcon,
  XIcon,
  CalendarIcon,
  TargetIcon,
  CheckIcon,
  TrashIcon,
  SparkleIcon,
  SpinnerIcon,
} from "@/components/Icons";
import type { Task, TaskFrequency } from "@/types/domain";

interface PersonalHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  initialTask?: Task | null;
  onSaved: (task: Task) => void;
  onDeleted?: (taskId: number) => void;
}

export function PersonalHabitModal({
  isOpen,
  onClose,
  currentUserId,
  initialTask,
  onSaved,
  onDeleted,
}: PersonalHabitModalProps) {
  const isEditing = Boolean(initialTask && initialTask.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequencyCategory, setFrequencyCategory] = useState<"everyday" | "weekly" | "cycle">("everyday");
  const [targetDays, setTargetDays] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialTask) {
      setName(initialTask.name || "");
      setDescription(initialTask.description === "Personal habit" ? "" : (initialTask.description || ""));
      if (initialTask.frequency === "cycle") {
        setFrequencyCategory("cycle");
        setTargetDays(1);
      } else {
        const isEveryday =
          initialTask.frequency === "daily" ||
          (!initialTask.frequency && (initialTask.target_days_per_week === 7 || !initialTask.target_days_per_week));
        setFrequencyCategory(isEveryday ? "everyday" : "weekly");
        setTargetDays(initialTask.target_days_per_week && initialTask.target_days_per_week < 7 ? initialTask.target_days_per_week : 2);
      }
      setShowDeleteConfirm(false);
      setErrorMessage(null);
    } else {
      setName("");
      setDescription("");
      setFrequencyCategory("everyday");
      setTargetDays(2);
      setShowDeleteConfirm(false);
      setErrorMessage(null);
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Habit name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const freq: TaskFrequency =
        frequencyCategory === "cycle"
          ? "cycle"
          : frequencyCategory === "everyday"
          ? "daily"
          : targetDays === 2
          ? "weekly_2x"
          : "weekly_custom";

      const finalTargetDays = frequencyCategory === "cycle" ? 1 : frequencyCategory === "everyday" ? 7 : targetDays;

      if (isEditing && initialTask) {
        const res = await fetch("/api/tasks/personal", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            taskId: initialTask.id,
            updates: {
              name: name.trim(),
              description: description.trim(),
              frequency: freq,
              target_days_per_week: finalTargetDays,
            },
          }),
        });

        const resJson = await res.json().catch(() => null);
        if (!res.ok || !resJson?.success) {
          throw new Error(resJson?.error || "Failed to update personal habit.");
        }

        onSaved(
          resJson.task || {
            ...initialTask,
            name: name.trim(),
            description: description.trim(),
            frequency: freq,
            target_days_per_week: finalTargetDays,
          }
        );
        onClose();
      } else {
        const res = await fetch("/api/tasks/personal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            task: {
              name: name.trim(),
              description: description.trim(),
              frequency: freq,
              target_days_per_week: finalTargetDays,
            },
          }),
        });

        const resJson = await res.json().catch(() => null);
        if (!res.ok || !resJson?.success) {
          throw new Error(resJson?.error || "Failed to create personal habit.");
        }

        onSaved(resJson.task);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save habit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialTask) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/tasks/personal", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUserId,
          taskId: initialTask.id,
        }),
      });

      const resJson = await res.json().catch(() => null);
      if (!res.ok || !resJson?.success) {
        throw new Error(resJson?.error || "Failed to delete personal habit.");
      }

      if (onDeleted) onDeleted(initialTask.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete habit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="neo-modal-backdrop" onClick={onClose}>
      <div
        className="neo-bottom-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-habit-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: "90dvh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div className="sheet-handle" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "rgba(56, 189, 248, 0.15)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <SproutIcon size={18} color="var(--sky-primary)" />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 id="personal-habit-modal-title" style={{ fontSize: "15px", fontWeight: "900", color: "#FFFFFF", margin: 0 }}>
                {isEditing ? "Edit Personal Habit" : "Add Personal Habit"}
              </h3>
              <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "2px 0 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Independent goal for your personal self-improvement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              minWidth: "44px",
              minHeight: "44px",
              padding: 0,
            }}
            aria-label="Close dialog"
          >
            <XIcon size={18} />
          </button>
        </div>

        {errorMessage && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "10px 14px",
              color: "#FCA5A5",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "14px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Habit Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Read 15 Mins, Morning Run, Meditate"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "12px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "700",
                boxSizing: "border-box",
              }}
              autoFocus
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Notes / Motivation (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Every morning before 8 AM"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-surface-input)",
                border: "1px solid var(--border-glass)",
                borderRadius: "14px",
                padding: "12px 14px",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "600",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "800",
                color: "var(--text-secondary)",
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Frequency Type *
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => setFrequencyCategory("everyday")}
                style={{
                  padding: "12px 8px",
                  borderRadius: "14px",
                  border:
                    frequencyCategory === "everyday"
                      ? "1.5px solid var(--emerald-primary)"
                      : "1px solid var(--border-glass)",
                  background:
                    frequencyCategory === "everyday"
                      ? "rgba(16, 185, 129, 0.14)"
                      : "var(--bg-surface-input)",
                  color: frequencyCategory === "everyday" ? "#FFFFFF" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <TargetIcon
                    size={15}
                    color={frequencyCategory === "everyday" ? "var(--emerald-primary)" : "var(--text-muted)"}
                  />
                  <span style={{ fontSize: "11px", fontWeight: "800" }}>Everyday</span>
                </div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                  Daily (7x/wk)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFrequencyCategory("weekly")}
                style={{
                  padding: "12px 8px",
                  borderRadius: "14px",
                  border:
                    frequencyCategory === "weekly"
                      ? "1.5px solid #8B5CF6"
                      : "1px solid var(--border-glass)",
                  background:
                    frequencyCategory === "weekly"
                      ? "rgba(139, 92, 246, 0.16)"
                      : "var(--bg-surface-input)",
                  color: frequencyCategory === "weekly" ? "#FFFFFF" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <CalendarIcon
                    size={15}
                    color={frequencyCategory === "weekly" ? "#A78BFA" : "var(--text-muted)"}
                  />
                  <span style={{ fontSize: "11px", fontWeight: "800" }}>Weekly</span>
                </div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                  Custom (2-6x/wk)
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFrequencyCategory("cycle");
                  setTargetDays(1);
                }}
                style={{
                  padding: "12px 8px",
                  borderRadius: "14px",
                  border:
                    frequencyCategory === "cycle"
                      ? "1.5px solid #F59E0B"
                      : "1px solid var(--border-glass)",
                  background:
                    frequencyCategory === "cycle"
                      ? "rgba(245, 158, 11, 0.16)"
                      : "var(--bg-surface-input)",
                  color: frequencyCategory === "cycle" ? "#FFFFFF" : "var(--text-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <SparkleIcon
                    size={15}
                    color={frequencyCategory === "cycle" ? "#FBBF24" : "var(--text-muted)"}
                  />
                  <span style={{ fontSize: "11px", fontWeight: "800" }}>Cycle Quest</span>
                </div>
                <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>
                  1x per cycle
                </span>
              </button>
            </div>
          </div>

          {frequencyCategory === "weekly" && (
            <div
              style={{
                background: "rgba(139, 92, 246, 0.08)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                borderRadius: "14px",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#DDD6FE" }}>
                  Weekly Target Days:
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "900",
                    color: "#A78BFA",
                    background: "rgba(139, 92, 246, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "8px",
                  }}
                >
                  {targetDays}x per week
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
                {[1, 2, 3, 4, 5, 6, 7].map((days) => {
                  const isSelected = targetDays === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTargetDays(days)}
                      style={{
                        padding: "8px 0",
                        borderRadius: "10px",
                        border: isSelected ? "1.5px solid #A78BFA" : "1px solid var(--border-glass)",
                        background: isSelected ? "rgba(139, 92, 246, 0.3)" : "var(--bg-surface-input)",
                        color: isSelected ? "#FFFFFF" : "var(--text-secondary)",
                        fontSize: "12px",
                        fontWeight: isSelected ? "900" : "700",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {days}x
                    </button>
                  );
                })}
              </div>

              <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", lineHeight: "1.4", display: "flex", alignItems: "flex-start", gap: "6px" }}>
                <SparkleIcon size={12} color="#F59E0B" style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>Complete at least <strong>{targetDays} days</strong> in a week (Monday - Sunday). Does not affect your Everyday daily streak!</span>
              </p>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "6px" }}>
            <button
              type="submit"
              className="neo-btn neo-btn-emerald"
              style={{
                padding: "13px",
                fontSize: "13px",
                fontWeight: "800",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon size={16} color="#FFFFFF" />
                  <span>{isEditing ? "Updating..." : "Saving..."}</span>
                </>
              ) : isEditing ? (
                <>
                  <CheckIcon size={16} strokeWidth={3} />
                  <span>Update Personal Habit</span>
                </>
              ) : (
                <>
                  <SproutIcon size={16} />
                  <span>Save New Habit</span>
                </>
              )}
            </button>

            {isEditing && (
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "transparent",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: "12px",
                      color: "#F87171",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <TrashIcon size={14} color="#F87171" />
                    <span>Delete this habit</span>
                  </button>
                ) : (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.35)",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#FCA5A5", fontWeight: "700" }}>
                      Delete this habit permanently?
                    </span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        style={{
                          background: "#EF4444",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          fontWeight: "800",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        {isSubmitting && <SpinnerIcon size={12} color="#FFFFFF" />}
                        <span>Yes, Delete</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isSubmitting}
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
