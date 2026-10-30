import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import type { Task, TaskFrequency } from "@/types/domain";

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
    const { userId, task } = body;

    const numUserId = Number(userId);
    if (!numUserId) {
      return jsonResponse(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    if (!task?.name || !task.name.trim()) {
      return jsonResponse(
        { error: "Habit name is required." },
        { status: 400 }
      );
    }

    const freqInput = task.frequency || "daily";
    let frequency: TaskFrequency = "daily";
    let targetDays = 7;

    if (freqInput === "cycle") {
      frequency = "cycle";
      targetDays = 1;
    } else if (freqInput === "daily") {
      frequency = "daily";
      targetDays = 7;
    } else {
      targetDays = Math.max(1, Math.min(7, Number(task.target_days_per_week) || 2));
      frequency = targetDays === 2 ? "weekly_2x" : "weekly_custom";
    }

    const newTask: Task = {
      id: 0,
      name: task.name.trim(),
      description: task.description ? String(task.description).trim() : "",
      base_score: 0,
      frequency,
      target_days_per_week: targetDays,
      is_personal: true,
      created_by: numUserId,
      active: true,
    };

    const savedTask = await dataStore.createTask(newTask);

    return jsonResponse({
      success: true,
      message: `Personal habit '${(savedTask as Task)?.name || newTask.name}' was created successfully!`,
      task: savedTask || newTask,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create personal habit.";
    return jsonResponse(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, taskId } = body;
    const updates = body.updates || body;

    const numUserId = Number(userId);
    const numTaskId = Number(taskId);

    if (!numUserId || !numTaskId) {
      return jsonResponse(
        { error: "Both user ID and task ID are required." },
        { status: 400 }
      );
    }

    const [existing, user] = await Promise.all([
      dataStore.getTaskById(numTaskId),
      dataStore.getUserById(numUserId),
    ]);

    if (!existing) {
      return jsonResponse(
        { error: `Task #${numTaskId} not found.` },
        { status: 404 }
      );
    }

    if (!existing.is_personal) {
      return jsonResponse(
        { error: "Only personal habits can be modified via this route." },
        { status: 400 }
      );
    }

    if (existing.created_by !== numUserId && user?.role !== "superadmin") {
      return jsonResponse(
        { error: "You are only authorized to modify your own personal habits." },
        { status: 403 }
      );
    }

    const cleanUpdates: Partial<Task> = {};
    if (updates.name !== undefined) {
      cleanUpdates.name = String(updates.name).trim();
    }
    if (updates.description !== undefined) {
      cleanUpdates.description = String(updates.description).trim();
    }

    if (updates.frequency !== undefined || updates.target_days_per_week !== undefined || updates.targetDays !== undefined) {
      const freq = updates.frequency || existing.frequency || "daily";
      if (freq === "cycle") {
        cleanUpdates.frequency = "cycle";
        cleanUpdates.target_days_per_week = 1;
      } else if (freq === "daily") {
        cleanUpdates.frequency = "daily";
        cleanUpdates.target_days_per_week = 7;
      } else {
        const targetDays = Math.max(1, Math.min(7, Number(updates.target_days_per_week ?? updates.targetDays) || 2));
        cleanUpdates.frequency = targetDays === 2 ? "weekly_2x" : "weekly_custom";
        cleanUpdates.target_days_per_week = targetDays;
      }
    }

    if (updates.active !== undefined) {
      cleanUpdates.active = Boolean(updates.active);
    }

    if (dataStore.updateTask) {
      const updated = await dataStore.updateTask(numTaskId, cleanUpdates);
      return jsonResponse({
        success: true,
        message: `Personal habit '${cleanUpdates.name || existing.name}' updated!`,
        task: updated,
      });
    }

    return jsonResponse({ success: true, message: "Updated." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update personal habit.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { userId, taskId } = body;

    const numUserId = Number(userId);
    const numTaskId = Number(taskId);

    if (!numUserId || !numTaskId) {
      return jsonResponse(
        { error: "Both user ID and task ID are required." },
        { status: 400 }
      );
    }

    const [existing, user] = await Promise.all([
      dataStore.getTaskById(numTaskId),
      dataStore.getUserById(numUserId),
    ]);

    if (!existing) {
      return jsonResponse(
        { error: `Task #${numTaskId} not found.` },
        { status: 404 }
      );
    }

    if (!existing.is_personal) {
      return jsonResponse(
        { error: "Only personal habits can be deleted via this route." },
        { status: 400 }
      );
    }

    if (existing.created_by !== numUserId && user?.role !== "superadmin") {
      return jsonResponse(
        { error: "You are only authorized to delete your own personal habits." },
        { status: 403 }
      );
    }

    if (dataStore.deleteTask) {
      await dataStore.deleteTask(numTaskId);
    }

    return jsonResponse({
      success: true,
      message: `Personal habit '${existing.name}' was successfully deleted.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete personal habit.";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
