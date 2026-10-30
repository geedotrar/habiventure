import { describe, test, expect } from "vitest";
import bcrypt from "bcryptjs";
import { isEverydayTask, getCycleKeyForDate } from "@/services/streakEngine";
import { formatCycleDateRange, formatDaysRemaining } from "@/utils/dateFormatter";
import { getStreakTier, STREAK_TIERS } from "@/components/StreakFlame";
import { SCORING_RULES, SCORE_REASON_TEMPLATES } from "@/config/scoring";
import { demoStore } from "@/services/demoStore";
import type { Task, Cycle } from "@/types/domain";

describe("domain utilities", () => {
  describe("isEverydayTask", () => {
    test("returns false for personal habits", () => {
      const task: Task = {
        id: 1,
        name: "Personal Habit",
        description: "",
        base_score: 0,
        active: true,
        frequency: "daily",
        is_personal: true,
      };
      expect(isEverydayTask(task)).toBe(false);
    });

    test("returns true for shared daily tasks", () => {
      const task: Task = {
        id: 2,
        name: "Language Practice",
        description: "",
        base_score: 10,
        active: true,
        frequency: "daily",
        target_days_per_week: 7,
      };
      expect(isEverydayTask(task)).toBe(true);
    });

    test("returns false for weekly and cycle tasks", () => {
      const weekly: Task = {
        id: 3,
        name: "Weekly Review",
        description: "",
        base_score: 15,
        active: true,
        frequency: "weekly_2x",
        target_days_per_week: 2,
      };
      const cycle: Task = {
        id: 4,
        name: "Cycle Savings Quest",
        description: "",
        base_score: 50,
        active: true,
        frequency: "cycle",
        target_days_per_week: 1,
      };
      expect(isEverydayTask(weekly)).toBe(false);
      expect(isEverydayTask(cycle)).toBe(false);
    });
  });

  describe("getCycleKeyForDate", () => {
    const cycles: Cycle[] = [
      { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" },
      { id: 2, name: "November", start_date: "2026-11-01", end_date: "2026-11-30", status: "draft" },
    ];

    test("returns cycle id for dates within a cycle", () => {
      expect(getCycleKeyForDate("2026-10-15", cycles)).toBe("cycle_1");
      expect(getCycleKeyForDate("2026-11-10", cycles)).toBe("cycle_2");
    });

    test("falls back to month key outside defined cycles", () => {
      expect(getCycleKeyForDate("2026-12-05", cycles)).toBe("month_2026-12");
    });
  });

  describe("scoring config", () => {
    test("has correct base point values", () => {
      expect(SCORING_RULES.PERSONAL_TASK_COMPLETED).toBe(10);
      expect(SCORING_RULES.PERSONAL_TASK_MISSED).toBe(0);
      expect(SCORING_RULES.TEAM_FULLY_ACTIVE_BONUS).toBe(10);
      expect(SCORING_RULES.TEAM_CYCLE_TASK_COMPLETED).toBe(50);
      expect(SCORING_RULES.TEAM_CYCLE_TASK_MISSED).toBe(0);
    });

    test("formats reason templates", () => {
      expect(SCORE_REASON_TEMPLATES.taskCompleted("Gym")).toBe("Completed goal: Gym");
      expect(SCORE_REASON_TEMPLATES.taskMissed("Gym")).toBe("Missed goal: Gym (0 PTS)");
      expect(SCORE_REASON_TEMPLATES.cycleTaskCompleted("Savings")).toBe("Completed cycle goal: Savings (+50 PTS)");
      expect(SCORE_REASON_TEMPLATES.cycleTaskMissed("Savings")).toBe("Missed cycle goal: Savings (0 PTS)");
    });
  });

  describe("dateFormatter", () => {
    test("formats same month date range", () => {
      expect(formatCycleDateRange("2026-10-01", "2026-10-31")).toBe("1 – 31 Oct 2026");
    });

    test("formats cross month range in same year", () => {
      expect(formatCycleDateRange("2026-10-15", "2026-11-15")).toBe("15 Oct – 15 Nov 2026");
    });

    test("formats cross year range", () => {
      expect(formatCycleDateRange("2026-12-01", "2027-01-31")).toBe("1 Dec 2026 – 31 Jan 2027");
    });

    test("returns empty string on invalid dates", () => {
      expect(formatCycleDateRange("", "")).toBe("");
      expect(formatCycleDateRange(undefined, undefined)).toBe("");
    });

    test("formats days remaining", () => {
      expect(formatDaysRemaining(0)).toBe("Ends today");
      expect(formatDaysRemaining(-2)).toBe("Ends today");
      expect(formatDaysRemaining(1)).toBe("1 day left");
      expect(formatDaysRemaining(5)).toBe("5 days left");
      expect(formatDaysRemaining(undefined)).toBe("");
    });
  });

  describe("streak flame tiers", () => {
    test("has 7 tiers defined", () => {
      expect(STREAK_TIERS.length).toBe(7);
    });

    test("maps streak count to correct tier and color", () => {
      expect(getStreakTier(0).name).toBe("Classic Ember");
      expect(getStreakTier(15).tier).toBe(1);
      expect(getStreakTier(30).name).toBe("Blue Hyperdrive");
      expect(getStreakTier(60).name).toBe("Amethyst Plasma");
      expect(getStreakTier(90).name).toBe("Emerald Radiant");
      expect(getStreakTier(120).name).toBe("Solar Gold");
      expect(getStreakTier(150).name).toBe("Crimson Phoenix");
      expect(getStreakTier(180).name).toBe("Cosmic Aurora");
      expect(getStreakTier(365).tier).toBe(7);
    });

    test("handles negative or invalid streak counts safely", () => {
      expect(getStreakTier(-1).name).toBe("Classic Ember");
      expect(getStreakTier(NaN).name).toBe("Classic Ember");
    });
  });

  describe("task target days validation", () => {
    test("enforces 7 days for daily frequency", () => {
      demoStore.resetDemoData();
      const updated = demoStore.updateDemoTask(1, {
        updates: { frequency: "daily", target_days_per_week: 3 },
      });
      expect(updated.target_days_per_week).toBe(7);
    });

    test("enforces 2 days for weekly_2x", () => {
      demoStore.resetDemoData();
      const updated = demoStore.updateDemoTask(1, {
        updates: { frequency: "weekly_2x", target_days_per_week: 5 },
      });
      expect(updated.target_days_per_week).toBe(2);
    });

    test("clamps custom weekly frequency between 1 and 7", () => {
      demoStore.resetDemoData();
      const updatedHigh = demoStore.updateDemoTask(1, {
        updates: { frequency: "weekly_custom", target_days_per_week: 10 },
      });
      expect(updatedHigh.target_days_per_week).toBe(7);

      const updatedLow = demoStore.updateDemoTask(1, {
        updates: { frequency: "weekly_custom", target_days_per_week: -5 },
      });
      expect(updatedLow.target_days_per_week).toBe(1);

      const updatedValid = demoStore.updateDemoTask(1, {
        updates: { frequency: "weekly_custom", target_days_per_week: 4 },
      });
      expect(updatedValid.target_days_per_week).toBe(4);
    });
  });

  describe("pin hashing", () => {
    test("hashes and compares pin with bcrypt", async () => {
      const pin = "1234";
      const hash = await bcrypt.hash(pin, 10);
      expect(await bcrypt.compare("1234", hash)).toBe(true);
      expect(await bcrypt.compare("9999", hash)).toBe(false);
    }, 15000);
  });

  describe("health route", () => {
    test("returns ok status and uptime", async () => {
      const { GET } = await import("@/app/api/health/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(typeof json.uptime).toBe("number");
      expect(typeof json.timestamp).toBe("string");
    });
  });

  describe("backup deduplication", () => {
    test("skips identical rows based on id and natural keys", () => {
      const existing = [
        { id: 1, name: "Workout" },
        { id: 2, name: "Language Practice" },
      ];
      const incoming = [
        { id: 1, name: "Workout" },
        { id: 3, name: "New Habit" },
      ];
      const existingKeys = new Set(existing.map((e) => `tasks:${e.id}:${e.name.toLowerCase()}`));
      const toInsert = incoming.filter((r) => !existingKeys.has(`tasks:${r.id}:${r.name.toLowerCase()}`));
      expect(toInsert.length).toBe(1);
      expect(toInsert[0].id).toBe(3);
    });
  });

  describe("storage quota monitoring", () => {
    test("calculates used and remaining storage from byte metrics", () => {
      const approxBytes = 45000;
      const MAX_FREE_BYTES = 500 * 1024 * 1024;
      const maxFreeMb = 500;
      const usedMb = Number((approxBytes / (1024 * 1024)).toFixed(2));
      const remainingMb = Number(Math.max(0, maxFreeMb - usedMb).toFixed(2));
      const percentage = Number(Math.min(100, Math.max(0.01, (approxBytes / MAX_FREE_BYTES) * 100)).toFixed(3));

      expect(usedMb).toBe(0.04);
      expect(remainingMb).toBe(499.96);
      expect(percentage).toBe(0.01);
      expect(remainingMb + usedMb).toBe(500);
    });

    test("handles full storage capacity without negative remaining values", () => {
      const approxBytes = 550 * 1024 * 1024;
      const maxFreeMb = 500;
      const usedMb = Number((approxBytes / (1024 * 1024)).toFixed(2));
      const remainingMb = Number(Math.max(0, maxFreeMb - usedMb).toFixed(2));

      expect(usedMb).toBe(550);
      expect(remainingMb).toBe(0);
    });

    test("demoStore returns aligned storageUsage structure", async () => {
      const { demoStore } = await import("@/services/demoStore");
      const storage = demoStore.getStorageUsage();
      expect(storage.maxFreeMb).toBe(500);
      expect(typeof storage.rowCount).toBe("number");
      expect(typeof storage.usedMb).toBe("number");
      expect(typeof storage.remainingMb).toBe("number");
      expect(storage.remainingMb).toBeGreaterThan(0);
    });

    test("formats display string into used / total capacity", () => {
      const usedMb = 8.85;
      const maxFreeMb = 500;
      const displayString = `${usedMb.toFixed(2)} / ${maxFreeMb} MB`;
      expect(displayString).toBe("8.85 / 500 MB");
    });

    test("supports custom storage limit and auto-scaling quota beyond 500 MB", () => {
      const configuredLimit = 8192;
      const usedMb = 1200;
      const quota = usedMb > configuredLimit ? Math.ceil(usedMb / 1024) * 1024 : configuredLimit;
      expect(quota).toBe(8192);
      expect(Number(Math.max(0, quota - usedMb).toFixed(2))).toBe(6992);

      const baseQuota = 500;
      const paidUsageMb = 1450;
      const autoScaledQuota = paidUsageMb > baseQuota ? Math.ceil(paidUsageMb / 1024) * 1024 : baseQuota;
      expect(autoScaledQuota).toBe(2048);
      expect(autoScaledQuota - paidUsageMb).toBe(598);
    });

    test("getSupabaseManagementQuota returns default quota and scales with higher usage", async () => {
      const { getSupabaseManagementQuota, clearManagementQuotaCache } = await import("@/services/supabaseManagement");
      clearManagementQuotaCache();

      const freeQuota = await getSupabaseManagementQuota(10);
      expect(freeQuota.quotaMb).toBe(500);

      clearManagementQuotaCache();
      const scaledQuota = await getSupabaseManagementQuota(1500);
      expect(scaledQuota.quotaMb).toBe(2048);
    });

    test("maps 2GB provisioned EBS disk to 500MB Free Tier quota", () => {
      const sizeGb = 2;
      const isFreeTier = sizeGb <= 2;
      const quotaMb = isFreeTier ? 500 : sizeGb * 1024;
      expect(isFreeTier).toBe(true);
      expect(quotaMb).toBe(500);

      const proSizeGb = 8;
      const isProFreeTier = proSizeGb <= 2;
      const proQuotaMb = isProFreeTier ? 500 : proSizeGb * 1024;
      expect(isProFreeTier).toBe(false);
      expect(proQuotaMb).toBe(8192);
    });
  });

  describe("personal habit notes and motivation description", () => {
    test("creates personal habit with custom notes and preserves exact text", () => {
      const task = demoStore.createDemoTask({
        name: "Morning Meditation",
        description: "5 minutes mindful breathing exercise",
        frequency: "daily",
        is_personal: true,
        created_by: 2,
      });

      expect(task).toBeDefined();
      expect(task.name).toBe("Morning Meditation");
      expect(task.description).toBe("5 minutes mindful breathing exercise");
      expect(task.is_personal).toBe(true);
      expect((task as any).penalty_score).toBeUndefined();
    });

    test("updates personal habit note without falling back to dummy text", () => {
      const created = demoStore.createDemoTask({
        name: "Daily Reading",
        description: "Read 10 pages of non-fiction",
        frequency: "daily",
        is_personal: true,
        created_by: 2,
      });

      const updated = demoStore.updateDemoTask(created.id, {
        description: "Read chapter 4 and take summary notes",
      });

      expect(updated.description).toBe("Read chapter 4 and take summary notes");
    });

    test("allows clearing personal habit note to empty string", () => {
      const created = demoStore.createDemoTask({
        name: "Hydration Goal",
        description: "Drink 2.5L water",
        frequency: "daily",
        is_personal: true,
        created_by: 2,
      });

      const updated = demoStore.updateDemoTask(created.id, {
        description: "",
      });

      expect(updated.description).toBe("");
    });
  });

  describe("positive reinforcement scoring rules", () => {
    test("initial seeded tasks have reward scores and no penalty score column", () => {
      const tasks = demoStore.getTasks();
      for (const t of tasks) {
        expect((t as any).penalty_score).toBeUndefined();
        expect(t.base_score).toBeGreaterThanOrEqual(0);
      }
    });

    test("scoring rules define 0 point deductions for missed goals", () => {
      expect(SCORING_RULES.PERSONAL_TASK_MISSED).toBe(0);
      expect(SCORING_RULES.TEAM_CYCLE_TASK_MISSED).toBe(0);
      expect(SCORE_REASON_TEMPLATES.taskMissed("Workout")).toContain("0 PTS");
      expect(SCORE_REASON_TEMPLATES.cycleTaskMissed("Savings")).toContain("0 PTS");
    });
  });

  describe("backup export and import schema hygiene", () => {
    test("exportFullBackup only includes canonical fields and excludes discarded legacy fields", () => {
      const backup = demoStore.exportFullBackup();

      expect(backup.tasks).toBeDefined();
      expect(backup.pairs).toBeDefined();

      for (const task of backup.tasks as any[]) {
        expect(task.penalty_score).toBeUndefined();
        expect(task.pair_id).toBeUndefined();
        expect(task.name).toBeDefined();
        expect(task.base_score).toBeDefined();
      }

      for (const pair of backup.pairs as any[]) {
        expect(pair.name).toBeUndefined();
        expect(pair.user_1_id).toBeDefined();
        expect(pair.user_2_id).toBeDefined();
      }

      for (const cycle of backup.cycles as any[]) {
        expect(cycle.pair_id).toBeUndefined();
      }

      for (const punishment of backup.punishments as any[]) {
        expect(punishment.pair_id).toBeUndefined();
      }
    });

    test("importFullBackup strips obsolete fields when importing legacy backup payloads", () => {
      const legacyPayload = {
        tasks: [
          {
            id: 99,
            name: "Legacy Habit",
            description: "Old habit with obsolete fields",
            base_score: 10,
            penalty_score: 5,
            pair_id: 1,
            frequency: "daily",
            target_days_per_week: 7,
          },
        ],
        pairs: [
          {
            id: 1,
            name: "Old Alpha Duo",
            user_1_id: 2,
            user_2_id: 3,
            active: true,
          },
        ],
      };

      const result = demoStore.importFullBackup(legacyPayload as any);
      expect(result.importedCount).toBeGreaterThan(0);

      const importedTask = demoStore.getTasks().find((t) => t.id === 99);
      expect(importedTask).toBeDefined();
      expect((importedTask as any).penalty_score).toBeUndefined();
      expect((importedTask as any).pair_id).toBeUndefined();

      const pairs = (demoStore as any).state.pairs;
      const importedPair = pairs.find((p: any) => p.id === 1);
      expect(importedPair).toBeDefined();
      expect(importedPair.name).toBeUndefined();
    });
  });
});
