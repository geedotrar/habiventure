import { SCORING_RULES, SCORE_REASON_TEMPLATES } from "@/config/scoring";
import type { ScoreEvent, ScoreEventType, Cycle, Task } from "@/types/domain";
import { dataStore } from "./supabaseStore";

export interface ScoreSummary {
  userId: number;
  total: number;
  breakdown: {
    personal: number;
    bonus: number;
    penalty: number;
  };
}

export class ScoreEngine {
  static async recordTaskCompletion(params: {
    cycleId: number;
    userId: number;
    taskId: number;
    date: string;
    preloadedCycle?: Cycle | null;
    preloadedTask?: Task | null;
  }): Promise<{
    success: boolean;
    alreadyRecorded: boolean;
    pointsEarned: number;
    event?: ScoreEvent;
  }> {
    const { cycleId, userId, taskId, date, preloadedCycle, preloadedTask } = params;

    const [cycle, task] = await Promise.all([
      preloadedCycle !== undefined ? Promise.resolve(preloadedCycle) : dataStore.getCycleById(cycleId),
      preloadedTask !== undefined ? Promise.resolve(preloadedTask) : dataStore.getTaskById(taskId),
    ]);

    if (!cycle || cycle.status !== "active") {
      throw new Error("Cannot record task: cycle is not active.");
    }
    if (!task || !task.active) {
      throw new Error(`Task ${taskId} not found or inactive.`);
    }

    if (task.frequency === "cycle") {
      const cycleLogs = await dataStore.getRecentLogs(2000);
      const completedLog = cycleLogs.find(
        (l) =>
          l.user_id === userId &&
          l.task_id === taskId &&
          l.status === "completed" &&
          l.date >= cycle.start_date &&
          l.date <= cycle.end_date
      );
      if (completedLog) {
        return {
          success: true,
          alreadyRecorded: true,
          pointsEarned: 0,
        };
      }
    }

    const existingLog = await dataStore.getDailyLog(date, userId, taskId);
    if (existingLog && existingLog.status === "completed") {
      return {
        success: true,
        alreadyRecorded: true,
        pointsEarned: 0,
      };
    }

    await dataStore.saveDailyLog({
      date,
      user_id: userId,
      task_id: taskId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    const eventType: ScoreEventType = "task_completed";
    const eventKey = task.frequency === "cycle"
      ? `${eventType}_${taskId}_cycle_${cycleId}`
      : `${eventType}_${taskId}`;
    const alreadyScored = await dataStore.hasScoreEvent(cycleId, userId, date, eventKey);
    if (alreadyScored) {
      return {
        success: true,
        alreadyRecorded: true,
        pointsEarned: 0,
      };
    }

    const defaultScore = task.frequency === "cycle"
      ? SCORING_RULES.TEAM_CYCLE_TASK_COMPLETED
      : SCORING_RULES.PERSONAL_TASK_COMPLETED;
    const points = task.is_personal ? 0 : (task.base_score || defaultScore);
    const reasonText = task.is_personal
      ? `Personal Habit: ${task.name} (Recorded independently, excluded from VS score)`
      : task.frequency === "cycle"
      ? SCORE_REASON_TEMPLATES.cycleTaskCompleted(task.name)
      : SCORE_REASON_TEMPLATES.taskCompleted(task.name);

    const scoreEvent: ScoreEvent = {
      cycle_id: cycleId,
      user_id: userId,
      date,
      type: eventType,
      points,
      reason: reasonText,
      metadata: { taskId, taskName: task.name, is_personal: !!task.is_personal, eventKey },
      created_at: new Date().toISOString(),
    };

    if (points > 0 || task.is_personal) {
      await dataStore.addScoreEvent(scoreEvent);
    }

    return {
      success: true,
      alreadyRecorded: false,
      pointsEarned: points,
      event: scoreEvent,
    };
  }

  static async calculateCycleSummary(
    cycleId: number,
    existingEvents?: ScoreEvent[]
  ): Promise<Record<number, ScoreSummary>> {
    const events = existingEvents || (await dataStore.getScoreEvents(cycleId));
    const summary: Record<number, ScoreSummary> = {};

    for (const event of events) {
      if (!summary[event.user_id]) {
        summary[event.user_id] = {
          userId: event.user_id,
          total: 0,
          breakdown: { personal: 0, bonus: 0, penalty: 0 },
        };
      }

      const item = summary[event.user_id];
      item.total += event.points;

      if (event.points < 0) {
        item.breakdown.penalty += event.points;
      } else if (event.type === "team_bonus") {
        item.breakdown.bonus += event.points;
      } else {
        item.breakdown.personal += event.points;
      }
    }

    return summary;
  }

}


