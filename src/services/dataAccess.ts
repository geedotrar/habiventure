import type {
  User,
  Task,
  Cycle,
  DailyLog,
  ScoreEvent,
  Punishment,
  CycleStatus,
  CycleResult,
  DecisionOption,
  Pair,
  CycleHistoryPage,
} from "@/types/domain";

export interface AppDataStore {
  getUsers(preloadedPairs?: Pair[]): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  getUserByPin?(pin: string): Promise<User | null>;
  verifyUserCurrentPin?(userId: number, currentPin: string): Promise<boolean>;
  updateUserPin?(userId: number, newPin: string): Promise<void>;
  updateUser?(userId: number, updates: Partial<User> & { newPin?: string; partnerId?: number | null }): Promise<User>;
  createUser?(params: {
    name: string;
    phone?: string;
    gender?: "male" | "female";
    role?: "user" | "superadmin";
    active?: boolean;
    pin: string;
    partnerId?: number | null;
  }): Promise<User>;
  deleteUser?(userId: number): Promise<void>;
  isPinTaken?(pin: string, excludeUserId?: number): Promise<boolean>;

  getPairs?(): Promise<Pair[]>;
  getPairForUser?(userId: number): Promise<Pair | null>;
  setPairForUser?(userId: number, partnerId: number | null): Promise<Pair | null>;

  getTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | null>;
  createTask(task: Task): Promise<Task | void>;
  updateTask?(id: number, updates: Partial<Task>): Promise<Task | null>;
  deleteTask?(id: number): Promise<void>;

  getActiveCycle(): Promise<Cycle | null>;
  getAllCycles?(): Promise<Cycle[]>;
  getCycleById(id: number): Promise<Cycle | null>;
  updateCycleStatus(cycleId: number, status: CycleStatus, winnerUserId?: number | null): Promise<void>;
  createCycle?(cycle: { name: string; start_date: string; end_date: string }): Promise<Cycle>;
  getCycleHistory?(
    page?: number,
    limit?: number,
    options?: { preloadedUsers?: User[]; preloadedPunishments?: Punishment[] }
  ): Promise<CycleHistoryPage>;

  getDailyLogs(date: string, userId?: number): Promise<DailyLog[]>;
  getDailyLog(date: string, userId: number, taskId: number): Promise<DailyLog | null>;
  getRecentLogs(limit?: number, userId?: number, taskId?: number): Promise<DailyLog[]>;
  saveDailyLog(log: DailyLog): Promise<void>;

  getScoreEvents(cycleId: number, userId?: number): Promise<ScoreEvent[]>;
  addScoreEvent(event: ScoreEvent): Promise<void>;
  hasScoreEvent(cycleId: number, userId: number, date: string, type: string): Promise<boolean>;

  getPunishments(): Promise<Punishment[]>;
  savePunishment?(punishment: Punishment): Promise<void>;
  deletePunishment?(id: number): Promise<void>;
  resetPunishments?(): Promise<Punishment[]>;
  getCycleResult?(cycleId: number): Promise<CycleResult | null>;
  saveCycleResult?(result: CycleResult): Promise<void>;

  getDecisionOptions?(): Promise<DecisionOption[]>;
  saveDecisionOption?(option: Partial<DecisionOption> & { name: string }): Promise<DecisionOption>;
  deleteDecisionOption?(id: number): Promise<void>;
  resetDecisionOptions?(): Promise<DecisionOption[]>;

  exportFullBackup(): Promise<Record<string, unknown[]>>;
  importFullBackup(backupData: Record<string, unknown[]>): Promise<{ importedCount: number; skippedCount?: number }>;
  getStorageUsage(): Promise<{
    rowCount: number;
    approxBytes: number;
    percentage: number;
    usedMb?: number;
    maxFreeMb?: number;
    remainingMb?: number;
  }>;
}
