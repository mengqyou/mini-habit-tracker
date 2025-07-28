import React, { useState, useEffect } from 'react';
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
import { StorageService } from './src/services/storage';
import { FirebaseAuthService, User } from './src/services/firebaseAuth';
import { FirebaseStorageService } from './src/services/firebaseStorage';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'setup' | 'tracker' | 'summary'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showInactiveHabits, setShowInactiveHabits] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useFirebase, setUseFirebase] = useState(false);
  const [firebaseUnsubscribers, setFirebaseUnsubscribers] = useState<{
    unsubscribeHabits?: () => void;
    unsubscribeEntries?: () => void;
  }>({});

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
      
      // Check if we have any local data to load
      const currentUser = FirebaseAuthService.getCurrentUser();
      console.log('🔍 [InitApp] Current Firebase user:', currentUser);
      
      if (currentUser) {
        setUser(currentUser);
        await loadLocalData();
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
      const unsubscribeHabits = FirebaseStorageService.subscribeToHabits(userId, (loadedHabits) => {
        setHabits(loadedHabits);
        if (loadedHabits.length > 0 && !selectedHabit) {
          setSelectedHabit(loadedHabits[0]);
        }
      });

      const unsubscribeEntries = FirebaseStorageService.subscribeToEntries(userId, (loadedEntries) => {
        setEntries(loadedEntries);
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
      setUseFirebase(false);
      setFirebaseUnsubscribers({});
      setCurrentView('dashboard');
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
      // Optimistically update UI immediately
      setEntries([...entries, entry]);
      
      if (useFirebase && user && !user.isGuest) {
        await FirebaseStorageService.saveEntry(user.id, entry);
        // Firebase real-time listener will sync the actual data
      } else {
        await StorageService.saveEntry(entry);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      // Revert optimistic update on error
      setEntries(entries.filter(e => e.id !== entry.id));
    }
  };

  const handleEntryUpdate = async (entry: HabitEntry) => {
    try {
      // Store original entry for rollback
      const originalEntries = [...entries];
      // Optimistically update UI immediately
      setEntries(entries.map(e => e.id === entry.id ? entry : e));
      
      if (useFirebase && user && !user.isGuest) {
        await FirebaseStorageService.saveEntry(user.id, entry);
        // Firebase real-time listener will sync the actual data
      } else {
        await StorageService.saveEntry(entry);
      }
    } catch (error) {
      console.error('Error updating entry:', error);
      // Revert optimistic update on error
      setEntries(originalEntries);
    }
  };

  const renderContent = () => {
    if (habits.length === 0 && !editingHabit) {
      return <HabitSetup onHabitCreate={handleHabitCreate} />;
    }

    if (currentView === 'setup') {
      return (
        <HabitSetup 
          onHabitCreate={handleHabitCreate} 
          onHabitUpdate={handleHabitUpdate}
          editingHabit={editingHabit}
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
            <TouchableOpacity style={styles.userButton} onPress={handleLogout}>
              <Text style={styles.userButtonText}>
                {user.name} • Logout
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
