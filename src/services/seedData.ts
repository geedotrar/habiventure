import type { Task, Cycle, Punishment, DecisionOption, Pair } from "@/types/domain";

export const INITIAL_PAIRS: Pair[] = [
  {
    id: 1,
    user_1_id: 2,
    user_2_id: 3,
    active: true,
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    name: "Workout (30 Mins)",
    description: "Daily exercise session (4x per week)",
    base_score: 10,
    active: true,
    frequency: "weekly_custom",
    target_days_per_week: 4,
  },
  {
    id: 2,
    name: "Deep Weekly Review",
    description: "Evaluate progress and milestones (2x weekly: Tue & Fri)",
    base_score: 15,
    active: true,
    frequency: "weekly_2x",
    target_days_per_week: 2,
  },
  {
    id: 3,
    name: "Language Practice",
    description: "Vocabulary, listening, or speaking (Daily)",
    base_score: 10,
    active: true,
    frequency: "daily",
    target_days_per_week: 7,
  },
  {
    id: 4,
    name: "Reading & Skill Upskilling",
    description: "Read books or build new skills (3x per week)",
    base_score: 10,
    active: true,
    frequency: "weekly_custom",
    target_days_per_week: 3,
  },
];

export const INITIAL_CYCLE: Cycle = {
  id: 1,
  name: "October 2026",
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  status: "active",
};

export const INITIAL_PUNISHMENTS: Punishment[] = [
  {
    id: 1,
    name: "Pay $10 Dinner Treat",
    description: "Direct transfer or treat to the winner",
    active: true,
  },
  {
    id: 2,
    name: "Treat Winner to Dinner",
    description: "Full dinner treat of the winner's choice",
    active: true,
  },
  {
    id: 3,
    name: "Treat Coffee (3x)",
    description: "Buy favorite coffee for the winner 3 times",
    active: true,
  },
  {
    id: 4,
    name: "Winner's Restaurant Choice",
    description: "Dine out at the restaurant chosen by the winner",
    active: true,
  },
  {
    id: 5,
    name: "Free Weekend Chores Pass",
    description: "Take care of winner's chores over the weekend",
    active: true,
  },
];

export const INITIAL_DECISION_OPTIONS: DecisionOption[] = [
  { id: 1, name: "Dine Out / Restaurant" },
  { id: 2, name: "Cook Together at Home" },
  { id: 3, name: "Movie Night / Cinema" },
  { id: 4, name: "Cafe & Coffee Chill" },
  { id: 5, name: "Casual Walk / Mall Trip" },
  { id: 6, name: "Your Treat" },
  { id: 7, name: "Partner's Treat" },
  { id: 8, name: "Rock Paper Scissors" },
];

