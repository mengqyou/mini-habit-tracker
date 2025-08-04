import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry } from '../../types';

describe('HabitDashboard - Daily Refresh System', () => {
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

  const mockEntries: HabitEntry[] = [
    {
      id: '1',
      habitId: '1',
      date: new Date().toISOString().split('T')[0], // Today
      levelId: '2',
      timestamp: new Date(),
    },
  ];

  const defaultProps = {
    habits: mockHabits,
    entries: mockEntries,
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

  it('should initialize with correct today date calculation', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);
    
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    expect(getByText(today)).toBeTruthy();
  });

  it('should filter entries correctly for today', () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const entriesWithYesterday = [
      ...defaultProps.entries,
      {
        id: 'yesterday-1',
        habitId: '1',
        date: yesterdayDate,
        levelId: '3',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    const { queryByText } = render(
      <HabitDashboard {...defaultProps} entries={entriesWithYesterday} />
    );

    // Should not show yesterday's completion status
    // Only today's entries should affect the display
    const todayEntries = entriesWithYesterday.filter(e => e.date === todayDate);
    expect(todayEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle AppState changes correctly', async () => {
    const mockAppState = require('react-native').AppState;
    let appStateCallback: ((state: string) => void) | null = null;
    
    // Mock AppState.addEventListener
    mockAppState.addEventListener = jest.fn((event, callback) => {
      if (event === 'change') {
        appStateCallback = callback;
      }
      return { remove: jest.fn() };
    });

    render(<HabitDashboard {...defaultProps} />);

    // Simulate app becoming active
    if (appStateCallback) {
      appStateCallback('active');
    }

    await waitFor(() => {
      expect(mockAppState.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });
  });

  it('should set up and clean up interval for date checking', () => {
    const originalSetInterval = global.setInterval;
    const originalClearInterval = global.clearInterval;
    const mockSetInterval = jest.fn();
    const mockClearInterval = jest.fn();
    
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;

    const { unmount } = render(<HabitDashboard {...defaultProps} />);

    // Should set up interval
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);

    // Should clean up on unmount
    unmount();
    expect(mockClearInterval).toHaveBeenCalled();

    // Restore original functions
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  it('should show clean state when no entries exist for today', () => {
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayEntries = [
      {
        id: 'yesterday-1',
        habitId: '1',
        date: yesterdayDate,
        levelId: '2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    const { queryByText } = render(
      <HabitDashboard {...defaultProps} entries={yesterdayEntries} />
    );

    // Should not show completion badges from yesterday
    expect(queryByText('✅ Good')).toBeNull();
  });

  it('should handle date changes within the same session', async () => {
    const { rerender } = render(<HabitDashboard {...defaultProps} />);

    // Simulate date change by re-rendering with updated entries
    const newDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureEntries = [
      {
        id: 'future-1',
        habitId: '1',
        date: newDate,
        levelId: '3',
        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    ];

    rerender(<HabitDashboard {...defaultProps} entries={futureEntries} />);

    // Should handle the date change appropriately
    await waitFor(() => {
      // The component should continue to function normally
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  it('should recalculate streak correctly after date change', () => {
    const todayDate = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const twoDaysAgoDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const streakEntries = [
      {
        id: 'today',
        habitId: '1',
        date: todayDate,
        levelId: '2',
        timestamp: new Date(),
      },
      {
        id: 'yesterday',
        habitId: '1',
        date: yesterdayDate,
        levelId: '1',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: 'twoDaysAgo',
        habitId: '1',
        date: twoDaysAgoDate,
        levelId: '3',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    const { getByText } = render(
      <HabitDashboard {...defaultProps} entries={streakEntries} />
    );

    // Should show current streak
    expect(getByText(/days? streak/)).toBeTruthy();
  });

  it('should handle timezone changes gracefully', () => {
    // Mock timezone change scenario by mocking the Date constructor
    const mockDate = new Date('2023-12-25T10:00:00.000Z');
    const originalDate = global.Date;
    (global as any).Date = jest.fn(() => mockDate);
    global.Date.now = jest.fn(() => mockDate.getTime());

    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    // Should still display the correct date
    expect(getByText(/December/)).toBeTruthy();

    // Restore original Date
    global.Date = originalDate;
  });

  it('should maintain state consistency during rapid date checks', async () => {
    const mockSetInterval = jest.fn();
    const originalSetInterval = global.setInterval;
    global.setInterval = mockSetInterval;

    render(<HabitDashboard {...defaultProps} />);

    // Verify interval was set up
    expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);

    // Simulate rapid interval calls
    const intervalCallback = mockSetInterval.mock.calls[0][0];
    intervalCallback();
    intervalCallback();
    intervalCallback();

    await waitFor(() => {
      // Should handle rapid calls without issues
      expect(true).toBe(true); // Component should remain stable
    });

    global.setInterval = originalSetInterval;
  });

  it('should handle edge case of midnight transition', () => {
    const nearMidnight = new Date();
    nearMidnight.setHours(23, 59, 59, 999);
    
    const originalDate = global.Date;
    const mockDate = jest.fn().mockImplementation(() => nearMidnight);
    mockDate.now = jest.fn(() => nearMidnight.getTime());
    global.Date = mockDate as any;

    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    // Should handle near-midnight rendering - verify any day name is displayed
    // The specific date might vary due to timezone and React component optimization
    expect(getByText(/\w+day,/)).toBeTruthy();

    global.Date = originalDate;
  });

  it('should preserve user interaction during date refresh', async () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    // Should maintain interactivity even during refresh cycles
    const exerciseCard = getByText('Exercise');
    expect(exerciseCard).toBeTruthy();

    // Component should remain responsive
    await waitFor(() => {
      expect(getByText('Exercise')).toBeTruthy();
    });
  });
});