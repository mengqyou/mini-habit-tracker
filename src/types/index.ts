export interface HabitLevel {
  id: string;
  name: string;
  description: string;
  value: number;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  levels: HabitLevel[];
  createdAt: Date;
}

export interface HabitEntry {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  levelId: string;
  timestamp: Date;
}

export interface HabitSummary {
  habitId: string;
  totalEntries: number;
  currentStreak: number;
  longestStreak: number;
  weeklyEntries: number;
  monthlyEntries: number;
  yearlyEntries: number;
  levelDistribution: Record<string, number>;
}