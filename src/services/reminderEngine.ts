import { getTodayDateString, getWeekRange } from "@/utils/dateFormatter";
import { sendWebPush } from "@/utils/webPush";
import type { AppDataStore } from "./dataAccess";
import { dataStore } from "./supabaseStore";
import type {
  ReminderType,
  ReminderNotificationItem,
  Task,
  DailyLog,
  ReminderDispatchLogRecord,
} from "@/types/domain";

export interface EvaluateRemindersOptions {
  store?: AppDataStore;
  targetDate?: string;
  type?: ReminderType;
  userId?: number;
  slot?: string;
}

export interface DispatchRemindersOptions extends EvaluateRemindersOptions {
  dryRun?: boolean;
}

export interface DispatchRemindersResult {
  success: boolean;
  type: ReminderType;
  targetDate: string;
  dryRun?: boolean;
  remindersCount: number;
  sentSuccessCount: number;
  sentFailedCount: number;
  expiredCleanedCount: number;
  reminders: ReminderNotificationItem[];
  details: Array<{
    userId: number;
    userName: string;
    type: "daily" | "weekly" | "cycle";
    title: string;
    body: string;
    subscriptionsCount: number;
    sentCount: number;
    failedCount: number;
  }>;
}

export function filterUserVisibleTasks(tasks: Task[], userId: number): Task[] {
  return tasks.filter((task) => {
    if (!task.active) return false;
    if (!task.is_personal) return true;
    return Number(task.created_by) === Number(userId);
  });
}

export async function evaluatePendingReminders(
  options: EvaluateRemindersOptions = {}
): Promise<ReminderNotificationItem[]> {
  const store = options.store || dataStore;
  const todayDate = options.targetDate || getTodayDateString();
  const requestedType = options.type || "all";
  const targetUserId = options.userId;

  const users = await store.getUsers();
  const eligibleUsers = users.filter((u) => {
    if (u.role === "superadmin" || u.active === false) return false;
    if (targetUserId && u.id !== targetUserId) return false;
    return true;
  });

  if (eligibleUsers.length === 0) {
    return [];
  }

  const allTasks = await store.getTasks();
  const activeCycle = store.getActiveCycle ? await store.getActiveCycle() : null;
  const { mondayStr, sundayStr } = getWeekRange(todayDate);

  const notifications: ReminderNotificationItem[] = [];

  for (const user of eligibleUsers) {
    const userTasks = filterUserVisibleTasks(allTasks, user.id);
    const userLogs = await store.getRecentLogs(300, user.id);

    if (requestedType === "daily" || requestedType === "all") {
      const dailyTasks = userTasks.filter(
        (t) => t.frequency === "daily" || (!t.frequency && (t.target_days_per_week === 7 || !t.target_days_per_week))
      );

      const pendingDailyTasks = dailyTasks.filter((t) => {
        return !userLogs.some(
          (l) => l.date === todayDate && l.task_id === t.id && l.status === "completed"
        );
      });

      if (pendingDailyTasks.length > 0) {
        const count = pendingDailyTasks.length;
        const taskNames = pendingDailyTasks.map((t) => t.name);
        const title = `Hey ${user.name}, you have incomplete Daily goals!`;
        const body =
          count === 1
            ?`'${taskNames[0]}' is still pending. Complete it today!`
            : `You have ${count} daily goals (${taskNames.slice(0, 3).join(", ")}${taskNames.length > 3 ? "..." : ""}) waiting to be completed today.`;

        const tag = `daily-reminder-${todayDate}${options.slot ? `-${options.slot}` : ""}`;

        notifications.push({
          userId: user.id,
          userName: user.name,
          type: "daily",
          title,
          body,
          url: "/?tab=today&category=everyday",
          tag,
          pendingTasksCount: count,
          taskNames,
        });
      }
    }

    if (requestedType === "weekly" || requestedType === "all") {
      const weeklyTasks = userTasks.filter(
        (t) => t.frequency !== "daily" && t.frequency !== "cycle" && (t.target_days_per_week ? t.target_days_per_week < 7 : true)
      );

      const pendingWeeklyTasks: Array<{ task: Task; completedCount: number; targetDays: number }> = [];

      for (const wt of weeklyTasks) {
        const targetDays = wt.target_days_per_week || (wt.frequency === "weekly_2x" ? 2 : 7);
        const completedDatesInWeek = Array.from(
          new Set(
            userLogs
              .filter(
                (l) =>
                  l.task_id === wt.id &&
                  l.status === "completed" &&
                  l.date >= mondayStr &&
                  l.date <= sundayStr
              )
              .map((l) => l.date)
          )
        );

        if (completedDatesInWeek.length < targetDays) {
          pendingWeeklyTasks.push({
            task: wt,
            completedCount: completedDatesInWeek.length,
            targetDays,
          });
        }
      }

      if (pendingWeeklyTasks.length > 0) {
        const count = pendingWeeklyTasks.length;
        const taskNames = pendingWeeklyTasks.map((item) => item.task.name);
        const title = `Hey ${user.name}, you have incomplete Weekly goals!`;
        const body =
          count === 1
            ?`'${pendingWeeklyTasks[0].task.name}' is at ${pendingWeeklyTasks[0].completedCount}/${pendingWeeklyTasks[0].targetDays} days. Let's finish it this week!`
            : `You have ${count} weekly goals pending this week. Finish them before Monday reset!`;

        const tag = `weekly-reminder-${mondayStr}${options.slot ? `-${options.slot}` : ""}`;

        notifications.push({
          userId: user.id,
          userName: user.name,
          type: "weekly",
          title,
          body,
          url: "/?tab=today&category=weekly",
          tag,
          pendingTasksCount: count,
          taskNames,
        });
      }
    }

    if ((requestedType === "cycle" || requestedType === "all") && activeCycle) {
      const cycleTasks = userTasks.filter((t) => t.frequency === "cycle");

      const pendingCycleTasks = cycleTasks.filter((ct) => {
        return !userLogs.some(
          (l) =>
            l.task_id === ct.id &&
            l.status === "completed" &&
            l.date >= activeCycle.start_date &&
            l.date <= activeCycle.end_date
        );
      });

      if (pendingCycleTasks.length > 0) {
        const count = pendingCycleTasks.length;
        const taskNames = pendingCycleTasks.map((t) => t.name);
        const title = `Hey ${user.name}, you have incomplete Cycle goals!`;
        const body =
          count === 1
            ?`'${taskNames[0]}' is still pending for this cycle.`
            : `You have ${count} cycle goals (${taskNames.slice(0, 3).join(", ")}${taskNames.length > 3 ? "..." : ""}) pending before the cycle ends!`;

        const tag = `cycle-reminder-${activeCycle.id}-${todayDate}`;

        notifications.push({
          userId: user.id,
          userName: user.name,
          type: "cycle",
          title,
          body,
          url: "/?tab=today&category=cycle",
          tag,
          pendingTasksCount: count,
          taskNames,
        });
      }
    }
  }

  return notifications;
}

export async function dispatchReminders(
  options: DispatchRemindersOptions = {}
): Promise<DispatchRemindersResult> {
  const store = options.store || dataStore;
  const targetDate = options.targetDate || getTodayDateString();
  const requestedType = options.type || "all";
  const dryRun = Boolean(options.dryRun);

  const notifications = await evaluatePendingReminders(options);
  const activeCycle = store.getActiveCycle ? await store.getActiveCycle() : null;

  let sentSuccessCount = 0;
  let sentFailedCount = 0;
  let expiredCleanedCount = 0;

  const details: DispatchRemindersResult["details"] = [];
  const dispatchLogs: ReminderDispatchLogRecord[] = [];

  for (const notif of notifications) {
    const subscriptions = store.getPushSubscriptionsByUserId
      ? await store.getPushSubscriptionsByUserId(notif.userId)
      : [];

    let sentForUser = 0;
    let failedForUser = 0;

    if (!dryRun) {
      if (subscriptions.length === 0) {
        dispatchLogs.push({
          cycle_id: activeCycle?.id || null,
          type: notif.type,
          slot: options.slot || null,
          user_id: notif.userId,
          user_name: notif.userName,
          target_date: targetDate,
          title: notif.title,
          body: notif.body,
          status: "no_subscription",
          status_code: null,
          error_message: "No active push subscription found on any device",
          endpoint: null,
        });
      } else {
        for (const sub of subscriptions) {
          const res = await sendWebPush(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            {
              title: notif.title,
              body: notif.body,
              url: notif.url,
              tag: notif.tag,
              data: {
                type: notif.type,
                userId: notif.userId,
                url: notif.url,
              },
            }
          );

          if (res.success) {
            sentSuccessCount++;
            sentForUser++;
            dispatchLogs.push({
              cycle_id: activeCycle?.id || null,
              type: notif.type,
              slot: options.slot || null,
              user_id: notif.userId,
              user_name: notif.userName,
              target_date: targetDate,
              title: notif.title,
              body: notif.body,
              status: "success",
              status_code: res.statusCode || 200,
              error_message: null,
              endpoint: sub.endpoint,
            });
          } else {
            sentFailedCount++;
            failedForUser++;
            console.error("[reminders] Web push failed:", {
              userId: notif.userId,
              type: notif.type,
              statusCode: res.statusCode,
              expired: res.expired,
              error: res.error,
            });
            dispatchLogs.push({
              cycle_id: activeCycle?.id || null,
              type: notif.type,
              slot: options.slot || null,
              user_id: notif.userId,
              user_name: notif.userName,
              target_date: targetDate,
              title: notif.title,
              body: notif.body,
              status: "failed",
              status_code: res.statusCode || null,
              error_message: res.error || "Push dispatch failed",
              endpoint: sub.endpoint,
            });
            if (res.expired && store.deletePushSubscription) {
              await store.deletePushSubscription(sub.endpoint);
              expiredCleanedCount++;
            }
          }
        }
      }
    }

    details.push({
      userId: notif.userId,
      userName: notif.userName,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      subscriptionsCount: subscriptions.length,
      sentCount: sentForUser,
      failedCount: failedForUser,
    });
  }

  if (!dryRun) {
    if (dispatchLogs.length > 0 && store.saveReminderLogs) {
      await store.saveReminderLogs(dispatchLogs);
    }

    if (activeCycle?.id && store.cleanupOldReminderLogs) {
      await store.cleanupOldReminderLogs(activeCycle.id, activeCycle.start_date);
    }
  }

  return {
    success: true,
    type: requestedType,
    targetDate,
    dryRun,
    remindersCount: notifications.length,
    sentSuccessCount,
    sentFailedCount,
    expiredCleanedCount,
    reminders: notifications,
    details,
  };
}
