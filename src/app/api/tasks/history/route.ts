import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import type { Task, DailyLog, ScoreEvent } from "@/types/domain";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
};

function jsonResponse(data: any, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...NO_CACHE_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get("userId");
    const rawTargetUserId = searchParams.get("targetUserId");
    const rawTaskId = searchParams.get("taskId");

    const callerId = Number(rawUserId);
    if (!callerId) {
      return jsonResponse(
        { error: "Authentication required (userId missing)." },
        { status: 401 }
      );
    }

    const caller = await dataStore.getUserById(callerId);
    if (!caller || !caller.active) {
      return jsonResponse(
        { error: "Active user account required." },
        { status: 403 }
      );
    }

    const isSuperAdmin = caller.role === "superadmin";

    let filterUserId: number | null = callerId;
    if (isSuperAdmin) {
      filterUserId = rawTargetUserId ? Number(rawTargetUserId) : null;
    }

    const targetTaskId = rawTaskId ? Number(rawTaskId) : null;

    const [allTasks, allLogs, allUsers, activeCycle] = await Promise.all([
      dataStore.getTasks(),
      dataStore.getRecentLogs(1000, filterUserId || undefined, targetTaskId || undefined),
      dataStore.getUsers(),
      dataStore.getActiveCycle(),
    ]);

    const allEvents: ScoreEvent[] = activeCycle
      ? await dataStore.getScoreEvents(activeCycle.id)
      : [];

    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    let relevantLogs = allLogs.filter((l) => l.status === "completed");
    if (filterUserId !== null) {
      relevantLogs = relevantLogs.filter((l) => l.user_id === filterUserId);
    }
    if (targetTaskId !== null) {
      relevantLogs = relevantLogs.filter((l) => l.task_id === targetTaskId);
    }

    const richLogs = relevantLogs.map((log) => {
      const task = allTasks.find((t) => t.id === log.task_id);
      const user = userMap.get(log.user_id);

      const scoreEvent = allEvents.find(
        (e) =>
          e.user_id === log.user_id &&
          e.date === log.date &&
          (e.metadata?.taskId === log.task_id || (e.reason && task && e.reason.includes(task.name)))
      );

      const points = scoreEvent
        ? scoreEvent.points
        : task
        ? task.base_score || (task.frequency === "daily" ? 10 : 15)
        : 10;

      return {
        id: log.id,
        date: log.date,
        completed_at: log.completed_at,
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

    return jsonResponse({
      success: true,
      tasksSummary,
      richLogs,
      users: allUsers.filter((u) => u.active),
      isSuperAdmin,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch task history.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
