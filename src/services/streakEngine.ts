import type { DailyLog, Task, Cycle } from "@/types/domain";

export function isEverydayTask(task: Task): boolean {
  if (task.is_personal) return false;
  if (task.frequency === "daily") return true;
  if (!task.frequency && (task.target_days_per_week === 7 || !task.target_days_per_week)) return true;
  return false;
}

export interface StreakDetails {
  streak: number;
  protectsUsed: number;
  protectsRemaining: number;
  maxProtects: number;
  protectedDates: string[];
  isProtectedToday?: boolean;
  isYesterdayProtected?: boolean;
}

export function getCycleKeyForDate(dateStr: string, cycles: Cycle[] = []): string {
  for (const c of cycles) {
    if (c.start_date && c.end_date && dateStr >= c.start_date && dateStr <= c.end_date) {
      return `cycle_${c.id}`;
    }
  }
  return `month_${dateStr.substring(0, 7)}`;
}

export class StreakEngine {
  static formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  static parseDate(s: string): Date {
    const parts = s.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }

  static calculatePersonalStreakDetails(
    userId: number,
    tasks: Task[],
    logs: DailyLog[],
    referenceDateStr: string = this.formatDate(new Date()),
    cycles: Cycle[] = [],
    maxProtectsPerCycle: number = 3
  ): StreakDetails {
    const activeTaskIds = new Set(tasks.filter((t) => t.active).map((t) => t.id));
    if (activeTaskIds.size === 0) {
      return {
        streak: 0,
        protectsUsed: 0,
        protectsRemaining: maxProtectsPerCycle,
        maxProtects: maxProtectsPerCycle,
        protectedDates: [],
        isProtectedToday: false,
        isYesterdayProtected: false,
      };
    }

    const completedByDate: Record<string, Set<number>> = {};
    for (const log of logs) {
      if (log.user_id === userId && log.status === "completed" && activeTaskIds.has(log.task_id)) {
        if (!completedByDate[log.date]) {
          completedByDate[log.date] = new Set();
        }
        completedByDate[log.date].add(log.task_id);
      }
    }

    const isDateCompleted = (dateStr: string) => {
      const completedSet = completedByDate[dateStr];
      return Boolean(completedSet && completedSet.size >= 1);
    };

    const refDate = this.parseDate(referenceDateStr);
    const todayStr = this.formatDate(refDate);
    const activeCycleKey = getCycleKeyForDate(todayStr, cycles);

    const isTodayDone = isDateCompleted(todayStr);
    let streak = isTodayDone ? 1 : 0;

    const confirmedProtectsByCycle: Record<string, number> = {};
    const confirmedProtectedDates: string[] = [];

    let currentGapProtectsByCycle: Record<string, number> = {};
    let currentGapDates: string[] = [];

    let checkDate = new Date(refDate);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const dateStr = this.formatDate(checkDate);
      const cycleKey = getCycleKeyForDate(dateStr, cycles);

      if (isDateCompleted(dateStr)) {
        for (const [ck, count] of Object.entries(currentGapProtectsByCycle)) {
          confirmedProtectsByCycle[ck] = (confirmedProtectsByCycle[ck] || 0) + count;
        }
        confirmedProtectedDates.push(...currentGapDates);
        currentGapProtectsByCycle = {};
        currentGapDates = [];

        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        const alreadyConfirmed = confirmedProtectsByCycle[cycleKey] || 0;
        const inCurrentGap = currentGapProtectsByCycle[cycleKey] || 0;

        if (alreadyConfirmed + inCurrentGap < maxProtectsPerCycle) {
          currentGapProtectsByCycle[cycleKey] = inCurrentGap + 1;
          currentGapDates.push(dateStr);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const diffDays = Math.round((refDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1000) break;
    }

    const protectsUsedInActiveCycle = confirmedProtectsByCycle[activeCycleKey] || 0;
    const protectsRemaining = Math.max(0, maxProtectsPerCycle - protectsUsedInActiveCycle);

    const yesterdayObj = new Date(refDate);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterdayObj);
    const isYesterdayProtected = confirmedProtectedDates.includes(yesterdayStr);

    return {
      streak,
      protectsUsed: protectsUsedInActiveCycle,
      protectsRemaining,
      maxProtects: maxProtectsPerCycle,
      protectedDates: confirmedProtectedDates,
      isProtectedToday: false,
      isYesterdayProtected,
    };
  }

  static calculatePersonalStreak(
    userId: number,
    tasks: Task[],
    logs: DailyLog[],
    referenceDateStr: string = this.formatDate(new Date()),
    cycles: Cycle[] = [],
    maxProtectsPerCycle: number = 3
  ): number {
    return this.calculatePersonalStreakDetails(
      userId,
      tasks,
      logs,
      referenceDateStr,
      cycles,
      maxProtectsPerCycle
    ).streak;
  }

  static calculateTeamStreakDetails(
    userIds: number[],
    tasks: Task[],
    logs: DailyLog[],
    referenceDateStr: string = this.formatDate(new Date()),
    cycles: Cycle[] = [],
    maxProtectsPerCycle: number = 3
  ): StreakDetails {
    if (userIds.length !== 2) {
      return {
        streak: 0,
        protectsUsed: 0,
        protectsRemaining: maxProtectsPerCycle,
        maxProtects: maxProtectsPerCycle,
        protectedDates: [],
        isProtectedToday: false,
        isYesterdayProtected: false,
      };
    }
    const [userA, userB] = userIds;

    const activeTaskIds = new Set(tasks.filter((t) => t.active).map((t) => t.id));
    if (activeTaskIds.size === 0) {
      return {
        streak: 0,
        protectsUsed: 0,
        protectsRemaining: maxProtectsPerCycle,
        maxProtects: maxProtectsPerCycle,
        protectedDates: [],
        isProtectedToday: false,
        isYesterdayProtected: false,
      };
    }

    const completedByUserDate: Record<string, Record<number, Set<number>>> = {};
    for (const log of logs) {
      if (log.status === "completed" && activeTaskIds.has(log.task_id)) {
        if (!completedByUserDate[log.date]) {
          completedByUserDate[log.date] = {};
        }
        if (!completedByUserDate[log.date][log.user_id]) {
          completedByUserDate[log.date][log.user_id] = new Set();
        }
        completedByUserDate[log.date][log.user_id].add(log.task_id);
      }
    }

    const isDateTeamActive = (dateStr: string) => {
      const dayUsers = completedByUserDate[dateStr];
      if (!dayUsers) return false;
      const aDone = Boolean(dayUsers[userA] && dayUsers[userA].size >= 1);
      const bDone = Boolean(dayUsers[userB] && dayUsers[userB].size >= 1);
      return aDone && bDone;
    };

    const refDate = this.parseDate(referenceDateStr);
    const todayStr = this.formatDate(refDate);
    const activeCycleKey = getCycleKeyForDate(todayStr, cycles);

    const isTodayDone = isDateTeamActive(todayStr);
    let streak = isTodayDone ? 1 : 0;

    const confirmedProtectsByCycle: Record<string, number> = {};
    const confirmedProtectedDates: string[] = [];

    let currentGapProtectsByCycle: Record<string, number> = {};
    let currentGapDates: string[] = [];

    let checkDate = new Date(refDate);
    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {
      const dateStr = this.formatDate(checkDate);
      const cycleKey = getCycleKeyForDate(dateStr, cycles);

      if (isDateTeamActive(dateStr)) {
        for (const [ck, count] of Object.entries(currentGapProtectsByCycle)) {
          confirmedProtectsByCycle[ck] = (confirmedProtectsByCycle[ck] || 0) + count;
        }
        confirmedProtectedDates.push(...currentGapDates);
        currentGapProtectsByCycle = {};
        currentGapDates = [];

        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        const alreadyConfirmed = confirmedProtectsByCycle[cycleKey] || 0;
        const inCurrentGap = currentGapProtectsByCycle[cycleKey] || 0;

        if (alreadyConfirmed + inCurrentGap < maxProtectsPerCycle) {
          currentGapProtectsByCycle[cycleKey] = inCurrentGap + 1;
          currentGapDates.push(dateStr);
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const diffDays = Math.round((refDate.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 1000) break;
    }

    const protectsUsedInActiveCycle = confirmedProtectsByCycle[activeCycleKey] || 0;
    const protectsRemaining = Math.max(0, maxProtectsPerCycle - protectsUsedInActiveCycle);

    const yesterdayObj = new Date(refDate);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = this.formatDate(yesterdayObj);

    return {
      streak,
      protectsUsed: protectsUsedInActiveCycle,
      protectsRemaining,
      maxProtects: maxProtectsPerCycle,
      protectedDates: confirmedProtectedDates,
      isProtectedToday: false,
      isYesterdayProtected: confirmedProtectedDates.includes(yesterdayStr),
    };
  }

  static calculateTeamStreak(
    userIds: number[],
    tasks: Task[],
    logs: DailyLog[],
    referenceDateStr: string = this.formatDate(new Date()),
    cycles: Cycle[] = [],
    maxProtectsPerCycle: number = 3
  ): number {
    return this.calculateTeamStreakDetails(
      userIds,
      tasks,
      logs,
      referenceDateStr,
      cycles,
      maxProtectsPerCycle
    ).streak;
  }

  static calculateTaskStreak(
    userId: number,
    taskId: number,
    logs: DailyLog[],
    referenceDateStr: string = this.formatDate(new Date())
  ): number {
    const completedDates = new Set<string>();
    for (const log of logs) {
      if (log.user_id === userId && log.task_id === taskId && log.status === "completed") {
        completedDates.add(log.date);
      }
    }

    if (completedDates.size === 0) return 0;

    let streak = 0;
    const refDate = this.parseDate(referenceDateStr);
    let checkDate = new Date(refDate);

    if (completedDates.has(this.formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      const yesterday = new Date(refDate);
      yesterday.setDate(yesterday.getDate() - 1);
      if (!completedDates.has(this.formatDate(yesterday))) {
        return 0;
      }
      checkDate = yesterday;
    }

    while (completedDates.has(this.formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  static calculateTaskTotalDays(
    userId: number,
    taskId: number,
    logs: DailyLog[]
  ): number {
    const completedDates = new Set<string>();
    for (const log of logs) {
      if (log.user_id === userId && log.task_id === taskId && log.status === "completed") {
        completedDates.add(log.date);
      }
    }
    return completedDates.size;
  }

  static calculateCycleTaskStreak(
    userId: number,
    taskId: number,
    cycles: Cycle[],
    logs: DailyLog[],
    activeCycleId?: number
  ): number {
    if (!cycles || cycles.length === 0) return 0;

    const sortedCycles = [...cycles].sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
    const activeCycleIndex = activeCycleId
      ? sortedCycles.findIndex((c) => c.id === activeCycleId)
      : sortedCycles.findIndex((c) => c.status === "active");

    const isCycleCompleted = (c: Cycle): boolean => {
      return logs.some(
        (l) =>
          l.user_id === userId &&
          l.task_id === taskId &&
          l.status === "completed" &&
          l.date >= c.start_date &&
          l.date <= c.end_date
      );
    };

    if (activeCycleIndex === -1) {
      let streak = 0;
      for (let i = sortedCycles.length - 1; i >= 0; i--) {
        if (isCycleCompleted(sortedCycles[i])) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }

    const activeCycle = sortedCycles[activeCycleIndex];
    const isCurrentDone = isCycleCompleted(activeCycle);

    let streak = isCurrentDone ? 1 : 0;
    for (let i = activeCycleIndex - 1; i >= 0; i--) {
      if (isCycleCompleted(sortedCycles[i])) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  static calculateTeamCycleTaskStreak(
    userIds: [number, number],
    taskId: number,
    cycles: Cycle[],
    logs: DailyLog[],
    activeCycleId?: number
  ): number {
    if (!cycles || cycles.length === 0 || userIds.length !== 2) return 0;
    const [userA, userB] = userIds;

    const sortedCycles = [...cycles].sort((a, b) => (a.start_date || "").localeCompare(b.start_date || ""));
    const activeCycleIndex = activeCycleId
      ? sortedCycles.findIndex((c) => c.id === activeCycleId)
      : sortedCycles.findIndex((c) => c.status === "active");

    const isCycleTeamCompleted = (c: Cycle): boolean => {
      const aDone = logs.some(
        (l) =>
          l.user_id === userA &&
          l.task_id === taskId &&
          l.status === "completed" &&
          l.date >= c.start_date &&
          l.date <= c.end_date
      );
      const bDone = logs.some(
        (l) =>
          l.user_id === userB &&
          l.task_id === taskId &&
          l.status === "completed" &&
          l.date >= c.start_date &&
          l.date <= c.end_date
      );
      return aDone && bDone;
    };

    if (activeCycleIndex === -1) {
      let streak = 0;
      for (let i = sortedCycles.length - 1; i >= 0; i--) {
        if (isCycleTeamCompleted(sortedCycles[i])) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }

    const activeCycle = sortedCycles[activeCycleIndex];
    const isCurrentDone = isCycleTeamCompleted(activeCycle);

    let streak = isCurrentDone ? 1 : 0;
    for (let i = activeCycleIndex - 1; i >= 0; i--) {
      if (isCycleTeamCompleted(sortedCycles[i])) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

