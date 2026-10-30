"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Mascot, MascotMood, MascotCharacter } from "@/components/Mascot";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { StreakFlame, getStreakTier } from "@/components/StreakFlame";
import { SearchableSelect } from "@/components/SearchableSelect";

const CycleResultModal = dynamic(() => import("@/components/CycleResultModal").then((m) => m.CycleResultModal), { ssr: false });
const ChangePinModal = dynamic(() => import("@/components/ChangePinModal").then((m) => m.ChangePinModal), { ssr: false });
const StreakCelebrationModal = dynamic(() => import("@/components/StreakCelebrationModal").then((m) => m.StreakCelebrationModal), { ssr: false });
const DecisionWheelTab = dynamic(() => import("@/components/DecisionWheelTab").then((m) => m.DecisionWheelTab), {
  ssr: false,
  loading: () => <div className="neo-card" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Loading Wheel...</div>,
});
const TaskHistoryView = dynamic(() => import("@/components/TaskHistoryView").then((m) => m.TaskHistoryView), {
  ssr: false,
  loading: () => <div className="neo-card" style={{ padding: "36px", textAlign: "center", color: "var(--text-muted)" }}>Loading History...</div>,
});
const EditTaskModal = dynamic(() => import("@/components/EditTaskModal").then((m) => m.EditTaskModal), { ssr: false });
const PersonalHabitModal = dynamic(() => import("@/components/PersonalHabitModal").then((m) => m.PersonalHabitModal), { ssr: false });
const LogoutModal = dynamic(() => import("@/components/LogoutModal").then((m) => m.LogoutModal), { ssr: false });
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { formatCycleDateRange, formatDaysRemaining } from "@/utils/dateFormatter";
import { gameFeedback } from "@/utils/gameFeedback";
import {
  TargetIcon,
  CrownIcon,
  BarChartIcon,
  CompassIcon,
  BookOpenIcon,
  ShieldIcon,
  FlameIcon,
  SparkleIcon,
  TrophyIcon,
  UsersIcon,
  SproutIcon,
  ZapIcon,
  TrendingUpIcon,
  ScaleIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  PhoneCallIcon,
  MessageCircleIcon,
  ClipboardCheckIcon,
  DiceIcon,
  RefreshIcon,
  LogOutIcon,
  LockIcon,
  KeyIcon,
  BackspaceIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  DownloadIcon,
  UploadIcon,
  EditIcon,
  PlusIcon,
  ExternalLinkIcon,
  SpinnerIcon,
} from "@/components/Icons";
import type { User, Task, CycleHistoryPage, CycleHistoryItem } from "@/types/domain";
import { setupDemoInterceptor, teardownDemoInterceptor } from "@/services/demoInterceptor";
import { demoStore } from "@/services/demoStore";
const PairDeviceModal = dynamic(() => import("@/components/PairDeviceModal").then((m) => m.PairDeviceModal), { ssr: false });

interface DashboardData {
  cycleHistory?: CycleHistoryPage;
  configured: boolean;
  schemaReady?: boolean;
  message?: string;
  users?: User[];
  regularUsers?: User[];
  playerA?: User | null;
  playerB?: User | null;
  currentUser?: User;
  partnerUser?: User;
  activeCycle?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    status: string;
  };
  tasks?: Task[];
  everydayTasks?: Task[];
  weeklyTasks?: Task[];
  cycleTasks?: Task[];
  cycleTaskProgress?: Record<
    number,
    {
      completedInCycle: boolean;
      completedDate: string | null;
      partnerCompletedInCycle: boolean;
      partnerCompletedDate: string | null;
      personalCycleStreak: number;
      teamCycleStreak: number;
    }
  >;
  weeklyProgress?: Record<
    number,
    {
      completedDaysThisWeek: number;
      targetDays: number;
      isTargetReached: boolean;
      completedToday: boolean;
      completedDatesThisWeek: string[];
      partnerCompletedDaysThisWeek: number;
      partnerTargetReached: boolean;
    }
  >;
  weekRange?: { start: string; end: string };
  historyLogs?: any[];
  taskStreaks?: Record<number, number>;
  taskTotalDays?: Record<number, number>;
  todayLogs?: Array<{
    user_id: number;
    task_id: number;
    status: string;
  }>;
  scores?: {
    currentScore: number;
    partnerScore: number;
    scoreDiff: number;
    playerA?: { id: number; name: string; score: number } | null;
    playerB?: { id: number; name: string; score: number } | null;
    currentUserSummary?: {
      total: number;
      breakdown: { personal: number; bonus: number; penalty: number };
    };
    partnerUserSummary?: {
      total: number;
      breakdown: { personal: number; bonus: number; penalty: number };
    };
  };
  streaks?: {
    personalStreak: number;
    teamStreak: number;
    partnerStreak?: number;
    protectsUsed?: number;
    protectsRemaining?: number;
    maxProtects?: number;
    protectedDates?: string[];
    isYesterdayProtected?: boolean;
    teamProtectsRemaining?: number;
    partnerProtectsRemaining?: number;
    weekStreakDays?: Array<{
      date: string;
      dateNum: number;
      dayLabel: string;
      dayLabelEn: string;
      completedCount: number;
      partnerCompletedCount: number;
      hasCompleted: boolean;
      isFullyCompleted: boolean;
      isTeamCompleted: boolean;
      isProtected?: boolean;
      isPartnerProtected?: boolean;
      isToday: boolean;
      isPast: boolean;
      isFuture: boolean;
    }>;
  };
  storageUsage?: {
    rowCount?: number;
    approxBytes?: number;
    percentage?: number;
    usedMb?: number;
    maxFreeMb?: number;
    remainingMb?: number;
    totalRows?: number;
    estimatedBytes?: number;
    estimatedMegabytes?: number;
    maxFreeMegabytes?: number;
    usagePercentage?: number;
  };
  daysRemaining?: number;
  todayDate?: string;
  recentEvents?: Array<{
    id?: number;
    points: number;
    reason: string;
    type: string;
    date: string;
    user_id: number;
  }>;
}

function DemoCreatorBadge({ maxWidth }: { maxWidth?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        marginBottom: "12px",
        borderRadius: "14px",
        background: "linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)",
        border: "1px solid rgba(16, 185, 129, 0.22)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        width: "100%",
        maxWidth: maxWidth || "100%",
        margin: maxWidth ? "0 auto 14px auto" : "0 0 12px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "var(--emerald-primary)",
            boxShadow: "0 0 8px var(--emerald-glow)",
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: "10px",
            fontWeight: "800",
            letterSpacing: "0.8px",
            color: "rgba(255, 255, 255, 0.85)",
            textTransform: "uppercase",
          }}
        >
          Interactive Demo
        </span>
      </div>

      <a
        href="https://stevanprb.com/"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "10px",
          fontWeight: "700",
          color: "var(--emerald-glow)",
          textDecoration: "none",
          padding: "3px 9px",
          borderRadius: "8px",
          background: "rgba(16, 185, 129, 0.12)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(16, 185, 129, 0.22)";
          e.currentTarget.style.borderColor = "var(--emerald-glow)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(16, 185, 129, 0.12)";
          e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.3)";
        }}
        title="Visit Stevan's Portfolio (stevanprb.com)"
      >
        <span>Reach Me</span>
        <ExternalLinkIcon size={10} color="var(--emerald-glow)" />
      </a>
    </div>
  );
}

function getStorageInfo(s?: DashboardData["storageUsage"]) {
  if (!s) return null;
  const rowCount = s.rowCount ?? s.totalRows ?? 0;
  const approxBytes = s.approxBytes ?? s.estimatedBytes ?? 0;
  const maxFreeMb = s.maxFreeMb ?? s.maxFreeMegabytes ?? 500;
  const usedMb = s.usedMb ?? s.estimatedMegabytes ?? Number((approxBytes / (1024 * 1024)).toFixed(2));
  const remainingMb = s.remainingMb ?? Number(Math.max(0, maxFreeMb - usedMb).toFixed(2));
  const percentage = s.percentage ?? s.usagePercentage ?? Number(Math.min(100, (usedMb / maxFreeMb) * 100).toFixed(3));

  const isCritical = remainingMb < 25;
  const isWarning = !isCritical && remainingMb < 100;
  const themeColor = isCritical ? "#F87171" : isWarning ? "#FBBF24" : "var(--emerald-glow)";
  const bgColor = isCritical ? "rgba(239, 68, 68, 0.18)" : isWarning ? "rgba(245, 158, 11, 0.16)" : "rgba(16, 185, 129, 0.14)";
  const borderColor = isCritical ? "rgba(239, 68, 68, 0.4)" : isWarning ? "rgba(245, 158, 11, 0.35)" : "rgba(16, 185, 129, 0.35)";

  return {
    rowCount,
    approxBytes,
    maxFreeMb,
    usedMb,
    remainingMb,
    percentage,
    isCritical,
    isWarning,
    themeColor,
    bgColor,
    borderColor,
  };
}

interface InFlightTaskCompletion {
  taskId: number;
  date: string;
  points: number;
  task?: Task;
  log: {
    id: number;
    date: string;
    user_id: number;
    task_id: number;
    status: "completed";
    completed_at: string;
  };
  timestamp: number;
}

function applyTaskCompletionToData(
  prev: DashboardData,
  taskId: number,
  userId: number,
  todayDate: string,
  targetTask: Task | undefined,
  pointsValue: number,
  log: {
    id: number;
    date: string;
    user_id: number;
    task_id: number;
    status: "completed";
    completed_at: string;
  }
): DashboardData {
  const nextTodayLogs = [...(prev.todayLogs || []), log];
  const nextHistoryLogs = [log, ...(prev.historyLogs || [])];

  let nextScores = prev.scores;
  if (prev.scores) {
    const prevScore = prev.scores.currentScore ?? 0;
    const isPlayerA = prev.scores.playerA?.id === userId;
    const isPlayerB = prev.scores.playerB?.id === userId;

    const nextPlayerA = isPlayerA && prev.scores.playerA
      ? { ...prev.scores.playerA, score: prev.scores.playerA.score + pointsValue }
      : prev.scores.playerA;

    const nextPlayerB = isPlayerB && prev.scores.playerB
      ? { ...prev.scores.playerB, score: prev.scores.playerB.score + pointsValue }
      : prev.scores.playerB;

    const playerAScore = nextPlayerA?.score ?? 0;
    const playerBScore = nextPlayerB?.score ?? 0;
    const nextScoreDiff = playerAScore - playerBScore;

    const nextCurrentUserSummary = prev.scores.currentUserSummary
      ? {
          ...prev.scores.currentUserSummary,
          total: (prev.scores.currentUserSummary.total ?? 0) + pointsValue,
          breakdown: {
            ...prev.scores.currentUserSummary.breakdown,
            personal: (prev.scores.currentUserSummary.breakdown.personal ?? 0) + pointsValue,
          },
        }
      : undefined;

    nextScores = {
      ...prev.scores,
      currentScore: prevScore + pointsValue,
      scoreDiff: nextScoreDiff,
      playerA: nextPlayerA,
      playerB: nextPlayerB,
      currentUserSummary: nextCurrentUserSummary,
    };
  }

  let nextWeeklyProgress = prev.weeklyProgress;
  const isWeeklyTask = targetTask?.frequency === "weekly_2x" || targetTask?.frequency === "weekly_custom" || Boolean(prev.weeklyProgress?.[taskId]);
  if (isWeeklyTask && prev.weeklyProgress) {
    const existing = prev.weeklyProgress[taskId];
    const prevDates = existing?.completedDatesThisWeek || [];
    const nextDates = prevDates.includes(todayDate) ? prevDates : [...prevDates, todayDate];
    const targetDays = existing?.targetDays || (targetTask?.target_days_per_week ?? (targetTask?.frequency === "weekly_2x" ? 2 : 3));
    const completedDaysThisWeek = nextDates.length;

    nextWeeklyProgress = {
      ...prev.weeklyProgress,
      [taskId]: {
        completedDaysThisWeek,
        targetDays,
        isTargetReached: completedDaysThisWeek >= targetDays,
        completedToday: true,
        completedDatesThisWeek: nextDates,
        partnerCompletedDaysThisWeek: existing?.partnerCompletedDaysThisWeek || 0,
        partnerTargetReached: existing?.partnerTargetReached || false,
      },
    };
  }

  let nextCycleTaskProgress = prev.cycleTaskProgress;
  const isCycleTask = targetTask?.frequency === "cycle" || Boolean(prev.cycleTaskProgress?.[taskId]);
  if (isCycleTask && prev.cycleTaskProgress) {
    const existing = prev.cycleTaskProgress[taskId];
    nextCycleTaskProgress = {
      ...prev.cycleTaskProgress,
      [taskId]: {
        completedInCycle: true,
        completedDate: todayDate,
        partnerCompletedInCycle: existing?.partnerCompletedInCycle || false,
        partnerCompletedDate: existing?.partnerCompletedDate || null,
        personalCycleStreak: (existing?.personalCycleStreak || 0) + 1,
        teamCycleStreak: existing?.teamCycleStreak || 0,
      },
    };
  }

  const nextTaskStreaks = {
    ...(prev.taskStreaks || {}),
    [taskId]: ((prev.taskStreaks || {})[taskId] || 0) + 1,
  };
  const nextTaskTotalDays = {
    ...(prev.taskTotalDays || {}),
    [taskId]: ((prev.taskTotalDays || {})[taskId] || 0) + 1,
  };

  let nextStreaks = prev.streaks;
  if (prev.streaks && prev.streaks.weekStreakDays) {
    const nextWeekStreakDays = prev.streaks.weekStreakDays.map((day) => {
      if (day.date === todayDate || day.isToday) {
        const completedCount = day.completedCount + 1;
        const activeDailyTasks = (prev.everydayTasks || (prev.tasks || []).filter((t) => !t.frequency || t.frequency === "daily")).filter(
          (t) => t.active !== false && (!t.is_personal || Number(t.created_by) === Number(userId))
        );
        const totalDaily = activeDailyTasks.length || 1;
        return {
          ...day,
          completedCount,
          hasCompleted: true,
          isFullyCompleted: completedCount >= totalDaily,
        };
      }
      return day;
    });

    nextStreaks = {
      ...prev.streaks,
      weekStreakDays: nextWeekStreakDays,
    };
  }

  return {
    ...prev,
    todayLogs: nextTodayLogs,
    historyLogs: nextHistoryLogs,
    scores: nextScores,
    weeklyProgress: nextWeeklyProgress,
    cycleTaskProgress: nextCycleTaskProgress,
    taskStreaks: nextTaskStreaks,
    taskTotalDays: nextTaskTotalDays,
    streaks: nextStreaks,
  };
}

export function MobileDashboard({
  isForcedDemo = false,
}: {
  isForcedDemo?: boolean;
} = {}) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(isForcedDemo);
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState<boolean>(false);
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<"today" | "wheel" | "standings" | "history" | "rules" | "admin">("today");

  const [taskCategoryTab, setTaskCategoryTab] = useState<"everyday" | "weekly" | "cycle">("everyday");
  const [taskFilter, setTaskFilter] = useState<"all" | "shared" | "personal">("all");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<string | null>(null);

  const [showPersonalTaskModal, setShowPersonalTaskModal] = useState(false);
  const [editingPersonalTask, setEditingPersonalTask] = useState<Task | null>(null);

  const [showCycleResultModal, setShowCycleResultModal] = useState(false);
  const [showStartCycleModal, setShowStartCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");
  const [newCycleStartDate, setNewCycleStartDate] = useState("");
  const [newCycleEndDate, setNewCycleEndDate] = useState("");
  const [cycleModalLoading, setCycleModalLoading] = useState(false);
  const [cycleModalError, setCycleModalError] = useState<string | null>(null);
  const [cycleHistory, setCycleHistory] = useState<CycleHistoryPage | null>(null);
  const [cycleHistoryLoading, setCycleHistoryLoading] = useState(false);

  const fetchCycleHistory = async (page: number, append = false) => {
    if (cycleHistoryLoading) return;
    setCycleHistoryLoading(true);
    try {
      const res = await fetch(`/api/cycle?page=${page}&limit=3&_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.history) {
          if (append) {
            setCycleHistory((prev) => {
              if (!prev) return json.history;
              const existingIds = new Set(prev.items.map((i) => i.id));
              const freshItems = (json.history.items || []).filter((i: CycleHistoryItem) => !existingIds.has(i.id));
              return {
                ...json.history,
                page,
                items: [...prev.items, ...freshItems],
              };
            });
          } else {
            setCycleHistory(json.history);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load cycle history page:", e);
    } finally {
      setCycleHistoryLoading(false);
    }
  };

  const openStartCycleModal = () => {
    let baseDate = new Date();
    if (data?.activeCycle?.end_date) {
      const end = new Date(data.activeCycle.end_date);
      if (!isNaN(end.getTime())) {
        baseDate = new Date(end);
        baseDate.setDate(baseDate.getDate() + 1);
      }
    }
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const MONTH_NAMES = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const pad = (n: number) => String(n).padStart(2, "0");
    const suggestedName = `${MONTH_NAMES[month]} ${year}`;
    const startStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`;
    const endStr = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}`;

    setNewCycleName(suggestedName);
    setNewCycleStartDate(startStr);
    setNewCycleEndDate(endStr);
    setCycleModalError(null);
    setShowStartCycleModal(true);
  };

  const handleStartNewCycle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCycleName.trim() || !newCycleStartDate || !newCycleEndDate) {
      setCycleModalError("Please provide cycle name, start date, and end date.");
      return;
    }
    if (newCycleStartDate > newCycleEndDate) {
      setCycleModalError("Start date cannot be after end date.");
      return;
    }

    try {
      setCycleModalLoading(true);
      setCycleModalError(null);
      const res = await fetch("/api/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_new",
          name: newCycleName.trim(),
          startDate: newCycleStartDate,
          endDate: newCycleEndDate,
        }),
      });
      const resJson = await res.json();
      if (!resJson.success) {
        throw new Error(resJson.error || "Failed to start new cycle");
      }

      gameFeedback.playStreakFanfare();
      gameFeedback.haptic([50, 70, 150]);
      setShowStartCycleModal(false);
      setCelebration(`🎉 New cycle "${newCycleName.trim()}" started! Duel scores reset to 0-0.`);
      setTimeout(() => setCelebration(null), 4000);
      if (authenticatedUser) {
        await fetchDashboard(authenticatedUser.id, true);
      }
      await fetchCycleHistory(1);
    } catch (err: any) {
      setCycleModalError(err.message || "Failed to start cycle");
    } finally {
      setCycleModalLoading(false);
    }
  };

  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [changePinTargetId, setChangePinTargetId] = useState<number | undefined>(undefined);
  const [changePinInitialMode, setChangePinInitialMode] = useState<"edit" | "register">("edit");
  const [streakModalData, setStreakModalData] = useState<{
    isOpen: boolean;
    count: number;
    character: MascotCharacter;
    userName: string;
    isTeam: boolean;
  }>({
    isOpen: false,
    count: 0,
    character: "male",
    userName: "",
    isTeam: false,
  });

  const openStreakCelebration = (isTeam = false, explicitCount?: number) => {
    const streakVal = explicitCount !== undefined
      ? explicitCount
      : (isTeam ? (data?.streaks?.teamStreak ?? 0) : (data?.streaks?.personalStreak ?? 0));
    setStreakModalData({
      isOpen: true,
      count: streakVal,
      character: "together",
      userName: isTeam ? "Synergy Team" : (authenticatedUser?.name || "Adventurer"),
      isTeam,
    });
  };

  const [flyingCoin, setFlyingCoin] = useState<{ id: string; points: number; x: number; y: number } | null>(null);
  const [mascotJoyBurst, setMascotJoyBurst] = useState(false);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskScore, setNewTaskScore] = useState(10);
  const [newTaskFreq, setNewTaskFreq] = useState<"daily" | "weekly_2x" | "weekly_custom" | "cycle">("daily");
  const [newTaskTargetDays, setNewTaskTargetDays] = useState(7);
  const [newTaskIsPersonal, setNewTaskIsPersonal] = useState(false);
  const [newTaskTargetUserId, setNewTaskTargetUserId] = useState<number | "">("");
  const [adminGoalFilter, setAdminGoalFilter] = useState<"all" | "shared" | "personal" | "cycle">("all");
  const [adminStatusMsg, setAdminStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [rulesLang, setRulesLang] = useState<"en" | "id">("en");


  const [todayTasksLimit, setTodayTasksLimit] = useState(50);
  const [adminTasksLimit, setAdminTasksLimit] = useState(15);
  const todayTasksObserverRef = useRef<HTMLDivElement | null>(null);
  const adminTasksObserverRef = useRef<HTMLDivElement | null>(null);
  const cycleHistoryObserverRef = useRef<HTMLDivElement | null>(null);
  const latestDashboardRequestIdRef = useRef<number>(0);
  const inFlightCompletionsRef = useRef<Map<number, InFlightTaskCompletion>>(new Map());

  useEffect(() => {
    setTodayTasksLimit((prev) => Math.max(prev, 50));
  }, [taskCategoryTab, taskFilter]);

  useEffect(() => {
    setAdminTasksLimit(15);
  }, [adminGoalFilter]);

  useEffect(() => {
    let isCancelled = false;

    const savedUser = typeof window !== "undefined" ? localStorage.getItem("habits_auth_user") : null;
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && typeof parsed.id === "number") {
          setAuthenticatedUser(parsed);
          if (parsed.role === "superadmin") {
            setActiveTab("admin");
          }
          try {
            const cachedDash = localStorage.getItem(`habits_dashboard_cache_${parsed.id}`);
            if (cachedDash) {
              const dashParsed = JSON.parse(cachedDash);
              if (dashParsed && dashParsed.configured) {
                setData(dashParsed);
                if (dashParsed.cycleHistory) {
                  setCycleHistory(dashParsed.cycleHistory);
                }
                setLoading(false);
              }
            }
          } catch {}
        } else {
          localStorage.removeItem("habits_auth_user");
        }
      } catch {
        localStorage.removeItem("habits_auth_user");
      }
    }
    setIsAuthInitializing(false);

    const isExplicitDemo =
      isForcedDemo ||
      (typeof window !== "undefined" &&
        (window.location.pathname === "/demo" ||
          window.location.search.includes("demo=true")));

    if (isExplicitDemo) {
      if (!isCancelled) setIsDemoMode(true);
      setupDemoInterceptor();
    } else {
      fetch("/api/auth/trust-device", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { trusted: false }))
        .then((trustData) => {
          if (!isCancelled && !trustData?.trusted) {
            setIsDemoMode(true);
            setupDemoInterceptor();
          }
        })
        .catch(() => {
          if (!isCancelled) {
            setIsDemoMode(true);
            setupDemoInterceptor();
          }
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [isForcedDemo]);

  const fetchDashboard = async (userId: number, silent = true) => {
    const requestId = ++latestDashboardRequestIdRef.current;
    try {
      if (!silent && !data) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }
      const res = await fetch(`/api/dashboard?userId=${userId}&_t=${Date.now()}`, {
        cache: "no-store",
        headers: {
          "Pragma": "no-cache",
          "Cache-Control": "no-cache",
        },
      });
      if (!res.ok) {
        console.warn(`Dashboard fetch returned ${res.status}: ${res.statusText}`);
        return null;
      }
      const json = await res.json();

      // Drop stale response if another dashboard fetch was triggered after this one
      if (requestId !== latestDashboardRequestIdRef.current) {
        return null;
      }

      setData((prev) => {
        if (!prev) return json;
        const serverTaskIds = new Set((json.tasks || []).map((t: Task) => Number(t.id)));
        const activeLocalPersonalTasks = (prev.tasks || []).filter(
          (t: Task) =>
            !serverTaskIds.has(Number(t.id)) &&
            Boolean(t.is_personal) &&
            (Number(t.created_by) === Number(userId) || userId === 1) &&
            t.active !== false
        );
        const mergedTasks = activeLocalPersonalTasks.length > 0
          ? [...activeLocalPersonalTasks, ...(json.tasks || [])]
          : (json.tasks || []);

        let nextData: DashboardData = {
          ...json,
          tasks: mergedTasks,
        };

        // Reconcile with any task completions currently in flight
        if (inFlightCompletionsRef.current.size > 0) {
          const serverLoggedTaskIds = new Set(
            (json.todayLogs || []).filter((l: any) => Number(l.user_id) === Number(userId)).map((l: any) => Number(l.task_id))
          );
          inFlightCompletionsRef.current.forEach((inFlight) => {
            if (!serverLoggedTaskIds.has(inFlight.taskId)) {
              nextData = applyTaskCompletionToData(
                nextData,
                inFlight.taskId,
                userId,
                inFlight.date,
                inFlight.task,
                inFlight.points,
                inFlight.log
              );
            }
          });
        }

        try {
          localStorage.setItem(`habits_dashboard_cache_${userId}`, JSON.stringify(nextData));
        } catch {}

        return nextData;
      });

      if (json.cycleHistory) {
        setCycleHistory(json.cycleHistory);
      }

      if (json.currentUser && json.currentUser.active !== false) {
        setAuthenticatedUser((prev) => {
          if (!prev) {
            try {
              localStorage.setItem("habits_auth_user", JSON.stringify(json.currentUser));
            } catch {}
            return json.currentUser;
          }
          if (json.currentUser.id !== prev.id) {
            return prev;
          }
          const merged: User = {
            ...prev,
            ...json.currentUser,
            name: json.currentUser.name?.trim() ? json.currentUser.name.trim() : prev.name,
            role: prev.id === 1 ? "superadmin" : (json.currentUser.role || prev.role),
          };
          try {
            localStorage.setItem("habits_auth_user", JSON.stringify(merged));
          } catch {}
          return merged;
        });
      } else if (json.configured && json.schemaReady !== false && !json.currentUser) {
        setAuthenticatedUser(null);
        localStorage.removeItem("habits_auth_user");
        try {
          localStorage.removeItem(`habits_dashboard_cache_${userId}`);
        } catch {}
      }
      return json;
    } catch (e) {
      console.error("Dashboard fetch error:", e);
      return null;
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!authenticatedUser?.id) return;

    fetchDashboard(authenticatedUser.id, Boolean(data));

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        fetchDashboard(authenticatedUser.id, true);
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboard(authenticatedUser.id, true);
      }
    }, 45000);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatedUser?.id]);

  const handleKeypadPress = (val: string) => {
    gameFeedback.playPop();
    if (pinError) setPinError(null);
    if (pinInput.length < 4) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      if (nextPin.length === 4) {
        submitPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    gameFeedback.playPop();
    if (pinError) setPinError(null);
    if (pinInput.length > 0) {
      setPinInput(pinInput.slice(0, -1));
    }
  };

  useEffect(() => {
    if (authenticatedUser || showPairModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setPinInput("");
        setPinError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticatedUser, showPairModal, pinInput, pinError, isVerifyingPin]);

  const submitPin = async (pinToSubmit: string) => {
    setIsVerifyingPin(true);
    setPinError(null);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToSubmit }),
      });
      if (!res.ok) {
        let errMessage = "Invalid PIN or account not found.";
        try {
          const errData = await res.json();
          if (errData?.error) errMessage = errData.error;
        } catch {
        }
        gameFeedback.haptic([100, 50, 100]);
        setPinError(errMessage);
        setPinInput("");
        return;
      }
      const result = await res.json();
      if (result.success && result.user) {
        gameFeedback.playSuccessChime();
        gameFeedback.haptic([40, 60]);
        setAuthenticatedUser(result.user);
        localStorage.setItem("habits_auth_user", JSON.stringify(result.user));
        setPinInput("");
        if (result.user.role === "superadmin") {
          setActiveTab("admin");
        }
      } else {
        gameFeedback.haptic([100, 50, 100]);
        setPinError(result.error || "Invalid PIN or account not found.");
        setPinInput("");
      }
    } catch (err: any) {
      setPinError("Failed to verify PIN. Please check your connection.");
      setPinInput("");
    } finally {
      setIsVerifyingPin(false);
    }
  };

  const handleLogout = () => {
    gameFeedback.playPop();
    if (authenticatedUser?.id) {
      try {
        localStorage.removeItem(`habits_dashboard_cache_${authenticatedUser.id}`);
      } catch {}
    }
    localStorage.removeItem("habits_auth_user");
    setAuthenticatedUser(null);
    setPinInput("");
    setData(null);
    setActiveTab("today");
  };

  const handleDemoSwitchUser = async (targetUserId: number, targetPin: string) => {
    gameFeedback.playPop();
    localStorage.removeItem("habits_auth_user");
    if (authenticatedUser?.id) {
      try {
        localStorage.removeItem(`habits_dashboard_cache_${authenticatedUser.id}`);
      } catch {}
    }
    setAuthenticatedUser(null);
    setData(null);
    await submitPin(targetPin);
    await fetchDashboard(targetUserId);
  };

  const handleResetDemoData = async () => {
    gameFeedback.playPop();
    demoStore.resetDemoData();

    [1, 2, 3].forEach((id) => {
      try {
        localStorage.removeItem(`habits_dashboard_cache_${id}`);
      } catch {}
    });
    localStorage.removeItem("habits_auth_user");

    const targetPin =
      authenticatedUser?.role === "superadmin"
        ? "9999"
        : authenticatedUser?.id === 3
        ? "3344"
        : "1122";
    const targetUserId =
      authenticatedUser?.role === "superadmin"
        ? 1
        : authenticatedUser?.id === 3
        ? 3
        : 2;

    setData(null);
    await submitPin(targetPin);
    await fetchDashboard(targetUserId);

    setCelebration("Guest demo data restored to pristine state!");
    setTimeout(() => setCelebration(null), 3000);
  };

  const handleCompleteTask = async (taskId: number, e?: React.MouseEvent) => {
    if (!data?.todayDate || !authenticatedUser || authenticatedUser.role === "superadmin") return;

    if (data.activeCycle?.status === "closed") {
      setCelebration("🔒 Current cycle is closed. Start the next cycle to record goals.");
      setTimeout(() => setCelebration(null), 3500);
      return;
    }

    const prevData = data;
    const targetTask = data.tasks?.find((t) => t.id === taskId);
    const isPersonal = Boolean(targetTask?.is_personal);
    const pointsValue = isPersonal ? 0 : (targetTask?.base_score || (targetTask?.frequency === "cycle" ? 50 : 10));

    const rawX = e ? e.clientX : (typeof window !== "undefined" ? window.innerWidth / 2 : 200);
    const rawY = e ? e.clientY : (typeof window !== "undefined" ? window.innerHeight * 0.6 : 300);

    // Clamp coordinates safely so popup badges never clip on any mobile or small screen
    const vw = typeof window !== "undefined" ? window.innerWidth : 380;
    const vh = typeof window !== "undefined" ? window.innerHeight : 700;
    const halfPillWidth = 78;
    const clickX = Math.max(halfPillWidth + 12, Math.min(vw - halfPillWidth - 12, rawX));
    const clickY = Math.max(110, Math.min(vh - 90, rawY));

    const newLog = {
      id: Date.now(),
      date: data.todayDate,
      user_id: authenticatedUser.id,
      task_id: taskId,
      status: "completed" as const,
      completed_at: new Date().toISOString(),
    };

    // Register in-flight completion to preserve optimistic state across concurrent fetches
    inFlightCompletionsRef.current.set(taskId, {
      taskId,
      date: data.todayDate,
      points: pointsValue,
      task: targetTask,
      log: newLog,
      timestamp: Date.now(),
    });

    setData((prev) => {
      if (!prev) return prev;
      return applyTaskCompletionToData(
        prev,
        taskId,
        authenticatedUser.id,
        data.todayDate!,
        targetTask,
        pointsValue,
        newLog
      );
    });

    const msg = isPersonal
      ? "Personal habit completed successfully!"
      : `+${pointsValue} Points! Goal Completed!`;
    setCelebration(msg);
    setTimeout(() => setCelebration(null), 3000);

    gameFeedback.playCoins();
    gameFeedback.playSuccessChime();

    setMascotJoyBurst(true);
    setTimeout(() => setMascotJoyBurst(false), 2400);

    setFlyingCoin({
      id: String(Date.now()),
      points: pointsValue || 1,
      x: clickX,
      y: clickY,
    });
    setTimeout(() => setFlyingCoin(null), 1100);

    try {
      setActionLoading(`task_${taskId}`);

      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          date: data.todayDate,
          userId: authenticatedUser.id,
        }),
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(result?.error || `Task completion failed with status ${res.status}`);
      }
      if (result && !result.success && result.error) {
        throw new Error(result.error);
      }

      inFlightCompletionsRef.current.delete(taskId);

      if (authenticatedUser) {
        await fetchDashboard(authenticatedUser.id, true);
      }
    } catch (err: any) {
      inFlightCompletionsRef.current.delete(taskId);
      setData(prevData);
      setCelebration(err.message || "Network error. Reverted to previous state.");
      setTimeout(() => setCelebration(null), 3500);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportBackup = async () => {
    try {
      gameFeedback.playPop();
      setAdminStatusMsg({ text: "Preparing data backup..." });
      const res = await fetch(`/api/admin/export?userId=${authenticatedUser?.id}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to export");
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `accountability_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setAdminStatusMsg({ text: "Database backup downloaded successfully!" });
    } catch (err: any) {
      setAdminStatusMsg({ text: err.message, error: true });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setAdminStatusMsg({ text: "Reading backup file..." });
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch("/api/admin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authenticatedUser?.id,
          backupData: parsed,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to import backup.");
      }

      gameFeedback.playSuccessChime();
      setAdminStatusMsg({ text: result.message });
      if (authenticatedUser) await fetchDashboard(authenticatedUser.id);
    } catch (err: any) {
      setAdminStatusMsg({ text: err.message, error: true });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) {
      alert("Goal name cannot be empty.");
      return;
    }

    try {
      setActionLoading("create_task");
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authenticatedUser?.id,
          task: {
            name: newTaskName.trim(),
            description: newTaskDesc.trim(),
            base_score: Number(newTaskScore) || (newTaskFreq === "cycle" ? (newTaskIsPersonal ? 20 : 50) : 10),
            frequency: newTaskFreq,
            is_personal: newTaskIsPersonal,
            created_by: newTaskIsPersonal ? (newTaskTargetUserId ? Number(newTaskTargetUserId) : authenticatedUser?.id) : null,
            target_days_per_week:
              newTaskFreq === "cycle"
                ? 1
                : newTaskFreq === "daily"
                ? 7
                : newTaskFreq === "weekly_2x"
                ? 2
                : Math.max(1, Math.min(7, Number(newTaskTargetDays) || 3)),
          },
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to add goal.");
      }

      gameFeedback.playSuccessChime();
      setAdminStatusMsg({ text: `Goal '${newTaskName}' created successfully!` });

      if (result.task) {
        setData((prev) => {
          if (!prev) return prev;
          const nextData = {
            ...prev,
            tasks: [result.task, ...(prev.tasks || [])],
          };
          if (authenticatedUser) {
            try {
              localStorage.setItem(`habits_dashboard_cache_${authenticatedUser.id}`, JSON.stringify(nextData));
            } catch {}
          }
          return nextData;
        });
      }

      setNewTaskName("");
      setNewTaskDesc("");
      setNewTaskTargetUserId("");
      if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
    } catch (err: any) {
      setAdminStatusMsg({ text: err.message, error: true });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTaskUpdated = async (updatedTask: Task) => {
    gameFeedback.playSuccessChime();
    setAdminStatusMsg({ text: `Goal '${updatedTask.name}' was updated successfully!` });
    setData((prev) => {
      if (!prev) return prev;
      const nextData = {
        ...prev,
        tasks: (prev.tasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      };
      if (authenticatedUser) {
        try {
          localStorage.setItem(`habits_dashboard_cache_${authenticatedUser.id}`, JSON.stringify(nextData));
        } catch {}
      }
      return nextData;
    });
    if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
  };

  const handleTaskDeleted = async (deletedTaskId: number) => {
    gameFeedback.playPop();
    setAdminStatusMsg({ text: `Goal #${deletedTaskId} was successfully removed.` });
    setData((prev) => {
      if (!prev) return prev;
      const nextData = {
        ...prev,
        tasks: (prev.tasks || []).filter((t) => t.id !== deletedTaskId),
      };
      if (authenticatedUser) {
        try {
          localStorage.setItem(`habits_dashboard_cache_${authenticatedUser.id}`, JSON.stringify(nextData));
        } catch {}
      }
      return nextData;
    });
    if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setTodayTasksLimit((prev) => prev + 12);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    const el = todayTasksObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setAdminTasksLimit((prev) => prev + 15);
        }
      },
      { threshold: 0.1, rootMargin: "200px" }
    );
    const el = adminTasksObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  });

  useEffect(() => {
    const totalPages = cycleHistory?.totalPages ?? data?.cycleHistory?.totalPages ?? 1;
    const currentPage = cycleHistory?.page ?? 1;
    const hasMore = currentPage < totalPages;
    if (!hasMore || cycleHistoryLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchCycleHistory(currentPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "150px" }
    );
    const el = cycleHistoryObserverRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  });

  if (isAuthInitializing || (loading && !data && authenticatedUser)) {
    return (
      <div className="app-viewport-container">
        <div
          className="app-mobile-shell"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "35%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(255, 87, 51, 0.16) 55%, transparent 75%)",
              filter: "blur(40px)",
              animation: "pulseGlow 3s ease-in-out infinite alternate",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              animation: "logoFloat 3s ease-in-out infinite alternate",
            }}
          >
            <Image
              src="/logo.png"
              alt="HabiVenture"
              width={260}
              height={70}
              priority
              style={{
                width: "260px",
                maxWidth: "85vw",
                height: "auto",
                display: "block",
                filter: "drop-shadow(0 12px 28px rgba(0, 0, 0, 0.6))",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "160px",
                height: "4px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: "var(--radius-pill)",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div
                style={{
                  width: "50%",
                  height: "100%",
                  background: "linear-gradient(90deg, #10B981 0%, #FF5733 100%)",
                  borderRadius: "var(--radius-pill)",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                  animation: "loadingSlide 1.5s ease-in-out infinite",
                }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "var(--emerald-primary)",
                  boxShadow: "0 0 8px var(--emerald-primary)",
                  animation: "pulseGlow 1.2s infinite alternate",
                }}
              />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                Loading HabiVenture...
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticatedUser) {
    return (
      <div className="app-viewport-container">
        <div
          className="app-mobile-shell"
          style={{
            justifyContent: "space-between",
            padding: "calc(20px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 20px)) 16px",
            minHeight: "100dvh",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isDemoMode && <DemoCreatorBadge maxWidth="340px" />}
          <PwaInstallPrompt />
          <div style={{ textAlign: "center", width: "100%", margin: "auto 0", paddingBottom: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "6px" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "180px",
                    height: "90px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(255, 87, 51, 0.14) 60%, transparent 80%)",
                    filter: "blur(22px)",
                    pointerEvents: "none",
                  }}
                />
                <Image
                  src="/logo.png"
                  alt="HabiVenture"
                  width={190}
                  height={52}
                  priority
                  style={{
                    width: "190px",
                    maxWidth: "75vw",
                    height: "auto",
                    position: "relative",
                    zIndex: 1,
                    filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.5))",
                  }}
                />
              </div>
            </div>

            <p
              style={{
                fontSize: "10px",
                fontWeight: "900",
                color: "rgba(255, 255, 255, 0.4)",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              BUILD BETTER HABITS TOGETHER
            </p>

            <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Mascot
                  character="together"
                  mood={pinError ? "sad" : pinInput.length >= 2 ? "excited" : "wave"}
                  animation={pinError ? "surprise" : pinInput.length >= 2 ? "celebrate" : "wave"}
                  size={100}
                  interactive={false}
                />
              </div>
              <div className="hologram-pedestal" style={{ width: "130px" }} />
            </div>

            {isDemoMode && (
              <div
                style={{
                  width: "100%",
                  maxWidth: "340px",
                  margin: "0 auto 16px auto",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "18px",
                  padding: "12px 14px",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-secondary)" }}>
                    Select Guest Profile
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDemoData}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: "10px",
                      fontWeight: "600",
                      padding: "2px 4px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title="Reset demo data"
                  >
                    <RefreshIcon size={10} />
                    <span>Reset Data</span>
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={isVerifyingPin}
                    onClick={() => submitPin("1122")}
                    className="neo-btn"
                    style={{
                      padding: "8px 4px",
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "800" }}>Player A</span>
                    <span style={{ fontSize: "10px", color: "var(--emerald-glow)", fontWeight: "700" }}>1122</span>
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingPin}
                    onClick={() => submitPin("3344")}
                    className="neo-btn"
                    style={{
                      padding: "8px 4px",
                      background: "rgba(255, 87, 51, 0.12)",
                      border: "1px solid rgba(255, 87, 51, 0.3)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "800" }}>Player B</span>
                    <span style={{ fontSize: "10px", color: "#FF7A59", fontWeight: "700" }}>3344</span>
                  </button>

                  <button
                    type="button"
                    disabled={isVerifyingPin}
                    onClick={() => submitPin("9999")}
                    className="neo-btn"
                    style={{
                      padding: "8px 4px",
                      background: "rgba(139, 92, 246, 0.12)",
                      border: "1px solid rgba(139, 92, 246, 0.3)",
                      borderRadius: "12px",
                      color: "#FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "2px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "11px", fontWeight: "800" }}>Admin</span>
                    <span style={{ fontSize: "10px", color: "#C4B5FD", fontWeight: "700" }}>9999</span>
                  </button>
                </div>
              </div>
            )}

            <div
              style={{
                minHeight: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 14px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  fontSize: pinError ? "12px" : "13px",
                  color: pinError ? "#FF7A59" : "rgba(255, 255, 255, 0.8)",
                  fontWeight: pinError ? "800" : "700",
                  lineHeight: 1.35,
                  transition: "color 0.2s ease",
                  textAlign: "center",
                }}
              >
                {pinError || "Enter your 4-digit PIN to unlock your account"}
              </p>
            </div>

            <div
              className={pinError ? "pin-shake" : ""}
              role="status"
              aria-label={`PIN entry: ${pinInput.length} of 4 digits entered`}
              aria-live="polite"
              style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "24px" }}
            >
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                const isError = Boolean(pinError);
                return (
                  <div
                    key={idx}
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: "2px solid " + (isError ? "#FF7A59" : filled ? "var(--emerald-primary)" : "rgba(255, 255, 255, 0.25)"),
                      backgroundColor: isError ? "rgba(255, 122, 89, 0.25)" : filled ? "var(--emerald-primary)" : "transparent",
                      transition: "all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      transform: filled ? "scale(1.2)" : "scale(1)",
                      boxShadow: isError ? "0 0 12px rgba(255, 122, 89, 0.6)" : filled ? "0 0 16px rgba(16, 185, 129, 0.8)" : "none",
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxWidth: "280px", margin: "0 auto 12px auto" }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="neo-keypad-btn"
                  disabled={isVerifyingPin}
                  onClick={() => handleKeypadPress(num)}
                >
                  {num}
                </button>
              ))}
              <div />
              <button
                type="button"
                className="neo-keypad-btn"
                disabled={isVerifyingPin}
                onClick={() => handleKeypadPress("0")}
              >
                0
              </button>
              <button
                type="button"
                className="neo-keypad-btn"
                style={{ fontSize: "20px", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                disabled={isVerifyingPin || pinInput.length === 0}
                onClick={handleBackspace}
                aria-label="Delete digit"
              >
                <BackspaceIcon size={20} color="var(--text-secondary)" />
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "14px" }}>
              <button
                type="button"
                onClick={() => {
                  gameFeedback.playPop();
                  setShowPairModal(true);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.35)",
                  fontSize: "11px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  transition: "color 0.2s ease",
                }}
              >
                <LockIcon size={12} color="rgba(255, 255, 255, 0.35)" />
                <span>Pair Trusted Device (Owner)</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!loading && data && (!data.configured || data.schemaReady === false)) {
    return (
      <div className="app-viewport-container">
        <main className="app-mobile-shell" style={{ padding: "40px 16px 24px 16px", justifyContent: "center" }}>
          <div className="neo-card" style={{ borderColor: "rgba(16, 185, 129, 0.4)", textAlign: "center", padding: "28px 20px" }}>
            <div style={{ marginBottom: "16px" }}>
              <Mascot
                character="together"
                mood="idea"
                animation="point"
                size={96}
                interactive={true}
                speechText="Initialize your Supabase database!"
              />
              <h1 style={{ fontSize: "20px", fontWeight: "900", marginTop: "14px", color: "#FFFFFF" }}>
                Supabase Connected!
              </h1>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                SQL tables need to be initialized in the Supabase editor.
              </p>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.12)", padding: "14px", borderRadius: "18px", fontSize: "12px", lineHeight: "1.5", marginBottom: "18px", color: "var(--emerald-glow)", fontWeight: "700", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
              Run <code>npx supabase db push</code> or execute the migration SQL in your Supabase Editor.
            </div>
            <button
              className="neo-btn neo-btn-emerald"
              style={{ width: "100%", fontSize: "13px", padding: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={() => authenticatedUser && fetchDashboard(authenticatedUser.id)}
            >
              <RefreshIcon size={16} />
              <span>Recheck & Refresh</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isSuperAdmin = authenticatedUser.role === "superadmin";
  const isCycleClosed = data?.activeCycle?.status === "closed";
  const partnerUser = data?.partnerUser;
  const storageInfo = getStorageInfo(data?.storageUsage);

  const userCharacter: "male" | "female" =
    authenticatedUser.gender
      ? authenticatedUser.gender
      : (authenticatedUser.id === 3 ? "female" : "male");
  const partnerCharacter: "male" | "female" =
    partnerUser?.gender
      ? partnerUser.gender
      : (partnerUser?.id === 3
        ? "female"
        : (partnerUser?.id === 2
          ? "male"
          : (userCharacter === "male" ? "female" : "male")));

  const currentScore = data?.scores?.currentScore ?? 0;
  const partnerScore = data?.scores?.partnerScore ?? 0;
  const scoreDiff = data?.scores?.scoreDiff ?? 0;
  const totalPoints = currentScore + partnerScore;
  const userPercent =
    totalPoints === 0 || currentScore === partnerScore
      ? 50
      : Math.max(12, Math.min(88, (currentScore / totalPoints) * 100));

  const playerAName = isSuperAdmin
    ? (data?.scores?.playerA?.name || data?.regularUsers?.[0]?.name || "Player A")
    : `${authenticatedUser.name} (You)`;
  const playerBName = isSuperAdmin
    ? (data?.scores?.playerB?.name || data?.regularUsers?.[1]?.name || "Player B")
    : (partnerUser?.name || "Partner");
  const sharedTasks = (data?.tasks || []).filter((t) => !t.is_personal);

  const partnerIncompleteTasks = (data?.tasks || []).filter((task) => {
    if (!partnerUser || task.is_personal) return false;
    const log = data?.todayLogs?.find(
      (l) => l.user_id === partnerUser.id && l.task_id === task.id
    );
    return log?.status !== "completed";
  });

  const myCompletedCount = (data?.tasks || []).filter((task) => {
    const log = data?.todayLogs?.find((l) => l.user_id === authenticatedUser.id && l.task_id === task.id);
    return log?.status === "completed";
  }).length;
  const myTotalCount = (data?.tasks || []).length;
  const completionPercent = myTotalCount > 0 ? Math.round((myCompletedCount / myTotalCount) * 100) : 0;

  const partnerCompletedCount = partnerUser
    ? (data?.tasks || []).filter((task) => {
        const log = data?.todayLogs?.find((l) => l.user_id === partnerUser.id && l.task_id === task.id);
        return log?.status === "completed";
      }).length
    : 0;

  const isScoreTied = scoreDiff === 0 && (currentScore > 0 || partnerScore > 0);

  let heroCharacter: MascotCharacter = "together";
  let mascotMood: MascotMood = "excited";
  let mascotSpeechBubble = "START YOUR DAY WITH FOCUS. KEEP YOUR STREAK ALIVE!";

  if (isScoreTied) {
    heroCharacter = "together";
    mascotMood = "tie";
    mascotSpeechBubble = "IT'S A TIE! KEEP UP THE MOMENTUM TOGETHER!";
  } else if (completionPercent === 100 && myTotalCount > 0) {
    heroCharacter = "together";
    mascotMood = "celebrating";
    mascotSpeechBubble = "ALL GOALS COMPLETED TODAY! WE ARE UNSTOPPABLE!";
  } else if (scoreDiff > 0) {
    heroCharacter = "together";
    mascotMood = "confident";
    mascotSpeechBubble = `YOU ARE LEADING BY +${scoreDiff} POINTS! KEEP THE PACE!`;
  } else if (scoreDiff < 0) {
    heroCharacter = "together";
    mascotMood = "behind";
    mascotSpeechBubble = `BEHIND BY ${Math.abs(scoreDiff)} POINTS! KNOCK OUT A GOAL NOW!`;
  }

  const getWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dayLabels = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
    const days = [];
    const todayIso = new Date().toISOString().split("T")[0];
    const weekStreakData = data?.streaks?.weekStreakDays;
    const weekStreakList: Array<{
      date?: string;
      hasCompleted?: boolean;
      isFullyCompleted?: boolean;
      isTeamCompleted?: boolean;
      isProtected?: boolean;
    }> = Array.isArray(weekStreakData) ? weekStreakData : [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      
      let streakInfo = weekStreakList.find((w) => w.date === iso);
      if (!streakInfo && weekStreakData && typeof weekStreakData === "object" && !Array.isArray(weekStreakData)) {
        const val = (weekStreakData as Record<string, any>)[iso];
        if (typeof val === "boolean") {
          streakInfo = { hasCompleted: val };
        } else if (val && typeof val === "object") {
          streakInfo = val;
        }
      }

      days.push({
        label: dayLabels[i],
        dateNum: d.getDate(),
        iso,
        isToday: iso === todayIso,
        isPast: iso < todayIso,
        hasCompleted: streakInfo?.hasCompleted ?? false,
        isFullyCompleted: streakInfo?.isFullyCompleted ?? false,
        isTeamCompleted: streakInfo?.isTeamCompleted ?? false,
        isProtected: streakInfo?.isProtected ?? false,
      });
    }
    return days;
  };

  const isEverydayTask = (t: Task) =>
    t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week));
  const isCycleTask = (t: Task) => t.frequency === "cycle";
  const isWeeklyTask = (t: Task) => !isEverydayTask(t) && !isCycleTask(t);

  const allVisibleTasks = (data?.tasks || []).filter((t) => {
    if (taskFilter === "shared") return !t.is_personal;
    if (taskFilter === "personal") return !!t.is_personal;
    return true;
  });

  const everydayTasks = allVisibleTasks.filter((t) => isEverydayTask(t));
  const weeklyTasks = allVisibleTasks.filter((t) => isWeeklyTask(t));
  const cycleTasks = allVisibleTasks.filter((t) => isCycleTask(t));

  const myCompletedEverydayCount = everydayTasks.filter((t) =>
    data?.todayLogs?.some(
      (l) => l.user_id === authenticatedUser?.id && l.task_id === t.id && l.status === "completed"
    )
  ).length;
  const myTotalEverydayCount = everydayTasks.length;

  const myCompletedWeeklyCount = weeklyTasks.filter((t) => {
    const prog = data?.weeklyProgress?.[t.id];
    return prog?.isTargetReached;
  }).length;
  const myTotalWeeklyCount = weeklyTasks.length;

  const pendingWeeklyTasks = weeklyTasks.filter((t) => {
    const prog = data?.weeklyProgress?.[t.id];
    return !prog?.isTargetReached;
  });

  const reachedWeeklyTasks = weeklyTasks.filter((t) => {
    const prog = data?.weeklyProgress?.[t.id];
    return !!prog?.isTargetReached;
  });

  const myCompletedCycleCount = cycleTasks.filter((t) => {
    const prog = data?.cycleTaskProgress?.[t.id];
    return prog?.completedInCycle;
  }).length;
  const myTotalCycleCount = cycleTasks.length;

  const sortTasks = (tasksList: Task[]) => {
    return [...tasksList].sort((a, b) => {
      const aCompleted = isCycleTask(a)
        ? Boolean(data?.cycleTaskProgress?.[a.id]?.completedInCycle)
        : Boolean(
            data?.todayLogs?.some(
              (l) => l.user_id === authenticatedUser?.id && l.task_id === a.id && l.status === "completed"
            )
          );
      const bCompleted = isCycleTask(b)
        ? Boolean(data?.cycleTaskProgress?.[b.id]?.completedInCycle)
        : Boolean(
            data?.todayLogs?.some(
              (l) => l.user_id === authenticatedUser?.id && l.task_id === b.id && l.status === "completed"
            )
          );

      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      if (Boolean(a.is_personal) !== Boolean(b.is_personal)) {
        return a.is_personal ? -1 : 1;
      }
      return Number(b.id) - Number(a.id);
    });
  };

  const rawDisplayedTasks =
    taskCategoryTab === "everyday"
      ? everydayTasks
      : taskCategoryTab === "weekly"
      ? pendingWeeklyTasks
      : cycleTasks;

  const displayedTasks = sortTasks(rawDisplayedTasks);

  const visibleDisplayedTasks = displayedTasks.slice(0, todayTasksLimit);
  const hasMoreTodayTasks = displayedTasks.length > todayTasksLimit;

  const allAdminTasks = data?.tasks || [];
  const filteredAdminTasks = allAdminTasks.filter((task) => {
    if (adminGoalFilter === "shared") return !task.is_personal;
    if (adminGoalFilter === "personal") return Boolean(task.is_personal);
    if (adminGoalFilter === "cycle") return task.frequency === "cycle";
    return true;
  });
  const visibleAdminTasks = filteredAdminTasks.slice(0, adminTasksLimit);
  const hasMoreAdminTasks = filteredAdminTasks.length > adminTasksLimit;

  return (
    <div className="app-viewport-container">
      <div className="app-mobile-shell">
        {celebration && (
          <div className="celebration-toast">
            {celebration}
          </div>
        )}

        {isDemoMode && <DemoCreatorBadge />}

        <header
          className="neo-card-glass"
          style={{
            marginBottom: "14px",
            padding: "12px 16px",
            borderRadius: "26px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
              <Mascot
                character={userCharacter}
                variant="avatar"
                size={40}
                showCrown={false}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                  <Image src="/icons/icon-192x192.png" alt="HabiVenture" width={12} height={12} style={{ width: "12px", height: "12px", objectFit: "contain" }} />
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--text-muted)", letterSpacing: "0.8px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {data?.activeCycle?.name
                      ? data.activeCycle.name.replace(/\s+cycle$/i, "").trim()
                      : "HABIVENTURE"}
                  </span>
                  {isSyncing && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        padding: "1px 6px",
                        borderRadius: "5px",
                        fontSize: "8.5px",
                        fontWeight: "800",
                        color: "var(--sky-primary)",
                        letterSpacing: "0.4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <SpinnerIcon size={9} color="var(--sky-primary)" />
                      <span>Syncing</span>
                    </span>
                  )}
                  {isDemoMode && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        padding: "1px 6px",
                        borderRadius: "5px",
                        fontSize: "8.5px",
                        fontWeight: "900",
                        color: "var(--emerald-glow)",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      DEMO
                    </span>
                  )}
                  {isSuperAdmin && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(139, 92, 246, 0.2)",
                        border: "1px solid rgba(139, 92, 246, 0.4)",
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: "900",
                        color: "#C4B5FD",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <ShieldIcon size={10} color="#A78BFA" />
                      <span>SUPER ADMIN</span>
                    </span>
                  )}
                  {isSuperAdmin && storageInfo && (
                    <button
                      type="button"
                      onClick={() => setShowStorageModal(true)}
                      title={`Supabase Storage: ${storageInfo.usedMb.toFixed(2)} MB used / ${storageInfo.maxFreeMb} MB total (${storageInfo.remainingMb.toFixed(2)} MB remaining)`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4.5px",
                        background: storageInfo.bgColor,
                        border: `1px solid ${storageInfo.borderColor}`,
                        padding: "2px 7px",
                        borderRadius: "6px",
                        fontSize: "9px",
                        fontWeight: "900",
                        color: storageInfo.themeColor,
                        letterSpacing: "0.4px",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <DatabaseIcon size={10} color={storageInfo.themeColor} />
                      <span>{storageInfo.usedMb < 0.01 && storageInfo.approxBytes > 0 ? "< 0.01" : storageInfo.usedMb.toFixed(2)} / {storageInfo.maxFreeMb} MB</span>
                    </button>
                  )}
                </div>
                <h1 style={{ fontSize: "15px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-0.3px", lineHeight: 1.2, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Hello, {authenticatedUser.name}!
                </h1>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {!isSuperAdmin && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    background: "rgba(255, 87, 51, 0.12)",
                    border: "1px solid rgba(255, 87, 51, 0.35)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    cursor: "pointer",
                    transition: "transform 0.15s ease",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onClick={() => openStreakCelebration(false)}
                  title="Open Streak Celebration"
                >
                  <StreakFlame
                    streak={data?.streaks?.personalStreak ?? 0}
                    size="sm"
                    isTodayCompleted={myCompletedCount > 0}
                  />
                </div>
              )}

              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setChangePinInitialMode("edit");
                    setChangePinTargetId(authenticatedUser.id);
                    setShowChangePinModal(true);
                  }}
                  className="neo-btn neo-btn-glass"
                  style={{ width: "34px", height: "34px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Super Admin PIN Settings"
                >
                  <KeyIcon size={16} color="var(--emerald-primary)" />
                </button>
              )}

              {isDemoMode && (
                <button
                  type="button"
                  onClick={handleResetDemoData}
                  className="neo-btn neo-btn-glass"
                  style={{ width: "34px", height: "34px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Reset Demo Data"
                >
                  <RefreshIcon size={14} color="var(--text-secondary)" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  gameFeedback.playPop();
                  setShowLogoutModal(true);
                }}
                className="neo-btn neo-btn-glass"
                style={{ width: "34px", height: "34px", borderRadius: "50%", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Switch Account / Log Out"
              >
                <LogOutIcon size={16} color="var(--text-secondary)" />
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {getWeekDays().map((day) => (
              <div
                key={day.iso}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 2px",
                  borderRadius: "14px",
                  background: day.isToday
                    ? "rgba(16, 185, 129, 0.18)"
                    : day.isProtected
                    ? "rgba(99, 102, 241, 0.16)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: day.isToday
                    ? "1px solid rgba(16, 185, 129, 0.5)"
                    : day.isProtected
                    ? "1px solid rgba(129, 140, 248, 0.5)"
                    : "1px solid var(--border-subtle)",
                }}
                title={
                  day.isProtected
                    ? "Streak Shielded: Missed day protected by Streak Shield"
                    : day.hasCompleted
                    ? "Completed goal(s)"
                    : undefined
                }
              >
                <span style={{ fontSize: "9px", fontWeight: "800", color: day.isToday ? "var(--emerald-glow)" : day.isProtected ? "#A5B4FC" : "var(--text-muted)" }}>
                  {day.label}
                </span>
                <span className="num-font" style={{ fontSize: "13px", fontWeight: "900", color: day.isToday ? "#FFFFFF" : day.isProtected ? "#E0E7FF" : "var(--text-secondary)", marginTop: "1px" }}>
                  {day.dateNum}
                </span>
                <div style={{ marginTop: "3px", height: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {day.hasCompleted ? (
                    <FlameIcon size={10} color="#FF5733" />
                  ) : day.isProtected ? (
                    <ShieldIcon size={10} color="#818CF8" />
                  ) : day.isToday ? (
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--emerald-primary)", boxShadow: "0 0 6px var(--emerald-primary)" }} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </header>

        <main style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <PwaInstallPrompt />
          {activeTab === "today" && isSuperAdmin ? (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                className="neo-card"
                style={{
                  border: "1.5px solid rgba(139, 92, 246, 0.4)",
                  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(18, 24, 19, 0.95) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "#A78BFA", letterSpacing: "1px", textTransform: "uppercase" }}>
                    ADMINISTRATOR MODE
                  </span>
                  <button
                    type="button"
                    className="neo-btn neo-btn-emerald"
                    style={{
                      fontSize: "11px",
                      padding: "7px 14px",
                      whiteSpace: "nowrap",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                    }}
                    onClick={() => setActiveTab("admin")}
                  >
                    <ShieldIcon size={14} />
                    <span>Admin Console</span>
                  </button>
                </div>

                <div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF" }}>
                    Live Player Habit Monitor
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "3px", lineHeight: 1.4 }}>
                    Super Admin accounts do not have personal tasks. Monitor Player A &amp; Player B&apos;s daily completion below, or manage shared goals in the Admin tab.
                  </div>
                </div>
              </div>

              <div className="neo-hero-vault">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase", minWidth: 0 }}>
                    PLAYER ACCOUNTABILITY DUEL
                  </span>
                  <div
                    onClick={() => setShowCycleResultModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#FCD34D",
                      cursor: "pointer",
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <DiceIcon size={13} color="#FCD34D" />
                    <span>Punishment Wheel</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                    <Mascot character="male" variant="avatar" size={44} showCrown={false} />
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--emerald-glow)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px", maxWidth: "95px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={playerAName}>
                      {playerAName}
                    </div>
                    <div className="num-font" style={{ fontSize: "36px", fontWeight: "900", color: "#FFFFFF", lineHeight: 1.1, marginTop: "2px" }}>
                      <AnimatedNumber value={currentScore} />
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "0.5px" }}>PTS</span>
                  </div>

                  <div style={{ padding: "4px 10px", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid var(--border-glass)", fontWeight: "900", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px", flexShrink: 0 }}>
                    VS
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                    <Mascot character="female" variant="avatar" size={44} showCrown={false} />
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--coral-glow)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px", maxWidth: "95px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={playerBName}>
                      {playerBName}
                    </div>
                    <div className="num-font" style={{ fontSize: "36px", fontWeight: "900", color: "#FF7A59", lineHeight: 1.1, marginTop: "2px" }}>
                      <AnimatedNumber value={partnerScore} />
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "0.5px" }}>PTS</span>
                  </div>
                </div>

                <div className="tug-of-war-track" style={{ marginBottom: "14px" }}>
                  <div className="tug-of-war-fill-user" style={{ width: `${userPercent}%` }} />
                  <div className="tug-of-war-fill-partner" style={{ width: `${100 - userPercent}%` }} />
                </div>
              </div>

              <div className="neo-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--sky-primary)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      TODAY&apos;S HABIT CHECKLIST
                    </span>
                    <h2 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      Players&apos; Daily Progress
                    </h2>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: "10px" }}>
                    {sharedTasks.length} Goals
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {sharedTasks.map((task) => {
                    const isEveryday = task.frequency === "daily" || (!task.frequency && (task.target_days_per_week === 7 || !task.target_days_per_week));
                    const playerAId = data?.scores?.playerA?.id || data?.regularUsers?.[0]?.id;
                    const playerBId = data?.scores?.playerB?.id || data?.regularUsers?.[1]?.id;
                    const isPlayerADone = Boolean(data?.todayLogs?.some((l) => l.user_id === playerAId && l.task_id === task.id && l.status === "completed"));
                    const isPlayerBDone = Boolean(data?.todayLogs?.some((l) => l.user_id === playerBId && l.task_id === task.id && l.status === "completed"));

                    return (
                      <div
                        key={task.id}
                        style={{
                          background: "var(--bg-surface-input)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "16px",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", wordBreak: "break-word" }}>
                              {task.name}
                            </div>
                            {task.description && task.description.trim() && task.description.trim() !== "Personal habit" && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "rgba(255, 255, 255, 0.65)",
                                  fontStyle: "italic",
                                  marginTop: "2px",
                                  lineHeight: 1.35,
                                }}
                              >
                                &ldquo;{task.description.trim()}&rdquo;
                              </div>
                            )}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: "800",
                                  color: isEveryday ? "var(--emerald-glow)" : "#A78BFA",
                                  background: isEveryday ? "rgba(16, 185, 129, 0.12)" : "rgba(139, 92, 246, 0.15)",
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                }}
                              >
                                {isEveryday ? "Everyday Task" : `Weekly Task (${task.target_days_per_week || 2}x)`}
                              </span>
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: "800",
                                  color: "var(--sky-primary)",
                                  background: "rgba(56, 189, 248, 0.12)",
                                  padding: "2px 6px",
                                  borderRadius: "6px",
                                }}
                              >
                                +{task.base_score || (isEveryday ? 10 : 15)} PTS
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingTask(task);
                              setIsEditTaskModalOpen(true);
                            }}
                            className="neo-btn neo-btn-glass"
                            style={{ fontSize: "10px", padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
                          >
                            <EditIcon size={12} />
                            <span>Edit Goal</span>
                          </button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", minWidth: 0 }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{playerAName}:</span>
                            {isPlayerADone ? (
                              <span style={{ color: "var(--emerald-glow)", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                <CheckCircleIcon size={12} color="var(--emerald-glow)" /> Done
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                <ClockIcon size={12} color="var(--text-muted)" /> Pending
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", minWidth: 0 }}>
                            <span style={{ color: "var(--text-secondary)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{playerBName}:</span>
                            {isPlayerBDone ? (
                              <span style={{ color: "var(--emerald-glow)", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                <CheckCircleIcon size={12} color="var(--emerald-glow)" /> Done
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
                                <ClockIcon size={12} color="var(--text-muted)" /> Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === "today" ? (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="neo-hero-vault">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase", minWidth: 0 }}>
                    ACCOUNTABILITY DUEL
                  </span>
                  <div
                    onClick={() => setShowCycleResultModal(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#FCD34D",
                      cursor: "pointer",
                      background: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      flexShrink: 0,
                    }}
                  >
                    <DiceIcon size={13} color="#FCD34D" />
                    <span>Punishment Wheel</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                    <Mascot character={userCharacter} variant="avatar" size={44} showCrown={false} />
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--emerald-glow)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px", maxWidth: "95px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={`${authenticatedUser.name} (You)`}>
                      {authenticatedUser.name} (You)
                    </div>
                    <div className="num-font" style={{ fontSize: "36px", fontWeight: "900", color: "#FFFFFF", lineHeight: 1.1, marginTop: "2px" }}>
                      <AnimatedNumber value={currentScore} />
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "0.5px" }}>PTS</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    <div style={{ padding: "4px 10px", borderRadius: "14px", backgroundColor: "rgba(255, 255, 255, 0.08)", border: "1px solid var(--border-glass)", fontWeight: "900", fontSize: "11px", color: "var(--text-secondary)", letterSpacing: "1px" }}>
                      VS
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 0 }}>
                    <Mascot character={partnerCharacter} variant="avatar" size={44} showCrown={false} />
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--coral-glow)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px", maxWidth: "95px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" }} title={partnerUser?.name || "Partner"}>
                      {partnerUser?.name || "Partner"}
                    </div>
                    <div className="num-font" style={{ fontSize: "36px", fontWeight: "900", color: "#FF7A59", lineHeight: 1.1, marginTop: "2px" }}>
                      <AnimatedNumber value={partnerScore} />
                    </div>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "0.5px" }}>PTS</span>
                  </div>
                </div>

                <div className="tug-of-war-track" style={{ marginBottom: "14px" }}>
                  <div className="tug-of-war-fill-user" style={{ width: `${userPercent}%` }} />
                  <div className="tug-of-war-fill-partner" style={{ width: `${100 - userPercent}%` }} />
                </div>

                <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
                  {scoreDiff > 0 ? (
                    <>
                      <Mascot character="together" mood="confident" animation="cheer" size={32} />
                      <span style={{ color: "var(--emerald-glow)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <TrendingUpIcon size={14} color="var(--emerald-glow)" />
                        <span>You lead by +{scoreDiff} points!</span>
                      </span>
                    </>
                  ) : scoreDiff < 0 ? (
                    <>
                      <Mascot character="together" mood="behind" animation="bounce" size={32} />
                      <span style={{ color: "var(--coral-glow)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <ZapIcon size={14} color="var(--coral-glow)" />
                        <span>Trailing by {Math.abs(scoreDiff)} points. Catch up now!</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Mascot character="together" mood="tie" animation="wave" size={32} />
                      <span style={{ color: "var(--sky-primary)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <ScaleIcon size={14} color="var(--sky-primary)" />
                        <span>Tied score! Keep the synergy strong!</span>
                      </span>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "4px" }}>
                  <div style={{ marginBottom: "12px", textAlign: "center" }}>
                    <div className="neo-speech-bubble">
                      {mascotSpeechBubble}
                    </div>
                  </div>
                  <Mascot
                    character={heroCharacter}
                    mood={mascotJoyBurst ? "celebrating" : mascotMood}
                    animation={
                      mascotJoyBurst
                        ? "jump"
                        : completionPercent === 100
                        ? "celebrate"
                        : scoreDiff > 0
                        ? "cheer"
                        : scoreDiff < 0
                        ? "bounce"
                        : isScoreTied
                        ? "wave"
                        : "bounce"
                    }
                    size={heroCharacter === "together" ? 145 : 125}
                    showCrown={false}
                    interactive={true}
                    particles={completionPercent === 100 ? "confetti" : mascotJoyBurst ? "stars" : "none"}
                  />
                  <div className="hologram-pedestal" />
                </div>
              </div>

              <div
                className="neo-card"
                style={{
                  padding: "16px 14px 12px 14px",
                  background: "linear-gradient(180deg, #18221B 0%, #101813 100%)",
                  border: `1px solid ${
                    (data?.streaks?.teamStreak ?? 0) >= 30
                      ? getStreakTier(data?.streaks?.teamStreak ?? 0).borderColor
                      : getStreakTier(data?.streaks?.personalStreak ?? 0).borderColor
                  }`,
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div
                    onClick={() => openStreakCelebration(false)}
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "12px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Click to view Personal Streak celebration"
                  >
                    <StreakFlame
                      streak={data?.streaks?.personalStreak ?? 0}
                      size="md"
                      showLabel={false}
                      isTodayCompleted={myCompletedCount > 0}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span
                          className="num-font"
                          style={{
                            fontSize: "22px",
                            fontWeight: 900,
                            color: getStreakTier(data?.streaks?.personalStreak ?? 0).textColor,
                            lineHeight: 1,
                          }}
                        >
                          <AnimatedNumber value={data?.streaks?.personalStreak ?? 0} />
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "900", color: "#FFFFFF" }}>
                          Days
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: "900", color: "var(--text-muted)", letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Personal
                      </div>
                      <div style={{ fontSize: "9px", fontWeight: "800", color: myCompletedCount > 0 ? "var(--emerald-glow)" : "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {myCompletedCount > 0 ? "Active today" : "Needs check-in"}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginTop: "6px",
                          padding: "2px 6px",
                          borderRadius: "8px",
                          background: (data?.streaks?.protectsRemaining ?? 3) > 0 ? "rgba(99, 102, 241, 0.14)" : "rgba(239, 68, 68, 0.14)",
                          border: (data?.streaks?.protectsRemaining ?? 3) > 0 ? "1px solid rgba(129, 140, 248, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <ShieldIcon size={10} color={(data?.streaks?.protectsRemaining ?? 3) > 0 ? "#818CF8" : "#EF4444"} />
                        <span className="num-font" style={{ fontSize: "9px", fontWeight: "900", color: (data?.streaks?.protectsRemaining ?? 3) > 0 ? "#C7D2FE" : "#FCA5A5", whiteSpace: "nowrap" }}>
                          {data?.streaks?.protectsRemaining ?? 3}/3 Shield
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => openStreakCelebration(true)}
                    style={{
                      background: (data?.streaks?.teamStreak ?? 0) >= 30 ? "rgba(56, 189, 248, 0.06)" : "rgba(255, 255, 255, 0.03)",
                      border: (data?.streaks?.teamStreak ?? 0) >= 30 ? `1px solid ${getStreakTier(data?.streaks?.teamStreak ?? 0).borderColor}` : "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "16px",
                      padding: "12px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    title="Click to view Team Synergy celebration"
                  >
                    <StreakFlame
                      streak={data?.streaks?.teamStreak ?? 0}
                      size="md"
                      showLabel={false}
                      isTodayCompleted={myCompletedCount > 0 && partnerCompletedCount > 0}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span
                          className="num-font"
                          style={{
                            fontSize: "22px",
                            fontWeight: 900,
                            color: getStreakTier(data?.streaks?.teamStreak ?? 0).textColor,
                            lineHeight: 1,
                          }}
                        >
                          <AnimatedNumber value={data?.streaks?.teamStreak ?? 0} />
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: "900", color: "#FFFFFF" }}>
                          Days
                        </span>
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: "900", color: getStreakTier(data?.streaks?.teamStreak ?? 0).textColor, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Team Duo
                      </div>
                      <div style={{ fontSize: "9px", fontWeight: "800", color: myCompletedCount > 0 && partnerCompletedCount > 0 ? "var(--emerald-glow)" : "var(--text-muted)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {myCompletedCount > 0 && partnerCompletedCount > 0 ? "Both active today" : "Requires both"}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          marginTop: "6px",
                          padding: "2px 6px",
                          borderRadius: "8px",
                          background: (data?.streaks?.teamProtectsRemaining ?? 3) > 0 ? "rgba(99, 102, 241, 0.14)" : "rgba(239, 68, 68, 0.14)",
                          border: (data?.streaks?.teamProtectsRemaining ?? 3) > 0 ? "1px solid rgba(129, 140, 248, 0.35)" : "1px solid rgba(239, 68, 68, 0.35)",
                          flexShrink: 0,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <ShieldIcon size={10} color={(data?.streaks?.teamProtectsRemaining ?? 3) > 0 ? "#818CF8" : "#EF4444"} />
                        <span className="num-font" style={{ fontSize: "9px", fontWeight: "900", color: (data?.streaks?.teamProtectsRemaining ?? 3) > 0 ? "#C7D2FE" : "#FCA5A5", whiteSpace: "nowrap" }}>
                          {data?.streaks?.teamProtectsRemaining ?? 3}/3 Shield
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "8px",
                    paddingTop: "7px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "4px",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                    fontWeight: "600",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    <ShieldIcon size={11} color="var(--sky-primary)" />
                    <span>Shields auto-protect missed days</span>
                  </span>
                  <span>Refreshes each cycle</span>
                </div>
              </div>

              {isCycleClosed && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)",
                    border: "1.5px solid rgba(245, 158, 11, 0.4)",
                    borderRadius: "18px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "rgba(245, 158, 11, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <LockIcon size={18} color="#FBBF24" />
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "900", color: "#FFFFFF" }}>
                        Cycle Closed & Scores Frozen
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {data?.activeCycle?.name || "Current cycle"} is closed. Launch the next cycle to begin recording goals!
                      </div>
                    </div>
                  </div>

                  {isSuperAdmin ? (
                    <button
                      type="button"
                      className="neo-btn neo-btn-emerald"
                      style={{ fontSize: "11px", padding: "8px 14px", flexShrink: 0 }}
                      onClick={openStartCycleModal}
                    >
                      Start Next Cycle
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="neo-btn neo-btn-glass"
                      style={{ fontSize: "11px", padding: "8px 14px", flexShrink: 0 }}
                      onClick={() => setActiveTab("standings")}
                    >
                      View Final Standings
                    </button>
                  )}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF" }}>
                      Today&apos;s Goals
                    </h2>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700" }}>
                      {taskCategoryTab === "everyday"
                        ? `${myCompletedEverydayCount} of ${myTotalEverydayCount} everyday goals completed today`
                        : `${myCompletedWeeklyCount} of ${myTotalWeeklyCount} weekly targets achieved this week`}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="neo-btn neo-btn-glass"
                    style={{ padding: "6px 14px", fontSize: "11px", borderRadius: "var(--radius-pill)", flexShrink: 0 }}
                    onClick={() => {
                      setEditingPersonalTask(null);
                      setShowPersonalTaskModal(true);
                    }}
                  >
                    + Personal Habit
                  </button>
                </div>

                <div className="neo-tabs-bar" style={{ padding: "4px", gap: "2px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      gameFeedback.playPop();
                      setTaskCategoryTab("everyday");
                    }}
                    className={`neo-tab-pill ${taskCategoryTab === "everyday" ? "active" : ""}`}
                    style={{ flex: 1, minWidth: 0, padding: "7px 6px", fontSize: "11px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <ZapIcon size={12} color="var(--emerald-primary)" />
                      <span>Everyday ({everydayTasks.length})</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameFeedback.playPop();
                      setTaskCategoryTab("weekly");
                    }}
                    className={`neo-tab-pill ${taskCategoryTab === "weekly" ? "active" : ""}`}
                    style={{ flex: 1, minWidth: 0, padding: "7px 6px", fontSize: "11px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <TargetIcon size={12} color="#A78BFA" />
                      <span>Weekly ({pendingWeeklyTasks.length})</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      gameFeedback.playPop();
                      setTaskCategoryTab("cycle");
                    }}
                    className={`neo-tab-pill ${taskCategoryTab === "cycle" ? "active" : ""}`}
                    style={{ flex: 1, minWidth: 0, padding: "7px 6px", fontSize: "11px" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <SparkleIcon size={12} color="#FBBF24" />
                      <span>Cycle ({cycleTasks.length})</span>
                    </span>
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", padding: "0 2px" }}>
                  <span style={{ fontSize: "10px", color: taskCategoryTab === "everyday" ? "var(--emerald-glow)" : taskCategoryTab === "weekly" ? "#A78BFA" : "#FBBF24", fontWeight: "800", display: "inline-flex", alignItems: "center", gap: "4px", minWidth: 0, flex: 1, lineHeight: 1.35 }}>
                    {taskCategoryTab === "everyday" ? (
                      <>
                        <SparkleIcon size={11} color="var(--emerald-glow)" />
                        <span>Daily Streak requires Everyday Goals</span>
                      </>
                    ) : taskCategoryTab === "weekly" ? (
                      <>
                        <TargetIcon size={11} color="#A78BFA" />
                        <span>Higher points (+15 PTS) • Independent from Daily Streak</span>
                      </>
                    ) : (
                      <>
                        <SparkleIcon size={11} color="#FBBF24" />
                        <span>Highest reward (+50 PTS) • 1x per cycle • Cycle Streak</span>
                      </>
                    )}
                  </span>

                  <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("all")}
                      style={{
                        background: taskFilter === "all" ? "rgba(255, 255, 255, 0.14)" : "transparent",
                        border: "none",
                        color: taskFilter === "all" ? "#FFFFFF" : "var(--text-muted)",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("shared")}
                      style={{
                        background: taskFilter === "shared" ? "rgba(255, 255, 255, 0.14)" : "transparent",
                        border: "none",
                        color: taskFilter === "shared" ? "#FFFFFF" : "var(--text-muted)",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Shared
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("personal")}
                      style={{
                        background: taskFilter === "personal" ? "rgba(255, 255, 255, 0.14)" : "transparent",
                        border: "none",
                        color: taskFilter === "personal" ? "#FFFFFF" : "var(--text-muted)",
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        cursor: "pointer",
                      }}
                    >
                      Personal
                    </button>
                  </div>
                </div>
              </div>

              {displayedTasks.length === 0 ? (
                <div className="neo-card" style={{ textAlign: "center", padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                  <Mascot
                    character="together"
                    mood={taskCategoryTab === "weekly" ? "winner" : taskCategoryTab === "cycle" ? "toast" : "idea"}
                    animation={taskCategoryTab === "weekly" ? "celebrate" : taskCategoryTab === "cycle" ? "bounce" : "point"}
                    size={105}
                    interactive={true}
                    speechText={taskCategoryTab === "weekly" ? "All weekly targets reached!" : taskCategoryTab === "cycle" ? "Big monthly milestones await!" : "Let's add a new habit!"}
                  />
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "#FFFFFF" }}>
                    {taskCategoryTab === "weekly" && reachedWeeklyTasks.length > 0
                      ? "All Weekly Goals Achieved for This Week!"
                      : taskFilter === "personal"
                      ? "No Personal Habits Yet"
                      : taskFilter === "shared"
                      ? "No Shared Goals Yet"
                      : taskCategoryTab === "cycle"
                      ? "No Cycle Quests Pending"
                      : `No ${taskCategoryTab === "everyday" ? "Everyday" : "Weekly"} Goals Pending`}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "260px", lineHeight: 1.4 }}>
                    {taskCategoryTab === "weekly" && reachedWeeklyTasks.length > 0
                      ? "Great job! Weekly goals reset automatically next Monday."
                      : taskCategoryTab === "cycle"
                      ? "Cycle goals (e.g. Monthly Savings) reward the highest points (+50 PTS) and must be completed once before the cycle ends!"
                      : "Add your goals to maintain consistency and level up together."}
                  </p>
                  {(taskCategoryTab === "everyday" || taskCategoryTab === "cycle") && (
                    <button
                      type="button"
                      className="neo-btn neo-btn-emerald"
                      style={{ fontSize: "12px", padding: "10px 18px", marginTop: "4px" }}
                      onClick={() => {
                        setEditingPersonalTask(null);
                        setShowPersonalTaskModal(true);
                      }}
                    >
                      + Add New Habit
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {visibleDisplayedTasks.map((task) => {
                    const isEveryday = isEverydayTask(task);
                    const isCycle = isCycleTask(task);
                    const isWeekly = isWeeklyTask(task);
                    const weeklyProg = data?.weeklyProgress?.[task.id];
                    const cycleProg = data?.cycleTaskProgress?.[task.id];

                    const isCompleted = isCycle
                      ? Boolean(cycleProg?.completedInCycle)
                      : data?.todayLogs?.some(
                          (l) => l.user_id === authenticatedUser.id && l.task_id === task.id && l.status === "completed"
                        );
                    const partnerCompleted = isCycle
                      ? Boolean(cycleProg?.partnerCompletedInCycle)
                      : Boolean(partnerUser && data?.todayLogs?.some(
                          (l) => l.user_id === partnerUser.id && l.task_id === task.id && l.status === "completed"
                        ));
                    const isPersonal = task.is_personal;
                    const pointsValue = isCycle ? (task.base_score || 50) : task.base_score || (isEveryday ? 10 : 15);

                    return (
                      <div
                        key={task.id}
                        className="neo-card"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 16px",
                          borderColor: isCompleted ? "rgba(16, 185, 129, 0.35)" : isCycle ? "rgba(245, 158, 11, 0.25)" : "var(--border-subtle)",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, marginRight: "12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                              {isPersonal ? (
                                <SproutIcon size={18} color="var(--sky-primary)" />
                              ) : isCycle ? (
                                <SparkleIcon size={18} color="#FBBF24" />
                              ) : isEveryday ? (
                                <TargetIcon size={18} color="var(--emerald-primary)" />
                              ) : (
                                <TargetIcon size={18} color="#A78BFA" />
                              )}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", textDecoration: isCompleted ? "line-through" : "none", opacity: isCompleted ? 0.75 : 1, wordBreak: "break-word" }}>
                              {task.name}
                            </span>
                          </div>

                          {task.description && task.description.trim() && task.description.trim() !== "Personal habit" && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "rgba(255, 255, 255, 0.65)",
                                marginTop: "3px",
                                marginLeft: "26px",
                                lineHeight: 1.35,
                                fontStyle: "italic",
                                opacity: isCompleted ? 0.55 : 0.85,
                              }}
                            >
                              &ldquo;{task.description.trim()}&rdquo;
                            </div>
                          )}

                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", flexWrap: "wrap" }}>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "800",
                                color: isPersonal ? "var(--sky-primary)" : isCycle ? "#FBBF24" : isEveryday ? "var(--emerald-glow)" : "#A78BFA",
                                background: isPersonal ? "rgba(56, 189, 248, 0.12)" : isCycle ? "rgba(245, 158, 11, 0.15)" : isEveryday ? "rgba(16, 185, 129, 0.12)" : "rgba(139, 92, 246, 0.15)",
                                border: isCycle ? "1px solid rgba(245, 158, 11, 0.3)" : undefined,
                                padding: "2px 7px",
                                borderRadius: "8px",
                              }}
                            >
                              {isPersonal ? "PERSONAL" : isCycle ? `+${pointsValue} PTS • CYCLE QUEST` : `+${pointsValue} PTS`}
                            </span>

                            {isPersonal && task.created_by === authenticatedUser.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPersonalTask(task);
                                  setShowPersonalTaskModal(true);
                                }}
                                style={{
                                  background: "rgba(56, 189, 248, 0.12)",
                                  border: "1px solid rgba(56, 189, 248, 0.3)",
                                  borderRadius: "6px",
                                  padding: "2px 6px",
                                  color: "var(--sky-primary)",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  cursor: "pointer",
                                }}
                                title="Edit personal habit"
                              >
                                <EditIcon size={10} color="var(--sky-primary)" />
                                <span>Edit</span>
                              </button>
                            )}

                            {isCycle && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "800",
                                  color: "#FBBF24",
                                  background: "rgba(245, 158, 11, 0.12)",
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                  padding: "2px 7px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <span>Target: 1x / Cycle</span>
                              </span>
                            )}

                            {isWeekly && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "800",
                                  color: "#A78BFA",
                                  background: "rgba(139, 92, 246, 0.12)",
                                  border: "1px solid rgba(139, 92, 246, 0.3)",
                                  padding: "2px 7px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                }}
                              >
                                <span>Target: {task.target_days_per_week || 2}x / Week</span>
                              </span>
                            )}

                            {isCycle && (() => {
                              const pStreak = cycleProg?.personalCycleStreak ?? 0;
                              const tStreak = cycleProg?.teamCycleStreak ?? 0;
                              return (
                                <>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      color: pStreak > 0 ? "#FBBF24" : "var(--text-muted)",
                                      background: pStreak > 0 ? "rgba(245, 158, 11, 0.12)" : "rgba(255, 255, 255, 0.04)",
                                      border: pStreak > 0 ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid var(--border-subtle)",
                                      padding: "2px 7px",
                                      borderRadius: "8px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    title={`Personal Cycle Streak: ${pStreak} consecutive cycles completed`}
                                  >
                                    <FlameIcon size={11} color={pStreak > 0 ? "#FBBF24" : "var(--text-muted)"} />
                                    <span>{pStreak} Cycle Streak</span>
                                  </span>

                                  {!isPersonal && partnerUser && (
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        color: tStreak > 0 ? "#10B981" : "var(--text-muted)",
                                        background: tStreak > 0 ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.04)",
                                        border: tStreak > 0 ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid var(--border-subtle)",
                                        padding: "2px 7px",
                                        borderRadius: "8px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "3px",
                                      }}
                                      title={`Team Cycle Streak: ${tStreak} consecutive cycles both partners completed together`}
                                    >
                                      <SparkleIcon size={11} color={tStreak > 0 ? "#10B981" : "var(--text-muted)"} />
                                      <span>{tStreak} Team Streak</span>
                                    </span>
                                  )}
                                </>
                              );
                            })()}

                            {isEveryday && (() => {
                              const isLanguageTask = task.name.toLowerCase().includes("language");
                              const tTotalDays = data?.taskTotalDays?.[task.id] ?? 0;
                              const tStreak = data?.taskStreaks?.[task.id] ?? 0;

                              if (isLanguageTask) {
                                return (
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: "800",
                                      color: tTotalDays > 0 ? "#FF7A59" : "var(--text-muted)",
                                      background: tTotalDays > 0 ? "rgba(255, 87, 51, 0.12)" : "rgba(255, 255, 255, 0.04)",
                                      border: tTotalDays > 0 ? "1px solid rgba(255, 87, 51, 0.3)" : "1px solid var(--border-subtle)",
                                      padding: "2px 7px",
                                      borderRadius: "8px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "3px",
                                    }}
                                    title={`All-time practice journey: ${tTotalDays} total days completed (never resets)`}
                                  >
                                    <FlameIcon size={11} color={tTotalDays > 0 ? "#FF7A59" : "var(--text-muted)"} />
                                    <span>{tTotalDays} {tTotalDays === 1 ? "Day" : "Days"} Done</span>
                                  </span>
                                );
                              }

                              return (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    fontWeight: "800",
                                    color: tStreak > 0 ? "#FF7A59" : "var(--text-muted)",
                                    background: tStreak > 0 ? "rgba(255, 87, 51, 0.12)" : "rgba(255, 255, 255, 0.04)",
                                    border: tStreak > 0 ? "1px solid rgba(255, 87, 51, 0.3)" : "1px solid var(--border-subtle)",
                                    padding: "2px 7px",
                                    borderRadius: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                  title={`Consistency streak for this task: ${tStreak} consecutive days`}
                                >
                                  <FlameIcon size={11} color={tStreak > 0 ? "#FF7A59" : "var(--text-muted)"} />
                                  <span>{tStreak} Day Streak</span>
                                </span>
                              );
                            })()}

                            {partnerUser && !isPersonal && (
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "800",
                                  color: partnerCompleted ? "var(--emerald-glow)" : "#FBBF24",
                                  background: partnerCompleted ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.08)",
                                  border: partnerCompleted ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.25)",
                                  padding: "2px 8px",
                                  borderRadius: "8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                title={
                                  partnerCompleted
                                    ? `Partner status: ${partnerUser.name} has completed this goal!`
                                    : `Partner status: ${partnerUser.name} has not completed this goal yet. You can still complete yours independently!`
                                }
                              >
                                <Mascot character={partnerCharacter} variant="avatar" size={14} />
                                <span style={{ color: "rgba(255, 255, 255, 0.7)" }}>Partner ({partnerUser.name}):</span>
                                {partnerCompleted ? (
                                  <span style={{ color: "var(--emerald-glow)", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                    <span>{isCycle ? "Done for cycle" : "Done today"}</span>
                                    {isWeekly && weeklyProg && (
                                      <span style={{ opacity: 0.85 }}>({weeklyProg.partnerCompletedDaysThisWeek}/{weeklyProg.targetDays})</span>
                                    )}
                                    <CheckIcon size={10} color="var(--emerald-glow)" strokeWidth={3} />
                                  </span>
                                ) : (
                                  <span style={{ color: "#FBBF24", display: "inline-flex", alignItems: "center", gap: "2px" }}>
                                    <span>Pending</span>
                                    {isWeekly && weeklyProg && (
                                      <span style={{ opacity: 0.85 }}>({weeklyProg.partnerCompletedDaysThisWeek}/{weeklyProg.targetDays})</span>
                                    )}
                                    <ClockIcon size={10} color="#FBBF24" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          {isWeekly && weeklyProg && (
                            <div style={{ marginTop: "8px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "3px" }}>
                                <span>Your Progress:</span>
                                <span style={{ color: weeklyProg.isTargetReached ? "var(--emerald-glow)" : "#A78BFA", fontWeight: "800" }}>
                                  {weeklyProg.completedDaysThisWeek} of {weeklyProg.targetDays} days completed this week
                                </span>
                              </div>
                              <div style={{ height: "4px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "4px", overflow: "hidden" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${Math.min(100, (weeklyProg.completedDaysThisWeek / weeklyProg.targetDays) * 100)}%`,
                                    background: weeklyProg.isTargetReached ? "var(--emerald-primary)" : "linear-gradient(90deg, #8B5CF6, #A78BFA)",
                                    borderRadius: "4px",
                                    transition: "width 0.3s ease",
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ flexShrink: 0 }}>
                          {isCompleted ? (
                            <div
                              className="habit-action-pill habit-action-pill-done"
                              style={{ padding: "8px 14px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <CheckIcon size={12} strokeWidth={3} />
                              <span>{isCycle ? "Done for Cycle" : "Done Today"}</span>
                            </div>
                          ) : isCycleClosed ? (
                            <div
                              style={{
                                padding: "8px 14px",
                                fontSize: "11px",
                                borderRadius: "var(--radius-pill)",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid rgba(255, 255, 255, 0.12)",
                                color: "var(--text-muted)",
                                fontWeight: "800",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                cursor: "not-allowed",
                                opacity: 0.65,
                              }}
                              title="Current cycle is closed. Scores are frozen."
                            >
                              <LockIcon size={11} color="var(--text-muted)" />
                              <span>Frozen</span>
                            </div>
                          ) : (
                            <button
                              className="habit-action-pill habit-action-pill-active"
                              style={{
                                padding: "8px 16px",
                                fontSize: "12px",
                                minWidth: "64px",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                background: isCycle
                                  ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                                  : isWeekly
                                  ? "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"
                                  : undefined,
                                boxShadow: isCycle ? "0 0 16px rgba(245, 158, 11, 0.4)" : undefined,
                              }}
                              disabled={actionLoading === `task_${task.id}`}
                              onClick={(e) => handleCompleteTask(task.id, e)}
                            >
                              {actionLoading === `task_${task.id}` ? (
                                <SpinnerIcon size={13} color="#FFFFFF" />
                              ) : isPersonal ? (
                                <>
                                  <CheckIcon size={12} strokeWidth={3} />
                                  <span>Done</span>
                                </>
                              ) : (
                                `+${pointsValue}`
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {hasMoreTodayTasks && (
                    <div
                      ref={todayTasksObserverRef}
                      style={{
                        textAlign: "center",
                        padding: "12px",
                        color: "var(--text-secondary)",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      Showing {visibleDisplayedTasks.length} of {displayedTasks.length} goals • Scroll to load more...
                    </div>
                  )}
                </div>
              )}

              {taskCategoryTab === "weekly" && reachedWeeklyTasks.length > 0 && (
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed var(--border-glass)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "900", color: "var(--emerald-glow)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckIcon size={13} strokeWidth={3} color="var(--emerald-glow)" />
                      <span>Goals Achieved This Week ({reachedWeeklyTasks.length})</span>
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: "700" }}>
                      Resets next Monday
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {reachedWeeklyTasks.map((t) => {
                      const prog = data?.weeklyProgress?.[t.id];
                      return (
                        <div
                          key={`reached_${t.id}`}
                          className="neo-card"
                          style={{
                            padding: "10px 14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(16, 185, 129, 0.05)",
                            borderColor: "rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          <div>
                            <span style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF" }}>{t.name}</span>
                            {t.description && t.description.trim() && t.description.trim() !== "Personal habit" && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "rgba(255, 255, 255, 0.65)",
                                  fontStyle: "italic",
                                  marginTop: "2px",
                                  lineHeight: 1.35,
                                }}
                              >
                                &ldquo;{t.description.trim()}&rdquo;
                              </div>
                            )}
                            <div style={{ fontSize: "10px", color: "var(--emerald-glow)", fontWeight: "700", marginTop: "2px" }}>
                              Weekly Target Achieved ({prog?.completedDaysThisWeek || t.target_days_per_week}/{t.target_days_per_week || 2} Days)
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {t.is_personal && t.created_by === authenticatedUser.id && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingPersonalTask(t);
                                  setShowPersonalTaskModal(true);
                                }}
                                style={{
                                  background: "rgba(56, 189, 248, 0.12)",
                                  border: "1px solid rgba(56, 189, 248, 0.3)",
                                  borderRadius: "6px",
                                  padding: "2px 6px",
                                  color: "var(--sky-primary)",
                                  fontSize: "10px",
                                  fontWeight: "700",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  cursor: "pointer",
                                }}
                                title="Edit personal habit"
                              >
                                <EditIcon size={10} color="var(--sky-primary)" />
                                <span>Edit</span>
                              </button>
                            )}
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: "900",
                                color: "var(--emerald-glow)",
                                background: "rgba(16, 185, 129, 0.15)",
                                borderRadius: "8px",
                                padding: "4px 8px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <CheckIcon size={10} strokeWidth={3} />
                              <span>Complete</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {myTotalEverydayCount > 0 && myCompletedEverydayCount === myTotalEverydayCount && (
                <div
                  className="neo-card animate-pop"
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.12) 100%)",
                    borderColor: "rgba(16, 185, 129, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2)",
                    marginTop: "20px",
                  }}
                  onClick={() => openStreakCelebration(false)}
                  title="Click to celebrate your winning streak"
                >
                  <Mascot
                    character="together"
                    mood="winner"
                    animation="celebrate"
                    size={52}
                    speechText="Streak Locked!"
                    speechPlacement="left"
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
                        All Everyday Goals Completed!
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--emerald-glow)", fontWeight: "900", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <FlameIcon size={12} color="var(--emerald-glow)" /> ACTIVE
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0", lineHeight: 1.4 }}>
                      Your daily flame is burning strong. Tap to view your streak celebration!
                    </p>
                  </div>
                </div>
              )}

              {myTotalCount > 0 && myCompletedCount === myTotalCount && (
                <div
                  className="neo-card animate-pop"
                  style={{
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.12) 100%)",
                    borderColor: "rgba(16, 185, 129, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    cursor: "pointer",
                    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2)",
                  }}
                  onClick={() => openStreakCelebration(false)}
                  title="Click to celebrate your winning streak"
                >
                  <Mascot
                    character="together"
                    mood="winner"
                    animation="celebrate"
                    size={68}
                    interactive={true}
                    particles="confetti"
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
                      ALL GOALS COMPLETED!
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--emerald-glow)", fontWeight: "700", marginTop: "2px" }}>
                      Awesome! Your daily streak is protected today. Click to open celebration!
                    </div>
                  </div>
                  <TrophyIcon size={24} color="#FCD34D" />
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "wheel" && (
            <DecisionWheelTab currentUser={authenticatedUser} partnerUser={partnerUser} />
          )}

          {activeTab === "standings" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                className="neo-card"
                style={{
                  border: "1.5px solid rgba(255, 87, 51, 0.4)",
                  background: "linear-gradient(135deg, #1C221B 0%, #121813 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: "10px", fontWeight: "900", color: "#FF7A59", letterSpacing: "1px", textTransform: "uppercase" }}>
                    ACTIVE CYCLE STATUS
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                    {data?.activeCycle?.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "rgba(255, 87, 51, 0.16)",
                        border: "1px solid rgba(255, 87, 51, 0.4)",
                        color: "#FF7A59",
                        padding: "3px 8px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: "800",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <ClockIcon size={12} color="#FF7A59" />
                      <span>{formatDaysRemaining(data?.daysRemaining)}</span>
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "700", whiteSpace: "nowrap" }}>
                      {formatCycleDateRange(data?.activeCycle?.start_date, data?.activeCycle?.end_date)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="neo-btn neo-btn-coral"
                  style={{ fontSize: "11px", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "5px", flexShrink: 0 }}
                  onClick={() => setShowCycleResultModal(true)}
                >
                  <DiceIcon size={13} />
                  <span>Punishment Wheel</span>
                </button>
              </div>

              <div className="neo-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      CYCLE STANDINGS
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      Cycle Score Overview
                    </h3>
                  </div>
                  <TrophyIcon size={22} color="#FCD34D" />
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                  {scoreDiff > 0 ? (
                    <span style={{ color: "var(--emerald-glow)", fontWeight: "800" }}>
                      {playerAName} is currently leading by +{scoreDiff} points! Maintain this lead to spin the Punishment Wheel at cycle end.
                    </span>
                  ) : scoreDiff < 0 ? (
                    <span style={{ color: "#FF7A59", fontWeight: "800" }}>
                      {playerBName} is leading by +{Math.abs(scoreDiff)} points. Complete daily goals to stay safe from punishment!
                    </span>
                  ) : (
                    <span style={{ color: "#FCD34D", fontWeight: "800" }}>
                      Tied score! The race to the cycle finale is neck and neck.
                    </span>
                  )}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      borderRadius: "16px",
                      padding: "12px",
                      textAlign: "center",
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--emerald-glow)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={playerAName}>
                      {playerAName}
                    </div>
                    <div className="num-font" style={{ fontSize: "28px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      <AnimatedNumber value={currentScore} />
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700" }}>TOTAL POINTS</div>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 87, 51, 0.08)",
                      border: "1px solid rgba(255, 87, 51, 0.25)",
                      borderRadius: "16px",
                      padding: "12px",
                      textAlign: "center",
                      minWidth: 0,
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: "800", color: "var(--coral-glow)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={playerBName}>
                      {playerBName}
                    </div>
                    <div className="num-font" style={{ fontSize: "28px", fontWeight: "900", color: "#FF7A59", marginTop: "2px" }}>
                      <AnimatedNumber value={partnerScore} />
                    </div>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: "700" }}>TOTAL POINTS</div>
                  </div>
                </div>

                <div className="tug-of-war-track" style={{ marginBottom: "10px" }}>
                  <div className="tug-of-war-fill-user" style={{ width: `${userPercent}%` }} />
                  <div className="tug-of-war-fill-partner" style={{ width: `${100 - userPercent}%` }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "800", color: "var(--text-muted)" }}>
                  <span>{playerAName}: {Math.round(userPercent)}%</span>
                  <span>{playerBName}: {Math.round(100 - userPercent)}%</span>
                </div>
              </div>

              <div className="neo-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      CYCLE HISTORY
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      Past Cycles & Champions
                    </h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {cycleHistoryLoading && (
                      <span className="neo-animate-spin" style={{ display: "inline-flex" }}>
                        <SpinnerIcon size={14} color="var(--emerald-glow)" />
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        color: "var(--text-muted)",
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "3px 8px",
                        borderRadius: "8px",
                      }}
                    >
                      {cycleHistory?.total ?? (data?.cycleHistory?.total ?? 0)} Cycles
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(cycleHistory?.items || data?.cycleHistory?.items || []).length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: "12px" }}>
                      No cycle records available.
                    </div>
                  ) : (
                    (cycleHistory?.items || data?.cycleHistory?.items || []).map((c) => {
                      const isActive = c.status === "active";

                      return (
                        <div
                          key={c.id}
                          style={{
                            background: isActive
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)"
                              : "rgba(255, 255, 255, 0.02)",
                            border: isActive
                              ? "1px solid rgba(16, 185, 129, 0.35)"
                              : "1px solid var(--border-glass)",
                            borderRadius: "14px",
                            padding: "12px 14px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
                                {c.name}
                              </span>
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: "900",
                                  letterSpacing: "0.5px",
                                  textTransform: "uppercase",
                                  padding: "2px 7px",
                                  borderRadius: "6px",
                                  background: isActive ? "rgba(16, 185, 129, 0.16)" : "rgba(255, 255, 255, 0.08)",
                                  border: isActive ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(255, 255, 255, 0.15)",
                                  color: isActive ? "#34D399" : "var(--text-secondary)",
                                }}
                              >
                                {isActive ? "Active" : "Completed"}
                              </span>
                            </div>

                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "700" }}>
                              {formatCycleDateRange(c.start_date, c.end_date)}
                            </span>
                          </div>

                          {isActive ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "11px",
                                color: "var(--text-secondary)",
                                background: "rgba(0, 0, 0, 0.2)",
                                padding: "6px 10px",
                                borderRadius: "8px",
                              }}
                            >
                              <ZapIcon size={12} color="var(--emerald-glow)" />
                              <span>
                                {c.isTie
                                  ? `Scores currently tied (${c.winner_score || 0} pts each)`
                                  : c.winner_name
                                  ? `${c.winner_name} leading (${c.winner_score} pts vs ${c.loser_score} pts)`
                                  : "Cycle duel in progress"}
                              </span>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                background: "rgba(0, 0, 0, 0.2)",
                                padding: "8px 10px",
                                borderRadius: "8px",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <CrownIcon size={14} color="#FCD34D" />
                                  <span style={{ fontSize: "12px", fontWeight: "900", color: "#FCD34D" }}>
                                    {c.isTie ? "Tied Finish" : `Champion: ${c.winner_name || "Winner"}`}
                                  </span>
                                </div>
                                <span style={{ fontSize: "11px", fontWeight: "800", color: "#FFFFFF" }}>
                                  {c.winner_score} pts vs {c.loser_score} pts
                                  {!c.isTie && c.score_diff ? (
                                    <span style={{ color: "var(--emerald-glow)", marginLeft: "4px" }}>
                                      (+{c.score_diff})
                                    </span>
                                  ) : null}
                                </span>
                              </div>

                              {c.punishment_name && (
                                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "#FF7A59", fontWeight: "700" }}>
                                  <DiceIcon size={11} color="#FF7A59" />
                                  <span>Endured: {c.punishment_name}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {(() => {
                  const cycleItems = cycleHistory?.items || data?.cycleHistory?.items || [];
                  const totalCycleCount = cycleHistory?.total ?? (data?.cycleHistory?.total ?? 0);
                  const totalCyclePages = cycleHistory?.totalPages ?? data?.cycleHistory?.totalPages ?? 1;
                  const currentCyclePage = cycleHistory?.page ?? 1;
                  const hasMoreCycles = currentCyclePage < totalCyclePages;

                  if (hasMoreCycles) {
                    return (
                      <div
                        ref={cycleHistoryObserverRef}
                        onClick={() => !cycleHistoryLoading && fetchCycleHistory(currentCyclePage + 1, true)}
                        style={{
                          textAlign: "center",
                          padding: "12px",
                          color: "var(--text-secondary)",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          borderTop: "1px dashed var(--border-glass)",
                          marginTop: "4px",
                        }}
                      >
                        {cycleHistoryLoading ? (
                          <>
                            <span className="neo-animate-spin" style={{ display: "inline-flex" }}>
                              <SpinnerIcon size={13} color="var(--emerald-glow)" />
                            </span>
                            <span>Loading more cycles...</span>
                          </>
                        ) : (
                          <span>
                            Showing {cycleItems.length} of {totalCycleCount} cycles • Scroll or tap to load more
                          </span>
                        )}
                      </div>
                    );
                  }

                  if (totalCycleCount > 3) {
                    return (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "10px",
                          color: "var(--text-muted)",
                          fontSize: "10px",
                          fontWeight: "700",
                          borderTop: "1px dashed var(--border-glass)",
                          marginTop: "4px",
                        }}
                      >
                        ✓ All {totalCycleCount} cycles loaded
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <TaskHistoryView
              authenticatedUser={authenticatedUser}
              isSuperAdmin={isSuperAdmin}
              tasks={data?.tasks || []}
              allUsers={data?.users || []}
            />
          )}

          {activeTab === "rules" && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="neo-card" style={{ padding: "18px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      {rulesLang === "id" ? "PANDUAN ATURAN" : "GAMEPLAY GUIDE"}
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      {rulesLang === "id" ? "Aturan & Sistem Poin" : "Rules & Scoring"}
                    </h2>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ display: "inline-flex", background: "rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "2px", border: "1px solid var(--border-glass)" }}>
                      <button
                        type="button"
                        onClick={() => setRulesLang("en")}
                        style={{
                          padding: "3px 8px",
                          fontSize: "10px",
                          fontWeight: "800",
                          borderRadius: "6px",
                          border: "none",
                          background: rulesLang === "en" ? "var(--emerald-primary)" : "transparent",
                          color: rulesLang === "en" ? "#000" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        EN
                      </button>
                      <button
                        type="button"
                        onClick={() => setRulesLang("id")}
                        style={{
                          padding: "3px 8px",
                          fontSize: "10px",
                          fontWeight: "800",
                          borderRadius: "6px",
                          border: "none",
                          background: rulesLang === "id" ? "var(--emerald-primary)" : "transparent",
                          color: rulesLang === "id" ? "#000" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        ID
                      </button>
                    </div>

                    <Mascot
                      character="together"
                      mood="toast"
                      animation="wave"
                      size={44}
                      interactive={true}
                      speechText={rulesLang === "id" ? "Konsisten setiap hari untuk menang!" : "Stay consistent to win!"}
                      speechPlacement="right"
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "12px" }}>
                  <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--border-glass)", borderRadius: "14px", padding: "12px" }}>
                    <div style={{ fontWeight: "800", color: "#FFFFFF", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                      <CrownIcon size={14} color="var(--emerald-primary)" />
                      <span>{rulesLang === "id" ? "Cara Bermain" : "How It Works"}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.5", margin: 0 }}>
                      {rulesLang === "id"
                        ? "HabiVenture berjalan dalam siklus 1 bulan. Selesaikan habit untuk meraih poin dan membangun streak. Di akhir bulan, pemain dengan skor lebih rendah akan memutar Roda Hukuman."
                        : "HabiVenture runs in 1-month cycles. Complete habits to earn points and build your streak. At the end of the month, the player with the lower score spins the Punishment Wheel."}
                    </p>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "12px", fontWeight: "900", color: "var(--emerald-glow)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {rulesLang === "id" ? "1. Perolehan Poin" : "1. Earning Points"}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <SparkleIcon size={15} color="#F59E0B" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Cycle Quest Selesai" : "Cycle Quest Completed"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Target pencapaian bulanan (1x per siklus)" : "Monthly milestone goal (1x per cycle)"}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: "#FBBF24", fontSize: "13px", fontWeight: "900" }}>+50 PTS</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <ZapIcon size={15} color="var(--emerald-glow)" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Team Synergy Bonus" : "Team Synergy Bonus"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Kedua pemain sama-sama aktif di hari yang sama" : "Both players active on the same day"}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: "var(--emerald-glow)", fontSize: "13px", fontWeight: "900" }}>
                          {rulesLang === "id" ? "+10 PTS / orang" : "+10 PTS each"}
                        </strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircleIcon size={15} color="var(--emerald-primary)" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Shared Goal Selesai" : "Shared Goal Completed"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Habit bersama harian atau mingguan" : "Daily or weekly shared habits"}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: "var(--emerald-glow)", fontSize: "13px", fontWeight: "900" }}>+10 PTS</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <SproutIcon size={15} color="var(--sky-primary)" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Personal Habit" : "Personal Habit"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Target pengembangan diri (tidak dihitung di duel)" : "Self-growth goals (not counted in duel)"}
                            </div>
                          </div>
                        </div>
                        <span style={{ color: "var(--sky-primary)", fontSize: "11px", fontWeight: "800" }}>
                          {rulesLang === "id" ? "Hanya Streak" : "Streak Only"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#38BDF8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {rulesLang === "id" ? "2. Target Terlewat & Fair Play" : "2. Missed Goals & Fair Play"}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <CheckCircleIcon size={15} color="var(--sky-primary)" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Sistem Poin Positif (0 PTS Pengurangan)" : "Zero Point Deductions (0 PTS)"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Poin yang sudah Anda raih tetap aman dan tidak pernah dikurangi saat melewatkan target" : "Earned points are never deducted when missing a goal"}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: "var(--sky-primary)", fontSize: "13px", fontWeight: "900" }}>0 PTS</strong>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <ShieldIcon size={15} color="#F59E0B" />
                          <div>
                            <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                              {rulesLang === "id" ? "Perlindungan Streak Shield" : "Streak Shield Protection"}
                            </div>
                            <div style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                              {rulesLang === "id" ? "Melewatkan hari mengonsumsi 1 shield agar streak harian tidak reset" : "Missing a day consumes 1 shield to protect your streak from resetting"}
                            </div>
                          </div>
                        </div>
                        <strong style={{ color: "#FBBF24", fontSize: "12px", fontWeight: "900" }}>3 Shields</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#818CF8", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {rulesLang === "id" ? "3. Streak & Perlindungan" : "3. Streaks & Protection"}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(129, 140, 248, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#C7D2FE", marginBottom: "2px" }}>
                          <FlameIcon size={13} color="#F97316" />
                          <span>{rulesLang === "id" ? "Aturan 1 Target per Hari" : "1 Goal per Day Rule"}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.4", margin: 0 }}>
                          {rulesLang === "id"
                            ? "Selesaikan minimal 1 target setiap hari untuk menaikkan streak. Jika kedua partner sama-sama menyelesaikan target di hari yang sama, Team Streak juga bertambah."
                            : "Complete at least 1 goal every day to advance your streak. If both partners complete a goal on the same day, your Team Streak also advances."}
                        </p>
                      </div>

                      <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(129, 140, 248, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#C7D2FE", marginBottom: "2px" }}>
                          <ShieldIcon size={13} color="#818CF8" />
                          <span>{rulesLang === "id" ? "Streak Shield (3x per Siklus)" : "Streak Shield (3x per Cycle)"}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.4", margin: 0 }}>
                          {rulesLang === "id"
                            ? "Jika terlewat 1 hari, 1 shield otomatis terpakai agar streak tidak reset. Kuota shield kembali menjadi 3 di setiap siklus baru."
                            : "Missing a day automatically consumes 1 shield to protect your streak from resetting. Each player receives 3 shields per cycle."}
                        </p>
                      </div>

                      <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(129, 140, 248, 0.2)", padding: "10px 12px", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "800", color: "#C7D2FE", marginBottom: "2px" }}>
                          <TrendingUpIcon size={13} color="var(--emerald-glow)" />
                          <span>{rulesLang === "id" ? "Streak Berkelanjutan Antar-Siklus" : "Continuous Streaks"}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.4", margin: 0 }}>
                          {rulesLang === "id"
                            ? "Hitungan hari streak tetap berlanjut ke bulan berikutnya. Hanya poin duel yang kembali ke 0 setiap bulan untuk kompetisi baru."
                            : "Day streaks carry over continuously into subsequent cycles. Points reset monthly for a fresh duel, but consistency is rewarded long-term."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: "12px", fontWeight: "900", color: "#FCD34D", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {rulesLang === "id" ? "4. Akhir Siklus" : "4. Cycle Finale"}
                    </h3>
                    <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <DiceIcon size={20} color="#FCD34D" />
                        <div>
                          <div style={{ fontWeight: "800", color: "#FFFFFF" }}>
                            {rulesLang === "id" ? "Roda Hukuman (Punishment Wheel)" : "Punishment Wheel"}
                          </div>
                          <div style={{ color: "var(--text-secondary)", fontSize: "11px", lineHeight: "1.4" }}>
                            {rulesLang === "id"
                              ? "Pemain dengan total poin lebih rendah di akhir bulan wajib memutar roda untuk menentukan konsekuensi yang disepakati bersama."
                              : "The player with the lower score at the end of the month spins the wheel to determine the agreed forfeit."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "admin" && isSuperAdmin && (
            <div className="tab-content-enter" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                className="neo-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  background: "linear-gradient(180deg, rgba(24, 34, 27, 0.95) 0%, rgba(16, 24, 19, 0.95) 100%)",
                  border: "1.5px solid rgba(16, 185, 129, 0.3)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      SEASON &amp; DUEL MANAGEMENT
                    </span>
                    <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      Cycle Control Center
                    </h2>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      background: (data?.activeCycle?.status === "closed") ? "rgba(255, 87, 51, 0.15)" : "rgba(16, 185, 129, 0.15)",
                      color: (data?.activeCycle?.status === "closed") ? "#FF7A59" : "var(--emerald-glow)",
                      border: (data?.activeCycle?.status === "closed") ? "1px solid rgba(255, 87, 51, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                    }}
                  >
                    {data?.activeCycle?.status === "closed" ? (
                      <>
                        <LockIcon size={11} />
                        <span>CLOSED / FROZEN</span>
                      </>
                    ) : (
                      <>
                        <FlameIcon size={11} />
                        <span>ACTIVE CYCLE</span>
                      </>
                    )}
                  </span>
                </div>

                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid var(--border-glass)",
                    borderRadius: "16px",
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
                      {data?.activeCycle?.name || "No Active Cycle"}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {formatCycleDateRange(data?.activeCycle?.start_date, data?.activeCycle?.end_date) || "No date range set"}
                      {data?.daysRemaining !== undefined && (
                        <span> • {formatDaysRemaining(data.daysRemaining)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="neo-btn neo-btn-emerald"
                      style={{ fontSize: "11px", padding: "8px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                      onClick={openStartCycleModal}
                    >
                      <PlusIcon size={13} color="#FFFFFF" />
                      <span>+ Start New Cycle</span>
                    </button>

                    <button
                      type="button"
                      className="neo-btn neo-btn-glass"
                      style={{ fontSize: "11px", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "5px" }}
                      onClick={() => setShowCycleResultModal(true)}
                    >
                      <DiceIcon size={13} color="#FCD34D" />
                      <span>Standings &amp; Wheel</span>
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                  Starting a new cycle automatically concludes the current cycle, resets duel points to 0-0 for a fresh duel, and replenishes 3x streak shields. Daily streaks continue seamlessly.
                </p>
              </div>
              {(() => {
                const allAdminTasks = data?.tasks || [];
                const sharedCount = allAdminTasks.filter((t) => !t.is_personal).length;
                const personalCount = allAdminTasks.filter((t) => Boolean(t.is_personal)).length;
                const cycleCount = allAdminTasks.filter((t) => t.frequency === "cycle").length;

                const filteredAdminTasks = allAdminTasks.filter((task) => {
                  if (adminGoalFilter === "shared") return !task.is_personal;
                  if (adminGoalFilter === "personal") return Boolean(task.is_personal);
                  if (adminGoalFilter === "cycle") return task.frequency === "cycle";
                  return true;
                });

                return (
                  <div className="neo-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "900", color: "#8B5CF6", letterSpacing: "1px", textTransform: "uppercase" }}>
                          GOAL INVENTORY &amp; CRUD
                        </span>
                        <h2 style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                          Manage Goals &amp; Habits
                        </h2>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "4px 8px", borderRadius: "10px" }}>
                        {filteredAdminTasks.length} / {allAdminTasks.length} Goals
                      </span>
                    </div>

                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                      Manage, edit frequency (Daily, Weekly, Cycle Quest), configure reward points, or remove goals for Players.
                    </p>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {[
                        { key: "all", label: `All (${allAdminTasks.length})` },
                        { key: "shared", label: `Team Shared (${sharedCount})` },
                        { key: "personal", label: `Personal (${personalCount})` },
                        { key: "cycle", label: `Cycle Quests (${cycleCount})` },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setAdminGoalFilter(tab.key as any)}
                          style={{
                            background: adminGoalFilter === tab.key ? "rgba(139, 92, 246, 0.25)" : "rgba(255, 255, 255, 0.05)",
                            border: adminGoalFilter === tab.key ? "1px solid rgba(139, 92, 246, 0.5)" : "1px solid var(--border-glass)",
                            color: adminGoalFilter === tab.key ? "#DDD6FE" : "var(--text-muted)",
                            borderRadius: "10px",
                            padding: "6px 12px",
                            fontSize: "11px",
                            fontWeight: "800",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {filteredAdminTasks.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "12px" }}>
                          No goals found in this filter category.
                        </div>
                      ) : (
                        visibleAdminTasks.map((task) => {
                          const isCycle = task.frequency === "cycle";
                          const isEveryday = task.frequency === "daily" || (!task.frequency && (task.target_days_per_week === 7 || !task.target_days_per_week));
                          const isActive = task.active !== false;
                          const isPersonal = Boolean(task.is_personal);
                          const ownerUser = (data?.users || []).find((u) => u.id === task.created_by);

                          return (
                            <div
                              key={task.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "var(--bg-surface-input)",
                                border: isCycle ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid var(--border-glass)",
                                borderRadius: "16px",
                                padding: "10px 14px",
                                gap: "10px",
                              }}
                            >
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF" }}>
                                    {task.name}
                                  </span>
                                  {!isActive && (
                                    <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--text-muted)", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "6px" }}>
                                      Inactive
                                    </span>
                                  )}
                                  {isPersonal ? (
                                    <span style={{ fontSize: "9px", fontWeight: "800", color: "#C084FC", background: "rgba(192, 132, 252, 0.15)", padding: "2px 6px", borderRadius: "6px" }}>
                                      Personal {ownerUser ? `(${ownerUser.name})` : ""}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: "9px", fontWeight: "800", color: "var(--sky-primary)", background: "rgba(56, 189, 248, 0.15)", padding: "2px 6px", borderRadius: "6px" }}>
                                      Team Shared
                                    </span>
                                  )}
                                </div>
                                {task.description && (
                                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {task.description}
                                  </div>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: "800",
                                      color: isCycle ? "#F59E0B" : isEveryday ? "var(--emerald-glow)" : "#A78BFA",
                                      background: isCycle ? "rgba(245, 158, 11, 0.15)" : isEveryday ? "rgba(16, 185, 129, 0.12)" : "rgba(139, 92, 246, 0.15)",
                                      padding: "2px 6px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    {isCycle ? "Cycle Quest (1x)" : isEveryday ? "Every Day" : `Weekly (${task.target_days_per_week || 2}x)`}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "9px",
                                      fontWeight: "800",
                                      color: isCycle ? "#FCD34D" : "var(--sky-primary)",
                                      background: isCycle ? "rgba(252, 211, 77, 0.15)" : "rgba(56, 189, 248, 0.12)",
                                      padding: "2px 6px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    +{task.base_score || (isCycle ? 50 : isEveryday ? 10 : 15)} PTS
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingTask(task);
                                    setIsEditTaskModalOpen(true);
                                  }}
                                  className="neo-btn neo-btn-glass"
                                  style={{ fontSize: "11px", padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                                  title="Edit Goal"
                                >
                                  <EditIcon size={13} />
                                  <span>Edit</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {hasMoreAdminTasks && (
                        <div
                          ref={adminTasksObserverRef}
                          style={{
                            textAlign: "center",
                            padding: "12px",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          Showing {visibleAdminTasks.length} of {filteredAdminTasks.length} goals • Scroll to load more...
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="neo-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--emerald-glow)", letterSpacing: "1px", textTransform: "uppercase" }}>
                      ADD NEW GOAL
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                      Create Goal for Players
                    </h3>
                  </div>
                  <PlusIcon size={18} color="var(--emerald-glow)" />
                </div>

                <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "6px" }}>
                      <UsersIcon size={13} color="var(--sky-primary)" />
                      <span>GOAL SCOPE:</span>
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskIsPersonal(false);
                          if (newTaskFreq === "cycle") setNewTaskScore(50);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px",
                          borderRadius: "12px",
                          border: !newTaskIsPersonal ? "1.5px solid var(--sky-primary)" : "1px solid var(--border-glass)",
                          background: !newTaskIsPersonal ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                          color: !newTaskIsPersonal ? "#38BDF8" : "var(--text-muted)",
                          fontWeight: "800",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <UsersIcon size={14} />
                        <span>Team Shared</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskIsPersonal(true);
                          if (newTaskFreq === "cycle") setNewTaskScore(20);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px",
                          borderRadius: "12px",
                          border: newTaskIsPersonal ? "1.5px solid #A855F7" : "1px solid var(--border-glass)",
                          background: newTaskIsPersonal ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.04)",
                          color: newTaskIsPersonal ? "#C084FC" : "var(--text-muted)",
                          fontWeight: "800",
                          fontSize: "12px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <SproutIcon size={14} />
                        <span>Personal Habit</span>
                      </button>
                    </div>
                  </div>

                  {newTaskIsPersonal && (
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "#C084FC", marginBottom: "5px" }}>
                        <span>ASSIGN TO USER:</span>
                      </label>
                      <select
                        value={newTaskTargetUserId || authenticatedUser?.id || ""}
                        onChange={(e) => setNewTaskTargetUserId(e.target.value ? Number(e.target.value) : "")}
                        style={{
                          width: "100%",
                          background: "var(--bg-surface-input)",
                          border: "1px solid rgba(168, 85, 247, 0.4)",
                          borderRadius: "14px",
                          padding: "10px 14px",
                          color: "#FFFFFF",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        {(data?.users || []).map((u) => (
                          <option key={u.id} value={u.id} style={{ background: "#1F2937", color: "#FFFFFF" }}>
                            {u.name} ({u.role === "superadmin" ? "Super Admin" : "Player"})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      <TargetIcon size={13} color="var(--emerald-primary)" />
                      <span>GOAL NAME:</span>
                    </label>
                    <input
                      type="text"
                      placeholder={newTaskFreq === "cycle" ? "e.g. Monthly Savings ($500 Deposit)" : "e.g. Drink 2L Water"}
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
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
                      <span>DESCRIPTION (OPTIONAL):</span>
                    </label>
                    <input
                      type="text"
                      placeholder={newTaskFreq === "cycle" ? "e.g. Deposit monthly savings into shared vault before cycle ends" : "e.g. Stay hydrated throughout the day"}
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "900", color: "var(--sky-primary)" }}>
                        <ClockIcon size={13} color="var(--sky-primary)" />
                        <span>FREQUENCY:</span>
                      </label>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)" }}>
                        {newTaskFreq === "cycle" ? "Fixed: 1x / Cycle (Highest Reward)" : newTaskFreq === "daily" ? "Fixed: 7 days / week (Daily)" : newTaskFreq === "weekly_2x" ? "Fixed: 2 days / week" : `Custom: ${newTaskTargetDays} days / week`}
                      </span>
                    </div>

                    <div style={{ display: newTaskFreq === "weekly_custom" ? "grid" : "block", gridTemplateColumns: newTaskFreq === "weekly_custom" ? "1fr 115px" : undefined, gap: "10px" }}>
                      <SearchableSelect
                        value={newTaskFreq}
                        onChange={(val: any) => {
                          setNewTaskFreq(val);
                          if (val === "daily") {
                            setNewTaskScore(10);
                            setNewTaskTargetDays(7);
                          } else if (val === "weekly_2x") {
                            setNewTaskScore(15);
                            setNewTaskTargetDays(2);
                          } else if (val === "weekly_custom") {
                            setNewTaskScore(15);
                            setNewTaskTargetDays(3);
                          } else if (val === "cycle") {
                            setNewTaskScore(newTaskIsPersonal ? 20 : 50);
                            setNewTaskTargetDays(1);
                          }
                        }}
                        options={[
                          { value: "daily", label: "Every Day (Daily)", sublabel: "7 days / week • +10 PTS" },
                          { value: "weekly_2x", label: "2x Weekly", sublabel: "2 days / week • +15 PTS" },
                          { value: "weekly_custom", label: "Custom Weekly Target", sublabel: "1 - 7 days • +15 PTS" },
                          { value: "cycle", label: "Cycle Quest (Monthly Milestone)", sublabel: "1x per cycle • Highest Reward (+50 PTS)" },
                        ]}
                        searchPlaceholder="Filter frequency..."
                      />

                      {newTaskFreq === "weekly_custom" && (
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <input
                            type="number"
                            min="1"
                            max="7"
                            value={newTaskTargetDays}
                            onChange={(e: any) => {
                              const raw = e.target.value;
                              if (raw === "") {
                                setNewTaskTargetDays("" as any);
                                return;
                              }
                              const val = parseInt(raw, 10);
                              if (!isNaN(val)) {
                                setNewTaskTargetDays(Math.max(1, Math.min(7, val)));
                              }
                            }}
                            onBlur={() => {
                              if (!newTaskTargetDays || isNaN(Number(newTaskTargetDays))) {
                                setNewTaskTargetDays(3);
                              }
                            }}
                            placeholder="3"
                            title="Target days per week (1 - 7)"
                            style={{
                              width: "100%",
                              background: "var(--bg-surface-input)",
                              border: "1px solid rgba(167, 139, 250, 0.4)",
                              borderRadius: "14px",
                              padding: "11px 44px 11px 14px",
                              color: "#FFFFFF",
                              fontSize: "13px",
                              fontWeight: "800",
                            }}
                          />
                          <span style={{
                            position: "absolute",
                            right: "8px",
                            display: "inline-flex",
                            alignItems: "center",
                            background: "rgba(167, 139, 250, 0.15)",
                            color: "#A78BFA",
                            border: "1px solid rgba(167, 139, 250, 0.3)",
                            borderRadius: "8px",
                            padding: "3px 6px",
                            fontSize: "9px",
                            fontWeight: "900",
                            letterSpacing: "0.5px",
                            pointerEvents: "none",
                          }}>
                            DAYS
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "900", color: newTaskFreq === "cycle" ? "#F59E0B" : "var(--emerald-glow)" }}>
                        <SparkleIcon size={13} color={newTaskFreq === "cycle" ? "#F59E0B" : "var(--emerald-glow)"} />
                        <span>REWARD POINTS:</span>
                      </label>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: newTaskFreq === "cycle" ? "#FCD34D" : "var(--text-muted)" }}>
                        {newTaskFreq === "cycle" ? "Highest game reward (50 PTS default)" : "per completed check-in"}
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          placeholder={newTaskFreq === "cycle" ? "50" : "10"}
                          value={newTaskScore}
                          onChange={(e) => setNewTaskScore(Number(e.target.value))}
                          style={{
                            width: "100%",
                            background: "var(--bg-surface-input)",
                            border: newTaskFreq === "cycle" ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid var(--border-emerald)",
                            borderRadius: "14px",
                            padding: "11px 55px 11px 14px",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: "800",
                          }}
                        />
                        <span style={{
                          position: "absolute",
                          right: "8px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "3px",
                          background: newTaskFreq === "cycle" ? "rgba(245, 158, 11, 0.18)" : "var(--emerald-surface)",
                          color: newTaskFreq === "cycle" ? "#FCD34D" : "var(--emerald-glow)",
                          border: newTaskFreq === "cycle" ? "1px solid rgba(245, 158, 11, 0.35)" : "1px solid var(--border-emerald)",
                          borderRadius: "8px",
                          padding: "4px 8px",
                          fontSize: "10px",
                          fontWeight: "900",
                          letterSpacing: "0.5px",
                          pointerEvents: "none",
                        }}>
                          PTS
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {[5, 10, 15, 20, 50].map((pt) => {
                          const isFifty = pt === 50;
                          const isSelected = newTaskScore === pt;
                          return (
                            <button
                              key={pt}
                              type="button"
                              onClick={() => setNewTaskScore(pt)}
                              style={{
                                background: isSelected
                                  ? (isFifty ? "rgba(245, 158, 11, 0.25)" : "var(--emerald-surface)")
                                  : "rgba(255, 255, 255, 0.05)",
                                border: isSelected
                                  ? (isFifty ? "1px solid rgba(245, 158, 11, 0.6)" : "1px solid var(--border-emerald)")
                                  : isFifty && newTaskFreq === "cycle"
                                  ? "1px dashed rgba(245, 158, 11, 0.5)"
                                  : "1px solid var(--border-glass)",
                                color: isSelected
                                  ? (isFifty ? "#FCD34D" : "var(--emerald-glow)")
                                  : isFifty && newTaskFreq === "cycle"
                                  ? "#F59E0B"
                                  : "var(--text-muted)",
                                borderRadius: "10px",
                                padding: "8px 11px",
                                fontSize: "11px",
                                fontWeight: "800",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              +{pt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading === "create_task"}
                    className={newTaskFreq === "cycle" ? "neo-btn neo-btn-gold" : newTaskIsPersonal ? "neo-btn neo-btn-purple" : "neo-btn neo-btn-emerald"}
                    style={{
                      padding: "13px",
                      marginTop: "6px",
                      background: newTaskFreq === "cycle" ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" : undefined,
                      color: newTaskFreq === "cycle" ? "#000000" : undefined,
                      fontWeight: "900",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {actionLoading === "create_task" ? (
                      <>
                        <SpinnerIcon size={16} color={newTaskFreq === "cycle" ? "#000" : "#FFF"} />
                        <span>Creating Goal...</span>
                      </>
                    ) : (
                      `+ Create ${newTaskFreq === "cycle" ? "Cycle Quest (Monthly)" : newTaskIsPersonal ? "Personal Habit" : "Shared Goal"}`
                    )}
                  </button>
                </form>
              </div>

              <div id="admin-database-section" className="neo-card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3 style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "900", color: "#FFFFFF" }}>
                  <DatabaseIcon size={16} color="var(--emerald-primary)" />
                  <span>Database Backup & Restore</span>
                </h3>

                {storageInfo && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid rgba(255, 255, 255, 0.07)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: "800" }}>
                        {storageInfo.maxFreeMb > 500 ? `Supabase Storage (${storageInfo.maxFreeMb} MB)` : "Supabase Free Tier (500 MB)"}
                      </span>
                      <span style={{ color: storageInfo.themeColor, fontWeight: "900" }}>
                        {storageInfo.usedMb < 0.01 && storageInfo.approxBytes > 0 ? "< 0.01" : storageInfo.usedMb.toFixed(2)} / {storageInfo.maxFreeMb} MB used ({storageInfo.percentage < 0.01 ? "< 0.01%" : `${storageInfo.percentage.toFixed(2)}%`})
                      </span>
                    </div>
                    <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(1, Math.min(100, storageInfo.percentage))}%`,
                          background: storageInfo.themeColor,
                          borderRadius: "3px",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "var(--text-muted)" }}>
                      <span>Used: {storageInfo.usedMb < 0.01 && storageInfo.approxBytes > 0 ? "< 0.01" : storageInfo.usedMb.toFixed(2)} MB ({storageInfo.rowCount} rows)</span>
                      <span>Remaining: {storageInfo.remainingMb.toFixed(2)} MB</span>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    className="neo-btn neo-btn-glass"
                    style={{ fontSize: "12px", padding: "10px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", whiteSpace: "nowrap" }}
                    onClick={handleExportBackup}
                  >
                    <DownloadIcon size={14} />
                    <span style={{ whiteSpace: "nowrap" }}>Export JSON</span>
                  </button>
                  <label
                    className="neo-btn neo-btn-glass"
                    style={{ fontSize: "12px", padding: "10px", cursor: "pointer", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", whiteSpace: "nowrap" }}
                  >
                    <UploadIcon size={14} />
                    <span style={{ whiteSpace: "nowrap" }}>Import JSON</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: "none" }} />
                  </label>
                </div>

                {adminStatusMsg && (
                  <div style={{ marginTop: "6px", fontSize: "11px", fontWeight: "800", color: adminStatusMsg.error ? "#FF7A59" : "var(--emerald-glow)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {adminStatusMsg.error ? <AlertTriangleIcon size={14} color="#FF7A59" /> : <CheckCircleIcon size={14} color="var(--emerald-glow)" />}
                    <span>{adminStatusMsg.text}</span>
                  </div>
                )}
              </div>

              <div className="neo-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "900", color: "#10B981", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        ACCOUNT MANAGEMENT
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-secondary)", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: "8px", whiteSpace: "nowrap" }}>
                        {(data?.users || []).length} Accounts
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", margin: "2px 0 0 0" }}>
                      User Profiles & PIN Management
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setChangePinInitialMode("register");
                      setChangePinTargetId(undefined);
                      setShowChangePinModal(true);
                    }}
                    className="neo-btn neo-btn-emerald"
                    style={{
                      fontSize: "11px",
                      padding: "7px 12px",
                      borderRadius: "10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontWeight: "800",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    <PlusIcon size={13} />
                    <span style={{ whiteSpace: "nowrap" }}>Register User</span>
                  </button>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                  Manage user accounts, assign accountability partners/duos, or configure individual 4-digit login PINs.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(data?.users || []).map((u) => {
                    const effectiveGender: "male" | "female" = u.gender ? u.gender : (u.id === 3 ? "female" : "male");
                    const char: MascotCharacter = effectiveGender === "female" ? "female" : "male";
                    const genderBadge = effectiveGender === "female" ? "Female" : "Male";

                    return (
                      <div
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "var(--bg-surface-input)",
                          border: "1px solid var(--border-glass)",
                          borderRadius: "16px",
                          padding: "10px 14px",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1, marginRight: "8px" }}>
                          <Mascot character={char} size={36} mood="idle" animation="none" />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ fontSize: "13px", fontWeight: "800", color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                              <span style={{
                                fontSize: "9px",
                                fontWeight: "900",
                                padding: "2px 6px",
                                borderRadius: "6px",
                                background: u.role === "superadmin" ? "rgba(139, 92, 246, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                color: u.role === "superadmin" ? "#A78BFA" : "var(--emerald-glow)",
                                textTransform: "uppercase",
                                flexShrink: 0,
                              }}>
                                {u.role === "superadmin" ? "Super Admin" : "Player"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px", marginTop: "2px" }}>
                              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", whiteSpace: "nowrap" }}>
                                {genderBadge} • ID #{u.id}
                              </span>
                              {u.role !== "superadmin" && (
                                <span style={{
                                  fontSize: "10px",
                                  fontWeight: "800",
                                  color: u.partner_name ? "var(--emerald-glow)" : "var(--text-secondary)",
                                  background: u.partner_name ? "rgba(16, 185, 129, 0.12)" : "rgba(255, 255, 255, 0.05)",
                                  padding: "1px 6px",
                                  borderRadius: "6px",
                                  border: `1px solid ${u.partner_name ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                                  whiteSpace: "nowrap",
                                }}>
                                  {u.partner_name ? `Duo: ${u.partner_name}` : "Solo (Unpaired)"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="neo-btn neo-btn-glass"
                          style={{ fontSize: "11px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap", flexShrink: 0 }}
                          onClick={() => {
                            setChangePinInitialMode("edit");
                            setChangePinTargetId(u.id);
                            setShowChangePinModal(true);
                          }}
                        >
                          <KeyIcon size={12} color="var(--emerald-primary)" />
                          <span style={{ whiteSpace: "nowrap" }}>Edit / Pair</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>

        <nav className="neo-dock" aria-label="Main application navigation">
          {isSuperAdmin ? (
            <>
              <button
                type="button"
                className={`neo-dock-item ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("admin");
                }}
                aria-label="Admin Console"
                aria-current={activeTab === "admin" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <ShieldIcon size={20} />
                </span>
                <span className="neo-dock-label">Admin</span>
                {activeTab === "admin" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "today" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("today");
                }}
                aria-label="Monitor Habits"
                aria-current={activeTab === "today" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <TargetIcon size={20} />
                </span>
                <span className="neo-dock-label">Monitor</span>
                {activeTab === "today" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "standings" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("standings");
                }}
                aria-label="Cycles & Standings"
                aria-current={activeTab === "standings" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <TrophyIcon size={20} />
                </span>
                <span className="neo-dock-label">Cycles</span>
                {activeTab === "standings" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "history" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("history");
                }}
                aria-label="Habit History"
                aria-current={activeTab === "history" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <ClipboardCheckIcon size={20} />
                </span>
                <span className="neo-dock-label">History</span>
                {activeTab === "history" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "rules" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("rules");
                }}
                aria-label="Rules & Guide"
                aria-current={activeTab === "rules" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <BookOpenIcon size={20} />
                </span>
                <span className="neo-dock-label">Rules</span>
                {activeTab === "rules" && <span className="neo-dock-active-dot" />}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`neo-dock-item ${activeTab === "today" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("today");
                }}
                aria-label="Today's Habits"
                aria-current={activeTab === "today" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <TargetIcon size={20} />
                </span>
                <span className="neo-dock-label">Today</span>
                {activeTab === "today" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "wheel" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("wheel");
                }}
                aria-label="Decision Wheel"
                aria-current={activeTab === "wheel" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <DiceIcon size={20} />
                </span>
                <span className="neo-dock-label">Decide</span>
                {activeTab === "wheel" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "standings" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("standings");
                }}
                aria-label="Cycles & Standings"
                aria-current={activeTab === "standings" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <TrophyIcon size={20} />
                </span>
                <span className="neo-dock-label">Cycles</span>
                {activeTab === "standings" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "history" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("history");
                }}
                aria-label="Habit History"
                aria-current={activeTab === "history" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <ClipboardCheckIcon size={20} />
                </span>
                <span className="neo-dock-label">History</span>
                {activeTab === "history" && <span className="neo-dock-active-dot" />}
              </button>

              <button
                type="button"
                className={`neo-dock-item ${activeTab === "rules" ? "active" : ""}`}
                onClick={() => {
                  gameFeedback.playPop();
                  setActiveTab("rules");
                }}
                aria-label="Rules & Guide"
                aria-current={activeTab === "rules" ? "page" : undefined}
              >
                <span className="neo-dock-icon">
                  <BookOpenIcon size={20} />
                </span>
                <span className="neo-dock-label">Rules</span>
                {activeTab === "rules" && <span className="neo-dock-active-dot" />}
              </button>
            </>
          )}
        </nav>

        <StreakCelebrationModal
          isOpen={streakModalData.isOpen}
          onClose={() => setStreakModalData((prev) => ({ ...prev, isOpen: false }))}
          streakCount={streakModalData.count}
          character={streakModalData.character}
          userName={streakModalData.userName}
          isTeamStreak={streakModalData.isTeam}
          protectsRemaining={streakModalData.isTeam ? (data?.streaks?.teamProtectsRemaining ?? 3) : (data?.streaks?.protectsRemaining ?? 3)}
          maxProtects={data?.streaks?.maxProtects ?? 3}
        />

        <CycleResultModal
          isOpen={showCycleResultModal}
          onClose={() => setShowCycleResultModal(false)}
          currentUserId={authenticatedUser?.id ?? 0}
          isSuperAdmin={isSuperAdmin}
          onCycleUpdated={() => {
            if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
            fetchCycleHistory(1);
          }}
          onStartNewCycle={() => {
            setShowCycleResultModal(false);
            openStartCycleModal();
          }}
        />

        {showStartCycleModal && (
          <div className="neo-modal-backdrop" onClick={() => !cycleModalLoading && setShowStartCycleModal(false)}>
            <div
              className="neo-bottom-sheet"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(180deg, #16241D 0%, #0D1612 100%)",
                borderRadius: "32px",
                padding: "26px 20px 24px",
                maxWidth: "420px",
                width: "100%",
                boxShadow: "0 24px 64px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.15)",
                border: "1.5px solid var(--border-specular)",
                position: "relative",
                color: "#FFFFFF",
              }}
            >
              <div className="sheet-handle" />

              <button
                type="button"
                disabled={cycleModalLoading}
                onClick={() => setShowStartCycleModal(false)}
                style={{
                  position: "absolute",
                  top: "18px",
                  right: "18px",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  color: "rgba(255, 255, 255, 0.8)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Close"
              >
                <XIcon size={15} />
              </button>

              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.1) 100%)",
                    border: "1.5px solid rgba(16, 185, 129, 0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px",
                  }}
                >
                  <FlameIcon size={24} color="var(--emerald-glow)" />
                </div>
                <h2 style={{ fontSize: "19px", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-0.4px" }}>
                  Start Next Cycle
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Launch a fresh monthly season and duel competition for Players.
                </p>
              </div>

              <form onSubmit={handleStartNewCycle} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "var(--emerald-glow)", marginBottom: "5px" }}>
                    CYCLE NAME:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. November 2026"
                    value={newCycleName}
                    onChange={(e) => setNewCycleName(e.target.value)}
                    style={{
                      width: "100%",
                      background: "var(--bg-surface-input)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "14px",
                      padding: "12px 14px",
                      color: "#FFFFFF",
                      fontSize: "13px",
                      fontWeight: "800",
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      START DATE:
                    </label>
                    <input
                      type="date"
                      required
                      value={newCycleStartDate}
                      onChange={(e) => setNewCycleStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        background: "var(--bg-surface-input)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "14px",
                        padding: "11px 12px",
                        color: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "900", color: "var(--text-secondary)", marginBottom: "5px" }}>
                      END DATE:
                    </label>
                    <input
                      type="date"
                      required
                      value={newCycleEndDate}
                      onChange={(e) => setNewCycleEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        background: "var(--bg-surface-input)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "14px",
                        padding: "11px 12px",
                        color: "#FFFFFF",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    borderRadius: "14px",
                    padding: "10px 12px",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--emerald-glow)", fontWeight: "800", marginBottom: "3px" }}>
                    <SparkleIcon size={13} color="var(--emerald-glow)" />
                    <span>Cycle Transition Rules</span>
                  </div>
                  Scores reset to <strong>0 - 0</strong> for a fresh duel, and <strong>3x Streak Shields</strong> are refreshed for both players. Player daily streaks carry over indefinitely.
                </div>

                {cycleModalError && (
                  <div
                    style={{
                      padding: "9px 12px",
                      borderRadius: "12px",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      color: "#FCA5A5",
                      fontSize: "11px",
                      fontWeight: "800",
                      textAlign: "center",
                    }}
                  >
                    {cycleModalError}
                  </div>
                )}

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    disabled={cycleModalLoading}
                    onClick={() => setShowStartCycleModal(false)}
                    className="neo-btn neo-btn-glass"
                    style={{ flex: 1, fontSize: "12px", padding: "12px" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={cycleModalLoading}
                    className="neo-btn neo-btn-emerald"
                    style={{
                      flex: 2,
                      fontSize: "12px",
                      padding: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    {cycleModalLoading ? (
                      <>
                        <SpinnerIcon size={14} color="#FFFFFF" />
                        <span>Launching Cycle...</span>
                      </>
                    ) : (
                      <>
                        <FlameIcon size={14} color="#FFFFFF" />
                        <span>Launch New Cycle</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ChangePinModal
          isOpen={showChangePinModal}
          onClose={() => {
            setShowChangePinModal(false);
            setChangePinTargetId(undefined);
            setChangePinInitialMode("edit");
          }}
          currentUser={authenticatedUser}
          targetUserId={changePinTargetId}
          initialMode={changePinInitialMode}
          allUsers={data?.users || []}
          onPinChanged={(msg, updatedUser) => {
            setCelebration(msg);
            setTimeout(() => setCelebration(null), 3500);

            if (updatedUser) {
              setData((prev) => {
                if (!prev) return prev;
                const nextUsers = (prev.users || []).map((u) =>
                  u.id === updatedUser.id
                    ? {
                        ...u,
                        ...updatedUser,
                        name: updatedUser.name?.trim() ? updatedUser.name.trim() : u.name,
                        role: u.id === 1 ? "superadmin" : (updatedUser.role || u.role),
                      }
                    : u
                );
                const nextPartner =
                  prev.partnerUser && prev.partnerUser.id === updatedUser.id
                    ? {
                        ...prev.partnerUser,
                        ...updatedUser,
                        name: updatedUser.name?.trim() ? updatedUser.name.trim() : prev.partnerUser.name,
                        role: prev.partnerUser.id === 1 ? "superadmin" : (updatedUser.role || prev.partnerUser.role),
                      }
                    : prev.partnerUser;
                const nextCurrent =
                  prev.currentUser && prev.currentUser.id === updatedUser.id
                    ? {
                        ...prev.currentUser,
                        ...updatedUser,
                        name: updatedUser.name?.trim() ? updatedUser.name.trim() : prev.currentUser.name,
                        role: prev.currentUser.id === 1 ? "superadmin" : (updatedUser.role || prev.currentUser.role),
                      }
                    : prev.currentUser;
                const nextPlayerA =
                  prev.playerA && prev.playerA.id === updatedUser.id
                    ? {
                        ...prev.playerA,
                        ...updatedUser,
                        name: updatedUser.name?.trim() ? updatedUser.name.trim() : prev.playerA.name,
                        role: prev.playerA.id === 1 ? "superadmin" : (updatedUser.role || prev.playerA.role),
                      }
                    : prev.playerA;
                const nextPlayerB =
                  prev.playerB && prev.playerB.id === updatedUser.id
                    ? {
                        ...prev.playerB,
                        ...updatedUser,
                        name: updatedUser.name?.trim() ? updatedUser.name.trim() : prev.playerB.name,
                        role: prev.playerB.id === 1 ? "superadmin" : (updatedUser.role || prev.playerB.role),
                      }
                    : prev.playerB;

                const nextData = {
                  ...prev,
                  users: nextUsers,
                  partnerUser: nextPartner,
                  currentUser: nextCurrent,
                  playerA: nextPlayerA,
                  playerB: nextPlayerB,
                };

                try {
                  localStorage.setItem(
                    `habits_dashboard_cache_${authenticatedUser.id}`,
                    JSON.stringify(nextData)
                  );
                } catch {}

                return nextData;
              });

              if (authenticatedUser && authenticatedUser.id === updatedUser.id) {
                const refreshedAuth = {
                  ...authenticatedUser,
                  ...updatedUser,
                  name: updatedUser.name?.trim() ? updatedUser.name.trim() : authenticatedUser.name,
                  role: authenticatedUser.id === 1 ? "superadmin" : (updatedUser.role || authenticatedUser.role),
                };
                setAuthenticatedUser(refreshedAuth);
                try {
                  localStorage.setItem("habits_auth_user", JSON.stringify(refreshedAuth));
                } catch {}
              }
            }

            if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
          }}
        />

        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => {
            setIsEditTaskModalOpen(false);
            setEditingTask(null);
          }}
          task={editingTask}
          currentUserId={authenticatedUser?.id ?? 0}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
        <PersonalHabitModal
          isOpen={showPersonalTaskModal}
          onClose={() => {
            setShowPersonalTaskModal(false);
            setEditingPersonalTask(null);
          }}
          currentUserId={authenticatedUser?.id ?? 0}
          initialTask={editingPersonalTask}
          onSaved={async (savedTask) => {
            setShowPersonalTaskModal(false);
            const wasEditing = Boolean(editingPersonalTask);
            setEditingPersonalTask(null);
            gameFeedback.playSuccessChime();
            setCelebration(wasEditing ? "Personal habit updated!" : "New personal habit added!");
            setTimeout(() => setCelebration(null), 3500);

            if (savedTask) {
              const taskFreq = savedTask.frequency;
              if (taskFreq === "cycle") {
                setTaskCategoryTab("cycle");
              } else if (taskFreq === "daily" || (!taskFreq && (savedTask.target_days_per_week === 7 || !savedTask.target_days_per_week))) {
                setTaskCategoryTab("everyday");
              } else {
                setTaskCategoryTab("weekly");
              }
              if (taskFilter === "shared") {
                setTaskFilter("all");
              }
              setTodayTasksLimit((prev) => Math.max(prev, 50));

              setData((prev) => {
                if (!prev) return prev;
                const currentTasks = prev.tasks || [];
                const existing = currentTasks.some((t) => Number(t.id) === Number(savedTask.id));
                const nextTasks = existing
                  ? currentTasks.map((t) => (Number(t.id) === Number(savedTask.id) ? savedTask : t))
                  : [savedTask, ...currentTasks];
                const nextData = { ...prev, tasks: nextTasks };
                if (authenticatedUser) {
                  try {
                    localStorage.setItem(`habits_dashboard_cache_${authenticatedUser.id}`, JSON.stringify(nextData));
                  } catch {}
                }
                return nextData;
              });
            }

            if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
          }}
          onDeleted={async (deletedId) => {
            setShowPersonalTaskModal(false);
            const targetId = deletedId || editingPersonalTask?.id;
            setEditingPersonalTask(null);
            gameFeedback.playPop();
            setCelebration("Personal habit removed.");
            setTimeout(() => setCelebration(null), 3500);

            if (targetId) {
              setData((prev) => {
                if (!prev) return prev;
                const nextData = {
                  ...prev,
                  tasks: (prev.tasks || []).filter((t) => Number(t.id) !== Number(targetId)),
                };
                if (authenticatedUser) {
                  try {
                    localStorage.setItem(`habits_dashboard_cache_${authenticatedUser.id}`, JSON.stringify(nextData));
                  } catch {}
                }
                return nextData;
              });
            }

            if (authenticatedUser) fetchDashboard(authenticatedUser.id, true);
          }}
        />

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            handleLogout();
          }}
          user={authenticatedUser}
        />

        <PairDeviceModal
          isOpen={showPairModal}
          onClose={() => setShowPairModal(false)}
          onSuccess={() => {
            teardownDemoInterceptor();
            setIsDemoMode(false);
            setShowPairModal(false);
            window.location.href = "/";
          }}
        />

        {showStorageModal && storageInfo && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.82)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: "16px",
            }}
            onClick={() => setShowStorageModal(false)}
          >
            <div
              className="neo-card animate-pop"
              style={{
                width: "100%",
                maxWidth: "420px",
                maxHeight: "90dvh",
                overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                boxSizing: "border-box",
                background: "linear-gradient(145deg, rgba(20, 26, 22, 0.98), rgba(11, 17, 13, 0.98))",
                border: `1px solid ${storageInfo.borderColor}`,
                borderRadius: "20px",
                padding: "20px",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(16, 185, 129, 0.12)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: storageInfo.bgColor,
                      border: `1px solid ${storageInfo.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DatabaseIcon size={18} color={storageInfo.themeColor} />
                  </div>
                  <div>
                    <span style={{ fontSize: "10px", fontWeight: "900", color: storageInfo.themeColor, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                      Supabase Database Storage
                    </span>
                    <h3 style={{ fontSize: "16px", fontWeight: "900", color: "#FFFFFF", margin: "1px 0 0 0" }}>
                      Storage Quota Monitor
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStorageModal(false)}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "var(--text-muted)",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <XIcon size={14} />
                </button>
              </div>

              <div
                style={{
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "#FFFFFF" }}>Used / Total Capacity</span>
                  <span style={{ fontSize: "11px", fontWeight: "900", color: storageInfo.themeColor }}>
                    {storageInfo.usedMb < 0.01 && storageInfo.approxBytes > 0 ? "< 0.01" : storageInfo.usedMb.toFixed(2)} / {storageInfo.maxFreeMb} MB ({storageInfo.percentage < 0.01 ? "< 0.01%" : `${storageInfo.percentage.toFixed(2)}%`})
                  </span>
                </div>
                <div
                  style={{
                    height: "8px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(1, Math.min(100, storageInfo.percentage))}%`,
                      background: storageInfo.themeColor,
                      borderRadius: "4px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", fontSize: "10px", color: "var(--text-muted)" }}>
                  <span>Remaining: {storageInfo.remainingMb.toFixed(2)} MB</span>
                  <span>Plan: {storageInfo.maxFreeMb > 500 ? `Supabase (${storageInfo.maxFreeMb} MB)` : "Supabase Free (500 MB)"}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Current Usage
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: "900", color: storageInfo.themeColor, marginTop: "2px" }}>
                    {storageInfo.usedMb < 0.01 && storageInfo.approxBytes > 0 ? "< 0.01" : storageInfo.usedMb.toFixed(2)} <span style={{ fontSize: "11px" }}>MB</span>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Approx {(storageInfo.approxBytes / 1024).toFixed(1)} KB
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Remaining Space
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                    {storageInfo.remainingMb.toFixed(2)} <span style={{ fontSize: "11px" }}>MB</span>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Available to store
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Total Capacity
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                    {storageInfo.maxFreeMb} <span style={{ fontSize: "11px" }}>MB</span>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Free plan quota
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "10px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Total Records
                  </div>
                  <div style={{ fontSize: "17px", fontWeight: "900", color: "#FFFFFF", marginTop: "2px" }}>
                    {storageInfo.rowCount} <span style={{ fontSize: "11px" }}>rows</span>
                  </div>
                  <div style={{ fontSize: "9.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Across 9 tables
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="neo-btn neo-btn-emerald"
                  style={{ flex: 1, padding: "10px", fontSize: "12px", fontWeight: "900", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  onClick={() => {
                    setShowStorageModal(false);
                    setActiveTab("admin");
                    setTimeout(() => {
                      const el = document.getElementById("admin-database-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }, 120);
                  }}
                >
                  <DownloadIcon size={14} />
                  <span>Backup & Export Data</span>
                </button>
                <button
                  type="button"
                  className="neo-btn neo-btn-glass"
                  style={{ padding: "10px 14px", fontSize: "12px", fontWeight: "800" }}
                  onClick={() => setShowStorageModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {flyingCoin && (
          <div
            className="floating-point-coin"
            style={{
              left: `${flyingCoin.x}px`,
              top: `${flyingCoin.y}px`,
            }}
          >
            <SparkleIcon size={14} color="#FCD34D" />
            <span>+{flyingCoin.points} Points</span>
          </div>
        )}
      </div>
    </div>
  );
}

