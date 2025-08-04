import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry } from '../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitDashboard - Core Functionality', () => {
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
    onEntryDelete: jest.fn(),
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
});