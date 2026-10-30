import { NextResponse } from "next/server";
import { ScoreEngine } from "@/services/scoreEngine";
import { dataStore } from "@/services/supabaseStore";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, date, userId } = body;

    if (!taskId || !date || !userId) {
      return jsonResponse(
        { error: "taskId, date, and userId are required." },
        { status: 400 }
      );
    }

    const [callingUser, cycle, task] = await Promise.all([
      dataStore.getUserById(Number(userId)),
      dataStore.getActiveCycle(),
      dataStore.getTaskById(Number(taskId)),
    ]);

    if (callingUser && callingUser.role === "superadmin") {
      return jsonResponse(
        { error: "Super Admin accounts do not participate in player tasks." },
        { status: 403 }
      );
    }

    if (!cycle || cycle.status !== "active") {
      return jsonResponse(
        { error: "Current cycle is closed and scores are frozen. Please start a new cycle to record goals." },
        { status: 400 }
      );
    }

    if (!task || !task.active) {
      return jsonResponse(
        { error: "Goal not found or inactive." },
        { status: 404 }
      );
    }

    const isWeekly = task.frequency !== "daily" && task.frequency !== "cycle" && (task.target_days_per_week ? task.target_days_per_week < 7 : false);
    if (isWeekly && task.target_days_per_week) {
      const d = new Date(date);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const mondayStr = monday.toISOString().split("T")[0];
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const sundayStr = sunday.toISOString().split("T")[0];

      const recentLogs = await dataStore.getRecentLogs(300);
      const otherDayLogsThisWeek = recentLogs.filter(
        (l) => l.user_id === Number(userId) && l.task_id === Number(taskId) && l.status === "completed" && l.date >= mondayStr && l.date <= sundayStr && l.date !== date
      );
      const uniqueDays = new Set(otherDayLogsThisWeek.map((l) => l.date));

      if (uniqueDays.size >= task.target_days_per_week) {
        return jsonResponse(
          { error: `Weekly target of ${task.target_days_per_week} days for '${task.name}' has already been achieved this week.` },
          { status: 400 }
        );
      }
    }

    const result = await ScoreEngine.recordTaskCompletion({
      cycleId: Number(cycle.id),
      userId: Number(userId),
      taskId: Number(taskId),
      date,
      preloadedCycle: cycle,
      preloadedTask: task,
    });

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete goal.";
    return jsonResponse(
      { error: message },
      { status: 500 }
    );
  }
}
