import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import { ScoreEngine } from "@/services/scoreEngine";
import { StreakEngine } from "@/services/streakEngine";
import type { ScoreEvent, DailyLog, User, Pair } from "@/types/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUserId = searchParams.get("userId");
  const requestedUserId = rawUserId ? (isNaN(Number(rawUserId)) ? 2 : Number(rawUserId)) : 2;

  const isConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (!isConfigured) {
    return NextResponse.json({
      configured: false,
      message:
        "Supabase credentials are not configured in environment variables. Please configure .env.",
    });
  }

  try {
    const todayDate = new Date().toISOString().split("T")[0];

    const pairs = dataStore.getPairs ? await dataStore.getPairs() : [];
    const [users, tasks, allCycles] = await Promise.all([
      dataStore.getUsers(pairs),
      dataStore.getTasks(),
      dataStore.getAllCycles ? dataStore.getAllCycles() : Promise.resolve([]),
    ]);

    if (users.length === 0) {
      return NextResponse.json({
        configured: true,
        schemaReady: false,
        message:
          "Supabase connected! Please run the SQL schema in your Supabase SQL editor to initialize tables and seed data.",
      });
    }

    const activeCycle =
      allCycles.find((c) => c.status === "active") ||
      (allCycles.length > 0 ? allCycles[allCycles.length - 1] : null);

    const [todayLogs, allHistoryLogs, allScoreEvents, storageUsage, cycleHistory] = await Promise.all([
      dataStore.getDailyLogs(todayDate),
      dataStore.getRecentLogs(200),
      activeCycle ? dataStore.getScoreEvents(activeCycle.id) : Promise.resolve([]),
      dataStore.getStorageUsage(),
      dataStore.getCycleHistory ? dataStore.getCycleHistory(1, 3, { preloadedUsers: users }) : Promise.resolve(null),
    ]);

    const activeUsers = users.filter((u) => u.active !== false);
    const regularUsers = activeUsers.filter((u) => u.role !== "superadmin");
    const currentUser =
      activeUsers.find((u) => u.id === requestedUserId) ||
      regularUsers[0] ||
      activeUsers[0];

    const userPair = currentUser
      ? pairs.find((p) => p.active && (p.user_1_id === currentUser.id || p.user_2_id === currentUser.id))
      : null;

    let partnerUser: User | null = null;
    if (userPair) {
      const partnerId = userPair.user_1_id === currentUser?.id ? userPair.user_2_id : userPair.user_1_id;
      partnerUser = activeUsers.find((u) => u.id === partnerId) || null;
    } else {
      partnerUser =
        currentUser?.role === "superadmin"
          ? regularUsers[0] || null
          : regularUsers.find((u) => u.id !== currentUser?.id) || null;
    }

    let scoreSummaries: Record<number, { total: number; breakdown: { personal: number; bonus: number; penalty: number } }> = {};
    let recentEvents: ScoreEvent[] = [];

    if (activeCycle) {
      scoreSummaries = await ScoreEngine.calculateCycleSummary(activeCycle.id, allScoreEvents);
      recentEvents = allScoreEvents.slice(-10).reverse();
    }

    const visibleTasks = tasks.filter((t) => {
      if (!t.is_personal) return true;
      if (currentUser?.role === "superadmin") return true;
      return Number(t.created_by) === Number(currentUser?.id);
    });

    const historyLogs: DailyLog[] = allHistoryLogs.length > 0 ? allHistoryLogs : todayLogs;

    const taskStreaks: Record<number, number> = {};
    const taskTotalDays: Record<number, number> = {};
    if (currentUser) {
      for (const t of visibleTasks) {
        taskStreaks[t.id] = StreakEngine.calculateTaskStreak(currentUser.id, t.id, historyLogs, todayDate);
        taskTotalDays[t.id] = StreakEngine.calculateTaskTotalDays(currentUser.id, t.id, historyLogs);
      }
    }

    let daysRemaining = 0;
    if (activeCycle) {
      const end = new Date(activeCycle.end_date).getTime();
      const now = new Date(todayDate).getTime();
      daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }

    const sharedTasks = visibleTasks.filter((t) => !t.is_personal);
    const sharedEverydayTasks = sharedTasks.filter(
      (t) => t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week))
    );
    const everydayTasks = visibleTasks.filter(
      (t) => t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week))
    );
    const weeklyTasks = visibleTasks.filter(
      (t) => t.frequency !== "daily" && t.frequency !== "cycle" && (t.target_days_per_week ? t.target_days_per_week < 7 : true)
    );
    const cycleTasks = visibleTasks.filter((t) => t.frequency === "cycle");

    const userTasks = visibleTasks.filter((t) => !t.is_personal || t.created_by === currentUser?.id);
    const partnerTasks = visibleTasks.filter((t) => !t.is_personal || t.created_by === partnerUser?.id);

    const cyclesList = (allCycles && allCycles.length > 0)
      ? allCycles
      : (activeCycle ? [activeCycle] : []);

    const personalStreakDetails = currentUser
      ? StreakEngine.calculatePersonalStreakDetails(currentUser.id, userTasks, historyLogs, todayDate, cyclesList)
      : { streak: 0, protectsUsed: 0, protectsRemaining: 3, maxProtects: 3, protectedDates: [] as string[], isYesterdayProtected: false };

    const teamStreakDetails =
      currentUser && partnerUser
        ? StreakEngine.calculateTeamStreakDetails([currentUser.id, partnerUser.id], sharedTasks, historyLogs, todayDate, cyclesList)
        : { streak: 0, protectsUsed: 0, protectsRemaining: 3, maxProtects: 3, protectedDates: [] as string[], isYesterdayProtected: false };

    const partnerStreakDetails = partnerUser
      ? StreakEngine.calculatePersonalStreakDetails(partnerUser.id, partnerTasks, historyLogs, todayDate, cyclesList)
      : { streak: 0, protectsUsed: 0, protectsRemaining: 3, maxProtects: 3, protectedDates: [] as string[], isYesterdayProtected: false };

    const personalStreak = personalStreakDetails.streak;
    const teamStreak = teamStreakDetails.streak;
    const partnerStreak = partnerStreakDetails.streak;

    const todayObj = new Date(todayDate);
    const dayOfWeek = todayObj.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const mondayDate = new Date(todayObj);
    mondayDate.setDate(todayObj.getDate() + mondayOffset);

    const mondayStr = mondayDate.toISOString().split("T")[0];
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    const sundayStr = sundayDate.toISOString().split("T")[0];

    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    const weekStreakDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate);
      d.setDate(mondayDate.getDate() + i);
      const iso = d.toISOString().split("T")[0];

      const userLogsForDay = historyLogs.filter(
        (l) => l.user_id === currentUser?.id && l.date === iso && l.status === "completed"
      );
      const partnerLogsForDay = historyLogs.filter(
        (l) => l.user_id === partnerUser?.id && l.date === iso && l.status === "completed"
      );

      const userEverydayCount = userLogsForDay.filter((l) => {
        const t = sharedTasks.find((st) => st.id === l.task_id);
        return t && (t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week)));
      }).length;

      const partnerEverydayCount = partnerLogsForDay.filter((l) => {
        const t = sharedTasks.find((st) => st.id === l.task_id);
        return t && (t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week)));
      }).length;

      const isToday = iso === todayDate;
      const isPast = iso < todayDate;
      const isFuture = iso > todayDate;

      weekStreakDays.push({
        date: iso,
        dateNum: d.getDate(),
        dayLabel: dayLabels[i],
        dayLabelEn: dayLabels[i],
        completedCount: userEverydayCount,
        partnerCompletedCount: partnerEverydayCount,
        hasCompleted: userEverydayCount > 0,
        isFullyCompleted: sharedEverydayTasks.length > 0 && userEverydayCount >= sharedEverydayTasks.length,
        isTeamCompleted: sharedEverydayTasks.length > 0 && userEverydayCount >= sharedEverydayTasks.length && partnerEverydayCount >= sharedEverydayTasks.length,
        isProtected: personalStreakDetails.protectedDates.includes(iso),
        isPartnerProtected: partnerStreakDetails.protectedDates.includes(iso),
        isToday,
        isPast,
        isFuture,
      });
    }

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

    for (const t of visibleTasks) {
      const isWeekly = t.frequency !== "daily" && (t.target_days_per_week ? t.target_days_per_week < 7 : true);
      const targetDays = t.target_days_per_week || (t.frequency === "weekly_2x" ? 2 : 7);

      const userLogsInWeek = historyLogs.filter(
        (l) => l.user_id === currentUser?.id && l.task_id === t.id && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr
      );
      const userUniqueDates = Array.from(new Set(userLogsInWeek.map((l) => l.date)));

      const partnerLogsInWeek = partnerUser
        ? historyLogs.filter(
          (l) => l.user_id === partnerUser.id && l.task_id === t.id && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr
        )
        : [];
      const partnerUniqueDates = Array.from(new Set(partnerLogsInWeek.map((l) => l.date)));

      const completedToday = todayLogs.some(
        (l) => l.user_id === currentUser?.id && l.task_id === t.id && l.status === "completed"
      );

      weeklyProgress[t.id] = {
        completedDaysThisWeek: userUniqueDates.length,
        targetDays,
        isTargetReached: isWeekly ? userUniqueDates.length >= targetDays : false,
        completedToday,
        completedDatesThisWeek: userUniqueDates,
        partnerCompletedDaysThisWeek: partnerUniqueDates.length,
        partnerTargetReached: isWeekly ? partnerUniqueDates.length >= targetDays : false,
      };
    }

    const isSuperAdminUser = currentUser?.role === "superadmin";
    const playerA = userPair
      ? activeUsers.find((u) => u.id === userPair.user_1_id) || regularUsers[0] || null
      : regularUsers[0] || null;
    const playerB = userPair
      ? activeUsers.find((u) => u.id === userPair.user_2_id) || regularUsers[1] || null
      : regularUsers[1] || null;

    const currentScore = isSuperAdminUser && playerA
      ? (scoreSummaries[playerA.id]?.total || 0)
      : (currentUser && scoreSummaries[currentUser.id]?.total) || 0;

    const partnerScore = isSuperAdminUser && playerB
      ? (scoreSummaries[playerB.id]?.total || 0)
      : (partnerUser && scoreSummaries[partnerUser.id]?.total) || 0;

    const scoreDiff = currentScore - partnerScore;

    const userHistoryLogs = currentUser?.role === "superadmin"
      ? historyLogs
      : historyLogs.filter((l) => l.user_id === currentUser?.id);

    const cycleTaskProgress: Record<
      number,
      {
        completedInCycle: boolean;
        completedDate: string | null;
        partnerCompletedInCycle: boolean;
        partnerCompletedDate: string | null;
        personalCycleStreak: number;
        teamCycleStreak: number;
      }
    > = {};

    for (const ct of cycleTasks) {
      const userLog = activeCycle
        ? historyLogs.find(
            (l) =>
              l.user_id === currentUser?.id &&
              l.task_id === ct.id &&
              l.status === "completed" &&
              l.date >= activeCycle.start_date &&
              l.date <= activeCycle.end_date
          )
        : null;

      const partnerLog = (activeCycle && partnerUser)
        ? historyLogs.find(
            (l) =>
              l.user_id === partnerUser.id &&
              l.task_id === ct.id &&
              l.status === "completed" &&
              l.date >= activeCycle.start_date &&
              l.date <= activeCycle.end_date
          )
        : null;

      const personalCycleStreak = currentUser
        ? StreakEngine.calculateCycleTaskStreak(currentUser.id, ct.id, cyclesList, historyLogs, activeCycle?.id)
        : 0;

      const teamCycleStreak = (!ct.is_personal && currentUser && partnerUser)
        ? StreakEngine.calculateTeamCycleTaskStreak([currentUser.id, partnerUser.id], ct.id, cyclesList, historyLogs, activeCycle?.id)
        : 0;

      cycleTaskProgress[ct.id] = {
        completedInCycle: Boolean(userLog),
        completedDate: userLog ? userLog.date : null,
        partnerCompletedInCycle: Boolean(partnerLog),
        partnerCompletedDate: partnerLog ? partnerLog.date : null,
        personalCycleStreak,
        teamCycleStreak,
      };
    }

    return NextResponse.json({
      configured: true,
      schemaReady: true,
      users: activeUsers,
      regularUsers,
      pairs,
      userPair,
      playerA,
      playerB,
      currentUser,
      partnerUser,
      daysRemaining,
      activeCycle,
      cycles: cyclesList,
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
      historyLogs: userHistoryLogs,
      scores: {
        currentScore,
        partnerScore,
        scoreDiff,
        playerA: playerA ? { id: playerA.id, name: playerA.name, score: scoreSummaries[playerA.id]?.total || 0 } : null,
        playerB: playerB ? { id: playerB.id, name: playerB.name, score: scoreSummaries[playerB.id]?.total || 0 } : null,
        currentUserSummary: currentUser ? scoreSummaries[currentUser.id] : null,
        partnerUserSummary: partnerUser ? scoreSummaries[partnerUser.id] : null,
      },
      streaks: {
        personalStreak,
        teamStreak,
        partnerStreak,
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
      storageUsage,
      todayDate,
      recentEvents,
      cycleHistory,
    }, { headers: NO_CACHE_HEADERS });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    return NextResponse.json(
      {
        configured: true,
        schemaReady: false,
        error: message,
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
