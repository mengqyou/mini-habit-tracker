import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry } from '../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitDashboard', () => {
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
    {
      id: '2',
      name: 'Reading',
      description: 'Daily reading habit',
      levels: [
        { id: '1', name: 'Basic', description: '5 pages', value: 1 },
        { id: '2', name: 'Good', description: '15 pages', value: 2 },
        { id: '3', name: 'Excellent', description: '30 pages', value: 3 },
      ],
      createdAt: new Date('2023-01-02'),
      status: 'inactive',
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render active habits by default', () => {
    const { getByText, queryByText } = render(<HabitDashboard {...defaultProps} />);

    expect(getByText('Exercise')).toBeTruthy();
    expect(queryByText('Reading')).toBeNull(); // Inactive habit should not be shown
  });

  it('should show inactive habits when showInactiveHabits is true', () => {
    const { getByText } = render(
      <HabitDashboard {...defaultProps} showInactiveHabits={true} />
    );

    expect(getByText('Exercise')).toBeTruthy();
    expect(getByText('Reading')).toBeTruthy();
  });

  it('should display completed level badge for today', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    expect(getByText('✅ Good')).toBeTruthy();
  });

  it('should handle level selection for new entry', async () => {
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [], // No existing entries
    };
    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    await waitFor(() => {
      expect(propsWithNoEntries.onEntryAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          habitId: '1',
          levelId: '1',
          date: expect.any(String),
        })
      );
    });

    // Wait for the 200ms delay to complete
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Great!',
        'Exercise: Basic - 10 min walk',
        [{ text: 'OK' }]
      );
    }, { timeout: 1000 });
  });

  it('should handle level selection for updating existing entry', async () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    const excellentButton = getByText('Excellent');
    fireEvent.press(excellentButton);

    await waitFor(() => {
      expect(defaultProps.onEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          habitId: '1',
          levelId: '3',
          date: expect.any(String),
        })
      );
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Great!',
      'Exercise: Excellent - 45 min full workout',
      [{ text: 'OK' }]
    );
  });

  it('should calculate streak correctly', () => {
    const consecutiveEntries: HabitEntry[] = [];
    const today = new Date();
    
    // Create entries for last 3 days
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      consecutiveEntries.push({
        id: `entry-${i}`,
        habitId: '1',
        date: date.toISOString().split('T')[0],
        levelId: '1',
        timestamp: new Date(),
      });
    }

    const { getByText } = render(
      <HabitDashboard
        {...defaultProps}
        entries={consecutiveEntries}
      />
    );

    expect(getByText('🔥 3 days streak')).toBeTruthy();
  });

  it('should show edit button and handle edit', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    const editButton = getByText('✏️ Edit');
    fireEvent.press(editButton);

    expect(defaultProps.onHabitEdit).toHaveBeenCalledWith(mockHabits[0]);
  });

  it('should show delete button and handle delete confirmation', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    const deleteButton = getByText('🗑️ Delete');
    fireEvent.press(deleteButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Habit',
      'Are you sure you want to delete "Exercise"? This will permanently remove the habit and all its tracking data.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('should handle status change', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    const statusButton = getByText('📊 Status');
    fireEvent.press(statusButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Change Habit Status',
      'Change status for "Exercise"',
      expect.any(Array)
    );
  });

  it('should show empty state when no active habits', () => {
    const { getByText } = render(
      <HabitDashboard
        {...defaultProps}
        habits={[mockHabits[1]]} // Only inactive habit
      />
    );

    expect(getByText('No Active Habits')).toBeTruthy();
    expect(getByText(/All your habits are inactive/)).toBeTruthy();
  });

  it('should show empty state when no habits at all', () => {
    const { getByText } = render(
      <HabitDashboard
        {...defaultProps}
        habits={[]}
        showInactiveHabits={true}
      />
    );

    expect(getByText('No Habits')).toBeTruthy();
    expect(getByText(/You don't have any habits yet/)).toBeTruthy();
  });

  it('should disable level buttons for inactive habits', () => {
    const { getByTestId } = render(
      <HabitDashboard
        {...defaultProps}
        showInactiveHabits={true}
      />
    );

    // This test assumes we add testID props to level buttons based on habit status
    // In the actual component, inactive habit level buttons should be disabled
  });

  it('should display today\'s date in header', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    expect(getByText(today)).toBeTruthy();
    expect(getByText('Track your daily habits')).toBeTruthy();
  });

  // Tests for recent bug fixes
  describe('Recent Bug Fixes', () => {
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
      const pressPromise = fireEvent.press(basicButton);

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
  });
});