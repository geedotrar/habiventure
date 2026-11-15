import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import {
  evaluatePendingReminders,
  dispatchReminders,
  filterUserVisibleTasks,
} from "@/services/reminderEngine";
import { demoStore } from "@/services/demoStore";
import type { Task, User, DailyLog, Cycle, PushSubscriptionRecord } from "@/types/domain";
import type { AppDataStore } from "@/services/dataAccess";

vi.mock("@/services/supabaseStore", () => ({
  dataStore: {
    getUsers: vi.fn().mockResolvedValue([
      { id: 1, name: "Admin", role: "superadmin", active: true },
      { id: 2, name: "Stevan", role: "user", active: true },
      { id: 3, name: "Via", role: "user", active: true },
    ]),
    getTasks: vi.fn().mockResolvedValue([
      { id: 101, name: "Morning Exercise", description: "", base_score: 10, active: true, frequency: "daily" },
    ]),
    getActiveCycle: vi.fn().mockResolvedValue({
      id: 1,
      name: "Season 1",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      status: "active",
    }),
    getRecentLogs: vi.fn().mockResolvedValue([]),
    getPushSubscriptionsByUserId: vi.fn().mockResolvedValue([]),
    getAllPushSubscriptions: vi.fn().mockResolvedValue([]),
    savePushSubscription: vi.fn().mockResolvedValue(undefined),
    deletePushSubscription: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("Web Push Reminders & Notification Engine", () => {
  afterEach(() => {
    demoStore.resetDemoData();
  });

  describe("filterUserVisibleTasks", () => {
    const tasks: Task[] = [
      { id: 1, name: "Shared Active", description: "", base_score: 10, active: true },
      { id: 2, name: "Shared Inactive", description: "", base_score: 10, active: false },
      { id: 3, name: "Personal User 2", description: "", base_score: 10, active: true, is_personal: true, created_by: 2 },
      { id: 4, name: "Personal User 3", description: "", base_score: 10, active: true, is_personal: true, created_by: 3 },
    ];

    test("filters out inactive tasks and other users' personal tasks", () => {
      const user2Tasks = filterUserVisibleTasks(tasks, 2);
      expect(user2Tasks.map((t) => t.id)).toEqual([1, 3]);

      const user3Tasks = filterUserVisibleTasks(tasks, 3);
      expect(user3Tasks.map((t) => t.id)).toEqual([1, 4]);
    });
  });

  describe("evaluatePendingReminders with mock store", () => {
    const mockUsers: User[] = [
      { id: 1, name: "Admin", role: "superadmin", active: true },
      { id: 2, name: "Stevan", role: "user", active: true },
      { id: 3, name: "Via", role: "user", active: true },
    ];

    const mockTasks: Task[] = [
      { id: 101, name: "Morning Exercise", description: "", base_score: 10, active: true, frequency: "daily" },
      { id: 102, name: "Read Book 3x", description: "", base_score: 15, active: true, frequency: "weekly_custom", target_days_per_week: 3 },
      { id: 103, name: "Monthly Financial Review", description: "", base_score: 30, active: true, frequency: "cycle" },
    ];

    const mockCycle: Cycle = {
      id: 1,
      name: "Season 1",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      status: "active",
    };

    const createMockStore = (logs: DailyLog[] = []): AppDataStore => {
      let storedLogs = [...logs];
      const subs: PushSubscriptionRecord[] = [];

      return {
        getUsers: async () => mockUsers,
        getUserById: async (id) => mockUsers.find((u) => u.id === id) || null,
        getTasks: async () => mockTasks,
        getTaskById: async (id) => mockTasks.find((t) => t.id === id) || null,
        createTask: async () => { },
        getActiveCycle: async () => mockCycle,
        getCycleById: async (id) => (mockCycle.id === id ? mockCycle : null),
        updateCycleStatus: async () => { },
        getDailyLogs: async (date, userId) => storedLogs.filter((l) => l.date === date && (!userId || l.user_id === userId)),
        getDailyLog: async (date, userId, taskId) =>
          storedLogs.find((l) => l.date === date && l.user_id === userId && l.task_id === taskId) || null,
        getRecentLogs: async (_limit, userId) =>
          storedLogs.filter((l) => !userId || l.user_id === userId),
        saveDailyLog: async (log) => {
          storedLogs.push(log);
        },
        getScoreEvents: async () => [],
        addScoreEvent: async () => { },
        hasScoreEvent: async () => false,
        getPunishments: async () => [],
        exportFullBackup: async () => ({}),
        importFullBackup: async () => ({ importedCount: 0 }),
        getStorageUsage: async () => ({ rowCount: 10, approxBytes: 1000, percentage: 1 }),
        savePushSubscription: async (sub) => {
          subs.push({
            id: subs.length + 1,
            user_id: sub.userId,
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
            user_agent: sub.userAgent,
          });
        },
        getPushSubscriptionsByUserId: async (uid) => subs.filter((s) => s.user_id === uid),
        getAllPushSubscriptions: async () => [...subs],
        deletePushSubscription: async (endpoint) => {
          const idx = subs.findIndex((s) => s.endpoint === endpoint);
          if (idx >= 0) subs.splice(idx, 1);
        },
      };
    };

    test("ignores superadmin and generates daily reminder for users with pending daily tasks", async () => {
      const store = createMockStore([]);
      const reminders = await evaluatePendingReminders({
        store,
        targetDate: "2026-11-14",
        type: "daily",
      });

      expect(reminders.some((r) => r.userId === 1)).toBe(false);
      expect(reminders.some((r) => r.userId === 2)).toBe(true);
      expect(reminders.some((r) => r.userId === 3)).toBe(true);

      const user2Daily = reminders.find((r) => r.userId === 2);
      expect(user2Daily?.type).toBe("daily");
      expect(user2Daily?.title).toBe("Hey Stevan, you have incomplete Daily goals!");
      expect(user2Daily?.taskNames).toContain("Morning Exercise");
      expect(user2Daily?.url).toBe("/?tab=today&category=everyday");

      const user3Daily = reminders.find((r) => r.userId === 3);
      expect(user3Daily?.title).toBe("Hey Via, you have incomplete Daily goals!");
    });

    test("does not generate daily reminder if user completed their daily tasks today", async () => {
      const store = createMockStore([
        { date: "2026-11-14", user_id: 2, task_id: 101, status: "completed" },
      ]);

      const reminders = await evaluatePendingReminders({
        store,
        targetDate: "2026-11-14",
        type: "daily",
      });

      expect(reminders.some((r) => r.userId === 2)).toBe(false);
      expect(reminders.some((r) => r.userId === 3)).toBe(true);
    });

      test("evaluates weekly reminder based on target days per week", async () => {
        const store = createMockStore([
          { date: "2026-11-10", user_id: 2, task_id: 102, status: "completed" },
          { date: "2026-11-12", user_id: 2, task_id: 102, status: "completed" },
          { date: "2026-11-09", user_id: 3, task_id: 102, status: "completed" },
          { date: "2026-11-11", user_id: 3, task_id: 102, status: "completed" },
          { date: "2026-11-13", user_id: 3, task_id: 102, status: "completed" },
        ]);

        const reminders = await evaluatePendingReminders({
          store,
          targetDate: "2026-11-14",
          type: "weekly",
        });

        const user2Weekly = reminders.find((r) => r.userId === 2);
        expect(user2Weekly).toBeDefined();
        expect(user2Weekly?.type).toBe("weekly");
        expect(user2Weekly?.title).toBe("Hey Stevan, you have incomplete Weekly goals!");
        expect(user2Weekly?.body).toContain("Read Book 3x");
        expect(user2Weekly?.body).toContain("2/3");

        const user3Weekly = reminders.find((r) => r.userId === 3);
        expect(user3Weekly).toBeUndefined();
      });

      test("evaluates cycle reminder when cycle task is not yet completed in the cycle", async () => {
        const store = createMockStore([
          { date: "2026-11-05", user_id: 3, task_id: 103, status: "completed" },
        ]);

        const reminders = await evaluatePendingReminders({
          store,
          targetDate: "2026-11-14",
          type: "cycle",
        });

        expect(reminders.some((r) => r.userId === 2)).toBe(true);
        expect(reminders.some((r) => r.userId === 3)).toBe(false);

        const user2Cycle = reminders.find((r) => r.userId === 2);
        expect(user2Cycle?.type).toBe("cycle");
        expect(user2Cycle?.title).toBe("Hey Stevan, you have incomplete Cycle goals!");
        expect(user2Cycle?.taskNames).toContain("Monthly Financial Review");
      });
    });

    describe("demoStore push subscription management", () => {
      test("saves, retrieves, and deletes push subscriptions", async () => {
        await demoStore.savePushSubscription({
          userId: 2,
          endpoint: "https://fcm.googleapis.com/fcm/send/sample-token-1",
          p256dh: "key-p256dh-1",
          auth: "key-auth-1",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        });

        let subs = await demoStore.getPushSubscriptionsByUserId(2);
        expect(subs.length).toBe(1);
        expect(subs[0].endpoint).toBe("https://fcm.googleapis.com/fcm/send/sample-token-1");

        await demoStore.deletePushSubscription("https://fcm.googleapis.com/fcm/send/sample-token-1");
        subs = await demoStore.getPushSubscriptionsByUserId(2);
        expect(subs.length).toBe(0);
      });

      test("dispatchReminders in dryRun mode does not throw and reports computed count", async () => {
        const result = await dispatchReminders({
          store: demoStore as any,
          targetDate: "2026-11-14",
          type: "daily",
          dryRun: true,
        });

        expect(result.success).toBe(true);
        expect(result.dryRun ?? true).toBe(true);
        expect(Array.isArray(result.reminders)).toBe(true);
        expect(result.sentSuccessCount).toBe(0);
      });
    });

    describe("Service Worker & Vercel Cron Configuration", () => {
      test("sw.js registers push and notificationclick event listeners", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const swPath = path.resolve(process.cwd(), "public", "sw.js");
        expect(fs.existsSync(swPath)).toBe(true);

        const swContent = fs.readFileSync(swPath, "utf-8");
        expect(swContent).toContain("addEventListener('push'");
        expect(swContent).toContain("addEventListener('notificationclick'");
        expect(swContent).toContain("showNotification");
        expect(swContent).toContain("openWindow");
      });

      test("vercel.json defines scheduled cron jobs for daily, weekly (Saturday 06:00 WIB), and cycle", async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const vercelPath = path.resolve(process.cwd(), "vercel.json");
        expect(fs.existsSync(vercelPath)).toBe(true);

        const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
        expect(Array.isArray(vercelConfig.crons)).toBe(true);

        const dailyCron = vercelConfig.crons.find((c: any) => c.path.includes("type=daily"));
        const weeklyCron = vercelConfig.crons.find((c: any) => c.path.includes("type=weekly"));
        const cycleCron = vercelConfig.crons.find((c: any) => c.path.includes("type=cycle"));

        expect(dailyCron).toBeDefined();
        expect(weeklyCron).toBeDefined();
        expect(weeklyCron.schedule).toBe("0 23 * * 5");
        expect(cycleCron).toBeDefined();
      });
    });

    describe("Cron Reminders API Route", () => {
      beforeEach(() => {
        process.env.CRON_SECRET = "test_cron_secret_12345";
      });

      test("rejects unauthorized request when CRON_SECRET is set", async () => {
        const { GET } = await import("@/app/api/cron/reminders/route");
        const req = new Request("http://localhost:3000/api/cron/reminders?type=daily", {
          headers: { authorization: "Bearer invalid_secret" },
        });

        const res = await GET(req);
        expect(res.status).toBe(401);
      });

      test("accepts authorized request with dryRun mode", async () => {
        const { GET } = await import("@/app/api/cron/reminders/route");
        const cronSecret = process.env.CRON_SECRET || "habiventure_cron_secret_reminder_key";
        const req = new Request(
          `http://localhost:3000/api/cron/reminders?type=daily&dryRun=true&key=${cronSecret}`
        );

        const res = await GET(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.type).toBe("daily");
        expect(Array.isArray(data.reminders)).toBe(true);
      });
    });
  });
