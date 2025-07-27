import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Habit, HabitEntry } from '../types';
import { AllHabitsSummary } from './AllHabitsSummary';
import { HabitSummary } from './HabitSummary';

interface SummaryContainerProps {
  habits: Habit[];
  entries: HabitEntry[];
}

export const SummaryContainer: React.FC<SummaryContainerProps> = ({
  habits,
  entries,
}) => {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const handleHabitSelect = (habit: Habit) => {
    setSelectedHabit(habit);
  };

  const handleBackToAll = () => {
    setSelectedHabit(null);
  };

  const getCurrentHabitIndex = () => {
    if (!selectedHabit) return -1;
    return habits.findIndex(h => h.id === selectedHabit.id);
  };

  const handlePreviousHabit = () => {
    const currentIndex = getCurrentHabitIndex();
    if (currentIndex > 0) {
      setSelectedHabit(habits[currentIndex - 1]);
    }
  };

  const handleNextHabit = () => {
    const currentIndex = getCurrentHabitIndex();
    if (currentIndex < habits.length - 1) {
      setSelectedHabit(habits[currentIndex + 1]);
    }
  };

  const currentIndex = getCurrentHabitIndex();
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < habits.length - 1;

  if (!selectedHabit) {
    return (
      <AllHabitsSummary
        habits={habits}
        entries={entries}
        onHabitSelect={handleHabitSelect}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToAll}
        >
          <Text style={styles.backButtonText}>← All Habits</Text>
        </TouchableOpacity>
        
        <View style={styles.habitCounter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} of {habits.length}
          </Text>
        </View>
      </View>

      {/* Navigation Controls */}
      <View style={styles.navigationControls}>
        <TouchableOpacity
          style={[styles.navButton, !hasPrevious && styles.navButtonDisabled]}
          onPress={handlePreviousHabit}
          disabled={!hasPrevious}
        >
          <Text style={[
            styles.navButtonText,
            !hasPrevious && styles.navButtonTextDisabled
          ]}>
            ← Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.habitNameContainer}>
          <Text style={styles.currentHabitName} numberOfLines={1}>
            {selectedHabit.name}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.navButton, !hasNext && styles.navButtonDisabled]}
          onPress={handleNextHabit}
          disabled={!hasNext}
        >
          <Text style={[
            styles.navButtonText,
            !hasNext && styles.navButtonTextDisabled
          ]}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Individual Habit Summary */}
      <View style={styles.summaryContent}>
        <HabitSummary
          habit={selectedHabit}
          entries={entries.filter(e => e.habitId === selectedHabit.id)}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  backButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  habitCounter: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
  },
  counterText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    minWidth: 80,
  },
  navButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  habitNameContainer: {
    flex: 1,
    marginHorizontal: 15,
    alignItems: 'center',
  },
  currentHabitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  summaryContent: {
    flex: 1,
  },
});