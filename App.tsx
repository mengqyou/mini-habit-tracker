import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Habit, HabitEntry } from './src/types';
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'setup' | 'tracker' | 'summary'>('dashboard');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
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
      await FirebaseAuthService.initialize();
      
      // Set up Firebase auth state listener
      const unsubscribe = FirebaseAuthService.onAuthStateChanged(async (firebaseUser) => {
        // Clean up previous Firebase listeners
        if (firebaseUnsubscribers.unsubscribeHabits) {
          firebaseUnsubscribers.unsubscribeHabits();
        }
        if (firebaseUnsubscribers.unsubscribeEntries) {
          firebaseUnsubscribers.unsubscribeEntries();
        }

        if (firebaseUser && !firebaseUser.isGuest) {
          setUser(firebaseUser);
          setUseFirebase(true);
          const unsubscribers = await loadFirebaseData(firebaseUser.id);
          if (unsubscribers) {
            setFirebaseUnsubscribers(unsubscribers);
          }
        } else {
          const currentUser = FirebaseAuthService.getCurrentUser();
          setUser(currentUser);
          if (currentUser) {
            await loadLocalData();
          }
          setFirebaseUnsubscribers({});
        }
        setIsLoading(false);
      });

      // Store unsubscribe function for cleanup
      return unsubscribe;
    } catch (error) {
      console.error('Error initializing app:', error);
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
    setUser(loggedInUser);
    
    if (!loggedInUser.isGuest) {
      setUseFirebase(true);
      
      // Check if we need to migrate local data
      const localHabits = await StorageService.getHabits();
      const localEntries = await StorageService.getEntries();
      
      if (localHabits.length > 0) {
        try {
          await FirebaseStorageService.migrateLocalDataToFirebase(
            loggedInUser.id, 
            localHabits, 
            localEntries
          );
          
          // Clear local storage after successful migration
          // await StorageService.clearAllData(); // We'll implement this
          console.log('Local data migrated to Firebase');
        } catch (error) {
          console.error('Migration failed:', error);
        }
      }
      
      const unsubscribers = await loadFirebaseData(loggedInUser.id);
      if (unsubscribers) {
        setFirebaseUnsubscribers(unsubscribers);
      }
    } else {
      setUseFirebase(false);
      await loadLocalData();
    }
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
      if (useFirebase && user && !user.isGuest) {
        await FirebaseStorageService.saveHabit(user.id, habit);
        // Firebase real-time listener will automatically update the state
      } else {
        await StorageService.saveHabit(habit);
        setHabits([...habits, habit]);
      }
      setSelectedHabit(habit);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleEntryAdd = async (entry: HabitEntry) => {
    try {
      if (useFirebase && user && !user.isGuest) {
        await FirebaseStorageService.saveEntry(user.id, entry);
        // Firebase real-time listener will automatically update the state
      } else {
        await StorageService.saveEntry(entry);
        setEntries([...entries, entry]);
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleEntryUpdate = async (entry: HabitEntry) => {
    try {
      if (useFirebase && user && !user.isGuest) {
        await FirebaseStorageService.saveEntry(user.id, entry);
        // Firebase real-time listener will automatically update the state
      } else {
        await StorageService.saveEntry(entry);
        setEntries(entries.map(e => e.id === entry.id ? entry : e));
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const renderContent = () => {
    if (habits.length === 0) {
      return <HabitSetup onHabitCreate={handleHabitCreate} />;
    }

    if (currentView === 'setup') {
      return <HabitSetup onHabitCreate={handleHabitCreate} />;
    }

    if (currentView === 'dashboard') {
      return (
        <HabitDashboard
          habits={habits}
          entries={entries}
          onEntryAdd={handleEntryAdd}
          onEntryUpdate={handleEntryUpdate}
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
        <View style={styles.header}>
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
              onPress={() => setCurrentView('dashboard')}
            >
              <Text style={[styles.navButtonText, currentView === 'dashboard' && styles.activeNavButtonText]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'summary' && styles.activeNavButton]}
              onPress={() => setCurrentView('summary')}
            >
              <Text style={[styles.navButtonText, currentView === 'summary' && styles.activeNavButtonText]}>
                Summary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'setup' && styles.activeNavButton]}
              onPress={() => setCurrentView('setup')}
            >
              <Text style={[styles.navButtonText, currentView === 'setup' && styles.activeNavButtonText]}>
                + New
              </Text>
            </TouchableOpacity>
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
