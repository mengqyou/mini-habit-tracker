import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Habit, HabitEntry, HabitSummary as SummaryType } from '../types';

interface HabitSummaryProps {
  habit: Habit;
  entries: HabitEntry[];
}

export const HabitSummary: React.FC<HabitSummaryProps> = ({ habit, entries }) => {
  const summary = useMemo(() => calculateSummary(habit, entries), [habit, entries]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const getStreakText = (streak: number) => {
    if (streak === 0) return 'No current streak';
    if (streak === 1) return '1 day';
    return `${streak} days`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.habitName}>{habit.name}</Text>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{summary.totalEntries}</Text>
          <Text style={styles.statLabel}>Total Completions</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getStreakText(summary.currentStreak)}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getStreakText(summary.longestStreak)}</Text>
          <Text style={styles.statLabel}>Longest Streak</Text>
        </View>
      </View>

      <View style={styles.timeFrameContainer}>
        <Text style={styles.sectionTitle}>Time Frame Summary</Text>
        
        <View style={styles.timeFrameRow}>
          <Text style={styles.timeFrameLabel}>This Week:</Text>
          <Text style={styles.timeFrameValue}>{summary.weeklyEntries} completions</Text>
        </View>
        
        <View style={styles.timeFrameRow}>
          <Text style={styles.timeFrameLabel}>This Month:</Text>
          <Text style={styles.timeFrameValue}>{summary.monthlyEntries} completions</Text>
        </View>
        
        <View style={styles.timeFrameRow}>
          <Text style={styles.timeFrameLabel}>This Year:</Text>
          <Text style={styles.timeFrameValue}>{summary.yearlyEntries} completions</Text>
        </View>
        
        <View style={styles.timeFrameRow}>
          <Text style={styles.timeFrameLabel}>All Time:</Text>
          <Text style={styles.timeFrameValue}>{summary.totalEntries} completions</Text>
        </View>
      </View>

      <View style={styles.levelDistributionContainer}>
        <Text style={styles.sectionTitle}>Level Distribution</Text>
        {habit.levels.map((level) => {
          const count = summary.levelDistribution[level.id] || 0;
          const percentage = summary.totalEntries > 0 
            ? Math.round((count / summary.totalEntries) * 100)
            : 0;
          
          return (
            <View key={level.id} style={styles.levelRow}>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{level.name}</Text>
                <Text style={styles.levelDescription}>{level.description}</Text>
              </View>
              <View style={styles.levelStats}>
                <Text style={styles.levelCount}>{count}</Text>
                <Text style={styles.levelPercentage}>({percentage}%)</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {entries.slice(-7).reverse().map((entry) => {
          const level = habit.levels.find(l => l.id === entry.levelId);
          return (
            <View key={entry.id} style={styles.activityRow}>
              <Text style={styles.activityDate}>{entry.date}</Text>
              <Text style={styles.activityLevel}>{level?.name}</Text>
            </View>
          );
        })}
        {entries.length === 0 && (
          <Text style={styles.noActivity}>No activity recorded yet</Text>
        )}
      </View>
    </ScrollView>
  );
};

function calculateSummary(habit: Habit, entries: HabitEntry[]): SummaryType {
  const habitEntries = entries.filter(e => e.habitId === habit.id);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  const weeklyEntries = habitEntries.filter(e => new Date(e.date) >= startOfWeek).length;
  const monthlyEntries = habitEntries.filter(e => new Date(e.date) >= startOfMonth).length;
  const yearlyEntries = habitEntries.filter(e => new Date(e.date) >= startOfYear).length;
  
  const levelDistribution: Record<string, number> = {};
  habitEntries.forEach(entry => {
    levelDistribution[entry.levelId] = (levelDistribution[entry.levelId] || 0) + 1;
  });
  
  const sortedEntries = habitEntries
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasEntry = sortedEntries.some(e => e.date === dateStr);
    
    if (hasEntry) {
      tempStreak++;
      if (i === 0 || (currentStreak === 0 && tempStreak > 0)) {
        currentStreak = tempStreak;
      }
    } else {
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      if (i === 0) {
        currentStreak = 0;
      }
      tempStreak = 0;
    }
    
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }
  
  return {
    habitId: habit.id,
    totalEntries: habitEntries.length,
    currentStreak,
    longestStreak,
    weeklyEntries,
    monthlyEntries,
    yearlyEntries,
    levelDistribution,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  habitName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  timeFrameContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timeFrameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timeFrameLabel: {
    fontSize: 16,
    color: '#333',
  },
  timeFrameValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  levelDistributionContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  levelDescription: {
    fontSize: 12,
    color: '#666',
  },
  levelStats: {
    alignItems: 'flex-end',
  },
  levelCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  levelPercentage: {
    fontSize: 12,
    color: '#666',
  },
  recentActivityContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityDate: {
    fontSize: 14,
    color: '#666',
  },
  activityLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  noActivity: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});