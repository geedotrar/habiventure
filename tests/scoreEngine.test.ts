import { describe, test, expect, vi, beforeEach } from "vitest";
import { ScoreEngine } from "@/services/scoreEngine";
import { dataStore } from "@/services/supabaseStore";
import type { Task, Cycle, DailyLog, ScoreEvent } from "@/types/domain";

vi.mock("@/services/supabaseStore", () => ({
  dataStore: {
    getCycleById: vi.fn(),
    getTaskById: vi.fn(),
    getDailyLog: vi.fn(),
    saveDailyLog: vi.fn(),
    hasScoreEvent: vi.fn(),
    addScoreEvent: vi.fn(),
    getScoreEvents: vi.fn(),
    getUsers: vi.fn(),
    getTasks: vi.fn(),
    getRecentLogs: vi.fn(),
  },
}));

describe("ScoreEngine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateCycleSummary", () => {
    test("calculates score breakdown for active users", async () => {
      const mockEvents: ScoreEvent[] = [
        {
          cycle_id: 1,
          user_id: 2,
          date: "2026-10-15",
          type: "task_completed",
          points: 10,
          reason: "Completed goal: Workout",
        },
        {
          cycle_id: 1,
          user_id: 2,
          date: "2026-10-16",
          type: "team_bonus",
          points: 10,
          reason: "Team synergy bonus",
        },
        {
          cycle_id: 1,
          user_id: 3,
          date: "2026-10-15",
          type: "task_completed",
          points: 15,
          reason: "Completed goal: Review",
        },
      ];

      const summary = await ScoreEngine.calculateCycleSummary(1, mockEvents);

      expect(summary[2]).toBeDefined();
      expect(summary[2].total).toBe(20);
      expect(summary[2].breakdown.personal).toBe(10);
      expect(summary[2].breakdown.bonus).toBe(10);
      expect(summary[2].breakdown.penalty).toBe(0);

      expect(summary[3]).toBeDefined();
      expect(summary[3].total).toBe(15);
      expect(summary[3].breakdown.personal).toBe(15);
      expect(summary[3].breakdown.bonus).toBe(0);
      expect(summary[3].breakdown.penalty).toBe(0);
    });

    test("handles empty score events array gracefully", async () => {
      const summary = await ScoreEngine.calculateCycleSummary(1, []);
      expect(Object.keys(summary).length).toBe(0);
    });
  });

  describe("recordTaskCompletion", () => {
    test("records completion and adds score event", async () => {
      const cycle: Cycle = { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };
      const task: Task = { id: 10, name: "Shared Gym", description: "", base_score: 10, active: true };

      vi.mocked(dataStore.getCycleById).mockResolvedValue(cycle);
      vi.mocked(dataStore.getTaskById).mockResolvedValue(task);
      vi.mocked(dataStore.getDailyLog).mockResolvedValue(null);
      vi.mocked(dataStore.hasScoreEvent).mockResolvedValue(false);

      const result = await ScoreEngine.recordTaskCompletion({
        cycleId: 1,
        userId: 2,
        taskId: 10,
        date: "2026-10-18",
      });

      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBe(10);
      expect(result.alreadyRecorded).toBe(false);
      expect(dataStore.saveDailyLog).toHaveBeenCalled();
      expect(dataStore.addScoreEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 10,
          type: "task_completed",
          user_id: 2,
        })
      );
    });

    test("awards 0 points for personal habit tasks", async () => {
      const cycle: Cycle = { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };
      const task: Task = { id: 20, name: "Personal Habit", description: "", base_score: 0, active: true, is_personal: true };

      vi.mocked(dataStore.getCycleById).mockResolvedValue(cycle);
      vi.mocked(dataStore.getTaskById).mockResolvedValue(task);
      vi.mocked(dataStore.getDailyLog).mockResolvedValue(null);
      vi.mocked(dataStore.hasScoreEvent).mockResolvedValue(false);

      const result = await ScoreEngine.recordTaskCompletion({
        cycleId: 1,
        userId: 2,
        taskId: 20,
        date: "2026-10-18",
      });

      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBe(0);
      expect(dataStore.addScoreEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 0,
          metadata: expect.objectContaining({ is_personal: true }),
        })
      );
    });

    test("awards cycle task completion score (+50 PTS)", async () => {
      const cycle: Cycle = { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };
      const cycleTask: Task = { id: 50, name: "Monthly Savings", description: "", base_score: 50, frequency: "cycle", active: true };

      vi.mocked(dataStore.getCycleById).mockResolvedValue(cycle);
      vi.mocked(dataStore.getTaskById).mockResolvedValue(cycleTask);
      vi.mocked(dataStore.getRecentLogs).mockResolvedValue([]);
      vi.mocked(dataStore.getDailyLog).mockResolvedValue(null);
      vi.mocked(dataStore.hasScoreEvent).mockResolvedValue(false);

      const result = await ScoreEngine.recordTaskCompletion({
        cycleId: 1,
        userId: 2,
        taskId: 50,
        date: "2026-10-18",
      });

      expect(result.success).toBe(true);
      expect(result.pointsEarned).toBe(50);
      expect(dataStore.addScoreEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          points: 50,
          type: "task_completed",
          user_id: 2,
        })
      );
    });

    test("ignores duplicate completion on the same day", async () => {
      const cycle: Cycle = { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "active" };
      const task: Task = { id: 10, name: "Shared Gym", description: "", base_score: 10, active: true };
      const existingLog: DailyLog = { id: 1, date: "2026-10-18", user_id: 2, task_id: 10, status: "completed" };

      vi.mocked(dataStore.getCycleById).mockResolvedValue(cycle);
      vi.mocked(dataStore.getTaskById).mockResolvedValue(task);
      vi.mocked(dataStore.getDailyLog).mockResolvedValue(existingLog);

      const result = await ScoreEngine.recordTaskCompletion({
        cycleId: 1,
        userId: 2,
        taskId: 10,
        date: "2026-10-18",
      });

      expect(result.alreadyRecorded).toBe(true);
      expect(result.pointsEarned).toBe(0);
      expect(dataStore.addScoreEvent).not.toHaveBeenCalled();
    });

    test("rejects task completion when cycle is closed or inactive", async () => {
      const closedCycle: Cycle = { id: 1, name: "October", start_date: "2026-10-01", end_date: "2026-10-31", status: "closed" };
      const task: Task = { id: 10, name: "Shared Gym", description: "", base_score: 10, active: true };

      vi.mocked(dataStore.getCycleById).mockResolvedValue(closedCycle);
      vi.mocked(dataStore.getTaskById).mockResolvedValue(task);

      await expect(
        ScoreEngine.recordTaskCompletion({
          cycleId: 1,
          userId: 2,
          taskId: 10,
          date: "2026-10-18",
        })
      ).rejects.toThrow("Cannot record task: cycle is not active.");

      expect(dataStore.addScoreEvent).not.toHaveBeenCalled();
      expect(dataStore.saveDailyLog).not.toHaveBeenCalled();
    });
  });
});
