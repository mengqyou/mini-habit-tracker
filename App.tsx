import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Habit, HabitEntry, HabitStatus } from './src/types';
import { HabitSetup } from './src/components/HabitSetup';
import { HabitTracker } from './src/components/HabitTracker';
import { HabitDashboard } from './src/components/HabitDashboard';
import { SummaryContainer } from './src/components/SummaryContainer';
import { LoginScreen } from './src/components/LoginScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { StorageService } from './src/services/storage';
import { FirebaseAuthService, User } from './src/services/firebaseAuth';
import { FirebaseStorageService } from './src/services/firebaseStorage';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'setup' | 'tracker' | 'summary' | 'settings'>('setup');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showInactiveHabits, setShowInactiveHabits] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [habitsLoading, setHabitsLoading] = useState(false);
  const [useFirebase, setUseFirebase] = useState(false);
  const [firebaseUnsubscribers, setFirebaseUnsubscribers] = useState<{
    unsubscribeHabits?: () => void;
    unsubscribeEntries?: () => void;
  }>({});
  // Track optimistic updates to prevent Firebase listeners from overwriting them
  const [optimisticEntries, setOptimisticEntries] = useState<HabitEntry[]>([]);
  const optimisticEntriesRef = useRef<HabitEntry[]>([]);

  useEffect(() => {
    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initializeApp = async () => {
    try {
      console.log('🔵 [InitApp] Initializing app...');
      await FirebaseAuthService.initialize();
      
      // Since we bypassed Firebase Auth for Google Sign-In, the auth state listener
      // won't work properly. We'll handle user state manually.
      console.log('🔵 [InitApp] Firebase initialized, checking for existing user...');
      
      // Check if we have any stored user data
      const currentUser = await FirebaseAuthService.getCurrentUser();
      console.log('🔍 [InitApp] Current user:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.isGuest) {
          await loadLocalData();
        } else {
          // For authenticated users, set up Firebase listeners
          setUseFirebase(true);
          const unsubscribers = await loadFirebaseData(currentUser.id);
          if (unsubscribers) {
            setFirebaseUnsubscribers(unsubscribers);
          }
        }
      } else {
        // No authenticated user found, check if there are local habits
        console.log('🔵 [InitApp] No authenticated user, checking for local habits...');
        const localHabits = await StorageService.getHabits();
        console.log('🔍 [InitApp] Found local habits:', localHabits.length);
        
        if (localHabits.length > 0) {
          // Auto-login as guest if local habits exist
          console.log('🔵 [InitApp] Auto-logging in as guest with existing habits');
          const guestUser = FirebaseAuthService.createGuestUser();
          setUser(guestUser);
          await loadLocalData();
        }
        // If no local habits, user will see login screen
      }
      
      console.log('✅ [InitApp] App initialization completed');
      setIsLoading(false);
    } catch (error) {
      console.error('❌ [InitApp] Error initializing app:', error);
      setIsLoading(false);
    }
  };

  const loadLocalData = async () => {
    try {
      const loadedHabits = await StorageService.getHabits();
      const loadedEntries = await StorageService.getEntries();
      setHabits(loadedHabits);
      setEntries(loadedEntries);
      
      if (loadedHabits.length > 0 && !selectedHabit) {
        setSelectedHabit(loadedHabits[0]);
      }
    } catch (error) {
      console.error('Error loading local data:', error);
    }
  };

  const loadFirebaseData = async (userId: string) => {
    try {
      // Set up real-time listeners for habits and entries
      setHabitsLoading(true);
      const unsubscribeHabits = FirebaseStorageService.subscribeToHabits(userId, (loadedHabits) => {
        console.log('🔵 [Firebase] Habits listener fired, count:', loadedHabits.length);
        setHabits(loadedHabits);
        // Clear loading state immediately after setting habits
        setHabitsLoading(false);
        console.log('🔵 [Firebase] Set habitsLoading to false');
        if (loadedHabits.length > 0 && !selectedHabit) {
          setSelectedHabit(loadedHabits[0]);
        }
        
        // If habits are loaded and we're on setup screen but not editing, go to dashboard
        if (loadedHabits.length > 0) {
          setCurrentView(currentView => {
            console.log('🔵 [Firebase] Current view is:', currentView, 'editingHabit:', editingHabit);
            if (currentView === 'setup' && !editingHabit) {
              console.log('🔵 [Firebase] Switching from setup to dashboard because habits were loaded');
              return 'dashboard';
            }
            return currentView;
          });
        }
      });

      const unsubscribeEntries = FirebaseStorageService.subscribeToEntries(userId, (loadedEntries) => {
        // Add a longer delay for first-time listener calls to allow Firebase transactions to complete
        setTimeout(() => {
          // Merge loaded entries with optimistic entries, prioritizing Firebase data when available
          const currentOptimistic = optimisticEntriesRef.current;
          const mergedEntries = [...loadedEntries];
          
          // Add optimistic entries that aren't in Firebase yet
          currentOptimistic.forEach(optimisticEntry => {
            const existsInFirebase = loadedEntries.some(e => 
              e.habitId === optimisticEntry.habitId && 
              e.date === optimisticEntry.date
            );
            
            if (!existsInFirebase) {
              mergedEntries.push(optimisticEntry);
            }
          });
          
          setEntries(mergedEntries);
          
          // Clean up optimistic entries that are now in Firebase
          // But be VERY conservative - keep recent entries longer
          const remainingOptimistic = currentOptimistic.filter(optimisticEntry => {
            const existsInFirebase = loadedEntries.some(e => 
              e.habitId === optimisticEntry.habitId && 
              e.date === optimisticEntry.date
            );
            
            // Always keep very recent entries (< 15 seconds) regardless of Firebase state
            // This prevents premature cleanup during Firebase sync delays
            const isVeryRecent = new Date().getTime() - optimisticEntry.timestamp.getTime() < 15000; // 15 seconds
            
            // Keep if: doesn't exist in Firebase OR is very recent
            return !existsInFirebase || isVeryRecent;
          });
          
          optimisticEntriesRef.current = remainingOptimistic;
          setOptimisticEntries(remainingOptimistic);
        }, 1000); // Longer delay for first-click reliability
      });

      // Store cleanup functions
      return { unsubscribeHabits, unsubscribeEntries };
    } catch (error) {
      console.error('Error setting up Firebase listeners:', error);
      return null;
    }
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
    console.log('🔵 [LoginSuccess] Starting login success handler...');
    console.log('🔍 [LoginSuccess] loggedInUser:', { id: loggedInUser.id, name: loggedInUser.name, isGuest: loggedInUser.isGuest });
    
    setUser(loggedInUser);
    
    if (!loggedInUser.isGuest) {
      console.log('🔵 [LoginSuccess] Setting up Firebase for non-guest user...');
      setUseFirebase(true);
      
      // Create user document in Firebase if it doesn't exist
      try {
        console.log('🔵 [LoginSuccess] Creating/updating user document in Firebase...');
        await FirebaseStorageService.createUserDocument(loggedInUser.id, {
          name: loggedInUser.name,
          email: loggedInUser.email
        });
        console.log('✅ [LoginSuccess] User document created/updated');
      } catch (error) {
        console.error('❌ [LoginSuccess] Failed to create user document:', error);
      }
      
      // Check if we need to migrate local data
      const localHabits = await StorageService.getHabits();
      const localEntries = await StorageService.getEntries();
      console.log('🔍 [LoginSuccess] Local data check - habits:', localHabits.length, 'entries:', localEntries.length);
      
      if (localHabits.length > 0) {
        try {
          console.log('🔵 [LoginSuccess] Migrating local data to Firebase...');
          await FirebaseStorageService.migrateLocalDataToFirebase(
            loggedInUser.id, 
            localHabits, 
            localEntries
          );
          
          // Clear local storage after successful migration
          // await StorageService.clearAllData(); // We'll implement this
          console.log('✅ [LoginSuccess] Local data migrated to Firebase');
        } catch (error) {
          console.error('❌ [LoginSuccess] Migration failed:', error);
        }
      }
      
      console.log('🔵 [LoginSuccess] Loading Firebase data...');
      const unsubscribers = await loadFirebaseData(loggedInUser.id);
      if (unsubscribers) {
        setFirebaseUnsubscribers(unsubscribers);
        console.log('✅ [LoginSuccess] Firebase listeners set up');
      }
    } else {
      console.log('🔵 [LoginSuccess] Setting up local storage for guest user...');
      setUseFirebase(false);
      await loadLocalData();
    }
    console.log('✅ [LoginSuccess] Login success handler completed');
  };

  const handleLogout = async () => {
    try {
      // Clean up Firebase listeners
      if (firebaseUnsubscribers.unsubscribeHabits) {
        firebaseUnsubscribers.unsubscribeHabits();
      }
      if (firebaseUnsubscribers.unsubscribeEntries) {
        firebaseUnsubscribers.unsubscribeEntries();
      }
      
      await FirebaseAuthService.signOut();
      setUser(null);
      setHabits([]);
      setEntries([]);
      setSelectedHabit(null);
      setEditingHabit(null);
      setOptimisticEntries([]);
      optimisticEntriesRef.current = [];
      setUseFirebase(false);
      setFirebaseUnsubscribers({});
      setCurrentView('dashboard');
      console.log('✅ [Logout] User logged out and app state cleared');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleHabitCreate = async (habit: Habit) => {
    try {
      console.log('🔵 [HabitCreate] Starting habit creation...');
      console.log('🔍 [HabitCreate] useFirebase:', useFirebase);
      console.log('🔍 [HabitCreate] user:', user ? { id: user.id, name: user.name, isGuest: user.isGuest } : null);
      console.log('🔍 [HabitCreate] habit:', { id: habit.id, name: habit.name });
      
      if (useFirebase && user && !user.isGuest) {
        console.log('🔵 [HabitCreate] Using Firebase storage...');
        await FirebaseStorageService.saveHabit(user.id, habit);
        console.log('✅ [HabitCreate] Habit saved to Firebase');
        // Firebase real-time listener will automatically update the state
      } else {
        console.log('🔵 [HabitCreate] Using local storage...');
        await StorageService.saveHabit(habit);
        setHabits([...habits, habit]);
        console.log('✅ [HabitCreate] Habit saved to local storage');
      }
      setSelectedHabit(habit);
      setEditingHabit(null);
      setCurrentView('dashboard');
      console.log('✅ [HabitCreate] Habit creation completed');
    } catch (error) {
      console.error('❌ [HabitCreate] Error creating habit:', error);
      Alert.alert('Error', `Failed to create habit: ${error}`);
    }
  };

  const handleHabitUpdate = async (habit: Habit) => {
    try {
      console.log('🔵 [HabitUpdate] Starting habit update...');
      console.log('🔍 [HabitUpdate] useFirebase:', useFirebase);
      console.log('🔍 [HabitUpdate] habit:', { id: habit.id, name: habit.name });
      
      if (useFirebase && user && !user.isGuest) {
        console.log('🔵 [HabitUpdate] Using Firebase storage...');
        await FirebaseStorageService.saveHabit(user.id, habit);
        console.log('✅ [HabitUpdate] Habit updated in Firebase');
        // Firebase real-time listener will automatically update the state
      } else {
        console.log('🔵 [HabitUpdate] Using local storage...');
        await StorageService.saveHabit(habit);
        setHabits(habits.map(h => h.id === habit.id ? habit : h));
        console.log('✅ [HabitUpdate] Habit updated in local storage');
      }
      setEditingHabit(null);
      setCurrentView('dashboard');
      console.log('✅ [HabitUpdate] Habit update completed');
    } catch (error) {
      console.error('❌ [HabitUpdate] Error updating habit:', error);
      Alert.alert('Error', `Failed to update habit: ${error}`);
    }
  };

  const handleHabitEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setCurrentView('setup');
  };

  const handleHabitDelete = async (habit: Habit) => {
    try {
      console.log('🔵 [HabitDelete] Starting habit deletion...');
      console.log('🔍 [HabitDelete] useFirebase:', useFirebase);
      console.log('🔍 [HabitDelete] habit:', { id: habit.id, name: habit.name });
      
      if (useFirebase && user && !user.isGuest) {
        console.log('🔵 [HabitDelete] Using Firebase storage...');
        await FirebaseStorageService.deleteHabit(habit.id);
        console.log('✅ [HabitDelete] Habit deleted from Firebase');
        // Firebase real-time listener will automatically update the state
      } else {
        console.log('🔵 [HabitDelete] Using local storage...');
        await StorageService.deleteHabit(habit.id);
        setHabits(habits.filter(h => h.id !== habit.id));
        setEntries(entries.filter(e => e.habitId !== habit.id));
        console.log('✅ [HabitDelete] Habit deleted from local storage');
      }
      
      // Clear selected habit if it was the deleted one
      if (selectedHabit?.id === habit.id) {
        setSelectedHabit(null);
      }
      
      console.log('✅ [HabitDelete] Habit deletion completed');
    } catch (error) {
      console.error('❌ [HabitDelete] Error deleting habit:', error);
      Alert.alert('Error', `Failed to delete habit: ${error}`);
    }
  };

  const handleHabitStatusChange = async (habit: Habit, newStatus: HabitStatus) => {
    try {
      console.log('🔵 [HabitStatusChange] Starting habit status change...');
      console.log('🔍 [HabitStatusChange] habit:', { id: habit.id, name: habit.name });
      console.log('🔍 [HabitStatusChange] newStatus:', newStatus);
      
      const updatedHabit = { ...habit, status: newStatus };
      
      if (useFirebase && user && !user.isGuest) {
        console.log('🔵 [HabitStatusChange] Using Firebase storage...');
        await FirebaseStorageService.saveHabit(user.id, updatedHabit);
        console.log('✅ [HabitStatusChange] Habit status updated in Firebase');
        // Firebase real-time listener will automatically update the state
      } else {
        console.log('🔵 [HabitStatusChange] Using local storage...');
        await StorageService.saveHabit(updatedHabit);
        setHabits(habits.map(h => h.id === habit.id ? updatedHabit : h));
        console.log('✅ [HabitStatusChange] Habit status updated in local storage');
      }
      
      console.log('✅ [HabitStatusChange] Habit status change completed');
    } catch (error) {
      console.error('❌ [HabitStatusChange] Error changing habit status:', error);
      Alert.alert('Error', `Failed to change habit status: ${error}`);
    }
  };

  const handleEntryAdd = async (entry: HabitEntry) => {
    try {
      if (useFirebase && user && !user.isGuest) {
        // Add to optimistic entries for immediate UI feedback
        const newOptimistic = [...optimisticEntriesRef.current, entry];
        optimisticEntriesRef.current = newOptimistic;
        setOptimisticEntries(newOptimistic);
        
        // Update entries immediately
        setEntries(prev => [...prev, entry]);
        
        // Add a small delay before Firebase save to ensure optimistic entry is fully registered
        // This helps prevent the race condition where Firebase listener clears the entry
        // before it has a chance to properly display
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // Save to Firebase (listener will handle final sync)
        await FirebaseStorageService.saveEntry(user.id, entry);
      } else {
        // Local storage - immediate update
        setEntries([...entries, entry]);
        await StorageService.saveEntry(entry);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      
      if (useFirebase && user && !user.isGuest) {
        // Revert optimistic update on error
        const revertedOptimistic = optimisticEntriesRef.current.filter(e => e.id !== entry.id);
        optimisticEntriesRef.current = revertedOptimistic;
        setOptimisticEntries(revertedOptimistic);
      }
      
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    }
  };

  const handleEntryUpdate = async (entry: HabitEntry) => {
    try {
      if (useFirebase && user && !user.isGuest) {
        // Update optimistic entries
        const updatedOptimistic = optimisticEntriesRef.current.map(e => e.id === entry.id ? entry : e);
        const entryExists = optimisticEntriesRef.current.some(e => e.id === entry.id);
        
        if (!entryExists) {
          // Add to optimistic if not already there
          updatedOptimistic.push(entry);
        }
        
        optimisticEntriesRef.current = updatedOptimistic;
        setOptimisticEntries(updatedOptimistic);
        
        // Update entries immediately
        setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
        
        // Save to Firebase (listener will handle final sync)
        await FirebaseStorageService.saveEntry(user.id, entry);
      } else {
        // Local storage - immediate update
        setEntries(entries.map(e => e.id === entry.id ? entry : e));
        await StorageService.saveEntry(entry);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      
      if (useFirebase && user && !user.isGuest) {
        // Revert optimistic update on error
        const revertedOptimistic = optimisticEntriesRef.current.filter(e => e.id !== entry.id);
        optimisticEntriesRef.current = revertedOptimistic;
        setOptimisticEntries(revertedOptimistic);
      }
      
      // Revert the main entries state (this is complex, for now just trigger a reload)
      if (useFirebase && user && !user.isGuest) {
        // Firebase listener will reload the correct data
      } else {
        // For local storage, we'd need to reload from storage
        setEntries(prev => prev.filter(e => e.id !== entry.id));
      }
    }
  };

  const handleEntryDelete = async (entry: HabitEntry) => {
    try {
      console.log('🔵 [EntryDelete] Starting entry deletion...');
      console.log('🔍 [EntryDelete] entry:', { id: entry.id, habitId: entry.habitId, date: entry.date });
      
      if (useFirebase && user && !user.isGuest) {
        console.log('🔵 [EntryDelete] Using Firebase storage...');
        
        // Remove from optimistic entries
        const filteredOptimistic = optimisticEntriesRef.current.filter(e => e.id !== entry.id);
        optimisticEntriesRef.current = filteredOptimistic;
        setOptimisticEntries(filteredOptimistic);
        
        // Update entries immediately
        setEntries(prev => prev.filter(e => e.id !== entry.id));
        
        // Delete from Firebase
        await FirebaseStorageService.deleteEntry(entry.id);
        console.log('✅ [EntryDelete] Entry deleted from Firebase');
      } else {
        console.log('🔵 [EntryDelete] Using local storage...');
        // Local storage - immediate update
        setEntries(entries.filter(e => e.id !== entry.id));
        await StorageService.deleteEntry(entry.id);
        console.log('✅ [EntryDelete] Entry deleted from local storage');
      }
      
      console.log('✅ [EntryDelete] Entry deletion completed');
    } catch (error) {
      console.error('❌ [EntryDelete] Error deleting entry:', error);
      
      if (useFirebase && user && !user.isGuest) {
        // Revert optimistic update on error
        const revertedOptimistic = [...optimisticEntriesRef.current, entry];
        optimisticEntriesRef.current = revertedOptimistic;
        setOptimisticEntries(revertedOptimistic);
      }
      
      // Revert the main entries state
      setEntries(prev => [...prev, entry]);
      Alert.alert('Error', `Failed to delete entry: ${error}`);
    }
  };

  const renderContent = () => {
    console.log('🔵 [renderContent] habitsLoading:', habitsLoading, 'habits.length:', habits.length, 'editingHabit:', editingHabit, 'currentView:', currentView);
    
    if (habitsLoading) {
      console.log('🔵 [renderContent] Showing loading screen');
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your habits...</Text>
        </View>
      );
    }

    if (habits.length === 0 && !editingHabit) {
      console.log('🔵 [renderContent] Showing HabitSetup because habits.length === 0');
      return <HabitSetup onHabitCreate={handleHabitCreate} existingHabits={habits} />;
    }

    if (habits.length > 0 && currentView === 'dashboard') {
      console.log('🔵 [renderContent] Should show HabitDashboard - habits:', habits.length, 'currentView:', currentView);
    }

    if (currentView === 'setup') {
      return (
        <HabitSetup 
          onHabitCreate={handleHabitCreate} 
          onHabitUpdate={handleHabitUpdate}
          editingHabit={editingHabit}
          existingHabits={habits}
        />
      );
    }

    if (currentView === 'dashboard') {
      return (
        <HabitDashboard
          habits={habits}
          entries={entries}
          onEntryAdd={handleEntryAdd}
          onEntryUpdate={handleEntryUpdate}
          onEntryDelete={handleEntryDelete}
          onHabitEdit={handleHabitEdit}
          onHabitDelete={handleHabitDelete}
          onHabitStatusChange={handleHabitStatusChange}
          showInactiveHabits={showInactiveHabits}
        />
      );
    }

    if (currentView === 'tracker' && selectedHabit) {
      return (
        <HabitTracker
          habit={selectedHabit}
          entries={entries}
          onEntryAdd={handleEntryAdd}
          onEntryUpdate={handleEntryUpdate}
        />
      );
    }

    if (currentView === 'summary') {
      return (
        <SummaryContainer
          habits={habits}
          entries={entries}
        />
      );
    }

    if (currentView === 'settings') {
      return (
        <SettingsScreen
          user={user}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <View style={styles.placeholder}>
        <Text>Please select a view</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {habits.length > 0 && (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <Text style={styles.appTitle}>Mini Habit Tracker</Text>
            <TouchableOpacity style={styles.userButton} onPress={user.isGuest ? () => setUser(null) : handleLogout}>
              <Text style={styles.userButtonText}>
                {user.isGuest ? 'Sign In' : `${user.name} • Logout`}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'dashboard' && styles.activeNavButton]}
              onPress={() => {
                setEditingHabit(null);
                setCurrentView('dashboard');
              }}
            >
              <Text style={[styles.navButtonText, currentView === 'dashboard' && styles.activeNavButtonText]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'summary' && styles.activeNavButton]}
              onPress={() => {
                setEditingHabit(null);
                setCurrentView('summary');
              }}
            >
              <Text style={[styles.navButtonText, currentView === 'summary' && styles.activeNavButtonText]}>
                Summary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'setup' && styles.activeNavButton]}
              onPress={() => {
                setEditingHabit(null);
                setCurrentView('setup');
              }}
            >
              <Text style={[styles.navButtonText, currentView === 'setup' && styles.activeNavButtonText]}>
                + New
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'settings' && styles.activeNavButton]}
              onPress={() => {
                setEditingHabit(null);
                setCurrentView('settings');
              }}
            >
              <Text style={[styles.navButtonText, currentView === 'settings' && styles.activeNavButtonText]}>
                Settings
              </Text>
            </TouchableOpacity>
            {currentView === 'dashboard' && (
              <TouchableOpacity
                style={[styles.navButton, showInactiveHabits && styles.activeNavButton]}
                onPress={() => setShowInactiveHabits(!showInactiveHabits)}
              >
                <Text style={[styles.navButtonText, showInactiveHabits && styles.activeNavButtonText]}>
                  {showInactiveHabits ? 'Active' : 'All Habits'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userButton: {
    padding: 5,
  },
  userButtonText: {
    fontSize: 12,
    color: '#666',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activeNavButton: {
    backgroundColor: '#007AFF',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeNavButtonText: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
