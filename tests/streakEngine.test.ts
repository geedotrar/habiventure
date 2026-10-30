import { describe, test, expect } from "vitest";
import { StreakEngine } from "@/services/streakEngine";
import type { Task, DailyLog, Cycle } from "@/types/domain";

describe("StreakEngine", () => {
  const tasks: Task[] = [
    { id: 1, name: "Workout", description: "", base_score: 10, active: true },
    { id: 2, name: "Reading", description: "", base_score: 10, active: true },
  ];

  const cycle: Cycle = {
    id: 1,
    name: "October Cycle",
    start_date: "2026-10-01",
    end_date: "2026-10-31",
    status: "active",
  };

  describe("calculatePersonalStreakDetails", () => {
    test("calculates consecutive active days", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 1, status: "completed" },
        { date: "2026-10-17", user_id: 2, task_id: 2, status: "completed" },
        { date: "2026-10-16", user_id: 2, task_id: 1, status: "completed" },
      ];

      const result = StreakEngine.calculatePersonalStreakDetails(
        2,
        tasks,
        logs,
        "2026-10-18",
        [cycle],
        3
      );

      expect(result.streak).toBe(3);
      expect(result.protectsUsed).toBe(0);
      expect(result.protectsRemaining).toBe(3);
    });

    test("consumes a shield when 1 day is missed", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 1, status: "completed" },
        { date: "2026-10-16", user_id: 2, task_id: 1, status: "completed" },
      ];

      const result = StreakEngine.calculatePersonalStreakDetails(
        2,
        tasks,
        logs,
        "2026-10-18",
        [cycle],
        3
      );

      expect(result.streak).toBe(2);
      expect(result.protectsUsed).toBe(1);
      expect(result.protectsRemaining).toBe(2);
      expect(result.protectedDates).toContain("2026-10-17");
    });

    test("resets streak to 1 if shields are exhausted", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 1, status: "completed" },
        { date: "2026-10-13", user_id: 2, task_id: 1, status: "completed" },
      ];

      const result = StreakEngine.calculatePersonalStreakDetails(
        2,
        tasks,
        logs,
        "2026-10-18",
        [cycle],
        3
      );

      expect(result.streak).toBe(1);
    });
  });

  describe("calculateTeamStreakDetails", () => {
    test("increments streak when both players complete goals", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 1, status: "completed" },
        { date: "2026-10-18", user_id: 3, task_id: 2, status: "completed" },
        { date: "2026-10-17", user_id: 2, task_id: 1, status: "completed" },
        { date: "2026-10-17", user_id: 3, task_id: 1, status: "completed" },
      ];

      const result = StreakEngine.calculateTeamStreakDetails(
        [2, 3],
        tasks,
        logs,
        "2026-10-18",
        [cycle]
      );

      expect(result.streak).toBe(2);
    });
  });

  describe("calculateTaskTotalDays", () => {
    test("counts total unique completed days", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 3, status: "completed" },
        { date: "2026-10-14", user_id: 2, task_id: 3, status: "completed" },
        { date: "2026-10-11", user_id: 2, task_id: 3, status: "completed" },
        { date: "2026-10-10", user_id: 2, task_id: 3, status: "completed" },
        { date: "2026-10-10", user_id: 2, task_id: 3, status: "completed" },
        { date: "2026-10-09", user_id: 2, task_id: 3, status: "pending" },
        { date: "2026-10-08", user_id: 3, task_id: 3, status: "completed" },
      ];

      expect(StreakEngine.calculateTaskTotalDays(2, 3, logs)).toBe(4);
    });

    test("returns 0 when no completions exist", () => {
      const logs: DailyLog[] = [
        { date: "2026-10-18", user_id: 2, task_id: 3, status: "pending" },
      ];
      expect(StreakEngine.calculateTaskTotalDays(2, 3, logs)).toBe(0);
    });
  });

  describe("calculateCycleTaskStreak", () => {
    const cycle1: Cycle = { id: 1, name: "August", start_date: "2026-08-01", end_date: "2026-08-31", status: "closed" };
    const cycle2: Cycle = { id: 2, name: "September", start_date: "2026-09-01", end_date: "2026-09-30", status: "closed" };
    const cycle3: Cycle = { id: 3, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };

    test("counts consecutive completed cycles", () => {
      const logs: DailyLog[] = [
        { date: "2026-08-15", user_id: 2, task_id: 5, status: "completed" },
        { date: "2026-09-20", user_id: 2, task_id: 5, status: "completed" },
        { date: "2026-10-10", user_id: 2, task_id: 5, status: "completed" },
      ];

      expect(StreakEngine.calculateCycleTaskStreak(2, 5, [cycle1, cycle2, cycle3], logs)).toBe(3);
    });

    test("preserves previous streak while current cycle is active", () => {
      const logs: DailyLog[] = [
        { date: "2026-08-15", user_id: 2, task_id: 5, status: "completed" },
        { date: "2026-09-20", user_id: 2, task_id: 5, status: "completed" },
      ];

      expect(StreakEngine.calculateCycleTaskStreak(2, 5, [cycle1, cycle2, cycle3], logs)).toBe(2);
    });

    test("resets streak if previous cycle was missed", () => {
      const logs: DailyLog[] = [
        { date: "2026-08-15", user_id: 2, task_id: 5, status: "completed" },
        { date: "2026-10-10", user_id: 2, task_id: 5, status: "completed" },
      ];

      expect(StreakEngine.calculateCycleTaskStreak(2, 5, [cycle1, cycle2, cycle3], logs)).toBe(1);
    });
  });

  describe("calculateTeamCycleTaskStreak", () => {
    const cycle1: Cycle = { id: 1, name: "August", start_date: "2026-08-01", end_date: "2026-08-31", status: "closed" };
    const cycle2: Cycle = { id: 2, name: "September", start_date: "2026-09-01", end_date: "2026-09-30", status: "closed" };
    const cycle3: Cycle = { id: 3, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };

    test("increments when both players complete the cycle goal", () => {
      const logs: DailyLog[] = [
        { date: "2026-08-10", user_id: 2, task_id: 8, status: "completed" },
        { date: "2026-08-12", user_id: 3, task_id: 8, status: "completed" },
        { date: "2026-09-05", user_id: 2, task_id: 8, status: "completed" },
        { date: "2026-09-18", user_id: 3, task_id: 8, status: "completed" },
      ];

      expect(StreakEngine.calculateTeamCycleTaskStreak([2, 3], 8, [cycle1, cycle2, cycle3], logs)).toBe(2);
    });

    test("breaks if either player missed a past cycle", () => {
      const logs: DailyLog[] = [
        { date: "2026-08-10", user_id: 2, task_id: 8, status: "completed" },
        { date: "2026-09-05", user_id: 2, task_id: 8, status: "completed" },
        { date: "2026-09-18", user_id: 3, task_id: 8, status: "completed" },
      ];

      expect(StreakEngine.calculateTeamCycleTaskStreak([2, 3], 8, [cycle1, cycle2, cycle3], logs)).toBe(1);
    });
  });
});
