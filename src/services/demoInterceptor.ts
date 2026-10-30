import { demoStore } from "./demoStore";

let isInterceptorInstalled = false;
let originalFetch: typeof window.fetch | null = null;

export function setupDemoInterceptor() {
  if (typeof window === "undefined") return;
  if (isInterceptorInstalled) return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const url = new URL(urlString, window.location.origin);
    const pathname = url.pathname;
    const method = (init?.method || "GET").toUpperCase();

    if (pathname.startsWith("/api/auth/trust-device") || !pathname.startsWith("/api/")) {
      return (originalFetch as typeof window.fetch)(input, init);
    }

    const jsonResponse = (data: any, status = 200): Response => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    };

    const parseBody = async (): Promise<any> => {
      if (!init?.body) return {};
      if (typeof init.body === "string") {
        try {
          return JSON.parse(init.body);
        } catch {
          return {};
        }
      }
      return {};
    };

    try {
      if (pathname === "/api/auth/pin") {
        const body = await parseBody();

        if (body.action === "change_pin" || method === "PATCH") {
          const targetId = Number(body.targetUserId || body.userId);
          const newPin = body.newPin || "1122";
          demoStore.updateUserPin(targetId, newPin);
          return jsonResponse({
            success: true,
            message: "PIN updated in Demo Mode sandbox.",
          });
        }

        const pin = body.pin;
        const matched = demoStore.verifyDemoPin(pin);
        if (!matched) {
          return jsonResponse(
            { error: "Invalid PIN in demo mode. Try 1122 (Player A), 3344 (Player B), or 9999 (Super Admin)." },
            401
          );
        }

        return jsonResponse({
          success: true,
          user: {
            id: matched.id,
            name: matched.name,
            gender: matched.gender || (matched.id === 3 ? "female" : "male"),
            role: matched.role || "user",
          },
        });
      }

      if (pathname === "/api/dashboard") {
        const userId = Number(url.searchParams.get("userId")) || 2;
        const dashData = demoStore.getDemoDashboard(userId);
        return jsonResponse(dashData);
      }

      if (pathname === "/api/tasks/complete") {
        const body = await parseBody();
        const { taskId, date, userId } = body;
        const result = demoStore.completeDemoTask(Number(userId) || 2, Number(taskId), date);
        if (result && !result.success && result.error) {
          return jsonResponse({ success: false, error: result.error }, 400);
        }
        return jsonResponse(result);
      }

      if (pathname === "/api/decision") {
        if (method === "GET") {
          return jsonResponse({
            success: true,
            options: demoStore.getDecisionOptions(),
            lastSpun: null,
          });
        }
        if (method === "POST") {
          const body = await parseBody();
          if (body.action === "reset") {
            const opts = demoStore.resetDecisionOptions();
            return jsonResponse({ success: true, options: opts });
          }
          if (body.name) {
            const added = demoStore.addDecisionOption(body.name);
            return jsonResponse({ success: true, option: added });
          }
          return jsonResponse({ success: true });
        }
        if (method === "DELETE") {
          const body = await parseBody();
          const id = Number(body.id || url.searchParams.get("id"));
          if (id) demoStore.deleteDecisionOption(id);
          return jsonResponse({ success: true });
        }
      }

      if (pathname === "/api/tasks/history") {
        const callerId = Number(url.searchParams.get("userId")) || 2;
        const targetUserId = url.searchParams.get("targetUserId")
          ? Number(url.searchParams.get("targetUserId"))
          : null;
        const targetTaskId = url.searchParams.get("taskId")
          ? Number(url.searchParams.get("taskId"))
          : null;

        const history = demoStore.getDemoHistory(callerId, targetUserId, targetTaskId);
        return jsonResponse(history);
      }

      if (pathname === "/api/cycle") {
        if (method === "GET") {
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const limit = parseInt(url.searchParams.get("limit") || "3", 10);
          const cycleData = demoStore.getDemoCycle();
          const history = demoStore.getCycleHistory(page, limit);
          return jsonResponse({
            ...cycleData,
            history,
          });
        }
        if (method === "POST") {
          const body = await parseBody();
          if (body.action === "save_punishment") {
            const punishments = demoStore.savePunishment(body.punishment);
            return jsonResponse({
              success: true,
              punishments,
              message: "Punishment option saved successfully!",
            });
          }
          if (body.action === "delete_punishment") {
            const punishments = demoStore.deletePunishment(Number(body.punishmentId));
            return jsonResponse({
              success: true,
              punishments,
              message: "Punishment option removed!",
            });
          }
          if (body.action === "reset_punishments") {
            const punishments = demoStore.resetPunishments();
            return jsonResponse({
              success: true,
              punishments,
              message: "Punishment options restored to defaults!",
            });
          }
          if (body.action === "spin") {
            return jsonResponse({
              success: true,
              punishmentId: body.punishmentId,
              message: "Wheel spun successfully!",
            });
          }
          if (body.action === "start_new" || body.action === "create") {
            const newCycle = demoStore.createCycle({
              name: body.name || "Next Cycle",
              start_date: body.startDate || body.start_date,
              end_date: body.endDate || body.end_date,
            });
            return jsonResponse({
              success: true,
              message: `Cycle "${newCycle.name}" started successfully!`,
              cycle: newCycle,
            });
          }
          if (body.action === "close") {
            const winnerId = body.winnerUserId || (demoStore.getDemoCycle().result.winner_user_id ?? null);
            demoStore.setCycleStatus("closed", winnerId);
            return jsonResponse({ success: true, message: "Cycle closed successfully." });
          }
          if (body.action === "reopen") {
            demoStore.setCycleStatus("active");
            return jsonResponse({ success: true, message: "Cycle reopened." });
          }
          return jsonResponse({ success: true, message: "Cycle updated in Demo Mode." });
        }
      }

      if (pathname === "/api/admin/tasks") {
        if (method === "GET") {
          return jsonResponse({ success: true, tasks: demoStore.getTasks() });
        }
        if (method === "POST") {
          const body = await parseBody();
          const taskData = body.task || body;
          const created = demoStore.createDemoTask(taskData);
          return jsonResponse({
            success: true,
            message: `Goal '${created.name}' was successfully created!`,
            task: created,
          });
        }
        if (method === "PUT" || method === "PATCH") {
          const body = await parseBody();
          const taskId = Number(body.taskId || body.id || url.searchParams.get("taskId"));
          const updates = body.updates || body;
          const updated = demoStore.updateDemoTask(taskId, updates);
          return jsonResponse({
            success: true,
            message: `Goal '${updated.name}' was successfully updated!`,
            task: updated,
          });
        }
        if (method === "DELETE") {
          const body = await parseBody();
          const taskId = Number(url.searchParams.get("taskId") || body.taskId || body.id);
          if (taskId) demoStore.deleteDemoTask(taskId);
          return jsonResponse({
            success: true,
            message: "Goal was permanently deleted.",
          });
        }
      }

      if (pathname === "/api/tasks/personal") {
        if (method === "POST") {
          const body = await parseBody();
          const userId = Number(body.userId) || 2;
          const taskData = body.task || body;
          const created = demoStore.createPersonalTask(userId, taskData);
          return jsonResponse({
            success: true,
            message: `Personal habit '${created.name}' was created successfully!`,
            task: created,
          });
        }
        if (method === "PUT" || method === "PATCH") {
          const body = await parseBody();
          const taskId = Number(body.taskId || body.id);
          const updates = body.updates || body;
          const updated = demoStore.updateDemoTask(taskId, updates);
          return jsonResponse({
            success: true,
            message: `Personal habit '${updated.name}' updated!`,
            task: updated,
          });
        }
        if (method === "DELETE") {
          const body = await parseBody();
          const taskId = Number(body.taskId || url.searchParams.get("taskId"));
          if (taskId) demoStore.deleteDemoTask(taskId);
          return jsonResponse({
            success: true,
            message: "Personal habit was successfully deleted.",
          });
        }
      }

      if (pathname === "/api/admin/users") {
        const body = await parseBody();
        const targetId = Number(body.targetUserId || body.userId);
        const updates = body.updates || {};
        if (body.newPin) updates.newPin = body.newPin;
        let updatedUser = null;
        if (targetId) {
          updatedUser = demoStore.updateUser(targetId, updates);
        }
        return jsonResponse({
          success: true,
          user: updatedUser,
          message: `Account '${updatedUser?.name || "User"}' updated successfully!`,
        });
      }

      if (pathname === "/api/admin/export") {
        const backup = demoStore.exportFullBackup();
        return jsonResponse({
          success: true,
          timestamp: new Date().toISOString(),
          version: "1.0",
          data: backup,
        });
      }

      if (pathname === "/api/admin/import") {
        const body = await parseBody();
        const payload = body?.backupData?.data || body?.backupData || body;
        const result = demoStore.importFullBackup(payload);
        const message = result.skippedCount && result.skippedCount > 0
          ? `Import completed: ${result.importedCount} rows imported, ${result.skippedCount} identical rows skipped.`
          : `Successfully imported ${result.importedCount} rows of data to the database.`;
        return jsonResponse({
          success: true,
          message,
          result,
        });
      }

      return jsonResponse({ success: true, demoMode: true });
    } catch (err: any) {
      console.warn("Demo fetch interceptor error:", err);
      return jsonResponse({ error: err?.message || "Demo error" }, 500);
    }
  };

  isInterceptorInstalled = true;
}

export function teardownDemoInterceptor() {
  if (typeof window === "undefined") return;
  if (isInterceptorInstalled && originalFetch) {
    window.fetch = originalFetch;
    isInterceptorInstalled = false;
    originalFetch = null;
  }
}
