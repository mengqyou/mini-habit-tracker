import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Habit, HabitEntry, getTodayString, getLocalDateString } from '../types';

interface AllHabitsSummaryProps {
  habits: Habit[];
  entries: HabitEntry[];
  onHabitSelect: (habit: Habit) => void;
}

export const AllHabitsSummary: React.FC<AllHabitsSummaryProps> = ({
  habits,
  entries,
  onHabitSelect,
}) => {
  const overallStats = useMemo(() => {
    const today = getTodayString();
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const todayEntries = entries.filter(e => e.date === today);
    const weekEntries = entries.filter(e => new Date(e.date) >= startOfWeek);
    const monthEntries = entries.filter(e => new Date(e.date) >= startOfMonth);
    
    const totalHabits = habits.length;
    const completedToday = todayEntries.length;
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    
    return {
      totalHabits,
      completedToday,
      completionRate,
      weeklyTotal: weekEntries.length,
      monthlyTotal: monthEntries.length,
      allTimeTotal: entries.length,
    };
  }, [habits, entries]);

  const getHabitStats = (habit: Habit) => {
    const habitEntries = entries.filter(e => e.habitId === habit.id);
    const today = getTodayString();
    const todayEntry = habitEntries.find(e => e.date === today);
    
    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < 30; i++) {
      const dateStr = getLocalDateString(checkDate);
      const hasEntry = habitEntries.some(e => e.date === dateStr);
      
      if (hasEntry) {
        if (dateStr === today || currentStreak > 0) {
          currentStreak++;
        }
      } else {
        if (dateStr === today) {
          break;
        } else if (currentStreak > 0) {
          break;
        }
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDates = habitEntries
      .map(e => e.date)
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index); // Remove duplicates
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return {
      totalEntries: habitEntries.length,
      currentStreak,
      longestStreak,
      completedToday: !!todayEntry,
      lastLevel: todayEntry ? habit.levels.find(l => l.id === todayEntry.levelId)?.name : null,
    };
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>All Habits Summary</Text>
      
      {/* Overall Statistics */}
      <View style={styles.overallCard}>
        <Text style={styles.cardTitle}>Overall Progress</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overallStats.completedToday}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overallStats.completionRate}%</Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overallStats.totalHabits}</Text>
            <Text style={styles.statLabel}>Total Habits</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{overallStats.allTimeTotal}</Text>
            <Text style={styles.statLabel}>All-Time Entries</Text>
          </View>
        </View>
        
        <View style={styles.timeFrameStats}>
          <View style={styles.timeFrameItem}>
            <Text style={styles.timeFrameNumber}>{overallStats.weeklyTotal}</Text>
            <Text style={styles.timeFrameLabel}>This Week</Text>
          </View>
          <View style={styles.timeFrameItem}>
            <Text style={styles.timeFrameNumber}>{overallStats.monthlyTotal}</Text>
            <Text style={styles.timeFrameLabel}>This Month</Text>
          </View>
        </View>
      </View>

      {/* Individual Habits */}
      <Text style={styles.sectionTitle}>Individual Habits</Text>
      
      {habits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No habits created yet</Text>
        </View>
      ) : (
        habits.map((habit) => {
          const stats = getHabitStats(habit);
          
          return (
            <TouchableOpacity
              key={habit.id}
              style={styles.habitCard}
              onPress={() => onHabitSelect(habit)}
            >
              <View style={styles.habitHeader}>
                <View style={styles.habitInfo}>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  {stats.completedToday && (
                    <Text style={styles.todayStatus}>
                      ✅ {stats.lastLevel} today
                    </Text>
                  )}
                </View>
                <Text style={styles.tapHint}>Tap for details →</Text>
              </View>
              
              <View style={styles.habitStats}>
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatNumber}>{stats.totalEntries}</Text>
                  <Text style={styles.habitStatLabel}>Total</Text>
                </View>
                
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatNumber}>{stats.currentStreak}</Text>
                  <Text style={styles.habitStatLabel}>Current Streak</Text>
                </View>
                
                <View style={styles.habitStatItem}>
                  <Text style={styles.habitStatNumber}>{stats.longestStreak}</Text>
                  <Text style={styles.habitStatLabel}>Best Streak</Text>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, (stats.currentStreak / Math.max(stats.longestStreak, 1)) * 100)}%` 
                    }
                  ]} 
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  overallCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeFrameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  timeFrameItem: {
    alignItems: 'center',
  },
  timeFrameNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 5,
  },
  timeFrameLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  todayStatus: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  habitStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  habitStatItem: {
    alignItems: 'center',
  },
  habitStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2,
  },
  habitStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
});