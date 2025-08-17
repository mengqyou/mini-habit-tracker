import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Habit, HabitEntry, getTodayString } from '../types';

interface HabitTrackerProps {
  habit: Habit;
  entries: HabitEntry[];
  onEntryAdd: (entry: HabitEntry) => void;
  onEntryUpdate: (entry: HabitEntry) => void;
}

export const HabitTracker: React.FC<HabitTrackerProps> = ({
  habit,
  entries,
  onEntryAdd,
  onEntryUpdate,
}) => {
  const today = getTodayString();
  const [todayEntry, setTodayEntry] = useState<HabitEntry | null>(null);

  useEffect(() => {
    const entry = entries.find(e => e.date === today && e.habitId === habit.id);
    setTodayEntry(entry || null);
  }, [entries, today, habit.id]);

  const getLevelColor = (levelIndex: number) => {
    const colors = [
      '#4CAF50', // Level 1: Green
      '#F44336', // Level 2: Red
      '#9C27B0', // Level 3: Purple
    ];
    return colors[levelIndex] || '#007AFF';
  };

  const handleLevelSelect = (levelId: string) => {
    const level = habit.levels.find(l => l.id === levelId);
    if (!level) return;

    if (todayEntry) {
      const updatedEntry: HabitEntry = {
        ...todayEntry,
        levelId,
        timestamp: new Date(),
      };
      setTodayEntry(updatedEntry);
      onEntryUpdate(updatedEntry);
    } else {
      const newEntry: HabitEntry = {
        id: Date.now().toString(),
        habitId: habit.id,
        date: today,
        levelId,
        timestamp: new Date(),
      };
      setTodayEntry(newEntry);
      onEntryAdd(newEntry);
    }

    Alert.alert(
      'Great!',
      `You completed: ${level.name} - ${level.description}`,
      [{ text: 'OK' }]
    );
  };

  const getSelectedLevelName = () => {
    if (!todayEntry) return null;
    const level = habit.levels.find(l => l.id === todayEntry.levelId);
    return level?.name;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.habitName}>{habit.name}</Text>
      {habit.description ? (
        <Text style={styles.habitDescription}>{habit.description}</Text>
      ) : null}
      
      <Text style={styles.todayLabel}>Today's Progress</Text>
      
      {todayEntry ? (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            ✅ Completed: {getSelectedLevelName()}
          </Text>
          <Text style={styles.changeText}>Tap another level to change:</Text>
        </View>
      ) : (
        <Text style={styles.notCompletedText}>Not completed today</Text>
      )}

      <View style={styles.levelsContainer}>
        {habit.levels.map((level, index) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelButton,
              todayEntry?.levelId === level.id && {
                backgroundColor: getLevelColor(index),
                borderColor: getLevelColor(index),
              },
            ]}
            onPress={() => handleLevelSelect(level.id)}
          >
            <Text style={[
              styles.levelButtonText,
              todayEntry?.levelId === level.id && styles.selectedLevelButtonText,
            ]}>
              {level.name}
            </Text>
            <Text style={[
              styles.levelDescription,
              todayEntry?.levelId === level.id && styles.selectedLevelDescription,
            ]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  habitDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  todayLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  completedContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  changeText: {
    fontSize: 14,
    color: '#666',
  },
  notCompletedText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  levelsContainer: {
    gap: 12,
  },
  levelButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedLevelButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  levelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedLevelButtonText: {
    color: 'white',
  },
  levelDescription: {
    fontSize: 14,
    color: '#666',
  },
  selectedLevelDescription: {
    color: '#E3F2FD',
  },
});