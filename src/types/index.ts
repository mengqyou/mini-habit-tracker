export interface HabitLevel {
  id: string;
  name: string;
  description: string;
  value: number;
}

export type HabitStatus = 'active' | 'inactive' | 'built-in';

export interface Habit {
  id: string;
  name: string;
  description: string;
  levels: HabitLevel[];
  createdAt: Date;
  status?: HabitStatus; // Optional for backward compatibility
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

// Date utility functions for proper local timezone handling
export const getLocalDateString = (date?: Date): string => {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTodayString = (): string => {
  return getLocalDateString();
};