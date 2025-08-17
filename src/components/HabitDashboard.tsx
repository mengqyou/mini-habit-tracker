import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  AppState,
} from 'react-native';
import { Habit, HabitEntry, HabitStatus, getTodayString } from '../types';

interface HabitDashboardProps {
  habits: Habit[];
  entries: HabitEntry[];
  onEntryAdd: (entry: HabitEntry) => void;
  onEntryUpdate: (entry: HabitEntry) => void;
  onEntryDelete: (entry: HabitEntry) => void;
  onHabitEdit?: (habit: Habit) => void;
  onHabitDelete?: (habit: Habit) => void;
  onHabitStatusChange?: (habit: Habit, newStatus: HabitStatus) => void;
  showInactiveHabits?: boolean;
}

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  habits,
  entries,
  onEntryAdd,
  onEntryUpdate,
  onEntryDelete,
  onHabitEdit,
  onHabitDelete,
  onHabitStatusChange,
  showInactiveHabits = false,
}) => {
  // State to force refresh when date changes
  const [refreshKey, setRefreshKey] = useState(0);
  // Track locally deleted entries for immediate visual feedback
  const [locallyDeletedEntries, setLocallyDeletedEntries] = useState<Set<string>>(new Set());

  // Calculate today's date fresh each time - important for daily refresh
  // Uses local timezone instead of UTC to fix timezone refresh issues
  const today = useMemo(() => {
    const todayDate = getTodayString();
    console.log('🔵 [HabitDashboard] Today calculated as (local timezone):', todayDate, 'refreshKey:', refreshKey);
    return todayDate;
  }, [refreshKey]); // Depend on refreshKey to recalculate when needed

  const todayFormatted = useMemo(() => {
    const formatted = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    console.log('🔵 [HabitDashboard] Today formatted as:', formatted);
    return formatted;
  }, [refreshKey]);

  // Effect to refresh date when app becomes active or component mounts
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        console.log('🔵 [HabitDashboard] App became active, checking if date changed');
        // Force refresh to ensure we have the correct date
        setRefreshKey(prev => prev + 1);
      }
    };

    // Initial mount refresh
    console.log('🔵 [HabitDashboard] Component mounted, setting up date refresh');
    
    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up interval to check for date changes (every minute)
    const interval = setInterval(() => {
      const currentDate = getTodayString();
      if (currentDate !== today) {
        console.log('🔵 [HabitDashboard] Date changed from', today, 'to', currentDate, '(local timezone) - refreshing');
        setRefreshKey(prev => prev + 1);
      }
    }, 60000); // Check every minute

    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, [today]);

  // Clean up locally deleted entries when they're actually removed from the entries array
  useEffect(() => {
    const entryIds = new Set(entries.map(e => e.id));
    setLocallyDeletedEntries(prev => {
      const cleaned = new Set();
      for (const deletedId of prev) {
        if (entryIds.has(deletedId)) {
          cleaned.add(deletedId); // Keep if still in entries array
        }
      }
      if (cleaned.size !== prev.size) {
        console.log('🔵 [HabitDashboard] Cleaned up locally deleted entries:', prev.size, '->', cleaned.size);
      }
      return cleaned;
    });
  }, [entries]);

  const todayEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      const match = entry.date === today && !locallyDeletedEntries.has(entry.id);
      if (entry.date === today) {
        console.log('🔵 [HabitDashboard] Today entry:', entry.habitId, 'level:', entry.levelId, 'deleted:', locallyDeletedEntries.has(entry.id));
      }
      return match;
    });
    console.log('🔵 [HabitDashboard] Total today entries:', filtered.length, 'out of', entries.length, 'total entries, locally deleted:', locallyDeletedEntries.size);
    console.log('🔵 [HabitDashboard] All entry dates:', entries.map(e => e.date));
    return filtered;
  }, [entries, today, locallyDeletedEntries]);

  const filteredHabits = useMemo(() => {
    if (showInactiveHabits) {
      return habits; // Show all habits
    } else {
      return habits.filter(habit => (habit.status || 'active') === 'active');
    }
  }, [habits, showInactiveHabits]);

  // Get today's entries without local deletion filter (for logic operations)
  const getRawTodayEntryForHabit = useCallback((habitId: string) => {
    const rawTodayEntries = entries.filter(entry => entry.date === today);
    return rawTodayEntries.find(entry => entry.habitId === habitId);
  }, [entries, today]);

  // Get today's entries with local deletion filter (for display)
  const getTodayEntryForHabit = useCallback((habitId: string) => {
    return todayEntries.find(entry => entry.habitId === habitId);
  }, [todayEntries]);

  const handleLevelSelect = useCallback(async (habit: Habit, levelId: string) => {
    const level = habit.levels.find(l => l.id === levelId);
    if (!level) return;

    const existingEntry = getRawTodayEntryForHabit(habit.id);
    const isLocallyDeleted = existingEntry ? locallyDeletedEntries.has(existingEntry.id) : false;
    
    // Check if clicking the same level as currently selected (unclick scenario) 
    if (existingEntry && !isLocallyDeleted) {
      if (existingEntry.levelId === levelId) {
        
        // Immediate visual feedback - mark as locally deleted
        console.log('🔵 [HabitDashboard] Adding entry to locally deleted:', existingEntry.id);
        setLocallyDeletedEntries(prev => new Set([...prev, existingEntry.id]));
        
        // Call the actual delete function (async)
        onEntryDelete(existingEntry);
        
        Alert.alert(
          'Habit Unclicked',
          `${habit.name} has been unmarked for today`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    let updatedEntry: HabitEntry;
    
    if (existingEntry && !isLocallyDeleted) {
      // Switching to a different level for existing entry
      updatedEntry = {
        ...existingEntry,
        levelId,
        timestamp: new Date(),
      };
      console.log('🔵 [HabitDashboard] Updating existing entry to different level');
      
      // Remove from locally deleted entries if it was there
      setLocallyDeletedEntries(prev => {
        const updated = new Set(prev);
        updated.delete(existingEntry.id);
        return updated;
      });
      
      onEntryUpdate(updatedEntry);
    } else {
      // Creating new entry (either no existing entry or existing entry was locally deleted)
      updatedEntry = {
        id: Date.now().toString(),
        habitId: habit.id,
        date: today,
        levelId,
        timestamp: new Date(),
      };
      console.log('🔵 [HabitDashboard] Adding new entry, will wait 200ms');
      
      // If there was a locally deleted entry, remove it from the set
      if (existingEntry && isLocallyDeleted) {
        setLocallyDeletedEntries(prev => {
          const updated = new Set(prev);
          updated.delete(existingEntry.id);
          return updated;
        });
      }
      
      onEntryAdd(updatedEntry);
      
      // Add a small delay specifically for new entries to ensure optimistic update takes hold
      // before Firebase listener processes the data
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    Alert.alert(
      'Great!',
      `${habit.name}: ${level.name} - ${level.description}`,
      [{ text: 'OK' }]
    );
  }, [today, onEntryAdd, onEntryUpdate, onEntryDelete, getRawTodayEntryForHabit, locallyDeletedEntries]);

  const getCompletionStatus = (habit: Habit) => {
    const entry = getTodayEntryForHabit(habit.id);
    console.log('🔵 [HabitDashboard] getCompletionStatus for habit:', habit.name, 'entry:', entry ? `${entry.date} level ${entry.levelId}` : 'null');
    if (!entry) return null;
    
    const level = habit.levels.find(l => l.id === entry.levelId);
    console.log('🔵 [HabitDashboard] Found level:', level ? level.name : 'null');
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
    
    if (habitEntries.length === 0) return 0;
    
    let streak = 0;
    let checkDate = new Date();
    
    // First check if we have an entry for today
    const todayStr = today;
    const hasTodayEntry = habitEntries.some(e => e.date === todayStr);
    
    console.log('🔵 [getStreakCount]', habit.name, 'total entries:', habitEntries.length, 'hasTodayEntry:', hasTodayEntry);
    
    // Start checking from yesterday first to establish if there's a previous streak
    checkDate.setDate(checkDate.getDate() - 1); // Start from yesterday
    
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasEntry = habitEntries.some(e => e.date === dateStr);
      
      if (hasEntry) {
        streak++;
        console.log('🔵 [getStreakCount] Found entry for', dateStr, 'streak now:', streak);
      } else {
        console.log('🔵 [getStreakCount] No entry for', dateStr, 'breaking streak at:', streak);
        break; // Break streak on first missing day
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Only add today to streak if we have yesterday's entry (continuing streak)
    // or if today is the very first entry ever
    if (hasTodayEntry) {
      const shouldAddToday = streak > 0 || habitEntries.length === 1;
      console.log('🔵 [getStreakCount] Should add today?', shouldAddToday, '(streak from yesterday:', streak, 'total entries:', habitEntries.length, ')');
      if (shouldAddToday) {
        streak++;
      }
    }
    
    console.log('🔵 [getStreakCount] Final streak for', habit.name, ':', streak);
    return streak;
  };

  const handleDeleteHabit = (habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This will permanently remove the habit and all its tracking data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onHabitDelete) {
              onHabitDelete(habit);
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = (habit: Habit) => {
    const currentStatus = habit.status || 'active';
    const statusOptions = [
      { text: 'Active', value: 'active' as HabitStatus, description: 'Continue tracking this habit' },
      { text: 'Inactive', value: 'inactive' as HabitStatus, description: 'Pause tracking but keep data' },
      { text: 'Built-in', value: 'built-in' as HabitStatus, description: 'Habit is mastered, archive with data' },
    ];

    const buttons = statusOptions.map(option => ({
      text: option.text + (currentStatus === option.value ? ' ✓' : ''),
      onPress: () => {
        if (onHabitStatusChange && currentStatus !== option.value) {
          onHabitStatusChange(habit, option.value);
        }
      },
    }));

    buttons.push({ text: 'Cancel', onPress: () => {}, style: 'cancel' as const });

    Alert.alert('Change Habit Status', `Change status for "${habit.name}"`, buttons);
  };

  if (filteredHabits.length === 0) {
    if (showInactiveHabits) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Habits</Text>
          <Text style={styles.emptyText}>
            You don't have any habits yet. Tap "+ New" to create your first habit!
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Active Habits</Text>
          <Text style={styles.emptyText}>
            All your habits are inactive or built-in. Tap "All Habits" to view them, or "+ New" to create a new habit!
          </Text>
        </View>
      );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.dateText}>{todayFormatted}</Text>
        <Text style={styles.subtitle}>Track your daily habits</Text>
      </View>

      <View style={styles.habitsContainer}>
        {filteredHabits.map((habit) => {
          const completedLevel = getCompletionStatus(habit);
          const streak = getStreakCount(habit);
          const completedLevelIndex = completedLevel ? habit.levels.findIndex(l => l.id === completedLevel.id) : -1;
          
          return (
            <View key={habit.id} style={styles.habitCard}>
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <View style={styles.habitTitleRow}>
                    <Text style={styles.habitName}>{habit.name}</Text>
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
                    {(habit.status && habit.status !== 'active') && (
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusBadgeText}>
                          {habit.status === 'inactive' ? '⏸️ Inactive' : '✅ Built-in'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.actionsRow}>
                    <View style={styles.streakContainer}>
                      <Text style={styles.streakText}>
                        🔥 {streak} day{streak !== 1 ? 's' : ''} streak
                      </Text>
                    </View>
                    <View style={styles.habitActions}>
                      {onHabitStatusChange && (
                        <TouchableOpacity
                          style={styles.statusButton}
                          onPress={() => handleStatusChange(habit)}
                        >
                          <Text style={styles.statusButtonText}>📊 Status</Text>
                        </TouchableOpacity>
                      )}
                      {onHabitEdit && (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => onHabitEdit(habit)}
                        >
                          <Text style={styles.editButtonText}>✏️ Edit</Text>
                        </TouchableOpacity>
                      )}
                      {onHabitDelete && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDeleteHabit(habit)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {habit.description && (
                <Text style={styles.habitDescription}>{habit.description}</Text>
              )}

              <View style={styles.levelsContainer}>
                {habit.levels.map((level, index) => {
                  const isSelected = completedLevel?.id === level.id;
                  const isActive = (habit.status || 'active') === 'active';
                  
                  return (
                    <TouchableOpacity
                      key={level.id}
                      style={[
                        styles.levelButton,
                        isSelected && {
                          backgroundColor: getLevelColor(index),
                          borderColor: getLevelColor(index),
                        },
                        !isActive && styles.disabledLevelButton,
                      ]}
                      onPress={() => {
                        if (isActive) {
                          handleLevelSelect(habit, level.id);
                        }
                      }}
                      disabled={!isActive}
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
                  Tap the same level to unclick, or tap another level to change
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
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    minWidth: 150,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 12,
    color: '#d32f2f',
    fontWeight: '500',
  },
  statusButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusButtonText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
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
  statusIndicator: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  disabledLevelButton: {
    opacity: 0.5,
    backgroundColor: '#f5f5f5',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  statusBadgeText: {
    fontSize: 10,
    color: '#856404',
    fontWeight: '500',
  },
});