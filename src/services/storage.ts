import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, HabitEntry } from '../types';

const HABITS_KEY = 'mini_habit_tracker_habits';
const ENTRIES_KEY = 'mini_habit_tracker_entries';

export class StorageService {
  static async getHabits(): Promise<Habit[]> {
    try {
      const habitsJson = await AsyncStorage.getItem(HABITS_KEY);
      if (habitsJson) {
        const habits = JSON.parse(habitsJson);
        return habits.map((habit: any) => ({
          ...habit,
          createdAt: new Date(habit.createdAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  }

  static async saveHabit(habit: Habit): Promise<void> {
    try {
      const habits = await this.getHabits();
      const existingIndex = habits.findIndex(h => h.id === habit.id);
      
      if (existingIndex >= 0) {
        habits[existingIndex] = habit;
      } else {
        habits.push(habit);
      }
      
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (error) {
      console.error('Error saving habit:', error);
      throw error;
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      const habits = await this.getHabits();
      const filteredHabits = habits.filter(h => h.id !== habitId);
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(filteredHabits));
      
      const entries = await this.getEntries();
      const filteredEntries = entries.filter(e => e.habitId !== habitId);
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  static async getEntries(): Promise<HabitEntry[]> {
    try {
      const entriesJson = await AsyncStorage.getItem(ENTRIES_KEY);
      if (entriesJson) {
        const entries = JSON.parse(entriesJson);
        return entries.map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading entries:', error);
      return [];
    }
  }

  static async saveEntry(entry: HabitEntry): Promise<void> {
    try {
      const entries = await this.getEntries();
      const existingIndex = entries.findIndex(e => e.id === entry.id);
      
      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      
      await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  }

  static async getEntriesForHabit(habitId: string): Promise<HabitEntry[]> {
    try {
      const entries = await this.getEntries();
      return entries.filter(entry => entry.habitId === habitId);
    } catch (error) {
      console.error('Error loading entries for habit:', error);
      return [];
    }
  }
}