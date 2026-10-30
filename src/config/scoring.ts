export const SCORING_RULES = {
  PERSONAL_TASK_COMPLETED: 10,
  PERSONAL_TASK_MISSED: 0,
  TEAM_FULLY_ACTIVE_BONUS: 10,
  TEAM_CYCLE_TASK_COMPLETED: 50,
  TEAM_CYCLE_TASK_MISSED: 0,
} as const;

export type ScoringRuleKey = keyof typeof SCORING_RULES;

export const SCORE_REASON_TEMPLATES = {
  taskCompleted: (taskName: string) => `Completed goal: ${taskName}`,
  taskMissed: (taskName: string) => `Missed goal: ${taskName} (0 PTS)`,
  teamBonus: () => "Team synergy bonus (both players completed all shared goals)",
  cycleTaskCompleted: (taskName: string) => `Completed cycle goal: ${taskName} (+50 PTS)`,
  cycleTaskMissed: (taskName: string) => `Missed cycle goal: ${taskName} (0 PTS)`,
} as const;

