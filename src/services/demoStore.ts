import { StreakEngine, isEverydayTask } from "./streakEngine";
import { SCORING_RULES, SCORE_REASON_TEMPLATES } from "@/config/scoring";
import type {
  User,
  Task,
  TaskFrequency,
  Cycle,
  DailyLog,
  ScoreEvent,
  Punishment,
  DecisionOption,
  Pair,
  CycleHistoryPage,
  CycleHistoryItem,
} from "@/types/domain";

const DEMO_STORAGE_KEY = "habiventure_demo_sandbox_v1";

export interface DemoState {
  users: User[];
  pairs: Pair[];
  activeCycle: Cycle;
  cycles: Cycle[];
  tasks: Task[];
  dailyLogs: DailyLog[];
  scoreEvents: ScoreEvent[];
  punishments: Punishment[];
  decisionOptions: DecisionOption[];
}

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 1,
    name: "Super Admin",
    role: "superadmin",
    gender: "male",
    active: true,
    pin: "9999",
  },
  {
    id: 2,
    name: "Player A",
    role: "user",
    gender: "male",
    active: true,
    pin: "1122",
    partner_id: 3,
    partner_name: "Player B",
  },
  {
    id: 3,
    name: "Player B",
    role: "user",
    gender: "female",
    active: true,
    pin: "3344",
    partner_id: 2,
    partner_name: "Player A",
  },
];

export const INITIAL_DEMO_PAIRS: Pair[] = [
  {
    id: 1,
    user_1_id: 2,
    user_2_id: 3,
    active: true,
  },
];

export const INITIAL_DEMO_CYCLES: Cycle[] = [
  {
    id: 1,
    name: "October 2026",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "active",
    winner_user_id: null,
  },
  {
    id: 101,
    name: "September 2026",
    start_date: "2026-09-01",
    end_date: "2026-09-30",
    status: "closed",
    winner_user_id: 2,
  },
  {
    id: 102,
    name: "August 2026",
    start_date: "2026-08-01",
    end_date: "2026-08-31",
    status: "closed",
    winner_user_id: 3,
  },
  {
    id: 103,
    name: "July 2026",
    start_date: "2026-07-01",
    end_date: "2026-07-31",
    status: "closed",
    winner_user_id: 2,
  },
];

export const INITIAL_DEMO_CYCLE: Cycle = INITIAL_DEMO_CYCLES[0];

export const INITIAL_DEMO_TASKS: Task[] = [
  {
    id: 1,
    name: "Workout (30 Mins)",
    description: "Daily exercise session (4x per week)",
    base_score: 10,
    active: true,
    frequency: "weekly_custom",
    target_days_per_week: 4,
  },
  {
    id: 2,
    name: "Deep Weekly Review",
    description: "Evaluate progress and milestones (2x weekly: Tue & Fri)",
    base_score: 15,
    active: true,
    frequency: "weekly_2x",
    target_days_per_week: 2,
  },
  {
    id: 3,
    name: "Language Practice",
    description: "Vocabulary, listening, or speaking (Daily)",
    base_score: 10,
    active: true,
    frequency: "daily",
    target_days_per_week: 7,
  },
  {
    id: 4,
    name: "Reading & Skill Upskilling",
    description: "Read books or build new skills (3x per week)",
    base_score: 10,
    active: true,
    frequency: "weekly_custom",
    target_days_per_week: 3,
  },
  {
    id: 5,
    name: "Monthly Savings Quest",
    description: "Save or invest monthly budget allocation",
    base_score: 50,
    active: true,
    frequency: "cycle",
    target_days_per_week: 1,
  },
];

export const INITIAL_DEMO_PUNISHMENTS: Punishment[] = [
  { id: 1, name: "Pay $10 Dinner Treat", description: "Direct transfer or treat to the winner", active: true },
  { id: 2, name: "Treat Winner to Dinner", description: "Full dinner treat of the winner's choice", active: true },
  { id: 3, name: "Treat Coffee (3x)", description: "Buy favorite coffee for the winner 3 times", active: true },
  { id: 4, name: "Winner's Restaurant Choice", description: "Dine out at the restaurant chosen by the winner", active: true },
  { id: 5, name: "Free Weekend Chores Pass", description: "Take care of winner's chores over the weekend", active: true },
];

export const INITIAL_DEMO_DECISION_OPTIONS: DecisionOption[] = [
  { id: 1, name: "Dine Out / Restaurant" },
  { id: 2, name: "Cook Together at Home" },
  { id: 3, name: "Movie Night / Cinema" },
  { id: 4, name: "Cafe & Coffee Chill" },
  { id: 5, name: "Casual Walk / Mall Trip" },
  { id: 6, name: "Your Treat" },
  { id: 7, name: "Partner's Treat" },
  { id: 8, name: "Rock Paper Scissors" },
];

function createInitialDemoState(): DemoState {
  const today = StreakEngine.formatDate(new Date());
  const logs: DailyLog[] = [];
  const events: ScoreEvent[] = [];

  let nextLogId = 1;
  let nextEventId = 1;

  for (let i = 14; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = StreakEngine.formatDate(d);

    if (i === 5) {
      logs.push({
        id: nextLogId++,
        user_id: 3,
        task_id: 3,
        date: dateStr,
        status: "completed",
        completed_at: `${dateStr}T11:00:00Z`,
      });
      events.push({
        id: nextEventId++,
        cycle_id: 1,
        user_id: 3,
        date: dateStr,
        type: "task_completed",
        points: 10,
        reason: SCORE_REASON_TEMPLATES.taskCompleted("Language Practice"),
      });
      continue;
    }

    logs.push({
      id: nextLogId++,
      user_id: 2,
      task_id: 3,
      date: dateStr,
      status: "completed",
      completed_at: `${dateStr}T09:30:00Z`,
    });
    events.push({
      id: nextEventId++,
      cycle_id: 1,
      user_id: 2,
      date: dateStr,
      type: "task_completed",
      points: 10,
      reason: SCORE_REASON_TEMPLATES.taskCompleted("Language Practice"),
    });

    logs.push({
      id: nextLogId++,
      user_id: 3,
      task_id: 3,
      date: dateStr,
      status: "completed",
      completed_at: `${dateStr}T10:15:00Z`,
    });
    events.push({
      id: nextEventId++,
      cycle_id: 1,
      user_id: 3,
      date: dateStr,
      type: "task_completed",
      points: 10,
      reason: SCORE_REASON_TEMPLATES.taskCompleted("Language Practice"),
    });

    events.push({
      id: nextEventId++,
      cycle_id: 1,
      user_id: 2,
      date: dateStr,
      type: "team_bonus",
      points: 10,
      reason: SCORE_REASON_TEMPLATES.teamBonus(),
    });
    events.push({
      id: nextEventId++,
      cycle_id: 1,
      user_id: 3,
      date: dateStr,
      type: "team_bonus",
      points: 10,
      reason: SCORE_REASON_TEMPLATES.teamBonus(),
    });

    if (i % 3 === 0) {
      logs.push({
        id: nextLogId++,
        user_id: 2,
        task_id: 1,
        date: dateStr,
        status: "completed",
        completed_at: `${dateStr}T17:00:00Z`,
      });
      events.push({
        id: nextEventId++,
        cycle_id: 1,
        user_id: 2,
        date: dateStr,
        type: "task_completed",
        points: 10,
        reason: SCORE_REASON_TEMPLATES.taskCompleted("Workout (30 Mins)"),
      });

      logs.push({
        id: nextLogId++,
        user_id: 3,
        task_id: 1,
        date: dateStr,
        status: "completed",
        completed_at: `${dateStr}T18:00:00Z`,
      });
      events.push({
        id: nextEventId++,
        cycle_id: 1,
        user_id: 3,
        date: dateStr,
        type: "task_completed",
        points: 10,
        reason: SCORE_REASON_TEMPLATES.taskCompleted("Workout (30 Mins)"),
      });
    }
  }

  return {
    users: INITIAL_DEMO_USERS.map((u) => ({ ...u })),
    pairs: INITIAL_DEMO_PAIRS.map((p) => ({ ...p })),
    activeCycle: { ...INITIAL_DEMO_CYCLE },
    cycles: INITIAL_DEMO_CYCLES.map((c) => ({ ...c })),
    tasks: INITIAL_DEMO_TASKS.map((t) => ({ ...t })),
    dailyLogs: logs,
    scoreEvents: events,
    punishments: INITIAL_DEMO_PUNISHMENTS.map((p) => ({ ...p })),
    decisionOptions: INITIAL_DEMO_DECISION_OPTIONS.map((o) => ({ ...o })),
  };
}

class DemoStore {
  private state: DemoState;

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): DemoState {
    if (typeof window === "undefined") {
      return createInitialDemoState();
    }

    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.tasks) && Array.isArray(parsed.dailyLogs)) {
          if (!Array.isArray(parsed.cycles) || parsed.cycles.length <= 1) {
            parsed.cycles = INITIAL_DEMO_CYCLES.map((c) => ({ ...c }));
          }
          return parsed;
        }
      }
    } catch {
      
    }

    const initial = createInitialDemoState();
    this.persistState(initial);
    return initial;
  }

  private persistState(state: DemoState) {
    this.state = state;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
      } catch {
        
      }
    }
  }

  public resetDemoData(): DemoState {
    const fresh = createInitialDemoState();
    this.persistState(fresh);
    return fresh;
  }

  public verifyDemoPin(pin: string): User | null {
    const trimmed = (pin || "").trim();
    if (trimmed === "1122") return this.state.users.find((u) => u.id === 2) || null;
    if (trimmed === "3344") return this.state.users.find((u) => u.id === 3) || null;
    if (trimmed === "9999") return this.state.users.find((u) => u.id === 1) || null;
    return this.state.users.find((u) => u.pin === trimmed) || null;
  }

  public getDemoDashboard(userId: number) {
    const activeUsers = this.state.users.filter((u) => u.active !== false);
    const regularUsers = activeUsers.filter((u) => u.role !== "superadmin");
    const currentUser = activeUsers.find((u) => u.id === userId) || regularUsers[0] || activeUsers[0];

    const userPair = this.state.pairs.find(
      (p) => p.user_1_id === currentUser.id || p.user_2_id === currentUser.id
    ) || this.state.pairs[0];

    let partnerUser: User | null = null;
    if (userPair && currentUser.role !== "superadmin") {
      const partnerId = userPair.user_1_id === currentUser.id ? userPair.user_2_id : userPair.user_1_id;
      partnerUser = activeUsers.find((u) => u.id === partnerId) || null;
    }

    const playerA = regularUsers[0] || null;
    const playerB = regularUsers[1] || null;

    const todayDate = StreakEngine.formatDate(new Date());
    const activeCycle = this.state.activeCycle;

    const endDate = new Date(activeCycle.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const visibleTasks = this.state.tasks.filter((t) => {
      if (!t.active) return false;
      if (!t.is_personal) return true;
      return Number(t.created_by) === Number(currentUser.id);
    });

    const everydayTasks = visibleTasks.filter(
      (t) => t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week))
    );
    const weeklyTasks = visibleTasks.filter(
      (t) => t.frequency !== "daily" && t.frequency !== "cycle" && (t.target_days_per_week ? t.target_days_per_week < 7 : true)
    );
    const cycleTasks = visibleTasks.filter((t) => t.frequency === "cycle");

    const todayLogs = this.state.dailyLogs.filter((l) => l.date === todayDate);

    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = StreakEngine.formatDate(monday);
    const sundayStr = StreakEngine.formatDate(sunday);

    const weeklyProgress: Record<
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
    > = {};
    for (const wt of weeklyTasks) {
      const isWeekly = wt.frequency !== "daily" && (wt.target_days_per_week ? wt.target_days_per_week < 7 : true);
      const targetDays = wt.target_days_per_week || (wt.frequency === "weekly_2x" ? 2 : 7);

      const userLogsInWeek = this.state.dailyLogs.filter(
        (l) => l.user_id === currentUser.id && l.task_id === wt.id && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr
      );
      const userUniqueDates = Array.from(new Set(userLogsInWeek.map((l) => l.date)));

      const partnerLogsInWeek = partnerUser
        ? this.state.dailyLogs.filter(
            (l) => l.user_id === partnerUser.id && l.task_id === wt.id && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr
          )
        : [];
      const partnerUniqueDates = Array.from(new Set(partnerLogsInWeek.map((l) => l.date)));

      const completedToday = todayLogs.some(
        (l) => l.user_id === currentUser.id && l.task_id === wt.id && l.status === "completed"
      );

      weeklyProgress[wt.id] = {
        completedDaysThisWeek: userUniqueDates.length,
        targetDays,
        isTargetReached: isWeekly ? userUniqueDates.length >= targetDays : false,
        completedToday,
        completedDatesThisWeek: userUniqueDates,
        partnerCompletedDaysThisWeek: partnerUniqueDates.length,
        partnerTargetReached: isWeekly ? partnerUniqueDates.length >= targetDays : false,
      };
    }

    const cycleTaskProgress: Record<number, any> = {};
    for (const ct of cycleTasks) {
      const userLog = this.state.dailyLogs.find(
        (l) => l.user_id === currentUser.id && l.task_id === ct.id && l.status === "completed" && l.date >= activeCycle.start_date && l.date <= activeCycle.end_date
      );
      const partnerLog = partnerUser
        ? this.state.dailyLogs.find(
            (l) => l.user_id === partnerUser.id && l.task_id === ct.id && l.status === "completed" && l.date >= activeCycle.start_date && l.date <= activeCycle.end_date
          )
        : null;

      cycleTaskProgress[ct.id] = {
        completedInCycle: Boolean(userLog),
        completedDate: userLog ? userLog.date : null,
        partnerCompletedInCycle: Boolean(partnerLog),
        partnerCompletedDate: partnerLog ? partnerLog.date : null,
        personalCycleStreak: 2,
        teamCycleStreak: 2,
      };
    }

    const taskStreaks: Record<number, number> = {};
    const taskTotalDays: Record<number, number> = {};
    for (const t of visibleTasks) {
      const tLogs = this.state.dailyLogs.filter((l) => l.task_id === t.id && l.user_id === currentUser.id && l.status === "completed");
      taskTotalDays[t.id] = tLogs.length;
      taskStreaks[t.id] = StreakEngine.calculateTaskStreak(currentUser.id, t.id, this.state.dailyLogs);
    }

    const personalStreakDetails = StreakEngine.calculatePersonalStreakDetails(
      currentUser.id,
      this.state.tasks,
      this.state.dailyLogs,
      todayDate,
      [activeCycle]
    );
    const partnerStreakDetails = partnerUser
      ? StreakEngine.calculatePersonalStreakDetails(
          partnerUser.id,
          this.state.tasks,
          this.state.dailyLogs,
          todayDate,
          [activeCycle]
        )
      : { streak: 0, protectsUsed: 0, protectsRemaining: 3, maxProtects: 3, protectedDates: [] };

    const teamStreakDetails = partnerUser
      ? StreakEngine.calculateTeamStreakDetails(
          [currentUser.id, partnerUser.id],
          this.state.tasks,
          this.state.dailyLogs,
          todayDate,
          [activeCycle]
        )
      : { streak: 0, protectsUsed: 0, protectsRemaining: 3, maxProtects: 3, protectedDates: [] };

    const userEvents = this.state.scoreEvents.filter((e) => e.cycle_id === activeCycle.id && e.user_id === currentUser.id);
    const partnerEvents = partnerUser
      ? this.state.scoreEvents.filter((e) => e.cycle_id === activeCycle.id && e.user_id === partnerUser.id)
      : [];

    const currentScore = userEvents.reduce((sum, e) => sum + e.points, 0);
    const partnerScore = partnerEvents.reduce((sum, e) => sum + e.points, 0);
    const scoreDiff = currentScore - partnerScore;

    const playerAScore = this.state.scoreEvents.filter((e) => e.cycle_id === activeCycle.id && e.user_id === (playerA?.id ?? 2)).reduce((sum, e) => sum + e.points, 0);
    const playerBScore = this.state.scoreEvents.filter((e) => e.cycle_id === activeCycle.id && e.user_id === (playerB?.id ?? 3)).reduce((sum, e) => sum + e.points, 0);

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const sharedTasks = this.state.tasks.filter((t) => !t.is_personal && t.active);
    const sharedEverydayTasks = sharedTasks.filter(
      (t) => t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week))
    );

    const weekStreakDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dStr = StreakEngine.formatDate(d);
      const userLogsForDay = this.state.dailyLogs.filter(
        (l) => l.user_id === currentUser.id && l.date === dStr && l.status === "completed"
      );
      const partnerLogsForDay = partnerUser
        ? this.state.dailyLogs.filter(
            (l) => l.user_id === partnerUser.id && l.date === dStr && l.status === "completed"
          )
        : [];

      const userEverydayCount = userLogsForDay.filter((l) =>
        sharedEverydayTasks.some((et) => et.id === l.task_id)
      ).length;
      const partnerEverydayCount = partnerLogsForDay.filter((l) =>
        sharedEverydayTasks.some((et) => et.id === l.task_id)
      ).length;

      const isProtected = personalStreakDetails.protectedDates?.includes(dStr) ?? false;
      const isPartnerProtected = partnerStreakDetails.protectedDates?.includes(dStr) ?? false;
      const isToday = dStr === todayDate;
      const isPast = dStr < todayDate;
      const isFuture = dStr > todayDate;

      weekStreakDays.push({
        date: dStr,
        dateNum: d.getDate(),
        dayLabel: dayLabels[i],
        dayLabelEn: dayLabels[i],
        completedCount: userEverydayCount,
        partnerCompletedCount: partnerEverydayCount,
        hasCompleted: userEverydayCount > 0,
        isFullyCompleted: sharedEverydayTasks.length > 0 && userEverydayCount >= sharedEverydayTasks.length,
        isTeamCompleted:
          sharedEverydayTasks.length > 0 &&
          userEverydayCount >= sharedEverydayTasks.length &&
          partnerEverydayCount >= sharedEverydayTasks.length,
        isProtected,
        isPartnerProtected,
        isToday,
        isPast,
        isFuture,
      });
    }

    return {
      configured: true,
      schemaReady: true,
      users: activeUsers,
      regularUsers,
      pairs: this.state.pairs,
      userPair,
      playerA,
      playerB,
      currentUser,
      partnerUser,
      daysRemaining,
      activeCycle,
      cycles: this.state.cycles,
      tasks: visibleTasks,
      everydayTasks,
      weeklyTasks,
      cycleTasks,
      cycleTaskProgress,
      weeklyProgress,
      weekRange: { start: mondayStr, end: sundayStr },
      taskStreaks,
      taskTotalDays,
      todayLogs,
      historyLogs: this.state.dailyLogs.filter((l) => l.user_id === currentUser.id),
      scores: {
        currentScore,
        partnerScore,
        scoreDiff,
        playerA: playerA ? { id: playerA.id, name: playerA.name, score: playerAScore } : null,
        playerB: playerB ? { id: playerB.id, name: playerB.name, score: playerBScore } : null,
        currentUserSummary: { userId: currentUser.id, total: currentScore, breakdown: { personal: currentScore, bonus: 0, penalty: 0 } },
        partnerUserSummary: partnerUser ? { userId: partnerUser.id, total: partnerScore, breakdown: { personal: partnerScore, bonus: 0, penalty: 0 } } : null,
      },
      streaks: {
        personalStreak: personalStreakDetails.streak,
        teamStreak: teamStreakDetails.streak,
        partnerStreak: partnerStreakDetails.streak,
        protectsUsed: personalStreakDetails.protectsUsed,
        protectsRemaining: personalStreakDetails.protectsRemaining,
        maxProtects: personalStreakDetails.maxProtects,
        protectedDates: personalStreakDetails.protectedDates,
        isYesterdayProtected: personalStreakDetails.isYesterdayProtected,
        teamProtectsRemaining: teamStreakDetails.protectsRemaining,
        teamProtectsUsed: teamStreakDetails.protectsUsed,
        partnerProtectsRemaining: partnerStreakDetails.protectsRemaining,
        weekStreakDays,
      },
      storageUsage: this.computeStorageUsage(),
      todayDate,
      recentEvents: this.state.scoreEvents.slice(-15).reverse(),
      cycleHistory: this.getCycleHistory(1, 3),
    };
  }

  public getStorageUsage() {
    return this.computeStorageUsage();
  }

  private computeStorageUsage() {
    const rowCount =
      this.state.users.length +
      this.state.tasks.length +
      this.state.dailyLogs.length +
      this.state.scoreEvents.length +
      this.state.cycles.length +
      this.state.punishments.length +
      this.state.decisionOptions.length;
    const approxBytes = JSON.stringify(this.state).length;
    const usedMb = Number((approxBytes / (1024 * 1024)).toFixed(2));
    const envQuota = Number(process.env.SUPABASE_DB_LIMIT_MB || process.env.NEXT_PUBLIC_DB_STORAGE_LIMIT_MB);
    const baseQuota = envQuota && envQuota > 0 ? envQuota : 500;
    const maxFreeMb = usedMb > baseQuota ? Math.ceil(usedMb / 1024) * 1024 : baseQuota;
    const remainingMb = Number(Math.max(0, maxFreeMb - usedMb).toFixed(2));
    const percentage = Number(Math.min(100, Math.max(0.01, (usedMb / maxFreeMb) * 100)).toFixed(3));

    return {
      rowCount,
      approxBytes,
      usedMb,
      maxFreeMb,
      remainingMb,
      percentage,
      totalRows: rowCount,
      estimatedBytes: approxBytes,
      estimatedMegabytes: usedMb,
      maxFreeMegabytes: maxFreeMb,
      usagePercentage: percentage,
      tableBreakdown: {
        tasks: this.state.tasks.length,
        daily_logs: this.state.dailyLogs.length,
        score_events: this.state.scoreEvents.length,
        users: this.state.users.length,
        cycles: this.state.cycles.length,
        punishments: this.state.punishments.length,
      },
    };
  }

  public completeDemoTask(userId: number, taskId: number, targetDate?: string) {
    if (this.state.activeCycle && this.state.activeCycle.status !== "active") {
      return {
        success: false,
        error: "Current cycle is closed and scores are frozen. Please start a new cycle to record goals.",
        alreadyRecorded: false,
        pointsEarned: 0,
      };
    }
    const date = targetDate || StreakEngine.formatDate(new Date());
    const task = this.state.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error("Task not found");

    const existingLog = this.state.dailyLogs.find(
      (l) => l.user_id === userId && l.task_id === taskId && l.date === date && l.status === "completed"
    );
    if (existingLog) {
      return { success: true, alreadyRecorded: true, pointsEarned: 0 };
    }

    if (task.frequency === "cycle") {
      const cycleLog = this.state.dailyLogs.find(
        (l) =>
          l.user_id === userId &&
          l.task_id === taskId &&
          l.status === "completed" &&
          l.date >= this.state.activeCycle.start_date &&
          l.date <= this.state.activeCycle.end_date
      );
      if (cycleLog) {
        return { success: true, alreadyRecorded: true, pointsEarned: 0 };
      }
    }

    const isWeekly = task.frequency !== "daily" && task.frequency !== "cycle" && (task.target_days_per_week ? task.target_days_per_week < 7 : false);
    if (isWeekly && task.target_days_per_week) {
      const d = StreakEngine.parseDate(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const mondayStr = StreakEngine.formatDate(monday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = StreakEngine.formatDate(sunday);

      const otherDayLogsThisWeek = this.state.dailyLogs.filter(
        (l) => l.user_id === userId && l.task_id === taskId && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr && l.date !== date
      );
      const uniqueDays = new Set(otherDayLogsThisWeek.map((l) => l.date));

      if (uniqueDays.size >= task.target_days_per_week) {
        return {
          success: false,
          error: `Weekly target of ${task.target_days_per_week} days for '${task.name}' has already been achieved this week.`,
          alreadyRecorded: false,
          pointsEarned: 0,
        };
      }
    }

    const newLog: DailyLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      user_id: userId,
      task_id: taskId,
      date,
      status: "completed",
      completed_at: new Date().toISOString(),
    };
    this.state.dailyLogs.push(newLog);

    let points = task.is_personal ? 0 : task.base_score || (task.frequency === "cycle" ? 50 : 10);
    const scoreEvent: ScoreEvent = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      cycle_id: this.state.activeCycle.id,
      user_id: userId,
      date,
      type: "task_completed",
      points,
      reason: SCORE_REASON_TEMPLATES.taskCompleted(task.name),
    };
    this.state.scoreEvents.push(scoreEvent);

    const pair = this.state.pairs.find((p) => p.user_1_id === userId || p.user_2_id === userId);
    if (pair && !task.is_personal && task.frequency === "daily") {
      const partnerId = pair.user_1_id === userId ? pair.user_2_id : pair.user_1_id;
      const partnerHasCompleted = this.state.dailyLogs.some(
        (l) => l.user_id === partnerId && l.task_id === taskId && l.date === date && l.status === "completed"
      );
      if (partnerHasCompleted) {
        this.state.scoreEvents.push({
          id: Date.now() + 10,
          cycle_id: this.state.activeCycle.id,
          user_id: userId,
          date,
          type: "team_bonus",
          points: SCORING_RULES.TEAM_FULLY_ACTIVE_BONUS,
          reason: SCORE_REASON_TEMPLATES.teamBonus(),
        });
        this.state.scoreEvents.push({
          id: Date.now() + 11,
          cycle_id: this.state.activeCycle.id,
          user_id: partnerId,
          date,
          type: "team_bonus",
          points: SCORING_RULES.TEAM_FULLY_ACTIVE_BONUS,
          reason: SCORE_REASON_TEMPLATES.teamBonus(),
        });
      }
    }

    this.persistState(this.state);
    return { success: true, pointsEarned: points, event: scoreEvent };
  }

  public createDemoTask(rawInput: any): Task {
    const taskInput = (rawInput && typeof rawInput === "object" && rawInput.task) ? rawInput.task : rawInput;
    if (!taskInput?.name || !String(taskInput.name).trim()) {
      throw new Error("Goal name is required.");
    }

    const name = String(taskInput.name).trim();
    const description = taskInput.description ? String(taskInput.description).trim() : "";
    const frequency = taskInput.frequency || "daily";
    const isPersonal = Boolean(taskInput.is_personal);
    const createdBy = isPersonal
      ? (taskInput.created_by ? Number(taskInput.created_by) : Number(rawInput?.userId) || 2)
      : null;

    let baseScore = Number(taskInput.base_score);
    if (isNaN(baseScore) || baseScore <= 0) {
      baseScore = frequency === "cycle" ? (isPersonal ? 20 : 50) : (frequency !== "daily" ? 15 : 10);
    }

    let targetDays = Number(taskInput.target_days_per_week);
    if (isNaN(targetDays) || targetDays < 1) {
      targetDays = frequency === "cycle" ? 1 : frequency === "daily" ? 7 : frequency === "weekly_2x" ? 2 : 3;
    }

    const newTask: Task = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name,
      description,
      base_score: baseScore,
      frequency,
      target_days_per_week: targetDays,
      is_personal: isPersonal,
      created_by: createdBy,
      active: taskInput.active !== false,
    };

    this.state.tasks.push(newTask);
    this.persistState(this.state);
    return newTask;
  }

  public updateDemoTask(taskId: number, updates: any): Task {
    const rawUpdates = (updates && typeof updates === "object" && updates.updates) ? updates.updates : updates;
    const idx = this.state.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) throw new Error(`Task #${taskId} not found`);

    const current = this.state.tasks[idx];
    const cleanUpdates: Partial<Task> = {};
    if (rawUpdates.name !== undefined) cleanUpdates.name = String(rawUpdates.name).trim();
    if (rawUpdates.description !== undefined) cleanUpdates.description = String(rawUpdates.description).trim();
    if (rawUpdates.base_score !== undefined || rawUpdates.baseScore !== undefined) {
      cleanUpdates.base_score = Math.max(1, Number(rawUpdates.base_score ?? rawUpdates.baseScore) || 10);
    }
    if (rawUpdates.frequency !== undefined) cleanUpdates.frequency = rawUpdates.frequency;
    const effectiveFreq = cleanUpdates.frequency || current.frequency || "daily";
    if (effectiveFreq === "cycle") {
      cleanUpdates.target_days_per_week = 1;
    } else if (effectiveFreq === "daily") {
      cleanUpdates.target_days_per_week = 7;
    } else if (effectiveFreq === "weekly_2x") {
      cleanUpdates.target_days_per_week = 2;
    } else if (rawUpdates.target_days_per_week !== undefined || rawUpdates.targetDays !== undefined) {
      cleanUpdates.target_days_per_week = Math.max(1, Math.min(7, Number(rawUpdates.target_days_per_week ?? rawUpdates.targetDays) || 3));
    }
    if (rawUpdates.is_personal !== undefined) cleanUpdates.is_personal = Boolean(rawUpdates.is_personal);
    if (rawUpdates.active !== undefined) cleanUpdates.active = Boolean(rawUpdates.active);

    this.state.tasks[idx] = { ...current, ...cleanUpdates };
    this.persistState(this.state);
    return this.state.tasks[idx];
  }

  public deleteDemoTask(taskId: number): void {
    this.state.tasks = this.state.tasks.filter((t) => t.id !== taskId);
    this.state.dailyLogs = this.state.dailyLogs.filter((l) => l.task_id !== taskId);
    this.persistState(this.state);
  }

  public getUsers(): User[] {
    return this.state.users;
  }

  public getTasks(): Task[] {
    return this.state.tasks;
  }

  public getPunishments(): Punishment[] {
    return this.state.punishments;
  }

  public updateUserPin(userId: number, newPin: string): boolean {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return false;
    user.pin = newPin.trim();
    this.persistState(this.state);
    return true;
  }

  public updateUser(
    userId: number,
    updates: Partial<User> & { newPin?: string; partnerId?: number | null }
  ): User | null {
    const user = this.state.users.find((u) => u.id === userId);
    if (!user) return null;
    if (updates.name !== undefined && updates.name.trim()) user.name = updates.name.trim();
    if (updates.phone !== undefined) user.phone = updates.phone.trim();
    if (updates.gender !== undefined) user.gender = updates.gender;
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.active !== undefined) user.active = Boolean(updates.active);
    if (updates.newPin) user.pin = updates.newPin.trim();
    if (updates.partnerId !== undefined) user.partner_id = updates.partnerId;
    this.persistState(this.state);
    return { ...user };
  }

  public createPersonalTask(userId: number, rawInput: any): Task {
    const taskInput = (rawInput && typeof rawInput === "object" && rawInput.task) ? rawInput.task : rawInput;
    if (!taskInput?.name || !String(taskInput.name).trim()) {
      throw new Error("Habit name is required.");
    }

    const freqInput = taskInput.frequency || "daily";
    let frequency: TaskFrequency = "daily";
    let targetDays = 7;

    if (freqInput === "cycle") {
      frequency = "cycle";
      targetDays = 1;
    } else if (freqInput === "daily") {
      frequency = "daily";
      targetDays = 7;
    } else {
      targetDays = Math.max(1, Math.min(7, Number(taskInput.target_days_per_week || taskInput.targetDays) || 2));
      frequency = targetDays === 2 ? "weekly_2x" : "weekly_custom";
    }

    const newTask: Task = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      name: String(taskInput.name).trim(),
      description: taskInput.description ? String(taskInput.description).trim() : "Personal habit",
      base_score: 0,
      frequency,
      target_days_per_week: targetDays,
      is_personal: true,
      created_by: userId,
      active: true,
    };
    this.state.tasks.push(newTask);
    this.persistState(this.state);
    return newTask;
  }

  public getDemoCycle() {
    const cycle = this.state.activeCycle;
    const regularUsers = this.state.users.filter((u) => u.role !== "superadmin");
    const u1 = regularUsers[0] || null;
    const u2 = regularUsers[1] || null;

    const score1 = this.state.scoreEvents
      .filter((e) => e.cycle_id === cycle.id && e.user_id === (u1?.id ?? 2))
      .reduce((sum, e) => sum + e.points, 0);
    const score2 = this.state.scoreEvents
      .filter((e) => e.cycle_id === cycle.id && e.user_id === (u2?.id ?? 3))
      .reduce((sum, e) => sum + e.points, 0);

    const isTie = score1 === score2;
    const winnerUser = isTie ? null : score1 > score2 ? u1 : u2;
    const loserUser = isTie ? null : score1 > score2 ? u2 : u1;
    const winnerScore = Math.max(score1, score2);
    const loserScore = Math.min(score1, score2);
    const scoreDiff = Math.abs(score1 - score2);

    return {
      success: true,
      cycle,
      status: cycle.status,
      isClosed: cycle.status === "closed",
      result: {
        cycle_id: cycle.id,
        winner_user_id: winnerUser?.id || null,
        loser_user_id: loserUser?.id || null,
        winner_score: winnerScore,
        loser_score: loserScore,
        score_diff: scoreDiff,
        selected_punishment_id: 1,
        closed_at: new Date().toISOString(),
      },
      selectedPunishment: this.state.punishments[0] || null,
      players: [
        { id: u1?.id, name: u1?.name, score: score1, gender: u1?.gender },
        { id: u2?.id, name: u2?.name, score: score2, gender: u2?.gender },
      ],
      punishments: this.state.punishments,
      scoreDifference: scoreDiff,
      history: this.getCycleHistory(1, 3),
    };
  }

  public getDemoHistory(callerId: number, targetUserId?: number | null, targetTaskId?: number | null) {
    const caller = this.state.users.find((u) => u.id === callerId) || this.state.users[0];
    const isSuperAdmin = caller.role === "superadmin";

    let filterUserId: number | null = callerId;
    if (isSuperAdmin) {
      filterUserId = targetUserId ? Number(targetUserId) : null;
    }

    const allTasks = this.state.tasks;
    const allLogs = this.state.dailyLogs.filter((l) => l.status === "completed");
    const userMap = new Map(this.state.users.map((u) => [u.id, u]));

    let relevantLogs = allLogs;
    if (filterUserId !== null) {
      relevantLogs = relevantLogs.filter((l) => l.user_id === filterUserId);
    }
    if (targetTaskId) {
      relevantLogs = relevantLogs.filter((l) => l.task_id === targetTaskId);
    }

    relevantLogs = [...relevantLogs].sort((a, b) => b.date.localeCompare(a.date));

    const richLogs = relevantLogs.map((log) => {
      const task = allTasks.find((t) => t.id === log.task_id);
      const user = userMap.get(log.user_id);
      const points = task ? (task.is_personal ? 0 : task.base_score || 10) : 10;

      return {
        id: log.id,
        date: log.date,
        completed_at: log.completed_at || `${log.date}T10:00:00Z`,
        status: log.status,
        task_id: log.task_id,
        task_name: task ? task.name : `Task #${log.task_id}`,
        task_frequency: task?.frequency || "daily",
        task_category: task?.frequency === "daily" ? "everyday" : "weekly",
        points,
        user_id: log.user_id,
        user_name: user ? user.name : `User #${log.user_id}`,
        user_role: user?.role || "user",
      };
    });

    const tasksSummary = allTasks
      .filter((task) => {
        if (!task.is_personal) return true;
        return task.created_by === callerId;
      })
      .map((task) => {
        const taskLogs = richLogs.filter((l) => l.task_id === task.id);
        const totalPoints = taskLogs.reduce((sum, l) => sum + (l.points || 0), 0);
        const lastLog = taskLogs[0];

        return {
          task,
          totalCompletions: taskLogs.length,
          totalPoints,
          lastCompletedDate: lastLog ? lastLog.date : null,
          lastCompletedAt: lastLog ? lastLog.completed_at : null,
          logs: taskLogs,
        };
      })
      .filter((item) => item.totalCompletions > 0 || item.task.active)
      .sort((a, b) => {
        if (a.lastCompletedDate && b.lastCompletedDate) {
          return b.lastCompletedDate.localeCompare(a.lastCompletedDate);
        }
        if (a.lastCompletedDate) return -1;
        if (b.lastCompletedDate) return 1;
        return b.totalCompletions - a.totalCompletions;
      });

    return {
      success: true,
      tasksSummary,
      richLogs,
      users: this.state.users.filter((u) => u.active),
      isSuperAdmin,
    };
  }

  public exportFullBackup(): Record<string, unknown[]> {
    return {
      users: this.state.users.map((u) => ({
        id: u.id,
        name: u.name,
        pin_hash: u.pin_hash || "",
        phone: u.phone || "",
        gender: u.gender,
        role: u.role,
        active: u.active,
        created_at: u.created_at || new Date().toISOString(),
      })),
      pairs: this.state.pairs.map((p) => ({
        id: p.id,
        user_1_id: p.user_1_id,
        user_2_id: p.user_2_id,
        active: p.active,
        created_at: p.created_at || new Date().toISOString(),
      })),
      tasks: this.state.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description || "",
        base_score: t.base_score,
        frequency: t.frequency || "daily",
        target_days_per_week: t.target_days_per_week || 7,
        is_personal: t.is_personal ?? false,
        created_by: t.created_by ?? null,
        active: t.active,
        created_at: t.created_at || new Date().toISOString(),
      })),
      cycles: this.state.cycles.map((c) => ({
        id: c.id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
        created_at: c.created_at || new Date().toISOString(),
      })),
      daily_logs: this.state.dailyLogs.map((l) => ({
        id: l.id,
        date: l.date,
        user_id: l.user_id,
        task_id: l.task_id,
        status: l.status,
        completed_at: l.completed_at || null,
        created_at: l.created_at || new Date().toISOString(),
      })),
      score_events: this.state.scoreEvents.map((s) => ({
        id: s.id,
        cycle_id: s.cycle_id,
        user_id: s.user_id,
        date: s.date,
        type: s.type,
        points: s.points,
        reason: s.reason,
        metadata: s.metadata || null,
        created_at: s.created_at || new Date().toISOString(),
      })),
      punishments: this.state.punishments.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        active: p.active,
        created_at: p.created_at || new Date().toISOString(),
      })),
      cycle_results: [],
      decision_wheel_options: this.state.decisionOptions.map((d) => ({
        id: d.id,
        name: d.name,
        created_at: d.created_at || new Date().toISOString(),
      })),
    };
  }

  public exportDemoData(): string {
    return JSON.stringify(this.exportFullBackup(), null, 2);
  }

  public importFullBackup(backupData: Record<string, unknown[]>): { importedCount: number; skippedCount: number } {
    let importedCount = 0;
    if (!backupData || typeof backupData !== "object") return { importedCount: 0, skippedCount: 0 };

    const tasks = backupData["tasks"];
    if (Array.isArray(tasks) && tasks.length > 0) {
      const cleanTasks: Task[] = tasks.map((t: any) => ({
        id: t.id,
        name: String(t.name || "").trim(),
        description: String(t.description || "").trim(),
        base_score: Number(t.base_score) || 10,
        frequency: t.frequency || "daily",
        target_days_per_week: Number(t.target_days_per_week) || 7,
        is_personal: Boolean(t.is_personal),
        created_by: t.created_by ?? null,
        active: t.active ?? true,
      }));
      this.state.tasks = cleanTasks;
      importedCount += cleanTasks.length;
    }

    const pairs = backupData["pairs"];
    if (Array.isArray(pairs) && pairs.length > 0) {
      const cleanPairs: Pair[] = pairs.map((p: any) => ({
        id: p.id,
        user_1_id: p.user_1_id,
        user_2_id: p.user_2_id,
        active: p.active ?? true,
      }));
      this.state.pairs = cleanPairs;
      importedCount += cleanPairs.length;
    }

    const cycles = backupData["cycles"];
    if (Array.isArray(cycles) && cycles.length > 0) {
      const cleanCycles: Cycle[] = cycles.map((c: any) => ({
        id: c.id,
        name: String(c.name || "").trim(),
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status || "active",
      }));
      this.state.cycles = cleanCycles;
      if (cleanCycles[0]) this.state.activeCycle = cleanCycles[0];
      importedCount += cleanCycles.length;
    }

    const logs = backupData["daily_logs"] || backupData["dailyLogs"];
    if (Array.isArray(logs) && logs.length > 0) {
      const cleanLogs: DailyLog[] = logs.map((l: any) => ({
        id: l.id,
        date: l.date,
        user_id: l.user_id,
        task_id: l.task_id,
        status: l.status,
        completed_at: l.completed_at || undefined,
      }));
      this.state.dailyLogs = cleanLogs;
      importedCount += cleanLogs.length;
    }

    const events = backupData["score_events"] || backupData["scoreEvents"];
    if (Array.isArray(events) && events.length > 0) {
      const cleanEvents: ScoreEvent[] = events.map((s: any) => ({
        id: s.id,
        cycle_id: s.cycle_id,
        user_id: s.user_id,
        date: s.date,
        type: s.type,
        points: s.points,
        reason: s.reason,
        metadata: s.metadata,
      }));
      this.state.scoreEvents = cleanEvents;
      importedCount += cleanEvents.length;
    }

    const punishments = backupData["punishments"];
    if (Array.isArray(punishments) && punishments.length > 0) {
      const cleanPunishments: Punishment[] = punishments.map((p: any) => ({
        id: p.id,
        name: String(p.name || "").trim(),
        description: String(p.description || "").trim(),
        active: p.active ?? true,
      }));
      this.state.punishments = cleanPunishments;
      importedCount += cleanPunishments.length;
    }

    const decisionOptions = backupData["decision_wheel_options"] || backupData["decisionOptions"];
    if (Array.isArray(decisionOptions) && decisionOptions.length > 0) {
      const cleanOptions: DecisionOption[] = decisionOptions.map((d: any) => ({
        id: d.id,
        name: String(d.name || "").trim(),
      }));
      this.state.decisionOptions = cleanOptions;
      importedCount += cleanOptions.length;
    }

    this.persistState(this.state);
    return { importedCount, skippedCount: 0 };
  }

  public importDemoData(jsonData: string): boolean {
    try {
      const parsed = JSON.parse(jsonData);
      const payload = parsed?.data || parsed;
      const res = this.importFullBackup(payload);
      return res.importedCount > 0;
    } catch {
      return false;
    }
  }

  public getDecisionOptions(): DecisionOption[] {
    return this.state.decisionOptions;
  }

  public addDecisionOption(name: string): DecisionOption {
    const newOption: DecisionOption = {
      id: Date.now(),
      name: name.trim(),
    };
    this.state.decisionOptions.push(newOption);
    this.persistState(this.state);
    return newOption;
  }

  public deleteDecisionOption(id: number): void {
    this.state.decisionOptions = this.state.decisionOptions.filter((o) => o.id !== id);
    this.persistState(this.state);
  }

  public resetDecisionOptions(): DecisionOption[] {
    this.state.decisionOptions = INITIAL_DEMO_DECISION_OPTIONS.map((o) => ({ ...o }));
    this.persistState(this.state);
    return this.state.decisionOptions;
  }

  public savePunishment(punishmentData: any): Punishment[] {
    const pId = typeof punishmentData?.id === "number"
      ? punishmentData.id
      : parseInt(String(punishmentData?.id || "").replace(/\D/g, "")) || (Date.now() % 1000000);
    const name = String(punishmentData?.name || "Punishment Option").trim();
    const existingIdx = this.state.punishments.findIndex(
      (p) => p.id === pId || p.name.toLowerCase() === name.toLowerCase()
    );
    if (existingIdx !== -1) {
      this.state.punishments[existingIdx] = {
        ...this.state.punishments[existingIdx],
        name,
        description: punishmentData?.description !== undefined ? String(punishmentData.description).trim() : this.state.punishments[existingIdx].description,
      };
    } else {
      this.state.punishments.push({
        id: pId,
        name,
        description: punishmentData?.description ? String(punishmentData.description).trim() : "",
        active: true,
      });
    }
    this.persistState(this.state);
    return this.state.punishments;
  }

  public deletePunishment(id: number): Punishment[] {
    this.state.punishments = this.state.punishments.filter((p) => p.id !== id);
    this.persistState(this.state);
    return this.state.punishments;
  }

  public resetPunishments(): Punishment[] {
    this.state.punishments = INITIAL_DEMO_PUNISHMENTS.map((p) => ({ ...p }));
    this.persistState(this.state);
    return this.state.punishments;
  }

  public getCycleHistory(page = 1, limit = 3): CycleHistoryPage {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, limit);
    const sortedCycles = [...this.state.cycles].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    const total = sortedCycles.length;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const offset = (pageNum - 1) * limitNum;
    const pageCycles = sortedCycles.slice(offset, offset + limitNum);

    const regularUsers = this.state.users.filter((u) => u.role !== "superadmin");
    const u1 = regularUsers[0] || null;
    const u2 = regularUsers[1] || null;

    const items: CycleHistoryItem[] = pageCycles.map((c) => {
      if (c.status === "active") {
        const score1 = this.state.scoreEvents
          .filter((e) => e.cycle_id === c.id && e.user_id === (u1?.id ?? 2))
          .reduce((sum, e) => sum + e.points, 0);
        const score2 = this.state.scoreEvents
          .filter((e) => e.cycle_id === c.id && e.user_id === (u2?.id ?? 3))
          .reduce((sum, e) => sum + e.points, 0);

        const isTie = score1 === score2;
        const leader = isTie ? null : score1 > score2 ? u1 : u2;
        const chaser = isTie ? null : score1 > score2 ? u2 : u1;

        return {
          id: c.id,
          name: c.name,
          start_date: c.start_date,
          end_date: c.end_date,
          status: c.status,
          winner_user_id: leader?.id || null,
          winner_name: leader?.name || null,
          winner_gender: leader?.gender || null,
          winner_score: Math.max(score1, score2),
          loser_name: chaser?.name || null,
          loser_score: Math.min(score1, score2),
          score_diff: Math.abs(score1 - score2),
          punishment_name: null,
          isTie,
        };
      }

      const winnerId = c.winner_user_id ?? 2;
      const winner = this.state.users.find((u) => u.id === winnerId) || u1;
      const loser = this.state.users.find((u) => u.id !== winnerId && u.role !== "superadmin") || u2;

      const baseWinner = c.id === 101 ? 190 : c.id === 102 ? 210 : 175;
      const baseLoser = c.id === 101 ? 145 : c.id === 102 ? 180 : 130;
      const punishment = this.state.punishments[(c.id % this.state.punishments.length)] || this.state.punishments[0];

      return {
        id: c.id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
        winner_user_id: winner?.id || null,
        winner_name: winner?.name || null,
        winner_gender: winner?.gender || null,
        winner_score: baseWinner,
        loser_name: loser?.name || null,
        loser_score: baseLoser,
        score_diff: baseWinner - baseLoser,
        punishment_name: punishment?.name || "Dinner Treat",
        isTie: false,
      };
    });

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  public setCycleStatus(status: "active" | "closed", winnerUserId?: number | null): void {
    this.state.activeCycle.status = status;
    if (winnerUserId !== undefined) {
      this.state.activeCycle.winner_user_id = winnerUserId;
    }
    const cIdx = this.state.cycles.findIndex((c) => c.id === this.state.activeCycle.id);
    if (cIdx !== -1) {
      this.state.cycles[cIdx].status = status;
      if (winnerUserId !== undefined) {
        this.state.cycles[cIdx].winner_user_id = winnerUserId;
      }
    }
    this.persistState(this.state);
  }

  public createCycle(cycleData: { name: string; start_date: string; end_date: string }): Cycle {
    if (this.state.activeCycle) {
      const demoResult = this.getDemoCycle();
      this.state.activeCycle.status = "closed";
      this.state.activeCycle.winner_user_id = demoResult.result.winner_user_id;
      const cIdx = this.state.cycles.findIndex((c) => c.id === this.state.activeCycle.id);
      if (cIdx !== -1) {
        this.state.cycles[cIdx].status = "closed";
        this.state.cycles[cIdx].winner_user_id = demoResult.result.winner_user_id;
      }
    }

    const nextId = (this.state.cycles.reduce((max, c) => Math.max(max, c.id), 0) || 1) + 1;
    const newCycle: Cycle = {
      id: nextId,
      name: cycleData.name.trim(),
      start_date: cycleData.start_date,
      end_date: cycleData.end_date,
      status: "active",
      winner_user_id: null,
    };

    this.state.cycles.unshift(newCycle);
    this.state.activeCycle = newCycle;
    this.persistState(this.state);
    return newCycle;
  }

  public async getRecentLogs(limit: number = 500, userId?: number, taskId?: number): Promise<DailyLog[]> {
    let logs = this.state.dailyLogs.slice();
    if (userId) {
      logs = logs.filter((l) => l.user_id === userId);
    }
    if (taskId) {
      logs = logs.filter((l) => l.task_id === taskId);
    }
    return logs.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
  }
}

export const demoStore = new DemoStore();
