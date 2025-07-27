import firestore from '@react-native-firebase/firestore';
import { Habit, HabitEntry } from '../types';

export class FirebaseStorageService {
  private static habitsCollection = firestore().collection('habits');
  private static entriesCollection = firestore().collection('entries');
  private static usersCollection = firestore().collection('users');

  // ===== USER MANAGEMENT =====
  static async createUserDocument(userId: string, userData: { name: string; email: string }): Promise<void> {
    try {
      await this.usersCollection.doc(userId).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // ===== HABITS MANAGEMENT =====
  static async getHabits(userId: string): Promise<Habit[]> {
    try {
      const snapshot = await this.habitsCollection
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          levels: data.levels,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Habit;
      });
    } catch (error) {
      console.error('Error loading habits:', error);
      return [];
    }
  }

  static async saveHabit(userId: string, habit: Habit): Promise<void> {
    try {
      const habitData = {
        userId,
        name: habit.name,
        description: habit.description,
        levels: habit.levels,
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      if (habit.id && habit.id !== Date.now().toString()) {
        // Update existing habit
        await this.habitsCollection.doc(habit.id).update({
          ...habitData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new habit
        await this.habitsCollection.add(habitData);
      }
    } catch (error) {
      console.error('Error saving habit:', error);
      throw error;
    }
  }

  static async deleteHabit(habitId: string): Promise<void> {
    try {
      // Delete habit
      await this.habitsCollection.doc(habitId).delete();
      
      // Delete all entries for this habit
      const entriesSnapshot = await this.entriesCollection
        .where('habitId', '==', habitId)
        .get();
      
      const batch = firestore().batch();
      entriesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }

  // ===== ENTRIES MANAGEMENT =====
  static async getEntries(userId: string): Promise<HabitEntry[]> {
    try {
      const snapshot = await this.entriesCollection
        .where('userId', '==', userId)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          habitId: data.habitId,
          date: data.date,
          levelId: data.levelId,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as HabitEntry;
      });
    } catch (error) {
      console.error('Error loading entries:', error);
      return [];
    }
  }

  static async saveEntry(userId: string, entry: HabitEntry): Promise<void> {
    try {
      const entryData = {
        userId,
        habitId: entry.habitId,
        date: entry.date,
        levelId: entry.levelId,
        timestamp: firestore.FieldValue.serverTimestamp(),
      };

      if (entry.id && entry.id !== Date.now().toString()) {
        // Update existing entry
        await this.entriesCollection.doc(entry.id).update({
          ...entryData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new entry
        await this.entriesCollection.add(entryData);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      throw error;
    }
  }

  static async getEntriesForHabit(userId: string, habitId: string): Promise<HabitEntry[]> {
    try {
      const snapshot = await this.entriesCollection
        .where('userId', '==', userId)
        .where('habitId', '==', habitId)
        .orderBy('date', 'desc')
        .get();

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          habitId: data.habitId,
          date: data.date,
          levelId: data.levelId,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as HabitEntry;
      });
    } catch (error) {
      console.error('Error loading entries for habit:', error);
      return [];
    }
  }

  // ===== REAL-TIME LISTENERS =====
  static subscribeToHabits(userId: string, callback: (habits: Habit[]) => void): () => void {
    return this.habitsCollection
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        (snapshot) => {
          const habits = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              description: data.description,
              levels: data.levels,
              createdAt: data.createdAt?.toDate() || new Date(),
            } as Habit;
          });
          callback(habits);
        },
        (error) => {
          console.error('Error in habits subscription:', error);
        }
      );
  }

  static subscribeToEntries(userId: string, callback: (entries: HabitEntry[]) => void): () => void {
    return this.entriesCollection
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .onSnapshot(
        (snapshot) => {
          const entries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              habitId: data.habitId,
              date: data.date,
              levelId: data.levelId,
              timestamp: data.timestamp?.toDate() || new Date(),
            } as HabitEntry;
          });
          callback(entries);
        },
        (error) => {
          console.error('Error in entries subscription:', error);
        }
      );
  }

  // ===== DATA MIGRATION =====
  static async migrateLocalDataToFirebase(
    userId: string, 
    localHabits: Habit[], 
    localEntries: HabitEntry[]
  ): Promise<void> {
    try {
      const batch = firestore().batch();
      
      // Migrate habits
      const habitIdMap: { [oldId: string]: string } = {};
      
      for (const habit of localHabits) {
        const newHabitRef = this.habitsCollection.doc();
        habitIdMap[habit.id] = newHabitRef.id;
        
        batch.set(newHabitRef, {
          userId,
          name: habit.name,
          description: habit.description,
          levels: habit.levels,
          createdAt: firestore.Timestamp.fromDate(habit.createdAt),
        });
      }
      
      // Migrate entries with updated habit IDs
      for (const entry of localEntries) {
        const newHabitId = habitIdMap[entry.habitId];
        if (newHabitId) {
          const newEntryRef = this.entriesCollection.doc();
          
          batch.set(newEntryRef, {
            userId,
            habitId: newHabitId,
            date: entry.date,
            levelId: entry.levelId,
            timestamp: firestore.Timestamp.fromDate(entry.timestamp),
          });
        }
      }
      
      await batch.commit();
      console.log('Local data migrated to Firebase successfully');
    } catch (error) {
      console.error('Error migrating local data:', error);
      throw error;
    }
  }
}