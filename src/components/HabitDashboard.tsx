import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Habit, HabitEntry } from '../types';

interface HabitDashboardProps {
  habits: Habit[];
  entries: HabitEntry[];
  onEntryAdd: (entry: HabitEntry) => void;
  onEntryUpdate: (entry: HabitEntry) => void;
}

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  entries,
  onEntryAdd,
  onEntryUpdate,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const todayEntries = useMemo(() => {
    return entries.filter(entry => entry.date === today);
  }, [entries, today]);

  const getTodayEntryForHabit = (habitId: string) => {
    return todayEntries.find(entry => entry.habitId === habitId);
  };

  const handleLevelSelect = (habit: Habit, levelId: string) => {
    const level = habit.levels.find(l => l.id === levelId);
    if (!level) return;

    const existingEntry = getTodayEntryForHabit(habit.id);

    if (existingEntry) {
      const updatedEntry: HabitEntry = {
        ...existingEntry,
        levelId,
        timestamp: new Date(),
      };
      onEntryUpdate(updatedEntry);
    } else {
      const newEntry: HabitEntry = {
        id: Date.now().toString(),
        habitId: habit.id,
        date: today,
        levelId,
        timestamp: new Date(),
      };
      onEntryAdd(newEntry);
    }

    Alert.alert(
      'Great!',
      `${habit.name}: ${level.name} - ${level.description}`,
      [{ text: 'OK' }]
    );
  };

  const getCompletionStatus = (habit: Habit) => {
    const entry = getTodayEntryForHabit(habit.id);
    if (!entry) return null;
    
    const level = habit.levels.find(l => l.id === entry.levelId);
    return level;
  };

  const getLevelColor = (levelIndex: number) => {
    const colors = [
      '#4CAF50', // Level 1: Green
      '#F44336', // Level 2: Red
      '#9C27B0', // Level 3: Purple
    ];
    return colors[levelIndex] || '#007AFF';
  };

  const getStreakCount = (habit: Habit) => {
    const habitEntries = entries
      .filter(e => e.habitId === habit.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = habitEntries.some(e => e.date === dateStr);
      
      if (hasEntry) {
        if (dateStr === today || streak > 0) {
          streak++;
        }
      } else {
        if (dateStr === today) {
          break;
        } else if (streak > 0) {
          break;
        }
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };

  if (habits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Habits Yet</Text>
        <Text style={styles.emptyText}>
          Tap "+ New" to create your first habit and start tracking!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{todayFormatted}</Text>
        <Text style={styles.subtitle}>Track your daily habits</Text>
      </View>

      <View style={styles.habitsContainer}>
        {habits.map((habit) => {
          const completedLevel = getCompletionStatus(habit);
          const streak = getStreakCount(habit);
          const completedLevelIndex = completedLevel ? habit.levels.findIndex(l => l.id === completedLevel.id) : -1;
          
          return (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <View style={styles.streakContainer}>
                    <Text style={styles.streakText}>
                      🔥 {streak} day{streak !== 1 ? 's' : ''} streak
                    </Text>
                  </View>
                </View>
                
                {completedLevel && (
                  <View style={[
                    styles.completedBadge,
                    { backgroundColor: getLevelColor(completedLevelIndex) }
                  ]}>
                    <Text style={styles.completedBadgeText}>
                      ✅ {completedLevel.name}
                    </Text>
                  </View>
                )}
              </View>

              {habit.description && (
                <Text style={styles.habitDescription}>{habit.description}</Text>
              )}

              <View style={styles.levelsContainer}>
                {habit.levels.map((level, index) => {
                  const isSelected = completedLevel?.id === level.id;
                  
                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.levelButton,
                        isSelected && {
                          backgroundColor: getLevelColor(index),
                          borderColor: getLevelColor(index),
                        },
                      ]}
                      onPress={() => handleLevelSelect(habit, level.id)}
                    >
                      <Text style={[
                        styles.levelButtonText,
                        isSelected && styles.selectedLevelButtonText,
                      ]}>
                        {level.name}
                      </Text>
                      <Text style={[
                        styles.levelDescription,
                        isSelected && styles.selectedLevelDescription,
                      ]}>
                        {level.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {completedLevel && (
                <Text style={styles.changeHint}>
                  Tap another level to change your completion
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  habitsContainer: {
    padding: 15,
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  streakContainer: {
    alignSelf: 'flex-start',
  },
  streakText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  habitDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  levelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  levelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    flex: 1,
    marginBottom: 8,
  },
  selectedLevelButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedLevelButtonText: {
    color: 'white',
  },
  levelDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedLevelDescription: {
    color: '#E3F2FD',
  },
  changeHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
});