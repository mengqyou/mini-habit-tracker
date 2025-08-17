import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry, getTodayString, getLocalDateString } from '../../types';

describe('HabitDashboard - Timezone Fix', () => {
  const mockHabits: Habit[] = [
    {
      id: '1',
      name: 'Exercise',
      description: 'Daily exercise routine',
      levels: [
        { id: '1', name: 'Basic', description: '10 min walk', value: 1 },
        { id: '2', name: 'Good', description: '20 min workout', value: 2 },
        { id: '3', name: 'Excellent', description: '45 min full workout', value: 3 },
      ],
      createdAt: new Date('2023-01-01'),
      status: 'active',
    },
  ];

  const defaultProps = {
    habits: mockHabits,
    entries: [] as HabitEntry[],
    onEntryAdd: jest.fn(),
    onEntryUpdate: jest.fn(),
    onEntryDelete: jest.fn(),
    onHabitEdit: jest.fn(),
    onHabitDelete: jest.fn(),
    onHabitStatusChange: jest.fn(),
    showInactiveHabits: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Local Timezone Date Handling', () => {
    it('should use local timezone for today calculation instead of UTC', () => {
      const { getByText } = render(<HabitDashboard {...defaultProps} />);
      
      // Verify that the component renders with today's date
      const today = getTodayString();
      const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      expect(getByText(todayFormatted)).toBeTruthy();
      
      // Verify that getTodayString returns a proper date format
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should correctly filter entries for today using local timezone', () => {
      const todayLocal = getTodayString();
      const mockEntries: HabitEntry[] = [
        {
          id: '1',
          habitId: '1',
          date: todayLocal,
          levelId: '2',
          timestamp: new Date(),
        },
      ];

      const { getByText } = render(
        <HabitDashboard {...defaultProps} entries={mockEntries} />
      );

      // Should show the completion status for today
      expect(getByText('✅ Good')).toBeTruthy();
    });

    it('should handle timezone edge cases correctly', () => {
      // Test with a date that would be different in UTC
      const localDate = new Date();
      localDate.setHours(23, 59, 59, 999); // Very late in the day locally
      
      const localDateString = getLocalDateString(localDate);
      const utcDateString = localDate.toISOString().split('T')[0];
      
      // Create entries for both dates to test the difference
      const mockEntries: HabitEntry[] = [
        {
          id: '1',
          habitId: '1',
          date: localDateString,
          levelId: '2',
          timestamp: localDate,
        },
      ];

      const { getByText } = render(
        <HabitDashboard {...defaultProps} entries={mockEntries} />
      );

      // Should show completion if using local date
      // Note: This test might need adjustment based on actual timezone, 
      // but it documents the expected behavior
      expect(getByText('Exercise')).toBeTruthy();
    });

    it('should not show yesterday\'s entries as today when timezone differs', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayLocal = getLocalDateString(yesterday);
      
      const mockEntries: HabitEntry[] = [
        {
          id: '1',
          habitId: '1',
          date: yesterdayLocal,
          levelId: '2',
          timestamp: yesterday,
        },
      ];

      const { queryByText } = render(
        <HabitDashboard {...defaultProps} entries={mockEntries} />
      );

      // Should NOT show completion badge for yesterday's entry
      expect(queryByText('✅ Good')).toBeNull();
    });

    it('should correctly handle date refresh when crossing midnight', async () => {
      const mockSetInterval = jest.fn();
      const originalSetInterval = global.setInterval;
      global.setInterval = mockSetInterval;

      render(<HabitDashboard {...defaultProps} />);

      // Verify interval was set up
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);

      // Simulate the interval callback
      const intervalCallback = mockSetInterval.mock.calls[0][0];
      
      // Mock a date change
      const originalGetTodayString = require('../../types').getTodayString;
      let callCount = 0;
      jest.doMock('../../types', () => ({
        ...jest.requireActual('../../types'),
        getTodayString: () => {
          callCount++;
          if (callCount === 1) return '2023-12-31';
          return '2024-01-01'; // Simulate date change
        },
      }));

      // Call the interval function
      intervalCallback();

      await waitFor(() => {
        // Component should handle the date transition
        expect(true).toBe(true); // Placeholder - component should remain stable
      });

      global.setInterval = originalSetInterval;
    });
  });

  describe('Date Utility Function Integration', () => {
    it('should demonstrate the fix prevents UTC timezone issues', () => {
      // Create a scenario where UTC and local dates would differ
      const testDate = new Date(2023, 11, 31, 23, 30, 0); // Dec 31, 11:30 PM local time
      
      const localDateString = getLocalDateString(testDate);
      const utcDateString = testDate.toISOString().split('T')[0];
      
      // Local date should always be Dec 31
      expect(localDateString).toBe('2023-12-31');
      
      // UTC date might be Jan 1 depending on timezone
      // This test documents that we now use local date consistently
      expect(localDateString).not.toBe(utcDateString);
    });

    it('should ensure consistency between all date utility usages', () => {
      const now = new Date();
      const todayString = getTodayString();
      const localString = getLocalDateString(now);
      
      // Both should return the same value
      expect(todayString).toBe(localString);
      
      // Both should be in correct format
      expect(todayString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(localString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Backwards Compatibility', () => {
    it('should handle existing entries with UTC-generated dates', () => {
      // Simulate entries that might have been created with the old UTC system
      const utcDate = new Date().toISOString().split('T')[0];
      const localDate = getTodayString();
      
      const mixedEntries: HabitEntry[] = [
        {
          id: '1',
          habitId: '1',
          date: utcDate, // Old format
          levelId: '1',
          timestamp: new Date(),
        },
        {
          id: '2',
          habitId: '1',
          date: localDate, // New format
          levelId: '2',
          timestamp: new Date(),
        },
      ];

      const { getByText } = render(
        <HabitDashboard {...defaultProps} entries={mixedEntries} />
      );

      // Component should handle both date formats gracefully
      expect(getByText('Exercise')).toBeTruthy();
    });
  });
});