import { describe, test, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}
import { demoStore } from "../src/services/demoStore";
import { StreakEngine } from "../src/services/streakEngine";
import { generateDeviceToken, verifyDeviceToken, isValidSecretKey } from "../src/utils/trustedDevice";

describe("demoStore", () => {
  beforeEach(() => {
    demoStore.resetDemoData();
  });

  describe("verifyDemoPin", () => {
    test("authenticates player A with 1122", () => {
      const user = demoStore.verifyDemoPin("1122");
      expect(user).not.toBeNull();
      expect(user?.id).toBe(2);
      expect(user?.name).toBe("Player A");
      expect(user?.role).toBe("user");
      expect(user?.partner_id).toBe(3);
    });

    test("authenticates player B with 3344", () => {
      const user = demoStore.verifyDemoPin("3344");
      expect(user).not.toBeNull();
      expect(user?.id).toBe(3);
      expect(user?.name).toBe("Player B");
      expect(user?.role).toBe("user");
      expect(user?.partner_id).toBe(2);
    });

    test("authenticates super admin with 9999", () => {
      const user = demoStore.verifyDemoPin("9999");
      expect(user).not.toBeNull();
      expect(user?.id).toBe(1);
      expect(user?.name).toBe("Super Admin");
      expect(user?.role).toBe("superadmin");
    });

    test("rejects incorrect pin", () => {
      expect(demoStore.verifyDemoPin("0000")).toBeNull();
    });
  });

  describe("getDemoDashboard", () => {
    test("loads player A dashboard with partner data", () => {
      const dash = demoStore.getDemoDashboard(2);
      expect(dash.configured).toBe(true);
      expect(dash.currentUser?.id).toBe(2);
      expect(dash.partnerUser?.id).toBe(3);
      expect(dash.tasks.length).toBeGreaterThan(0);
      expect(dash.streaks?.personalStreak).toBeGreaterThanOrEqual(0);
      expect(dash.scores?.playerA?.id).toBe(2);
      expect(dash.scores?.playerB?.id).toBe(3);
    });

    test("loads player B dashboard with partner data", () => {
      const dash = demoStore.getDemoDashboard(3);
      expect(dash.configured).toBe(true);
      expect(dash.currentUser?.id).toBe(3);
      expect(dash.partnerUser?.id).toBe(2);
      expect(dash.tasks.length).toBeGreaterThan(0);
      expect(Array.isArray(dash.streaks?.weekStreakDays)).toBe(true);
      expect(dash.streaks?.weekStreakDays?.length).toBe(7);
    });

    test("loads admin dashboard with all users", () => {
      const dash = demoStore.getDemoDashboard(1);
      expect(dash.configured).toBe(true);
      expect(dash.currentUser?.id).toBe(1);
      expect(dash.currentUser?.role).toBe("superadmin");
      expect(dash.users.length).toBe(3);
    });

    test("provides complete weeklyProgress structure matching API contract", () => {
      const dash = demoStore.getDemoDashboard(2);
      expect(dash.weeklyProgress).toBeDefined();
      const task1Prog = dash.weeklyProgress?.[1];
      expect(task1Prog).toBeDefined();
      expect(typeof task1Prog?.targetDays).toBe("number");
      expect(typeof task1Prog?.completedDaysThisWeek).toBe("number");
      expect(typeof task1Prog?.isTargetReached).toBe("boolean");
      expect(typeof task1Prog?.completedToday).toBe("boolean");
      expect(Array.isArray(task1Prog?.completedDatesThisWeek)).toBe(true);
      expect(typeof task1Prog?.partnerCompletedDaysThisWeek).toBe("number");
      expect(typeof task1Prog?.partnerTargetReached).toBe("boolean");
    });

    test("provides complete weekStreakDays metadata", () => {
      const dash = demoStore.getDemoDashboard(2);
      const days = dash.streaks?.weekStreakDays;
      expect(days).toBeDefined();
      expect(days?.length).toBe(7);
      days?.forEach((day) => {
        expect(typeof day.isToday).toBe("boolean");
        expect(typeof day.isPast).toBe("boolean");
        expect(typeof day.isFuture).toBe("boolean");
        expect(typeof day.hasCompleted).toBe("boolean");
        expect(typeof day.isFullyCompleted).toBe("boolean");
      });
    });
  });

  describe("task completion", () => {
    test("awards points on completing a task", () => {
      const initialDash = demoStore.getDemoDashboard(2);
      const initialScore = initialDash.scores?.currentScore || 0;

      const result = demoStore.completeDemoTask(2, 1);
      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBeGreaterThan(0);

      const updatedDash = demoStore.getDemoDashboard(2);
      expect(updatedDash.scores?.currentScore).toBe(initialScore + result.pointsEarned);
    });

    test("ignores second completion on the same day", () => {
      demoStore.completeDemoTask(2, 4);
      const secondAttempt = demoStore.completeDemoTask(2, 4);
      expect(secondAttempt.alreadyRecorded).toBe(true);
      expect(secondAttempt.pointsEarned).toBe(0);
    });

    test("rejects repeat cycle task completions in the same cycle", () => {
      const first = demoStore.completeDemoTask(2, 5);
      expect(first.success).toBe(true);
      expect(first.pointsEarned).toBe(50);

      const second = demoStore.completeDemoTask(2, 5);
      expect(second.alreadyRecorded).toBe(true);
      expect(second.pointsEarned).toBe(0);
    });

    test("enforces weekly target limit on weekly tasks", () => {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diff);
      const tuesday = new Date(monday);
      tuesday.setDate(monday.getDate() + 1);
      const wednesday = new Date(monday);
      wednesday.setDate(monday.getDate() + 2);

      const mStr = StreakEngine.formatDate(monday);
      const tStr = StreakEngine.formatDate(tuesday);
      const wStr = StreakEngine.formatDate(wednesday);

      const r1 = demoStore.completeDemoTask(2, 2, mStr);
      expect(r1.success).toBe(true);
      const r2 = demoStore.completeDemoTask(2, 2, tStr);
      expect(r2.success).toBe(true);

      const r3 = demoStore.completeDemoTask(2, 2, wStr);
      expect(r3.success).toBe(false);
      expect(r3.error).toContain("Weekly target");
    });

    test("rejects task completion when cycle is closed", () => {
      demoStore.setCycleStatus("closed");
      const attempt = demoStore.completeDemoTask(2, 1);
      expect(attempt.success).toBe(false);
      expect(attempt.error).toContain("closed");
      demoStore.setCycleStatus("active");
    });
  });

  describe("getRecentLogs pushdown filtering", () => {
    test("filters logs by userId and taskId", async () => {
      const allLogs = await demoStore.getRecentLogs(100);
      expect(allLogs.length).toBeGreaterThan(0);

      const user2Logs = await demoStore.getRecentLogs(100, 2);
      expect(user2Logs.length).toBeGreaterThan(0);
      user2Logs.forEach((log) => expect(log.user_id).toBe(2));

      const task3Logs = await demoStore.getRecentLogs(100, undefined, 3);
      expect(task3Logs.length).toBeGreaterThan(0);
      task3Logs.forEach((log) => expect(log.task_id).toBe(3));

      const combinedLogs = await demoStore.getRecentLogs(100, 2, 3);
      expect(combinedLogs.length).toBeGreaterThan(0);
      combinedLogs.forEach((log) => {
        expect(log.user_id).toBe(2);
        expect(log.task_id).toBe(3);
      });
    });
  });

  describe("task and wheel management", () => {
    test("creates, updates, and deletes tasks", () => {
      const created = demoStore.createDemoTask({
        userId: 1,
        task: {
          name: "Demo Running Quest",
          description: "Run 5km",
          base_score: 20,
          frequency: "weekly_custom",
          target_days_per_week: 3,
        },
      });
      expect(created.id).toBeGreaterThan(0);
      expect(created.name).toBe("Demo Running Quest");
      expect(created.base_score).toBe(20);
      expect(demoStore.getTasks().some((t) => t.id === created.id && t.name === "Demo Running Quest")).toBe(true);

      const updated = demoStore.updateDemoTask(created.id, {
        updates: { name: "Demo Sprint Quest", base_score: 25 },
      });
      expect(updated.name).toBe("Demo Sprint Quest");
      expect(updated.base_score).toBe(25);

      demoStore.deleteDemoTask(created.id);
      expect(demoStore.getTasks().some((t) => t.id === created.id)).toBe(false);
    });

    test("manages personal habit tasks isolated to owner", () => {
      const personal = demoStore.createPersonalTask(2, {
        userId: 2,
        task: {
          name: "Drink 2L Water",
          description: "Stay hydrated",
          frequency: "daily",
          target_days_per_week: 7,
        },
      });
      expect(personal.id).toBeGreaterThan(0);
      expect(personal.name).toBe("Drink 2L Water");
      expect(personal.is_personal).toBe(true);
      expect(personal.created_by).toBe(2);

      const dashUserA = demoStore.getDemoDashboard(2);
      expect(dashUserA.tasks.some((t) => t.id === personal.id)).toBe(true);

      const dashUserB = demoStore.getDemoDashboard(3);
      expect(dashUserB.tasks.some((t) => t.id === personal.id)).toBe(false);
    });

    test("clears completed logs when reset", () => {
      demoStore.completeDemoTask(2, 1);
      const dashAfterComplete = demoStore.getDemoDashboard(2);
      const doneLogsAfter = dashAfterComplete.todayLogs?.filter((l) => l.user_id === 2 && l.status === "completed") || [];
      expect(doneLogsAfter.some((l) => l.task_id === 1)).toBe(true);

      demoStore.resetDemoData();
      const dashAfterReset = demoStore.getDemoDashboard(2);
      const doneLogsReset = dashAfterReset.todayLogs?.filter((l) => l.user_id === 2 && l.status === "completed") || [];
      expect(doneLogsReset.some((l) => l.task_id === 1)).toBe(false);
    });

    test("starts next cycle and closes previous cycle", () => {
      const prevCycleId = demoStore.getDemoCycle().cycle.id;
      const newCycle = demoStore.createCycle({
        name: "November 2026",
        start_date: "2026-11-01",
        end_date: "2026-11-30",
      });

      expect(newCycle.id).toBeGreaterThan(prevCycleId);
      expect(newCycle.name).toBe("November 2026");
      expect(newCycle.status).toBe("active");

      const cycleData = demoStore.getDemoCycle();
      expect(cycleData.cycle.id).toBe(newCycle.id);
      expect(cycleData.cycle.status).toBe("active");
      expect(cycleData.isClosed).toBe(false);
    });

    test("paginates cycle history with winner details", () => {
      const page1 = demoStore.getCycleHistory(1, 2);
      expect(page1.items.length).toBeLessThanOrEqual(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.total).toBeGreaterThan(0);
      expect(page1.totalPages).toBeGreaterThanOrEqual(1);

      const closedCycle = page1.items.find((c) => c.status === "closed");
      if (closedCycle) {
        expect(closedCycle.winner_user_id).toBeDefined();
        expect(closedCycle.winner_name).toBeDefined();
      }
    });

    test("manages decision options", () => {
      const initialCount = demoStore.getDecisionOptions().length;
      const added = demoStore.addDecisionOption("Sunset Stroll");
      expect(demoStore.getDecisionOptions().length).toBe(initialCount + 1);

      demoStore.deleteDecisionOption(added.id);
      expect(demoStore.getDecisionOptions().length).toBe(initialCount);

      demoStore.addDecisionOption("Temporary Option");
      demoStore.resetDecisionOptions();
      expect(demoStore.getDecisionOptions().length).toBe(initialCount);
      expect(demoStore.getDecisionOptions().some((o) => o.name === "Temporary Option")).toBe(false);
    });

    test("saves and resets punishment options", () => {
      const initialCount = demoStore.getPunishments().length;
      demoStore.savePunishment({ name: "Cook Breakfast for Winner", description: "Pancakes and coffee" });
      expect(demoStore.getPunishments().length).toBe(initialCount + 1);

      demoStore.resetPunishments();
      expect(demoStore.getPunishments().length).toBe(initialCount);
      expect(demoStore.getPunishments().some((p) => p.name === "Cook Breakfast for Winner")).toBe(false);
    });

    test("restores clean state on reset", () => {
      demoStore.createDemoTask({
        id: 999,
        name: "Temporary Task",
        description: "",
        base_score: 10,
        frequency: "daily",
        target_days_per_week: 7,
        active: true,
      });

      demoStore.resetDemoData();
      expect(demoStore.getTasks().some((t) => t.name === "Temporary Task")).toBe(false);
    });
  });
});

describe("trustedDevice", () => {
  const originalSecret = process.env.TRUSTED_DEVICE_SECRET;

  beforeAll(() => {
    process.env.TRUSTED_DEVICE_SECRET = "test-device-secret-key-123";
  });

  afterAll(() => {
    process.env.TRUSTED_DEVICE_SECRET = originalSecret;
  });

  test("fails closed if secret is not set", async () => {
    delete process.env.TRUSTED_DEVICE_SECRET;
    expect(isValidSecretKey("any-secret")).toBe(false);
    expect(await verifyDeviceToken("12345.signature")).toBe(false);
    await expect(generateDeviceToken()).rejects.toThrow("TRUSTED_DEVICE_SECRET environment variable is not configured.");
    process.env.TRUSTED_DEVICE_SECRET = "test-device-secret-key-123";
  });

  test("generates and verifies HMAC-SHA256 tokens", async () => {
    const token = await generateDeviceToken();
    expect(typeof token).toBe("string");
    expect(token).toContain(".");

    const isValid = await verifyDeviceToken(token);
    expect(isValid).toBe(true);
  });

  test("rejects malformed or tampered tokens", async () => {
    expect(await verifyDeviceToken(null)).toBe(false);
    expect(await verifyDeviceToken("invalid.token")).toBe(false);
    expect(await verifyDeviceToken("12345.tampered_signature")).toBe(false);
  });

  test("validates pairing key against environment secret", () => {
    expect(isValidSecretKey("test-device-secret-key-123")).toBe(true);
    expect(isValidSecretKey("wrong-key")).toBe(false);
    expect(isValidSecretKey("")).toBe(false);
    expect(isValidSecretKey(null)).toBe(false);
  });
});
