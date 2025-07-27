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
import { HabitSummary } from './src/components/HabitSummary';
import { StorageService } from './src/services/storage';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [currentView, setCurrentView] = useState<'setup' | 'tracker' | 'summary'>('tracker');
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const loadedHabits = await StorageService.getHabits();
      const loadedEntries = await StorageService.getEntries();
      setHabits(loadedHabits);
      setEntries(loadedEntries);
      
      if (loadedHabits.length > 0 && !selectedHabit) {
        setSelectedHabit(loadedHabits[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleHabitCreate = async (habit: Habit) => {
    try {
      await StorageService.saveHabit(habit);
      setHabits([...habits, habit]);
      setSelectedHabit(habit);
      setCurrentView('tracker');
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const handleEntryAdd = async (entry: HabitEntry) => {
    try {
      await StorageService.saveEntry(entry);
      setEntries([...entries, entry]);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleEntryUpdate = async (entry: HabitEntry) => {
    try {
      await StorageService.saveEntry(entry);
      setEntries(entries.map(e => e.id === entry.id ? entry : e));
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

    if (currentView === 'summary' && selectedHabit) {
      return (
        <HabitSummary
          habit={selectedHabit}
          entries={entries.filter(e => e.habitId === selectedHabit.id)}
        />
      );
    }

    return (
      <View style={styles.placeholder}>
        <Text>Please select a view</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {habits.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.appTitle}>Mini Habit Tracker</Text>
          <View style={styles.navigation}>
            <TouchableOpacity
              style={[styles.navButton, currentView === 'tracker' && styles.activeNavButton]}
              onPress={() => setCurrentView('tracker')}
            >
              <Text style={[styles.navButtonText, currentView === 'tracker' && styles.activeNavButtonText]}>
                Track
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
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
