import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { getTodayDateString, formatDateString, getWeekRange, APP_TIMEZONE } from "@/utils/dateFormatter";
import { demoStore } from "@/services/demoStore";

describe("Strict Task Reset Timing (WIB / Asia/Jakarta)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    demoStore.resetDemoData();
  });

  describe("1. Daily Reset Exact Boundary (00:00 WIB)", () => {
    test("23:59:59 WIB on Day 1 is still Day 1", () => {
      // 2026-11-09 23:59:59 WIB is 2026-11-09 16:59:59 UTC
      vi.setSystemTime(new Date("2026-11-09T16:59:59Z"));
      expect(getTodayDateString()).toBe("2026-11-09");
    });

    test("00:00:00 WIB on Day 2 flips immediately to Day 2", () => {
      // 2026-11-10 00:00:00 WIB is 2026-11-09 17:00:00 UTC
      vi.setSystemTime(new Date("2026-11-09T17:00:00Z"));
      expect(getTodayDateString()).toBe("2026-11-10");
    });

    test("01:00:00 WIB on Day 2 remains Day 2 (even though UTC is still yesterday)", () => {
      // 2026-11-10 01:00:00 WIB is 2026-11-09 18:00:00 UTC
      vi.setSystemTime(new Date("2026-11-09T18:00:00Z"));
      expect(getTodayDateString()).toBe("2026-11-10");
    });

    test("06:59:59 WIB on Day 2 remains Day 2 (1 second before UTC midnight)", () => {
      // 2026-11-10 06:59:59 WIB is 2026-11-09 23:59:59 UTC
      vi.setSystemTime(new Date("2026-11-09T23:59:59Z"));
      expect(getTodayDateString()).toBe("2026-11-10");
    });

    test("07:00:00 WIB on Day 2 remains Day 2 (when UTC enters Day 2)", () => {
      // 2026-11-10 07:00:00 WIB is 2026-11-10 00:00:00 UTC
      vi.setSystemTime(new Date("2026-11-10T00:00:00Z"));
      expect(getTodayDateString()).toBe("2026-11-10");
    });

    test("Daily checklist resets at 00:00:00 WIB and allows fresh completion", () => {
      // Create a fresh uncompleted daily task to test
      const dailyTask = demoStore.createDemoTask({
        name: "Morning Sunlight & Water",
        frequency: "daily",
        target_days_per_week: 7,
        base_score: 10,
      });

      // Complete daily task on 2026-11-09 at 21:00 WIB (14:00 UTC)
      vi.setSystemTime(new Date("2026-11-09T14:00:00Z"));
      const res1 = demoStore.completeDemoTask(2, dailyTask.id);
      expect(res1.success).toBe(true);
      expect(res1.alreadyRecorded).toBeFalsy();
      expect(res1.pointsEarned).toBe(10);

      // Verify dashboard at 23:59:59 WIB: dailyTask is completed today
      vi.setSystemTime(new Date("2026-11-09T16:59:59Z"));
      let dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-11-09");
      expect(dash.todayLogs?.some((l) => l.task_id === dailyTask.id && l.status === "completed")).toBe(true);

      // Transition to Day 2 at 00:00:01 WIB (17:00:01 UTC)
      vi.setSystemTime(new Date("2026-11-09T17:00:01Z"));
      dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-11-10");
      // dailyTask MUST be reset for the new day
      expect(dash.todayLogs?.some((l) => l.task_id === dailyTask.id && l.status === "completed")).toBe(false);

      // Complete dailyTask on the new day at 00:15 WIB (17:15 UTC)
      vi.setSystemTime(new Date("2026-11-09T17:15:00Z"));
      const res2 = demoStore.completeDemoTask(2, dailyTask.id);
      expect(res2.success).toBe(true);
      expect(res2.alreadyRecorded).toBeFalsy();
      expect(res2.pointsEarned).toBe(10);

      // Verify dailyTask is now completed on Day 2
      dash = demoStore.getDemoDashboard(2);
      expect(dash.todayLogs?.some((l) => l.task_id === dailyTask.id && l.status === "completed")).toBe(true);
    });
  });

  describe("2. Weekly Reset Exact Boundary (Monday 00:00 WIB)", () => {
    test("Week range shifts from Sun 23:59:59 WIB to Mon 00:00:00 WIB", () => {
      // Sunday 2026-11-15 23:59:59 WIB (16:59:59 UTC)
      vi.setSystemTime(new Date("2026-11-15T16:59:59Z"));
      const sunRange = getWeekRange(getTodayDateString());
      expect(sunRange.mondayStr).toBe("2026-11-09");
      expect(sunRange.sundayStr).toBe("2026-11-15");

      // Monday 2026-11-16 00:00:00 WIB (17:00:00 UTC)
      vi.setSystemTime(new Date("2026-11-15T17:00:00Z"));
      const monRange = getWeekRange(getTodayDateString());
      expect(monRange.mondayStr).toBe("2026-11-16");
      expect(monRange.sundayStr).toBe("2026-11-22");
    });

    test("Weekly task completed in week W resets to 0 at Monday 00:00 WIB", () => {
      // Create fresh weekly task (target 2 days per week)
      const weeklyTask = demoStore.createDemoTask({
        name: "Weekly Deep Clean",
        frequency: "weekly_2x",
        target_days_per_week: 2,
        base_score: 15,
      });

      // Day 1: Tuesday 2026-11-10 10:00 WIB (03:00 UTC)
      vi.setSystemTime(new Date("2026-11-10T03:00:00Z"));
      const r1 = demoStore.completeDemoTask(2, weeklyTask.id);
      expect(r1.success).toBe(true);
      expect(r1.alreadyRecorded).toBeFalsy();

      // Day 2: Friday 2026-11-13 10:00 WIB (03:00 UTC)
      vi.setSystemTime(new Date("2026-11-13T03:00:00Z"));
      const r2 = demoStore.completeDemoTask(2, weeklyTask.id);
      expect(r2.success).toBe(true);
      expect(r2.alreadyRecorded).toBeFalsy();

      // On Sunday night 23:59 WIB (16:59 UTC): target 2/2 is REACHED
      vi.setSystemTime(new Date("2026-11-15T16:59:00Z"));
      let dash = demoStore.getDemoDashboard(2);
      expect(dash.weeklyProgress?.[weeklyTask.id].completedDaysThisWeek).toBe(2);
      expect(dash.weeklyProgress?.[weeklyTask.id].isTargetReached).toBe(true);

      // Attempting another completion on Sunday is blocked (weekly limit reached)
      const rBlocked = demoStore.completeDemoTask(2, weeklyTask.id);
      expect(rBlocked.success).toBe(false);
      expect(rBlocked.error).toContain("Weekly target of 2 days");

      // Monday 00:00:01 WIB (17:00:01 UTC): WEEKLY PROGRESS MUST RESET TO 0
      vi.setSystemTime(new Date("2026-11-15T17:00:01Z"));
      dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-11-16");
      expect(dash.weeklyProgress?.[weeklyTask.id].completedDaysThisWeek).toBe(0);
      expect(dash.weeklyProgress?.[weeklyTask.id].isTargetReached).toBe(false);

      // Monday 01:30 WIB (18:30 UTC): can complete for the new week!
      vi.setSystemTime(new Date("2026-11-15T18:30:00Z"));
      const rNewWeek = demoStore.completeDemoTask(2, weeklyTask.id);
      expect(rNewWeek.success).toBe(true);
      expect(rNewWeek.alreadyRecorded).toBeFalsy();

      dash = demoStore.getDemoDashboard(2);
      expect(dash.weeklyProgress?.[weeklyTask.id].completedDaysThisWeek).toBe(1);
      expect(dash.weeklyProgress?.[weeklyTask.id].isTargetReached).toBe(false);
    });

    test("Weekly reset remains consistent through Monday morning (01:00, 06:59, 07:00 WIB)", () => {
      // 01:00 WIB Monday (UTC is Sunday 18:00)
      vi.setSystemTime(new Date("2026-11-15T18:00:00Z"));
      let range = getWeekRange(getTodayDateString());
      expect(range.mondayStr).toBe("2026-11-16");
      expect(range.sundayStr).toBe("2026-11-22");

      // 06:59:59 WIB Monday (UTC is Sunday 23:59:59)
      vi.setSystemTime(new Date("2026-11-15T23:59:59Z"));
      range = getWeekRange(getTodayDateString());
      expect(range.mondayStr).toBe("2026-11-16");
      expect(range.sundayStr).toBe("2026-11-22");

      // 07:00:00 WIB Monday (UTC is Monday 00:00:00)
      vi.setSystemTime(new Date("2026-11-16T00:00:00Z"));
      range = getWeekRange(getTodayDateString());
      expect(range.mondayStr).toBe("2026-11-16");
      expect(range.sundayStr).toBe("2026-11-22");
    });
  });

  describe("3. Monthly / Cycle Quests Exact Behavior", () => {
    test("Cycle task is completed once and blocked from repeat in same cycle", () => {
      // Task 5 is Monthly Savings Quest (cycle task, +50 PTS)
      vi.setSystemTime(new Date("2026-10-15T05:00:00Z"));
      const r1 = demoStore.completeDemoTask(2, 5);
      expect(r1.success).toBe(true);
      expect(r1.alreadyRecorded).toBeFalsy();
      expect(r1.pointsEarned).toBe(50);

      // Repeat completion in same cycle is prevented
      const rRepeat = demoStore.completeDemoTask(2, 5);
      expect(rRepeat.success).toBe(true);
      expect(rRepeat.alreadyRecorded).toBe(true);
      expect(rRepeat.pointsEarned).toBe(0);

      const dash = demoStore.getDemoDashboard(2);
      expect(dash.cycleTaskProgress?.[5].completedInCycle).toBe(true);
    });

    test("Days remaining calculation decrements at 00:00 WIB", () => {
      // Active cycle end_date is "2026-10-31"
      // On 2026-10-29 23:59:59 WIB (16:59:59 UTC): 2 days remaining
      vi.setSystemTime(new Date("2026-10-29T16:59:59Z"));
      let dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-10-29");
      expect(dash.daysRemaining).toBe(2);

      // On 2026-10-30 00:00:00 WIB (17:00:00 UTC): drops to 1 day remaining
      vi.setSystemTime(new Date("2026-10-29T17:00:00Z"));
      dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-10-30");
      expect(dash.daysRemaining).toBe(1);

      // On 2026-10-31 00:00:00 WIB: drops to 0 (ends today)
      vi.setSystemTime(new Date("2026-10-30T17:00:00Z"));
      dash = demoStore.getDemoDashboard(2);
      expect(dash.todayDate).toBe("2026-10-31");
      expect(dash.daysRemaining).toBe(0);
    });

    test("Cycle task resets when a new cycle starts", () => {
      // Complete cycle task in cycle 1
      vi.setSystemTime(new Date("2026-10-15T05:00:00Z"));
      demoStore.completeDemoTask(2, 5);
      let dash = demoStore.getDemoDashboard(2);
      expect(dash.cycleTaskProgress?.[5].completedInCycle).toBe(true);

      // Start new cycle "November 2026"
      demoStore.createCycle({
        name: "November 2026",
        start_date: "2026-11-01",
        end_date: "2026-11-30",
      });

      // Jump into new cycle on 2026-11-02
      vi.setSystemTime(new Date("2026-11-02T05:00:00Z"));
      dash = demoStore.getDemoDashboard(2);
      // Cycle task is RESET in the new cycle!
      expect(dash.cycleTaskProgress?.[5].completedInCycle).toBe(false);

      // Can be completed again in the new cycle
      const rNewCycle = demoStore.completeDemoTask(2, 5);
      expect(rNewCycle.success).toBe(true);
      expect(rNewCycle.alreadyRecorded).toBeFalsy();
      expect(rNewCycle.pointsEarned).toBe(50);

      dash = demoStore.getDemoDashboard(2);
      expect(dash.cycleTaskProgress?.[5].completedInCycle).toBe(true);
    });
  });

  describe("4. Leap Years and Month End Transitions", () => {
    test("Properly handles leap year transition (Feb 28 -> Feb 29 -> Mar 1)", () => {
      // 2028 is a leap year. Feb 28 23:59:59 WIB (16:59:59 UTC)
      vi.setSystemTime(new Date("2028-02-28T16:59:59Z"));
      expect(getTodayDateString()).toBe("2028-02-28");

      // Feb 29 00:00:00 WIB (17:00:00 UTC)
      vi.setSystemTime(new Date("2028-02-28T17:00:00Z"));
      expect(getTodayDateString()).toBe("2028-02-29");

      // Mar 01 00:00:00 WIB (17:00:00 UTC)
      vi.setSystemTime(new Date("2028-02-29T17:00:00Z"));
      expect(getTodayDateString()).toBe("2028-03-01");
    });

    test("Properly handles Year-End transition (Dec 31 23:59 WIB -> Jan 01 00:00 WIB)", () => {
      // Dec 31 2026 23:59:59 WIB (16:59:59 UTC)
      vi.setSystemTime(new Date("2026-12-31T16:59:59Z"));
      expect(getTodayDateString()).toBe("2026-12-31");

      // Jan 01 2027 00:00:00 WIB (17:00:00 UTC)
      vi.setSystemTime(new Date("2026-12-31T17:00:00Z"));
      expect(getTodayDateString()).toBe("2027-01-01");
    });
  });
});
