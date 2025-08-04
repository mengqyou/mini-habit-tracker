import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HabitDashboard } from '../HabitDashboard';
import { Habit, HabitEntry } from '../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitDashboard - Unclick Functionality', () => {
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
      id: 'entry-1',
      habitId: '1',
      date: new Date().toISOString().split('T')[0], // Today
      levelId: '2', // Good level is selected
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

  it('should unclick when clicking the same level that is already selected', async () => {
    const mockOnEntryDelete = jest.fn();
    const propsWithMockDelete = {
      ...defaultProps,
      onEntryDelete: mockOnEntryDelete,
    };

    const { getByText } = render(<HabitDashboard {...propsWithMockDelete} />);

    // Verify that "Good" level is currently selected (shows completion badge)
    expect(getByText('✅ Good')).toBeTruthy();

    // Click on the "Good" button again (the same level that's already selected)
    const goodButton = getByText('Good');
    fireEvent.press(goodButton);

    // Should call onEntryDelete with the existing entry
    await waitFor(() => {
      expect(mockOnEntryDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-1',
          habitId: '1',
          levelId: '2',
          date: expect.any(String),
        })
      );
    });

    // Should show unclick confirmation
    expect(Alert.alert).toHaveBeenCalledWith(
      'Habit Unclicked',
      'Exercise has been unmarked for today',
      [{ text: 'OK' }]
    );
  });

  it('should switch to different level when clicking a different level', async () => {
    const mockOnEntryUpdate = jest.fn();
    const propsWithMockUpdate = {
      ...defaultProps,
      onEntryUpdate: mockOnEntryUpdate,
    };

    const { getByText } = render(<HabitDashboard {...propsWithMockUpdate} />);

    // Verify that "Good" level is currently selected
    expect(getByText('✅ Good')).toBeTruthy();

    // Click on "Excellent" button (different level)
    const excellentButton = getByText('Excellent');
    fireEvent.press(excellentButton);

    // Should call onEntryUpdate to switch to the new level
    await waitFor(() => {
      expect(mockOnEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-1',
          habitId: '1',
          levelId: '3', // Excellent level
          date: expect.any(String),
        })
      );
    });

    // Should show success message for the new level
    expect(Alert.alert).toHaveBeenCalledWith(
      'Great!',
      'Exercise: Excellent - 45 min full workout',
      [{ text: 'OK' }]
    );
  });

  it('should create new entry when clicking a level with no existing entry', async () => {
    const mockOnEntryAdd = jest.fn();
    const propsWithNoEntries = {
      ...defaultProps,
      entries: [], // No existing entries
      onEntryAdd: mockOnEntryAdd,
    };

    const { getByText } = render(<HabitDashboard {...propsWithNoEntries} />);

    // Click on "Basic" button
    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    // Should call onEntryAdd to create new entry
    await waitFor(() => {
      expect(mockOnEntryAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          habitId: '1',
          levelId: '1', // Basic level
          date: expect.any(String),
        })
      );
    });
  });

  it('should display updated hint text for unclick functionality', () => {
    const { getByText } = render(<HabitDashboard {...defaultProps} />);

    // Should show the updated hint text that mentions unclick
    expect(getByText('Tap the same level to unclick, or tap another level to change')).toBeTruthy();
  });

  it('should not call onEntryDelete when clicking different level', async () => {
    const mockOnEntryDelete = jest.fn();
    const mockOnEntryUpdate = jest.fn();
    const propsWithMocks = {
      ...defaultProps,
      onEntryDelete: mockOnEntryDelete,
      onEntryUpdate: mockOnEntryUpdate,
    };

    const { getByText } = render(<HabitDashboard {...propsWithMocks} />);

    // Click on "Basic" button (different from currently selected "Good")
    const basicButton = getByText('Basic');
    fireEvent.press(basicButton);

    // Should NOT call onEntryDelete
    expect(mockOnEntryDelete).not.toHaveBeenCalled();

    // Should call onEntryUpdate instead
    await waitFor(() => {
      expect(mockOnEntryUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          levelId: '1', // Basic level
        })
      );
    });
  });

  it('should handle unclick correctly with multiple habits', async () => {
    const multipleHabits: Habit[] = [
      ...mockHabits,
      {
        id: '2',
        name: 'Reading',
        description: 'Daily reading habit',
        levels: [
          { id: '1', name: 'Basic', description: '5 pages', value: 1 },
          { id: '2', name: 'Good', description: '15 pages', value: 2 },
        ],
        createdAt: new Date('2023-01-02'),
        status: 'active',
      },
    ];

    const multipleEntries: HabitEntry[] = [
      ...mockEntries,
      {
        id: 'entry-2',
        habitId: '2',
        date: new Date().toISOString().split('T')[0],
        levelId: '1', // Basic level for Reading
        timestamp: new Date(),
      },
    ];

    const mockOnEntryDelete = jest.fn();
    const propsWithMultiple = {
      ...defaultProps,
      habits: multipleHabits,
      entries: multipleEntries,
      onEntryDelete: mockOnEntryDelete,
    };

    const { getAllByText } = render(<HabitDashboard {...propsWithMultiple} />);

    // Click on "Basic" button for Reading habit (should unclick)
    const basicButtons = getAllByText('Basic');
    fireEvent.press(basicButtons[1]); // Second "Basic" button (for Reading)

    // Should call onEntryDelete for the Reading habit entry
    await waitFor(() => {
      expect(mockOnEntryDelete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-2',
          habitId: '2',
          levelId: '1',
        })
      );
    });
  });
});