import { NextResponse } from "next/server";
import { dataStore } from "@/services/supabaseStore";
import { ScoreEngine } from "@/services/scoreEngine";
import type { CycleResult } from "@/types/domain";

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
    const cycle = await dataStore.getActiveCycle();
    if (!cycle) {
      return jsonResponse({ success: false, error: "No active cycle found" });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    const [punishments, existingResult, summaries, allUsers, history] = await Promise.all([
      dataStore.getPunishments(),
      dataStore.getCycleResult ? dataStore.getCycleResult(cycle.id) : Promise.resolve(null),
      ScoreEngine.calculateCycleSummary(cycle.id),
      dataStore.getUsers(),
      dataStore.getCycleHistory ? dataStore.getCycleHistory(page, limit) : Promise.resolve(null),
    ]);

    const regularUsers = allUsers.filter((u) => u.role !== "superadmin");
    const u1 = regularUsers[0] || null;
    const u2 = regularUsers[1] || null;

    const score1 = u1 ? (summaries[u1.id]?.total || 0) : 0;
    const score2 = u2 ? (summaries[u2.id]?.total || 0) : 0;
    const isTie = score1 === score2;

    const winnerUser = isTie ? null : (score1 > score2 ? u1 : u2);
    const loserUser = isTie ? null : (score1 > score2 ? u2 : u1);
    const winnerScore = Math.max(score1, score2);
    const loserScore = Math.min(score1, score2);
    const scoreDiff = Math.abs(score1 - score2);

    const liveResult: CycleResult = {
      cycle_id: cycle.id,
      winner_user_id: cycle.status === "closed" && existingResult && existingResult.score_diff > 0
        ? existingResult.winner_user_id
        : (winnerUser?.id || null),
      loser_user_id: cycle.status === "closed" && existingResult && existingResult.score_diff > 0
        ? existingResult.loser_user_id
        : (loserUser?.id || null),
      winner_score: cycle.status === "closed" && existingResult ? existingResult.winner_score : winnerScore,
      loser_score: cycle.status === "closed" && existingResult ? existingResult.loser_score : loserScore,
      score_diff: cycle.status === "closed" && existingResult ? existingResult.score_diff : scoreDiff,
      selected_punishment_id: existingResult?.selected_punishment_id || null,
      closed_at: existingResult?.closed_at || new Date().toISOString(),
    };

    const selectedPunishment = punishments.find((p) => p.id === liveResult.selected_punishment_id) || null;

    const players = [
      { id: u1?.id, name: u1?.name, score: score1, gender: u1?.gender },
      { id: u2?.id, name: u2?.name, score: score2, gender: u2?.gender },
    ].filter((p) => Boolean(p.id));

    return jsonResponse({
      success: true,
      cycle,
      punishments,
      result: liveResult,
      winnerUser,
      loserUser,
      players,
      selectedPunishment,
      isClosed: cycle.status === "closed",
      history,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load cycle data";
    return jsonResponse({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, cycleId, punishmentId } = body;

    if (action === "start_new" || action === "create") {
      const name = String(body.name || "").trim();
      const startDate = String(body.startDate || body.start_date || "").trim();
      const endDate = String(body.endDate || body.end_date || "").trim();

      if (!name) {
        return jsonResponse({ success: false, error: "Cycle name is required" }, { status: 400 });
      }
      if (!startDate || !endDate) {
        return jsonResponse({ success: false, error: "Start and end dates are required" }, { status: 400 });
      }
      if (startDate > endDate) {
        return jsonResponse({ success: false, error: "Start date cannot be after end date" }, { status: 400 });
      }

      if (!dataStore.createCycle) {
        return jsonResponse({ success: false, error: "Cycle creation not supported" }, { status: 501 });
      }

      const newCycle = await dataStore.createCycle({
        name,
        start_date: startDate,
        end_date: endDate,
      });

      return jsonResponse({
        success: true,
        message: `New cycle "${newCycle.name}" launched successfully!`,
        cycle: newCycle,
      });
    }

    const cycle = await dataStore.getActiveCycle();
    const targetCycleId = Number(cycleId || cycle?.id);

    if (!targetCycleId) {
      return jsonResponse({ success: false, error: "Cycle not found" });
    }

    if (action === "close") {
      const [summaries, allUsers] = await Promise.all([
        ScoreEngine.calculateCycleSummary(targetCycleId),
        dataStore.getUsers(),
      ]);

      const regularUsers = allUsers.filter((u) => u.role !== "superadmin");
      const u1 = regularUsers[0] || null;
      const u2 = regularUsers[1] || null;

      const score1 = u1 ? (summaries[u1.id]?.total || 0) : 0;
      const score2 = u2 ? (summaries[u2.id]?.total || 0) : 0;
      const isTie = score1 === score2;
      const winnerId = isTie ? null : (score1 > score2 ? u1?.id : u2?.id) || null;
      const loserId = isTie ? null : (score1 > score2 ? u2?.id : u1?.id) || null;

      await dataStore.updateCycleStatus(targetCycleId, "closed", winnerId);

      const result: CycleResult = {
        cycle_id: targetCycleId,
        winner_user_id: winnerId,
        loser_user_id: loserId,
        winner_score: Math.max(score1, score2),
        loser_score: Math.min(score1, score2),
        score_diff: Math.abs(score1 - score2),
        selected_punishment_id: null,
        closed_at: new Date().toISOString(),
      };

      if (dataStore.saveCycleResult) {
        await dataStore.saveCycleResult(result);
      }

      return jsonResponse({ success: true, message: "Cycle closed successfully! Scores are now frozen.", result });
    }

    if (action === "reopen") {
      await dataStore.updateCycleStatus(targetCycleId, "active");
      return jsonResponse({ success: true, message: "Cycle reopened successfully." });
    }

    if (action === "spin") {
      if (!punishmentId) {
        return jsonResponse({ success: false, error: "Punishment ID is required" }, { status: 400 });
      }

      const pId = Number(punishmentId);

      const [existingResult, summaries, allUsers, punishments] = await Promise.all([
        dataStore.getCycleResult ? dataStore.getCycleResult(targetCycleId) : Promise.resolve(null),
        ScoreEngine.calculateCycleSummary(targetCycleId),
        dataStore.getUsers(),
        dataStore.getPunishments(),
      ]);

      const regularUsers = allUsers.filter((u) => u.role !== "superadmin");
      const u1 = regularUsers[0] || null;
      const u2 = regularUsers[1] || null;
      const score1 = u1 ? (summaries[u1.id]?.total || 0) : 0;
      const score2 = u2 ? (summaries[u2.id]?.total || 0) : 0;
      const isTie = score1 === score2;

      const result: CycleResult = {
        cycle_id: targetCycleId,
        winner_user_id: isTie ? null : (score1 > score2 ? u1?.id : u2?.id) || null,
        loser_user_id: isTie ? null : (score1 > score2 ? u2?.id : u1?.id) || null,
        winner_score: Math.max(score1, score2),
        loser_score: Math.min(score1, score2),
        score_diff: Math.abs(score1 - score2),
        selected_punishment_id: pId,
        closed_at: existingResult?.closed_at || new Date().toISOString(),
      };

      if (dataStore.saveCycleResult) {
        await dataStore.saveCycleResult(result);
      }

      const selected = punishments.find((p) => p.id === pId) || null;

      return jsonResponse({
        success: true,
        message: "Punishment saved successfully for this cycle!",
        result,
        selectedPunishment: selected,
      });
    }

    const checkWinnerPermission = async (requesterId?: number | string) => {
      if (!requesterId) return { allowed: false, winnerId: null };
      const reqId = Number(requesterId);

      const [allUsers, summaries, existingResult] = await Promise.all([
        dataStore.getUsers(),
        ScoreEngine.calculateCycleSummary(targetCycleId),
        dataStore.getCycleResult ? dataStore.getCycleResult(targetCycleId) : Promise.resolve(null),
      ]);
      const requester = allUsers.find((u) => u.id === reqId);
      if (requester?.role === "superadmin") {
        return { allowed: true, winnerId: existingResult?.winner_user_id || null };
      }

      const regularUsers = allUsers.filter((u) => u.role !== "superadmin");
      const u1 = regularUsers[0] || null;
      const u2 = regularUsers[1] || null;
      if (!u1 || !u2) {
        return { allowed: false, winnerId: null };
      }
      const score1 = summaries[u1.id]?.total || 0;
      const score2 = summaries[u2.id]?.total || 0;

      if (score1 === score2) {
        return { allowed: false, winnerId: null, isTie: true };
      }

      const winnerUserId = (score1 > score2 ? u1.id : u2.id);
      return { allowed: winnerUserId === reqId, winnerId: winnerUserId, isTie: false };
    };

    if (action === "save_punishment") {
      const { allowed, isTie } = await checkWinnerPermission(body.userId);
      if (!allowed) {
        return jsonResponse(
          {
            success: false,
            error: isTie
              ? "Wheel customization is locked during a tie! Only the cycle winner can edit punishment options."
              : "Only the cycle winner is authorized to edit punishment options!"
          },
          { status: 403 }
        );
      }

      const pData = body.punishment;
      if (!pData || !pData.name || !pData.name.trim()) {
        return jsonResponse({ success: false, error: "Punishment name cannot be empty" }, { status: 400 });
      }

      const id = pData.id ? Number(pData.id) : Date.now();
      const punishmentToSave = {
        id,
        name: pData.name.trim(),
        description: (pData.description || "").trim(),
        active: pData.active ?? true,
      };

      if (dataStore.savePunishment) {
        await dataStore.savePunishment(punishmentToSave);
      }

      const updatedPunishments = await dataStore.getPunishments();
      return jsonResponse({
        success: true,
        message: "Punishment option saved successfully!",
        punishments: updatedPunishments,
      });
    }

    if (action === "delete_punishment") {
      const { allowed, isTie } = await checkWinnerPermission(body.userId);
      if (!allowed) {
        return jsonResponse(
          {
            success: false,
            error: isTie
              ? "Wheel customization is locked during a tie! Only the cycle winner can delete punishment options."
              : "Only the cycle winner is authorized to delete punishment options!"
          },
          { status: 403 }
        );
      }

      if (!punishmentId) {
        return jsonResponse({ success: false, error: "Punishment ID is required" }, { status: 400 });
      }

      const currentPunishments = await dataStore.getPunishments();
      if (currentPunishments.length <= 2) {
        return jsonResponse(
          { success: false, error: "At least 2 punishment options are required on the wheel!" },
          { status: 400 }
        );
      }

      if (dataStore.deletePunishment) {
        await dataStore.deletePunishment(Number(punishmentId));
      }

      const updatedPunishments = await dataStore.getPunishments();
      return jsonResponse({
        success: true,
        message: "Punishment option removed from the wheel!",
        punishments: updatedPunishments,
      });
    }

    if (action === "reset_punishments") {
      const { allowed, isTie } = await checkWinnerPermission(body.userId);
      if (!allowed) {
        return jsonResponse(
          {
            success: false,
            error: isTie
              ? "Wheel customization is locked during a tie! Only the cycle winner can reset punishment options."
              : "Only the cycle winner is authorized to reset punishment options!"
          },
          { status: 403 }
        );
      }

      let updatedPunishments = [];
      if (dataStore.resetPunishments) {
        updatedPunishments = await dataStore.resetPunishments();
      } else {
        updatedPunishments = await dataStore.getPunishments();
      }

      return jsonResponse({
        success: true,
        message: "Punishment options restored to defaults!",
        punishments: updatedPunishments,
      });
    }

    return jsonResponse({ success: false, error: "Unrecognized action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process cycle action";
    return jsonResponse({ success: false, error: message }, { status: 500 });
  }
}
