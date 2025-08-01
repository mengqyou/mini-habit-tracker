import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Habit, HabitEntry } from '../types';

export class FirebaseStorageService {
  private static habitsCollection = firestore().collection('habits');
  private static entriesCollection = firestore().collection('entries');
  private static usersCollection = firestore().collection('users');

  // ===== USER MANAGEMENT =====
  static async createUserDocument(userId: string, userData: { name: string; email: string }): Promise<void> {
    try {
      // Use set with merge to update existing document or create new one
      await this.usersCollection.doc(userId).set({
        ...userData,
        lastLoginAt: new Date(),
      }, { merge: true });
      
      // Set createdAt only if it's a new document
      const userDoc = await this.usersCollection.doc(userId).get();
      if (!userDoc.data()?.createdAt) {
        await this.usersCollection.doc(userId).update({
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  static async updateUserLastLogin(userId: string): Promise<void> {
    try {
      await this.usersCollection.doc(userId).update({
        lastLoginAt: new Date(),
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
      console.log('🔵 [SaveHabit] Starting habit save process...');
      console.log('🔍 [SaveHabit] userId:', userId);
      console.log('🔍 [SaveHabit] habit:', { id: habit.id, name: habit.name });
      
      // First, verify that the user document exists
      console.log('🔵 [SaveHabit] Verifying user document exists...');
      const userDoc = await this.usersCollection.doc(userId).get();
      if (!userDoc.exists) {
        console.error('❌ [SaveHabit] User document does not exist for userId:', userId);
        throw new Error(`User document not found for user ${userId}`);
      }
      console.log('✅ [SaveHabit] User document exists');
      
      const habitData = {
        userId,
        name: habit.name,
        description: habit.description,
        levels: habit.levels,
        createdAt: new Date(),
      };
      console.log('🔍 [SaveHabit] habitData prepared:', habitData);

      // Check if this is a new habit (timestamp-based ID) or existing habit (Firestore document ID)
      const isNewHabit = !habit.id || habit.id.length <= 15; // Timestamp IDs are ~13 chars, Firestore IDs are longer
      console.log('🔍 [SaveHabit] isNewHabit:', isNewHabit, 'habit.id length:', habit.id?.length);
      
      if (!isNewHabit) {
        // Update existing habit (has a real Firestore document ID)
        console.log('🔵 [SaveHabit] Updating existing habit...');
        await this.habitsCollection.doc(habit.id).update({
          ...habitData,
          updatedAt: new Date(),
        });
        console.log('✅ [SaveHabit] Habit updated successfully');
      } else {
        // Create new habit (has timestamp ID or no ID)
        console.log('🔵 [SaveHabit] Creating new habit...');
        const docRef = await this.habitsCollection.add(habitData);
        console.log('✅ [SaveHabit] Habit created successfully with ID:', docRef.id);
      }
    } catch (error) {
      console.error('❌ [SaveHabit] Error saving habit:', error);
      console.error('❌ [SaveHabit] Error code:', error.code);
      console.error('❌ [SaveHabit] Error message:', error.message);
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
        timestamp: new Date(),
      };

      // Use a transaction to ensure atomicity
      await firestore().runTransaction(async (transaction) => {
        // Check if an entry already exists for this habit+date combination
        const existingQuery = await this.entriesCollection
          .where('userId', '==', userId)
          .where('habitId', '==', entry.habitId)
          .where('date', '==', entry.date)
          .get();

        if (!existingQuery.empty) {
          // Update existing entry
          const existingDoc = existingQuery.docs[0];
          transaction.update(existingDoc.ref, {
            ...entryData,
            updatedAt: new Date(),
          });
        } else {
          // Create new entry
          const newDocRef = this.entriesCollection.doc();
          transaction.set(newDocRef, entryData);
        }
      });
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
          createdAt: firestore().timestamp.fromDate(habit.createdAt),
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
            timestamp: firestore().timestamp.fromDate(entry.timestamp),
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