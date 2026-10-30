export interface User {
  id: number;
  name: string;
  pin?: string;
  pin_hash?: string;
  phone?: string;
  gender?: "male" | "female";
  role?: "user" | "superadmin";
  active: boolean;
  partner_id?: number | null;
  partner_name?: string | null;
  created_at?: string;
}

export interface Pair {
  id: number;
  user_1_id: number;
  user_2_id: number;
  active: boolean;
  created_at?: string;
}

export type TaskFrequency = "daily" | "weekly_2x" | "weekly_custom" | "cycle";

export interface Task {
  id: number;
  name: string;
  description: string;
  base_score: number;
  active: boolean;
  frequency?: TaskFrequency;
  target_days_per_week?: number;
  is_personal?: boolean;
  created_by?: number | null;
  created_at?: string;
}

export type CycleStatus = "draft" | "active" | "closed";

export interface Cycle {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  winner_user_id?: number | null;
  created_at?: string;
}

export interface CycleHistoryItem {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  winner_user_id?: number | null;
  winner_name?: string | null;
  winner_gender?: "male" | "female" | null;
  winner_score?: number;
  loser_name?: string | null;
  loser_score?: number;
  score_diff?: number;
  punishment_name?: string | null;
  isTie?: boolean;
}

export interface CycleHistoryPage {
  items: CycleHistoryItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type TaskCompletionStatus = "pending" | "completed" | "missed";

export interface DailyLog {
  id?: number;
  date: string;
  user_id: number;
  task_id: number;
  status: TaskCompletionStatus;
  completed_at?: string | null;
  created_at?: string;
}

export type ScoreEventType =
  | "task_completed"
  | "task_missed"
  | "team_bonus"
  | "custom";

export interface ScoreEvent {
  id?: number;
  cycle_id: number;
  user_id: number;
  date: string;
  type: ScoreEventType;
  points: number;
  reason: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface Punishment {
  id: number;
  name: string;
  description: string;
  active: boolean;
  created_at?: string;
}

export interface CycleResult {
  cycle_id: number;
  winner_user_id: number | null;
  loser_user_id: number | null;
  winner_score: number;
  loser_score: number;
  score_diff: number;
  selected_punishment_id?: number | null;
  closed_at: string;
}

export interface DecisionOption {
  id: number;
  name: string;
  created_at?: string;
}

