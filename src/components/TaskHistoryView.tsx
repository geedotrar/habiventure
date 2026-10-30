"use client";

import React, { useState, useEffect } from "react";
import type { User, Task } from "@/types/domain";
import { Mascot } from "@/components/Mascot";
import { gameFeedback } from "@/utils/gameFeedback";
import {
  ClipboardCheckIcon,
  CheckIcon,
  SparkleIcon,
  TargetIcon,
  ZapIcon,
  ClockIcon,
  FlameIcon,
  UsersIcon,
  ChevronRightIcon,
  CalendarIcon,
  RefreshIcon,
  ShieldIcon,
  SpinnerIcon,
} from "@/components/Icons";

interface TaskHistoryViewProps {
  authenticatedUser: User;
  isSuperAdmin: boolean;
  tasks: Task[];
  allUsers?: User[];
}

export const TaskHistoryView: React.FC<TaskHistoryViewProps> = ({
  authenticatedUser,
  isSuperAdmin,
  tasks,
  allUsers = [],
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [playerFilter, setPlayerFilter] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "everyday" | "weekly">("all");
  const [historyData, setHistoryData] = useState<{
    tasksSummary: any[];
    richLogs: any[];
    users: any[];
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = React.useCallback(async (targetId: number | null = playerFilter) => {
    try {
      setLoading(true);
      setError(null);
      let url = `/api/tasks/history?userId=${authenticatedUser.id}`;
      if (isSuperAdmin && targetId !== null) {
        url += `&targetUserId=${targetId}`;
      }
      const res = await fetch(`${url}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load history.");
      }
      setHistoryData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load task history.");
    } finally {
      setLoading(false);
    }
  }, [authenticatedUser.id, isSuperAdmin, playerFilter]);

  useEffect(() => {
    fetchHistory(playerFilter);
  }, [fetchHistory, playerFilter]);

  const regularPlayers = allUsers.filter((u) => u.role !== "superadmin");

  const [tasksLimit, setTasksLimit] = useState(10);
  const [logsLimit, setLogsLimit] = useState(15);
  const tasksObserverRef = React.useRef<HTMLDivElement | null>(null);
  const logsObserverRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTasksLimit(10);
  }, [categoryFilter, playerFilter]);

  useEffect(() => {
    setLogsLimit(15);
  }, [selectedTaskId]);

  const selectedTaskItem = historyData?.tasksSummary?.find((item) => item.task.id === selectedTaskId);
  const selectedTask = selectedTaskItem?.task || tasks.find((t) => t.id === selectedTaskId);
  const selectedTaskLogs = selectedTaskItem?.logs || [];

  const filteredTasksSummary = (historyData?.tasksSummary || []).filter((item) => {
    const isEveryday = item.task.frequency === "daily" || (!item.task.frequency && (item.task.target_days_per_week === 7 || !item.task.target_days_per_week));
    if (categoryFilter === "everyday") return isEveryday;
    if (categoryFilter === "weekly") return !isEveryday;
    return true;
  });

  const visibleTasksSummary = filteredTasksSummary.slice(0, tasksLimit);
  const hasMoreTasks = filteredTasksSummary.length > tasksLimit;

  const visibleLogs = selectedTaskLogs.slice(0, logsLimit);
  const hasMoreLogs = selectedTaskLogs.length > logsLimit;

  useEffect(() => {
    if (!hasMoreTasks) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTasksLimit((prev) => prev + 10);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    const el = tasksObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasMoreTasks]);

  useEffect(() => {
    if (!hasMoreLogs) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLogsLimit((prev) => prev + 15);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );
    const el = logsObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [hasMoreLogs]);

  const totalCompletionsAcrossTasks = (historyData?.richLogs || []).length;
  const totalPointsAcrossTasks = (historyData?.richLogs || []).reduce((acc: number, l: any) => acc + (l.points || 0), 0);

  return (
    <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="neo-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "10px", fontWeight: "900", color: isSuperAdmin ? "#A78BFA" : "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
              {isSuperAdmin ? "ADMIN TASK AUDIT" : "ACTIVITY HISTORY"}
            </span>
            <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
              {selectedTaskId ? "Task Completion Log" : "Task History"}
            </h2>
          </div>
          <button
            type="button"
            className="neo-btn neo-btn-glass"
            style={{ padding: "6px 12px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "5px", flexShrink: 0 }}
            onClick={() => {
              gameFeedback.playPop();
              fetchHistory(playerFilter);
            }}
            title="Refresh history"
          >
            <RefreshIcon size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
          {isSuperAdmin
            ? "Comprehensive audit of all task completions, timestamps, and point distributions across players."
            : "Review your verified habit check-ins, earned reward points, and historical consistency over time."}
        </p>

        {isSuperAdmin && !selectedTaskId && regularPlayers.length > 0 && (
          <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-glass)" }}>
            <span style={{ display: "block", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", marginBottom: "6px", letterSpacing: "0.5px" }}>
              FILTER BY PLAYER:
            </span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              <button
                type="button"
                className={`neo-tab-pill ${playerFilter === null ? "active" : ""}`}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onClick={() => {
                  gameFeedback.playPop();
                  setPlayerFilter(null);
                }}
              >
                <UsersIcon size={13} />
                <span>All Players</span>
              </button>
              {regularPlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className={`neo-tab-pill ${playerFilter === player.id ? "active" : ""}`}
                  style={{
                    padding: "5px 12px",
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => {
                    gameFeedback.playPop();
                    setPlayerFilter(player.id);
                  }}
                >
                  <Mascot
                    character={(player.gender ? player.gender === "female" : player.id === 3) ? "female" : "male"}
                    variant="avatar"
                    size={16}
                  />
                  <span>{player.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {!selectedTaskId && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "14px", padding: "10px 14px" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--emerald-glow)", textTransform: "uppercase" }}>
                Total Check-ins
              </span>
              <div className="num-font" style={{ fontSize: "22px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                {totalCompletionsAcrossTasks}
              </div>
            </div>
            <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.25)", borderRadius: "14px", padding: "10px 14px" }}>
              <span style={{ fontSize: "10px", fontWeight: "800", color: "#A78BFA", textTransform: "uppercase" }}>
                Points Earned
              </span>
              <div className="num-font" style={{ fontSize: "22px", fontWeight: "900", color: "#A78BFA", marginTop: "2px" }}>
                +{totalPointsAcrossTasks}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTaskId && selectedTask ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <button
            type="button"
            className="neo-btn neo-btn-glass"
            style={{ padding: "8px 14px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px", width: "fit-content" }}
            onClick={() => {
              gameFeedback.playPop();
              setSelectedTaskId(null);
            }}
          >
            <span>← Back to All Tasks</span>
          </button>

          <div className="neo-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: "900",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: selectedTask.frequency === "daily" ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)",
                      color: selectedTask.frequency === "daily" ? "var(--emerald-glow)" : "#A78BFA",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {selectedTask.frequency === "daily" ? (
                      <>
                        <ZapIcon size={10} color="var(--emerald-glow)" />
                        <span>Everyday Task</span>
                      </>
                    ) : (
                      <>
                        <TargetIcon size={10} color="#A78BFA" />
                        <span>Weekly ({selectedTask.target_days_per_week || 2}x)</span>
                      </>
                    )}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      fontWeight: "900",
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: "rgba(255, 255, 255, 0.08)",
                      color: "#FFFFFF",
                    }}
                  >
                    +{selectedTask.base_score || (selectedTask.frequency === "daily" ? 10 : 15)} PTS
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", margin: 0 }}>
                  {selectedTask.name}
                </h3>
                {selectedTask.description && (
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", marginBottom: 0 }}>
                    {selectedTask.description}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border-glass)" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>Total Completed</span>
                <div className="num-font" style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF" }}>
                  {selectedTaskLogs.length} times
                </div>
              </div>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "var(--text-muted)" }}>Total Points Earned</span>
                <div className="num-font" style={{ fontSize: "18px", fontWeight: "900", color: "var(--emerald-glow)" }}>
                  +{selectedTaskLogs.reduce((acc: number, l: any) => acc + (l.points || 0), 0)} PTS
                </div>
              </div>
            </div>
          </div>

          <div className="neo-card" style={{ padding: "16px" }}>
            <h4 style={{ fontSize: "13px", fontWeight: "900", color: "#FFFFFF", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <ClockIcon size={14} color="var(--emerald-primary)" />
              <span>Completion History ({selectedTaskLogs.length})</span>
            </h4>

            {selectedTaskLogs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 12px" }}>
                <Mascot character="together" mood="idle" animation="none" size={75} />
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", marginTop: "8px" }}>
                  No Completions Recorded Yet
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  Complete this goal in the Today tab to record your first check-in!
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {visibleLogs.map((log: any, idx: number) => {
                  const dateObj = new Date(log.date);
                  const formattedDate = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  let timeStr = "";
                  if (log.completed_at) {
                    try {
                      timeStr = new Date(log.completed_at).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    } catch {}
                  }

                  return (
                    <div
                      key={log.id || `${log.date}_${log.user_id}_${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "var(--bg-surface-input)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "14px",
                        padding: "10px 14px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CheckIcon size={14} color="var(--emerald-glow)" strokeWidth={3} />
                        </div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>
                            {formattedDate}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                            {isSuperAdmin && (
                              <span style={{ color: "#A78BFA", fontWeight: "800" }}>
                                {log.user_name} •
                              </span>
                            )}
                            <span>{timeStr || "Completed"}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "900",
                            color: "var(--emerald-glow)",
                            background: "rgba(16, 185, 129, 0.15)",
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                            borderRadius: "8px",
                            padding: "3px 8px",
                          }}
                        >
                          +{log.points} PTS
                        </span>
                      </div>
                    </div>
                  );
                })}

                {hasMoreLogs && (
                  <div
                    ref={logsObserverRef}
                    style={{
                      textAlign: "center",
                      padding: "14px",
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                  >
                    Showing {visibleLogs.length} of {selectedTaskLogs.length} logs • Scroll to load more...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <div className="neo-tabs-bar">
            <button
              type="button"
              onClick={() => {
                gameFeedback.playPop();
                setCategoryFilter("all");
              }}
              className={`neo-tab-pill ${categoryFilter === "all" ? "active" : ""}`}
            >
              All Goals ({historyData?.tasksSummary?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => {
                gameFeedback.playPop();
                setCategoryFilter("everyday");
              }}
              className={`neo-tab-pill ${categoryFilter === "everyday" ? "active" : ""}`}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <ZapIcon size={12} color="var(--emerald-primary)" />
                <span>Everyday</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                gameFeedback.playPop();
                setCategoryFilter("weekly");
              }}
              className={`neo-tab-pill ${categoryFilter === "weekly" ? "active" : ""}`}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <TargetIcon size={12} color="#A78BFA" />
                <span>Weekly</span>
              </span>
            </button>
          </div>

          {loading ? (
            <div className="neo-card" style={{ textAlign: "center", padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <SpinnerIcon size={24} color="var(--emerald-glow)" />
              <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)" }}>
                Loading task history...
              </div>
            </div>
          ) : filteredTasksSummary.length === 0 ? (
            <div className="neo-card" style={{ textAlign: "center", padding: "36px 20px" }}>
              <Mascot character="together" mood="idle" animation="none" size={85} />
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF", marginTop: "12px" }}>
                No Tasks Found
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                Start completing daily or weekly goals to build up your history.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {visibleTasksSummary.map((item: any, index: number) => {
                const isEveryday = item.task.frequency === "daily" || (!item.task.frequency && (item.task.target_days_per_week === 7 || !item.task.target_days_per_week));
                const pointsValue = item.task.base_score || (isEveryday ? 10 : 15);

                let formattedLastDate = "Never";
                if (item.lastCompletedDate) {
                  try {
                    formattedLastDate = new Date(item.lastCompletedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  } catch {}
                }

                return (
                  <div
                    key={item.task.id || index}
                    className="neo-card"
                    onClick={() => {
                      gameFeedback.playPop();
                      setSelectedTaskId(item.task.id);
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "transform 0.15s ease, border-color 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(16, 185, 129, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.transform = "none";
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)";
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "900",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: isEveryday ? "rgba(16, 185, 129, 0.15)" : "rgba(139, 92, 246, 0.15)",
                            color: isEveryday ? "var(--emerald-glow)" : "#A78BFA",
                            textTransform: "uppercase",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {isEveryday ? (
                            <>
                              <ZapIcon size={10} color="var(--emerald-glow)" />
                              <span>Everyday</span>
                            </>
                          ) : (
                            <>
                              <TargetIcon size={10} color="#A78BFA" />
                              <span>Weekly ({item.task.target_days_per_week || 2}x)</span>
                            </>
                          )}
                        </span>
                        <span
                          style={{
                            fontSize: "9px",
                            fontWeight: "900",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          +{pointsValue} PTS
                        </span>
                      </div>

                      <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", wordBreak: "break-word" }}>
                        {item.task.name}
                      </div>

                      {item.task.description && item.task.description.trim() && item.task.description.trim() !== "Personal habit" && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "rgba(255, 255, 255, 0.65)",
                            fontStyle: "italic",
                            marginTop: "3px",
                            lineHeight: 1.35,
                          }}
                        >
                          &ldquo;{item.task.description.trim()}&rdquo;
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "6px", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
                        <span>
                          <strong style={{ color: "#FFFFFF" }}>{item.totalCompletions}</strong> completions
                        </span>
                        <span>•</span>
                        <span>
                          <strong style={{ color: "var(--emerald-glow)" }}>+{item.totalPoints}</strong> PTS earned
                        </span>
                        <span>•</span>
                        <span>Last: <strong style={{ color: "#FFFFFF" }}>{formattedLastDate}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--emerald-primary)" }}>
                        Details
                      </span>
                      <ChevronRightIcon size={16} color="var(--emerald-primary)" />
                    </div>
                  </div>
                );
              })}

              {hasMoreTasks && (
                <div
                  ref={tasksObserverRef}
                  style={{
                    textAlign: "center",
                    padding: "14px",
                    color: "var(--text-secondary)",
                    fontSize: "11px",
                    fontWeight: "700",
                  }}
                >
                  Showing {visibleTasksSummary.length} of {filteredTasksSummary.length} goals • Scroll to load more...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskHistoryView;
