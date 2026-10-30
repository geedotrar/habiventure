import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import type {
  User,
  Task,
  Cycle,
  DailyLog,
  ScoreEvent,
  Punishment,
  CycleResult,
  CycleStatus,
  DecisionOption,
  Pair,
  CycleHistoryItem,
  CycleHistoryPage,
} from "@/types/domain";
import { INITIAL_PUNISHMENTS, INITIAL_DECISION_OPTIONS, INITIAL_TASKS, INITIAL_CYCLE, INITIAL_PAIRS } from "./seedData";
import type { AppDataStore } from "./dataAccess";
import { getSupabaseManagementQuota } from "./supabaseManagement";

export class SupabaseStore implements AppDataStore {
  public client;
  private storageUsageCache: {
    data: {
      rowCount: number;
      approxBytes: number;
      percentage: number;
      usedMb: number;
      maxFreeMb: number;
      remainingMb: number;
    };
    expiresAt: number;
  } = {
    data: {
      rowCount: 35,
      approxBytes: 15000,
      usedMb: 0.02,
      maxFreeMb: 500,
      remainingMb: 499.98,
      percentage: 0.004,
    },
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  private pairsCache: { data: Pair[]; expiresAt: number } | null = null;
  private punishmentsCache: { data: Punishment[]; expiresAt: number } | null = null;

  constructor() {
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://placeholder.supabase.co";
    // Prefer private server-side service role key if configured, fallback to publishable key
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "placeholder-anon-key";
    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  async getUsers(preloadedPairs?: Pair[]): Promise<User[]> {
    const { data: usersData, error } = await this.client
      .from("users")
      .select("*")
      .order("id");
    if (error) {
      console.error("Error fetching users from DB:", error);
      return [];
    }

    let pairsList: Pair[] = [];
    if (preloadedPairs && preloadedPairs.length > 0) {
      pairsList = preloadedPairs;
    } else {
      try {
        pairsList = await this.getPairs();
      } catch {
        pairsList = [];
      }
    }

    const userMap = new Map<number, string>();
    (usersData || []).forEach((u: any) => {
      userMap.set(u.id, u.name);
    });

    const users = (usersData || []).map((u: any) => {
      const activePair = pairsList.find(
        (p) => p.user_1_id === u.id || p.user_2_id === u.id
      );
      let partner_id: number | null = null;
      let partner_name: string | null = null;
      if (activePair) {
        partner_id = activePair.user_1_id === u.id ? activePair.user_2_id : activePair.user_1_id;
        partner_name = userMap.get(partner_id) || null;
      }

      return {
        id: u.id,
        name: u.name,
        phone: u.phone,
        gender: u.gender || (u.id === 3 ? "female" : "male"),
        role: u.role,
        active: u.active,
        partner_id,
        partner_name,
      };
    });

    return users;
  }

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return null;
    }
    return {
      id: (data as any).id,
      name: (data as any).name,
      phone: (data as any).phone,
      gender: (data as any).gender || (data.id === 3 ? "female" : "male"),
      role: (data as any).role,
      active: (data as any).active,
    };
  }

  private async comparePin(inputPin: string, storedHashOrPlain: string): Promise<boolean> {
    if (!storedHashOrPlain) return false;
    if (/^\$2[aby]\$\d{2}\$/.test(storedHashOrPlain)) {
      return await bcrypt.compare(inputPin, storedHashOrPlain);
    }
    return inputPin === storedHashOrPlain;
  }

  async getUserByPin(pin: string): Promise<User | null> {
    const trimmed = pin.trim();
    if (!trimmed) return null;
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("active", true);
    if (error || !data) {
      console.error("Error fetching users from DB for PIN verification:", error);
      return null;
    }
    for (const u of data) {
      const stored = (u as any).pin_hash || (u as any).pin;
      if (stored && (await this.comparePin(trimmed, stored))) {
        return {
          id: u.id,
          name: u.name,
          phone: u.phone,
          gender: (u as any).gender || (u.id === 3 ? "female" : "male"),
          role: u.role,
          active: u.active,
        };
      }
    }
    return null;
  }

  async verifyUserCurrentPin(userId: number, currentPin: string): Promise<boolean> {
    const trimmed = currentPin.trim();
    if (!trimmed) return false;
    const { data, error } = await this.client
      .from("users")
      .select("id, pin_hash")
      .eq("id", userId)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) {
      return false;
    }
    const stored = (data as any).pin_hash || (data as any).pin;
    return await this.comparePin(trimmed, stored);
  }

  async isPinTaken(pin: string, excludeUserId?: number): Promise<boolean> {
    const trimmed = pin.trim();
    if (!trimmed) return false;
    let query = this.client
      .from("users")
      .select("id, pin_hash")
      .eq("active", true);
    if (excludeUserId) {
      query = query.neq("id", excludeUserId);
    }
    const { data, error } = await query;
    if (error || !data) {
      console.error("Error checking PIN availability in DB:", error);
      return false;
    }
    for (const u of data) {
      const stored = (u as any).pin_hash || (u as any).pin;
      if (stored && (await this.comparePin(trimmed, stored))) {
        return true;
      }
    }
    return false;
  }

  async updateUserPin(userId: number, newPin: string): Promise<void> {
    const trimmed = newPin.trim();
    if (!trimmed) {
      throw new Error("New PIN cannot be empty.");
    }
    const hashed = await bcrypt.hash(trimmed, 10);
    const { error } = await this.client
      .from("users")
      .update({ pin_hash: hashed })
      .eq("id", userId);
    if (error) {
      console.error("Error updating user PIN in DB:", error);
      throw new Error(`Failed to update PIN in database: ${error.message}`);
    }
  }

  async createUser(params: {
    name: string;
    phone?: string;
    gender?: "male" | "female";
    role?: "user" | "superadmin";
    active?: boolean;
    pin: string;
    partnerId?: number | null;
  }): Promise<User> {
    const trimmedName = params.name?.trim();
    if (!trimmedName) {
      throw new Error("Full name is required.");
    }
    const trimmedPin = params.pin?.trim();
    if (!trimmedPin || !/^\d{4}$/.test(trimmedPin)) {
      throw new Error("Account PIN must consist of exactly 4 numeric digits (0-9).");
    }

    const isTaken = await this.isPinTaken(trimmedPin);
    if (isTaken) {
      throw new Error("This PIN is already in use by another user account. Please choose a different PIN.");
    }

    const hashedPin = await bcrypt.hash(trimmedPin, 10);
    const { data, error } = await this.client
      .from("users")
      .insert({
        name: trimmedName,
        phone: params.phone?.trim() || "",
        gender: params.gender || "male",
        role: params.role || "user",
        active: params.active !== false,
        pin_hash: hashedPin,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error creating user in DB:", error);
      throw new Error(`Failed to create user in database: ${error?.message || "Unknown error"}`);
    }

    const newUser: User = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      gender: data.gender || "male",
      role: data.role,
      active: data.active,
      partner_id: null,
      partner_name: null,
    };

    if (params.partnerId && params.partnerId > 0 && params.partnerId !== data.id) {
      await this.setPairForUser(data.id, params.partnerId);
      newUser.partner_id = params.partnerId;
    }

    return newUser;
  }

  async deleteUser(userId: number): Promise<void> {
    const { error } = await this.client
      .from("users")
      .delete()
      .eq("id", userId);
    if (error) {
      console.error("Error deleting user from DB:", error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async updateUser(
    userId: number,
    updates: Partial<User> & { newPin?: string; partnerId?: number | null }
  ): Promise<User> {
    const payload: Record<string, any> = {};

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.phone !== undefined) payload.phone = updates.phone.trim();
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    if (updates.newPin) {
      const trimmedPin = updates.newPin.trim();
      if (!/^\d{4}$/.test(trimmedPin)) {
        throw new Error("New PIN must consist of exactly 4 digits.");
      }
      const isTaken = await this.isPinTaken(trimmedPin, userId);
      if (isTaken) {
        throw new Error("This PIN is already in use by another user account.");
      }
      payload.pin_hash = await bcrypt.hash(trimmedPin, 10);
    }

    if (Object.keys(payload).length > 0) {
      const { error } = await this.client
        .from("users")
        .update(payload)
        .eq("id", userId);

      if (error) {
        console.error("Error updating user in DB:", error);
        throw new Error(`Failed to update user in database: ${error?.message || "Unknown error"}`);
      }
    }

    if (updates.partnerId !== undefined) {
      await this.setPairForUser(userId, updates.partnerId);
    }

    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User record could not be found after update.");
    }
    if (updates.partnerId !== undefined) {
      user.partner_id = updates.partnerId;
    }
    return user;
  }

  async getPairs(): Promise<Pair[]> {
    const now = Date.now();
    if (this.pairsCache && this.pairsCache.expiresAt > now) {
      return this.pairsCache.data;
    }
    const { data, error } = await this.client
      .from("pairs")
      .select("*")
      .order("id");
    if (error) {
      console.error("Error fetching pairs from DB:", error);
      return [...INITIAL_PAIRS];
    }
    const list = data && data.length > 0 ? (data as Pair[]) : [...INITIAL_PAIRS];
    this.pairsCache = { data: list, expiresAt: now + 30 * 1000 };
    return list;
  }

  async getPairForUser(userId: number): Promise<Pair | null> {
    const { data, error } = await this.client
      .from("pairs")
      .select("*")
      .eq("active", true)
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as Pair;
  }

  async setPairForUser(userId: number, partnerId: number | null): Promise<Pair | null> {
    this.pairsCache = null;
    if (!userId) throw new Error("Valid user ID is required to configure duo pairing.");

    if (!partnerId || partnerId === 0) {
      await this.client
        .from("pairs")
        .update({ active: false })
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`);
      return null;
    }

    if (userId === partnerId) {
      throw new Error("Cannot pair a user with themselves.");
    }

    await this.client
      .from("pairs")
      .update({ active: false })
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId},user_1_id.eq.${partnerId},user_2_id.eq.${partnerId}`);

    const u1 = Math.min(userId, partnerId);
    const u2 = Math.max(userId, partnerId);

    const { data: existingPair } = await this.client
      .from("pairs")
      .select("*")
      .eq("user_1_id", u1)
      .eq("user_2_id", u2)
      .maybeSingle();

    if (existingPair) {
      const { data: updated, error: updErr } = await this.client
        .from("pairs")
        .update({ active: true })
        .eq("id", existingPair.id)
        .select("*")
        .single();
      if (updErr) {
        console.error("Error activating existing pair:", updErr);
        throw new Error(`Failed to activate pair: ${updErr.message}`);
      }
      return updated as Pair;
    }

    const { data: created, error: insErr } = await this.client
      .from("pairs")
      .insert({
        user_1_id: u1,
        user_2_id: u2,
        active: true,
      })
      .select("*")
      .single();

    if (insErr) {
      console.error("Error creating new pair in DB:", insErr);
      throw new Error(`Failed to create pair: ${insErr.message}`);
    }

    return created as Pair;
  }

  async getTasks(): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .order("id");
    if (error) {
      console.error("Error fetching tasks:", error);
      return [...INITIAL_TASKS];
    }
    return (data && data.length > 0) ? data : [...INITIAL_TASKS];
  }

  async getTaskById(id: number): Promise<Task | null> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return INITIAL_TASKS.find((t) => t.id === id) || null;
    }
    return data as Task;
  }

  async createTask(task: Task): Promise<Task> {
    const fullPayload: Record<string, unknown> = {
      name: task.name,
      description: task.description,
      base_score: task.base_score,
      frequency: task.frequency || "daily",
      target_days_per_week: task.target_days_per_week || 7,
      is_personal: !!task.is_personal,
      created_by: task.created_by || null,
      active: task.active ?? true,
    };
    if (task.id && task.id < 2147483647) {
      fullPayload.id = task.id;
    }

    const { data, error } = await this.client
      .from("tasks")
      .insert(fullPayload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Could not insert to tasks table:", error.message);
      throw new Error(error.message);
    }
    return (data as Task) || task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | null> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.base_score !== undefined) payload.base_score = updates.base_score;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.target_days_per_week !== undefined) payload.target_days_per_week = updates.target_days_per_week;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.is_personal !== undefined) payload.is_personal = updates.is_personal;

    const { data, error } = await this.client
      .from("tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating task in DB:", error);
      throw new Error(error.message);
    }
    return data;
  }

  async deleteTask(id: number): Promise<void> {
    const { error } = await this.client
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting task in DB:", error);
      throw new Error(error.message);
    }
  }

  async getActiveCycle(): Promise<Cycle | null> {
    const { data: activeData, error: activeError } = await this.client
      .from("cycles")
      .select("id, name, start_date, end_date, status, winner_user_id")
      .eq("status", "active")
      .maybeSingle();

    if (!activeError && activeData) {
      return activeData as Cycle;
    }

    const { data: latestData } = await this.client
      .from("cycles")
      .select("id, name, start_date, end_date, status, winner_user_id")
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    return latestData ? (latestData as Cycle) : INITIAL_CYCLE;
  }

  async getAllCycles(): Promise<Cycle[]> {
    const { data, error } = await this.client
      .from("cycles")
      .select("id, name, start_date, end_date, status, winner_user_id")
      .order("start_date", { ascending: true });
    if (error || !data || data.length === 0) {
      return [INITIAL_CYCLE];
    }
    return data;
  }

  async getCycleById(id: number): Promise<Cycle | null> {
    const { data, error } = await this.client
      .from("cycles")
      .select("id, name, start_date, end_date, status, winner_user_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      return INITIAL_CYCLE.id === id ? INITIAL_CYCLE : null;
    }
    return data;
  }

  async updateCycleStatus(cycleId: number, status: CycleStatus, winnerUserId?: number | null): Promise<void> {
    const updatePayload: { status: CycleStatus; winner_user_id?: number | null } = { status };
    if (winnerUserId !== undefined) {
      updatePayload.winner_user_id = winnerUserId;
    }
    const { error } = await this.client
      .from("cycles")
      .update(updatePayload)
      .eq("id", cycleId);
    if (error) throw new Error(error.message);
  }

  async createCycle(cycleData: { name: string; start_date: string; end_date: string }): Promise<Cycle> {
    await this.client
      .from("cycles")
      .update({ status: "closed" })
      .eq("status", "active");

    const { data, error } = await this.client
      .from("cycles")
      .insert({
        name: cycleData.name.trim(),
        start_date: cycleData.start_date,
        end_date: cycleData.end_date,
        status: "active",
      })
      .select("id, name, start_date, end_date, status, winner_user_id")
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to create new cycle");
    }

    return data as Cycle;
  }

  async getCycleHistory(
    page = 1,
    limit = 3,
    options?: { preloadedUsers?: User[]; preloadedPunishments?: Punishment[] }
  ): Promise<CycleHistoryPage> {
    const pageNum = Math.max(1, page);
    const limitNum = Math.max(1, limit);
    const offset = (pageNum - 1) * limitNum;

    const { data: cyclesData, count, error: countError } = await this.client
      .from("cycles")
      .select("id, name, start_date, end_date, status, winner_user_id", { count: "exact" })
      .order("start_date", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (countError || !cyclesData) {
      return { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
    }

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / limitNum));
    const cycleIds = cyclesData.map((c) => c.id);

    const [allUsers, resultsData, punishmentsData] = await Promise.all([
      options?.preloadedUsers ? Promise.resolve(options.preloadedUsers) : this.getUsers(),
      cycleIds.length > 0
        ? this.client
            .from("cycle_results")
            .select("cycle_id, winner_user_id, loser_user_id, winner_score, loser_score, score_diff, selected_punishment_id")
            .in("cycle_id", cycleIds)
        : Promise.resolve({ data: [] }),
      options?.preloadedPunishments ? Promise.resolve(options.preloadedPunishments) : this.getPunishments(),
    ]);

    const results = resultsData.data || [];
    const resultMap = new Map(results.map((r) => [r.cycle_id, r]));
    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const punishmentMap = new Map(punishmentsData.map((p) => [p.id, p]));

    const items: CycleHistoryItem[] = cyclesData.map((c) => {
      const res = resultMap.get(c.id);
      const winnerId = c.winner_user_id || res?.winner_user_id || null;
      const loserId = res?.loser_user_id || null;
      const winner = winnerId ? userMap.get(winnerId) : null;
      const loser = loserId ? userMap.get(loserId) : null;
      const punishment = res?.selected_punishment_id ? punishmentMap.get(res.selected_punishment_id) : null;
      const scoreDiff = res?.score_diff ?? 0;
      const isTie = res ? scoreDiff === 0 : false;

      return {
        id: c.id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
        winner_user_id: winnerId,
        winner_name: winner?.name || null,
        winner_gender: winner?.gender || null,
        winner_score: res?.winner_score ?? 0,
        loser_name: loser?.name || null,
        loser_score: res?.loser_score ?? 0,
        score_diff: scoreDiff,
        punishment_name: punishment?.name || null,
        isTie,
      };
    });

    return { items, total, page: pageNum, limit: limitNum, totalPages };
  }

  async getDailyLogs(date: string, userId?: number): Promise<DailyLog[]> {
    let query = this.client.from("daily_logs").select("*").eq("date", date);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching daily logs:", error);
      return [];
    }
    return data || [];
  }

  async getDailyLog(date: string, userId: number, taskId: number): Promise<DailyLog | null> {
    const { data, error } = await this.client
      .from("daily_logs")
      .select("*")
      .eq("date", date)
      .eq("user_id", userId)
      .eq("task_id", taskId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  async getRecentLogs(limit: number = 500, userId?: number, taskId?: number): Promise<DailyLog[]> {
    let query = this.client
      .from("daily_logs")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (taskId) {
      query = query.eq("task_id", taskId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching recent logs:", error);
      return [];
    }
    return (data as DailyLog[]) || [];
  }

  async saveDailyLog(log: DailyLog): Promise<void> {
    const payload: Record<string, unknown> = {
      date: log.date,
      user_id: log.user_id,
      task_id: log.task_id,
      status: log.status,
      completed_at: log.completed_at || new Date().toISOString(),
    };
    if (log.id) {
      payload.id = log.id;
    }

    const { error } = await this.client.from("daily_logs").upsert(
      payload,
      { onConflict: "date,user_id,task_id" }
    );
    if (error) throw new Error(error.message);
  }

  async getScoreEvents(cycleId: number, userId?: number): Promise<ScoreEvent[]> {
    let query = this.client
      .from("score_events")
      .select("*")
      .eq("cycle_id", cycleId)
      .order("created_at", { ascending: true });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching score events:", error);
      return [];
    }
    return data || [];
  }

  async hasScoreEvent(
    cycleId: number,
    userId: number,
    date: string,
    typeOrKey: string
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from("score_events")
      .select("id, type, metadata")
      .eq("cycle_id", cycleId)
      .eq("user_id", userId)
      .eq("date", date);
    if (error || !data) return false;
    return data.some(
      (ev) =>
        ev.type === typeOrKey ||
        (ev.metadata &&
          typeof ev.metadata === "object" &&
          (ev.metadata as Record<string, unknown>).eventKey === typeOrKey)
    );
  }

  async addScoreEvent(event: ScoreEvent): Promise<void> {
    const payload: Record<string, unknown> = {
      cycle_id: event.cycle_id,
      user_id: event.user_id,
      date: event.date,
      type: event.type,
      points: event.points,
      reason: event.reason,
      metadata: event.metadata || null,
      created_at: event.created_at || new Date().toISOString(),
    };
    if (event.id) {
      payload.id = event.id;
    }

    const { error } = await this.client.from("score_events").insert(payload);
    if (error) throw new Error(error.message);
  }

  private memoryPunishments: Punishment[] = [...INITIAL_PUNISHMENTS];

  async getPunishments(): Promise<Punishment[]> {
    const now = Date.now();
    if (this.punishmentsCache && this.punishmentsCache.expiresAt > now) {
      return this.punishmentsCache.data;
    }
    try {
      const { data, error } = await this.client
        .from("punishments")
        .select("id, name, description, active")
        .order("id", { ascending: true });
      if (error || !data || data.length === 0) {
        return this.memoryPunishments;
      }
      this.memoryPunishments = data;
      this.punishmentsCache = { data, expiresAt: now + 30 * 1000 };
      return data;
    } catch {
      return this.memoryPunishments;
    }
  }

  async savePunishment(punishment: Punishment): Promise<void> {
    this.punishmentsCache = null;
    const existingIndex = this.memoryPunishments.findIndex((p) => p.id === punishment.id);
    if (existingIndex >= 0) {
      this.memoryPunishments[existingIndex] = punishment;
    } else {
      this.memoryPunishments.push(punishment);
    }

    try {
      const { error } = await this.client.from("punishments").upsert({
        id: punishment.id,
        name: punishment.name,
        description: punishment.description,
        active: punishment.active ?? true,
      });
      if (error) {
        console.warn("Could not save to punishments table:", error.message);
      }
    } catch (e: unknown) {
      console.warn("Supabase upsert punishment error:", e);
    }
  }

  async deletePunishment(id: number): Promise<void> {
    this.punishmentsCache = null;
    this.memoryPunishments = this.memoryPunishments.filter((p) => p.id !== id);
    try {
      const { error } = await this.client.from("punishments").delete().eq("id", id);
      if (error) {
        console.warn("Could not delete from punishments table:", error.message);
      }
    } catch (e: unknown) {
      console.warn("Supabase delete punishment error:", e);
    }
  }

  async resetPunishments(): Promise<Punishment[]> {
    this.punishmentsCache = null;
    this.memoryPunishments = [...INITIAL_PUNISHMENTS];
    try {
      await this.client.from("punishments").delete().neq("id", 0);
      await this.client.from("punishments").upsert(
        INITIAL_PUNISHMENTS.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          active: p.active,
        }))
      );
    } catch (e: unknown) {
      console.warn("Supabase reset punishments error:", e);
    }
    return this.memoryPunishments;
  }

  async getCycleResult(cycleId: number): Promise<CycleResult | null> {
    try {
      const { data, error } = await this.client
        .from("cycle_results")
        .select("*")
        .eq("cycle_id", cycleId)
        .maybeSingle();
      if (error) return null;
      return data || null;
    } catch {
      return null;
    }
  }

  async saveCycleResult(result: CycleResult): Promise<void> {
    try {
      await Promise.all([
        this.client.from("cycle_results").upsert({
          cycle_id: result.cycle_id,
          winner_user_id: result.winner_user_id,
          loser_user_id: result.loser_user_id,
          winner_score: result.winner_score,
          loser_score: result.loser_score,
          score_diff: result.score_diff,
          selected_punishment_id: result.selected_punishment_id || null,
          closed_at: result.closed_at || new Date().toISOString(),
        }),
        this.client.from("cycles").update({
          winner_user_id: result.winner_user_id,
        }).eq("id", result.cycle_id),
      ]);
    } catch (e: unknown) {
      console.warn("Could not save to cycle_results table:", e instanceof Error ? e.message : e);
    }
  }

  private memoryDecisionOptions: DecisionOption[] = [...INITIAL_DECISION_OPTIONS];

  async getDecisionOptions(): Promise<DecisionOption[]> {
    try {
      const { data, error } = await this.client
        .from("decision_wheel_options")
        .select("id, name, created_at")
        .order("id", { ascending: true });
      if (error || !data || data.length === 0) {
        return this.memoryDecisionOptions;
      }
      this.memoryDecisionOptions = data;
      return data;
    } catch {
      return this.memoryDecisionOptions;
    }
  }

  async saveDecisionOption(option: Partial<DecisionOption> & { name: string }): Promise<DecisionOption> {
    try {
      if (option.id && option.id > 0 && option.id < 2000000000) {
        const { data, error } = await this.client
          .from("decision_wheel_options")
          .update({
            name: option.name.trim(),
          })
          .eq("id", option.id)
          .select()
          .maybeSingle();

        if (error) {
          console.error("Could not update decision_wheel_options table:", error.message);
          throw new Error(error.message);
        }

        const updated = data || (option as DecisionOption);
        const existingIndex = this.memoryDecisionOptions.findIndex((o) => o.id === option.id);
        if (existingIndex >= 0) {
          this.memoryDecisionOptions[existingIndex] = updated;
        } else {
          this.memoryDecisionOptions.push(updated);
        }
        return updated;
      } else {
        const { data, error } = await this.client
          .from("decision_wheel_options")
          .insert({
            name: option.name.trim(),
          })
          .select()
          .single();

        if (error) {
          console.error("Could not insert to decision_wheel_options table:", error.message);
          throw new Error(error.message);
        }

        this.memoryDecisionOptions.push(data);
        return data;
      }
    } catch (e: unknown) {
      console.error("Supabase save decision option error:", e);
      throw e;
    }
  }

  async deleteDecisionOption(id: number): Promise<void> {
    this.memoryDecisionOptions = this.memoryDecisionOptions.filter((o) => o.id !== id);
    try {
      const { error } = await this.client.from("decision_wheel_options").delete().eq("id", id);
      if (error) {
        console.error("Could not delete from decision_wheel_options table:", error.message);
        throw new Error(error.message);
      }
    } catch (e: unknown) {
      console.error("Supabase delete decision option error:", e);
      throw e;
    }
  }

  async resetDecisionOptions(): Promise<DecisionOption[]> {
    this.memoryDecisionOptions = [...INITIAL_DECISION_OPTIONS];

    try {
      await this.client.from("decision_wheel_options").delete().neq("id", 0);
      let { data, error } = await this.client
        .from("decision_wheel_options")
        .insert(
          INITIAL_DECISION_OPTIONS.map((o) => ({
            name: o.name,
          }))
        )
        .select();

      if (!error && data && data.length > 0) {
        this.memoryDecisionOptions = data;
      }
    } catch (e: unknown) {
      console.warn("Supabase reset decision options error:", e);
    }

    return this.memoryDecisionOptions;
  }

  private static readonly CANONICAL_TABLE_COLUMNS: Record<string, readonly string[]> = {
    users: ["id", "name", "pin_hash", "phone", "gender", "role", "active", "created_at"],
    pairs: ["id", "user_1_id", "user_2_id", "active", "created_at"],
    tasks: ["id", "name", "description", "base_score", "frequency", "target_days_per_week", "is_personal", "created_by", "active", "created_at"],
    cycles: ["id", "name", "start_date", "end_date", "status", "winner_user_id", "created_at"],
    daily_logs: ["id", "date", "user_id", "task_id", "status", "completed_at", "created_at"],
    score_events: ["id", "cycle_id", "user_id", "date", "type", "points", "reason", "metadata", "created_at"],
    punishments: ["id", "name", "description", "active", "created_at"],
    cycle_results: ["cycle_id", "winner_user_id", "loser_user_id", "winner_score", "loser_score", "score_diff", "selected_punishment_id", "closed_at"],
    decision_wheel_options: ["id", "name", "created_at"],
  };

  private sanitizeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
    const allowed = SupabaseStore.CANONICAL_TABLE_COLUMNS[table];
    if (!allowed || !row || typeof row !== "object") return row;
    const clean: Record<string, unknown> = {};
    for (const col of allowed) {
      if (row[col] !== undefined) {
        clean[col] = row[col];
      }
    }
    return clean;
  }

  async exportFullBackup(): Promise<Record<string, unknown[]>> {
    const tables = Object.keys(SupabaseStore.CANONICAL_TABLE_COLUMNS);

    const results = await Promise.all(
      tables.map(async (table) => {
        const allRows: unknown[] = [];
        const pageSize = 1000;
        let from = 0;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await this.client
            .from(table)
            .select("*")
            .range(from, from + pageSize - 1);

          if (error) {
            console.warn(`Export warning for ${table}:`, error.message);
            break;
          }

          if (data && data.length > 0) {
            const cleanRows = data.map((r) => this.sanitizeRow(table, r as Record<string, unknown>));
            allRows.push(...cleanRows);
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
        }

        return [table, allRows] as const;
      })
    );
    return Object.fromEntries(results);
  }

  private getRowFingerprint(table: string, row: Record<string, unknown>): string {
    if (!row) return "";
    switch (table) {
      case "users":
        return `users:${row.id}:${String(row.name || "").toLowerCase().trim()}`;
      case "pairs":
        return `pairs:${row.id}:${row.user_1_id}:${row.user_2_id}`;
      case "tasks":
        return `tasks:${row.id}:${String(row.name || "").toLowerCase().trim()}`;
      case "cycles":
        return `cycles:${row.id}:${row.start_date}:${row.end_date}`;
      case "daily_logs":
        return `daily_logs:${row.date}:${row.user_id}:${row.task_id}`;
      case "score_events":
        return `score_events:${row.cycle_id}:${row.user_id}:${row.date}:${row.type}:${row.points}:${row.reason}`;
      case "punishments":
        return `punishments:${row.id}:${String(row.name || "").toLowerCase().trim()}`;
      case "cycle_results":
        return `cycle_results:${row.cycle_id}`;
      case "decision_wheel_options":
        return `decision_wheel_options:${row.id}:${String(row.name || "").toLowerCase().trim()}`;
      default:
        return `${table}:${row.id}`;
    }
  }

  async importFullBackup(backupData: Record<string, unknown[]>): Promise<{ importedCount: number; skippedCount: number }> {
    let totalImported = 0;
    let totalSkipped = 0;
    const tables = Object.keys(SupabaseStore.CANONICAL_TABLE_COLUMNS);
    const batchSize = 200;

    for (const table of tables) {
      const rows = backupData[table] ||
        (table === "daily_logs" ? backupData["dailyLogs"] : undefined) ||
        (table === "score_events" ? backupData["scoreEvents"] : undefined) ||
        (table === "decision_wheel_options" ? backupData["decisionOptions"] : undefined) ||
        (table === "cycle_results" ? backupData["cycleResults"] : undefined);

      if (Array.isArray(rows) && rows.length > 0) {
        const { data: existingRows } = await this.client.from(table).select("*");
        const existingFingerprints = new Set(
          (existingRows || []).map((r) => this.getRowFingerprint(table, r as Record<string, unknown>))
        );

        const toInsert: Record<string, unknown>[] = [];
        for (const row of rows) {
          const rowObj = row as Record<string, unknown>;
          const cleanRow = this.sanitizeRow(table, rowObj);
          const fp = this.getRowFingerprint(table, cleanRow);
          if (existingFingerprints.has(fp)) {
            totalSkipped++;
          } else {
            toInsert.push(cleanRow);
            existingFingerprints.add(fp);
          }
        }

        if (toInsert.length > 0) {
          for (let i = 0; i < toInsert.length; i += batchSize) {
            const chunk = toInsert.slice(i, i + batchSize);
            const { error } = await this.client
              .from(table)
              .upsert(chunk, { ignoreDuplicates: true });
            if (error) {
              console.error(`Import error on table ${table}:`, error);
              throw new Error(`Failed to import table ${table}: ${error.message}`);
            }
            totalImported += chunk.length;
          }
        }
      }
    }

    return { importedCount: totalImported, skippedCount: totalSkipped };
  }

  async getStorageUsage(): Promise<{
    rowCount: number;
    approxBytes: number;
    percentage: number;
    usedMb: number;
    maxFreeMb: number;
    remainingMb: number;
  }> {
    const now = Date.now();
    if (this.storageUsageCache && this.storageUsageCache.expiresAt > now) {
      return this.storageUsageCache.data;
    }

    const tables = [
      "users",
      "pairs",
      "tasks",
      "cycles",
      "daily_logs",
      "score_events",
      "punishments",
      "cycle_results",
      "decision_wheel_options",
    ];

    let exactDiskBytes: number | null = null;
    try {
      const { data: diskBytes, error } = await this.client.rpc("get_db_disk_usage");
      if (!error && diskBytes != null) {
        const parsed = Number(diskBytes);
        if (!isNaN(parsed) && parsed > 0) {
          exactDiskBytes = parsed;
        }
      }
    } catch {}

    const tableCounts = await Promise.all(
      tables.map(async (table) => {
        try {
          const pkCol = table === "cycle_results" ? "cycle_id" : "id";
          const { count, error } = await this.client
            .from(table)
            .select(pkCol, { count: "exact", head: true });
          if (!error && typeof count === "number") {
            return count;
          }
        } catch {}
        return 0;
      })
    );

    let totalRows = 0;
    for (const count of tableCounts) {
      totalRows += count;
    }

    const fallbackPayloadBytes = totalRows * 350;
    const actualBytes = exactDiskBytes ?? fallbackPayloadBytes;
    const usedMb = Number((actualBytes / (1024 * 1024)).toFixed(2));

    const quotaInfo = await getSupabaseManagementQuota(usedMb);
    const maxFreeMb = quotaInfo.quotaMb;
    const remainingMb = Number(Math.max(0, maxFreeMb - usedMb).toFixed(2));
    const percentage = Math.min(100, Math.max(0.01, (usedMb / maxFreeMb) * 100));

    const result = {
      rowCount: totalRows,
      approxBytes: actualBytes,
      usedMb,
      maxFreeMb,
      remainingMb,
      percentage: Number(percentage.toFixed(3)),
    };

    this.storageUsageCache = {
      data: result,
      expiresAt: now + 5 * 60 * 1000,
    };

    return result;
  }
}

export const dataStore: AppDataStore = new SupabaseStore();
