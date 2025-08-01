import { Habit, HabitEntry, HabitLevel, HabitSummary, HabitStatus } from '../index';

describe('Type Definitions', () => {
  describe('HabitLevel', () => {
    it('should have correct structure', () => {
      const level: HabitLevel = {
        id: '1',
        name: 'Basic',
        description: 'Basic level description',
        value: 1,
      };

      expect(level.id).toBe('1');
      expect(level.name).toBe('Basic');
      expect(level.description).toBe('Basic level description');
      expect(level.value).toBe(1);
    });
  });

  describe('HabitStatus', () => {
    it('should accept valid status values', () => {
      const activeStatus: HabitStatus = 'active';
      const inactiveStatus: HabitStatus = 'inactive';
      const builtInStatus: HabitStatus = 'built-in';

      expect(activeStatus).toBe('active');
      expect(inactiveStatus).toBe('inactive');
      expect(builtInStatus).toBe('built-in');
    });
  });

  describe('Habit', () => {
    it('should have correct structure with required fields', () => {
      const habit: Habit = {
        id: '1',
        name: 'Exercise',
        description: 'Daily exercise routine',
        levels: [
          { id: '1', name: 'Basic', description: '10 min walk', value: 1 },
          { id: '2', name: 'Good', description: '20 min workout', value: 2 },
          { id: '3', name: 'Excellent', description: '45 min full workout', value: 3 },
        ],
        createdAt: new Date('2023-01-01'),
      };

      expect(habit.id).toBe('1');
      expect(habit.name).toBe('Exercise');
      expect(habit.description).toBe('Daily exercise routine');
      expect(habit.levels).toHaveLength(3);
      expect(habit.createdAt).toBeInstanceOf(Date);
      expect(habit.status).toBeUndefined(); // Optional field
    });

    it('should have correct structure with optional status field', () => {
      const habit: Habit = {
        id: '1',
        name: 'Exercise',
        description: 'Daily exercise routine',
        levels: [
          { id: '1', name: 'Basic', description: '10 min walk', value: 1 },
        ],
        createdAt: new Date('2023-01-01'),
        status: 'active',
      };

      expect(habit.status).toBe('active');
    });
  });

  describe('HabitEntry', () => {
    it('should have correct structure', () => {
      const entry: HabitEntry = {
        id: '1',
        habitId: '1',
        date: '2023-01-01',
        levelId: '1',
        timestamp: new Date('2023-01-01T10:00:00Z'),
      };

      expect(entry.id).toBe('1');
      expect(entry.habitId).toBe('1');
      expect(entry.date).toBe('2023-01-01');
      expect(entry.levelId).toBe('1');
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it('should use YYYY-MM-DD format for date', () => {
      const entry: HabitEntry = {
        id: '1',
        habitId: '1',
        date: '2023-12-25',
        levelId: '1',
        timestamp: new Date(),
      };

      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('HabitSummary', () => {
    it('should have correct structure', () => {
      const summary: HabitSummary = {
        habitId: '1',
        totalEntries: 100,
        currentStreak: 7,
        longestStreak: 30,
        weeklyEntries: 5,
        monthlyEntries: 25,
        yearlyEntries: 300,
        levelDistribution: {
          '1': 30,
          '2': 40,
          '3': 30,
        },
      };

      expect(summary.habitId).toBe('1');
      expect(summary.totalEntries).toBe(100);
      expect(summary.currentStreak).toBe(7);
      expect(summary.longestStreak).toBe(30);
      expect(summary.weeklyEntries).toBe(5);
      expect(summary.monthlyEntries).toBe(25);
      expect(summary.yearlyEntries).toBe(300);
      expect(summary.levelDistribution).toEqual({
        '1': 30,
        '2': 40,
        '3': 30,
      });
    });

    it('should allow empty level distribution', () => {
      const summary: HabitSummary = {
        habitId: '1',
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        weeklyEntries: 0,
        monthlyEntries: 0,
        yearlyEntries: 0,
        levelDistribution: {},
      };

      expect(summary.levelDistribution).toEqual({});
    });
  });

  describe('Type Relationships', () => {
    it('should maintain proper relationships between types', () => {
      const levels: HabitLevel[] = [
        { id: '1', name: 'Basic', description: 'Basic level', value: 1 },
        { id: '2', name: 'Good', description: 'Good level', value: 2 },
        { id: '3', name: 'Excellent', description: 'Excellent level', value: 3 },
      ];

      const habit: Habit = {
        id: 'habit-1',
        name: 'Exercise',
        description: 'Daily exercise',
        levels,
        createdAt: new Date(),
        status: 'active',
      };

      const entry: HabitEntry = {
        id: 'entry-1',
        habitId: habit.id,
        date: '2023-01-01',
        levelId: levels[0].id,
        timestamp: new Date(),
      };

      const summary: HabitSummary = {
        habitId: habit.id,
        totalEntries: 1,
        currentStreak: 1,
        longestStreak: 1,
        weeklyEntries: 1,
        monthlyEntries: 1,
        yearlyEntries: 1,
        levelDistribution: {
          [levels[0].id]: 1,
        },
      };

      // Verify relationships
      expect(entry.habitId).toBe(habit.id);
      expect(entry.levelId).toBe(levels[0].id);
      expect(summary.habitId).toBe(habit.id);
      expect(summary.levelDistribution[levels[0].id]).toBe(1);
    });
  });
});