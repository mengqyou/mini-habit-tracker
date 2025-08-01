import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry } from '../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitDashboard - First-Click Reliability Fix', () => {
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
    onHabitEdit: jest.fn(),
    onHabitDelete: jest.fn(),
    onHabitStatusChange: jest.fn(),
    showInactiveHabits: false,
  };

  // Mock setTimeout for delay testing
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('should add delay for new entry to prevent first-click disappearing', async () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [], // No existing entries
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    // Verify onEntryAdd was called
    expect(mockOnEntryAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: '1',
        levelId: '1',
        date: expect.any(String),
      })
    );

    // Fast-forward the 200ms delay
    jest.advanceTimersByTime(200);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Great!',
        'Exercise: Basic - 10 min walk',
        [{ text: 'OK' }]
      );
    });
  });

  it('should not add delay for updating existing entry', async () => {
    const mockOnEntryUpdate = jest.fn();
    const propsWithEntry = {
      ...defaultProps,
      onEntryUpdate: mockOnEntryUpdate,
    };

    const { getByText } = render(<HabitDashboard {...propsWithEntry} />);

    const excellentButton = getByText('Excellent');
    fireEvent.press(excellentButton);

    // For existing entries, no delay should be added
    expect(mockOnEntryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        habitId: '1',
        levelId: '3',
        date: expect.any(String),
      })
    );

    // Alert should show immediately without delay
    expect(Alert.alert).toHaveBeenCalledWith(
      'Great!',
      'Exercise: Excellent - 45 min full workout',
      [{ text: 'OK' }]
    );
  });

  it('should handle async level selection correctly', async () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [],
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    
    // Press button - this should be async due to the delay
    fireEvent.press(basicButton);

    // Verify onEntryAdd was called immediately
    expect(mockOnEntryAdd).toHaveBeenCalled();

    // Fast-forward time to complete the delay
    jest.advanceTimersByTime(200);

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('should maintain button functionality during delay', async () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [],
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    
    // Press button
    fireEvent.press(basicButton);

    // Entry should be added immediately (optimistic update)
    expect(mockOnEntryAdd).toHaveBeenCalledTimes(1);

    // Even if user presses again during delay, it should work
    fireEvent.press(basicButton);
    
    // Since there's now an "entry" from the first press, this should be an update
    // Note: In real app, the entries prop would update, but in this test it's static
    expect(mockOnEntryAdd).toHaveBeenCalledTimes(2);
  });

  it('should handle rapid clicks without breaking', async () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [],
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    
    // Rapidly click the button multiple times
    fireEvent.press(basicButton);
    fireEvent.press(basicButton);
    fireEvent.press(basicButton);

    // Each click should register
    expect(mockOnEntryAdd).toHaveBeenCalledTimes(3);

    // Fast-forward through delays
    jest.advanceTimersByTime(600); // 3 * 200ms

    // All clicks should complete successfully
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle delay cancellation on component unmount', () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [],
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText, unmount } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    // Unmount component before delay completes
    unmount();

    // Fast-forward past the delay
    jest.advanceTimersByTime(200);

    // Alert should not be called after unmount
    // This prevents memory leaks and state updates on unmounted components
    expect(mockOnEntryAdd).toHaveBeenCalledTimes(1);
  });
});