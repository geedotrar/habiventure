import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import { authenticateAdminRequest } from "@/utils/adminAuth";
import type { Task } from "@/types/domain";

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
    const userId = Number(searchParams.get("userId"));

    const auth = await authenticateAdminRequest(request, userId || null);
    if (!auth.authorized) {
      return jsonResponse(
        { error: auth.error || "Only an active Super Admin can access task management." },
        { status: auth.status || 403 }
      );
    }


    const tasks = await dataStore.getTasks();
    return jsonResponse({
      success: true,
      tasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch tasks.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, task } = body;

    const numUserId = Number(userId);
    const auth = await authenticateAdminRequest(request, numUserId || null);
    if (!auth.authorized) {
      return jsonResponse(
        { error: auth.error || "Only an active Super Admin is authorized to add new goals for both players." },
        { status: auth.status || 403 }
      );
    }


    if (!task?.name || !task.name.trim()) {
      return jsonResponse(
        { error: "Goal name is required." },
        { status: 400 }
      );
    }

    const freq = task.frequency || "daily";
    const isPersonal = Boolean(task.is_personal);
    const defaultScore =
      freq === "cycle"
        ? (isPersonal ? 20 : 50)
        : freq !== "daily"
        ? 15
        : 10;
    const defaultTargetDays =
      freq === "cycle"
        ? 1
        : freq === "daily"
        ? 7
        : freq === "weekly_2x"
        ? 2
        : Math.max(1, Math.min(7, Number(task.target_days_per_week) || 3));

    const newTask: Task = {
      id: (task.id && Number(task.id) < 2147483647) ? Number(task.id) : 0,
      name: task.name.trim(),
      description: task.description?.trim() || "",
      base_score: Number(task.base_score) || defaultScore,
      frequency: freq,
      target_days_per_week: defaultTargetDays,
      is_personal: isPersonal,
      created_by: isPersonal ? (task.created_by ? Number(task.created_by) : numUserId) : null,
      active: true,
    };

    const savedTask = await dataStore.createTask(newTask);

    return jsonResponse({
      success: true,
      message: `Goal '${(savedTask as Task)?.name || newTask.name}' was successfully created!`,
      task: savedTask || newTask,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add goal.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, taskId } = body;
    const updates = body.updates || body;

    const numUserId = Number(userId);
    const numTaskId = Number(taskId);
    if (!numTaskId) {
      return jsonResponse(
        { error: "Task ID is required for updating." },
        { status: 400 }
      );
    }

    const [auth, existing] = await Promise.all([
      authenticateAdminRequest(request, numUserId || null),
      dataStore.getTaskById(numTaskId),
    ]);

    if (!auth.authorized) {
      return jsonResponse(
        { error: auth.error || "Only an active Super Admin is authorized to modify shared goals." },
        { status: auth.status || 403 }
      );
    }


    if (!existing) {
      return jsonResponse(
        { error: `Task #${numTaskId} not found.` },
        { status: 404 }
      );
    }

    const cleanUpdates: Partial<Task> = {};
    if (updates.name !== undefined) cleanUpdates.name = String(updates.name).trim();
    if (updates.description !== undefined) cleanUpdates.description = String(updates.description).trim();
    if (updates.base_score !== undefined || updates.baseScore !== undefined) {
      cleanUpdates.base_score = Math.max(1, Number(updates.base_score ?? updates.baseScore) || 10);
    }
    if (updates.frequency !== undefined) cleanUpdates.frequency = updates.frequency;
    const effectiveFreq = cleanUpdates.frequency || existing.frequency || "daily";
    if (effectiveFreq === "cycle") {
      cleanUpdates.target_days_per_week = 1;
    } else if (effectiveFreq === "daily") {
      cleanUpdates.target_days_per_week = 7;
    } else if (effectiveFreq === "weekly_2x") {
      cleanUpdates.target_days_per_week = 2;
    } else if (updates.target_days_per_week !== undefined || updates.targetDays !== undefined) {
      cleanUpdates.target_days_per_week = Math.max(1, Math.min(7, Number(updates.target_days_per_week ?? updates.targetDays) || 3));
    }
    if (updates.is_personal !== undefined) cleanUpdates.is_personal = Boolean(updates.is_personal);
    if (updates.active !== undefined) cleanUpdates.active = Boolean(updates.active);

    if (dataStore.updateTask) {
      const updated = await dataStore.updateTask(numTaskId, cleanUpdates);
      return jsonResponse({
        success: true,
        message: `Goal '${cleanUpdates.name || existing.name}' was successfully updated!`,
        task: updated,
      });
    } else {
      return jsonResponse(
        { error: "Task update operation is not supported by data store." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update goal.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = Number(searchParams.get("userId"));
    const taskId = Number(searchParams.get("taskId"));

    if (!taskId) {
      return jsonResponse(
        { error: "Task ID is required for deletion." },
        { status: 400 }
      );
    }

    const [auth, existing] = await Promise.all([
      authenticateAdminRequest(request, userId || null),
      dataStore.getTaskById(taskId),
    ]);

    if (!auth.authorized) {
      return jsonResponse(
        { error: auth.error || "Only an active Super Admin is authorized to delete shared goals." },
        { status: auth.status || 403 }
      );
    }


    if (!existing) {
      return jsonResponse(
        { error: `Task #${taskId} not found.` },
        { status: 404 }
      );
    }

    if (dataStore.deleteTask) {
      await dataStore.deleteTask(taskId);
      return jsonResponse({
        success: true,
        message: `Goal '${existing.name}' was permanently deleted.`,
      });
    } else {
      return jsonResponse(
        { error: "Task deletion is not supported by data store." },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete goal.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
