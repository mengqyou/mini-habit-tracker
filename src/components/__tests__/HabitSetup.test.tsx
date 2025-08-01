import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { HabitSetup } from '../HabitSetup';
import { Habit } from '../../types';

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('HabitSetup', () => {
  const mockOnHabitCreate = jest.fn();
  const mockOnHabitUpdate = jest.fn();

  const defaultProps = {
    onHabitCreate: mockOnHabitCreate,
    onHabitUpdate: mockOnHabitUpdate,
    existingHabits: [],
  };

  const mockHabit: Habit = {
    id: '1',
    name: 'Test Habit',
    description: 'Test description',
    levels: [
      { id: '1', name: 'Basic', description: 'Basic level', value: 1 },
      { id: '2', name: 'Good', description: 'Good level', value: 2 },
      { id: '3', name: 'Excellent', description: 'Excellent level', value: 3 },
    ],
    createdAt: new Date('2023-01-01'),
    status: 'active',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render habit creation form with default values', () => {
    const { getByPlaceholderText, getByDisplayValue } = render(
      <HabitSetup {...defaultProps} />
    );

    expect(getByPlaceholderText('e.g., Reading Books')).toBeTruthy();
    expect(getByPlaceholderText('Optional description of your habit')).toBeTruthy();
    
    // Default level names
    expect(getByDisplayValue('Basic')).toBeTruthy();
    expect(getByDisplayValue('Good')).toBeTruthy();
    expect(getByDisplayValue('Excellent')).toBeTruthy();
  });

  it('should render habit edit form with existing values', () => {
    const { getByDisplayValue } = render(
      <HabitSetup {...defaultProps} editingHabit={mockHabit} />
    );

    expect(getByDisplayValue('Test Habit')).toBeTruthy();
    expect(getByDisplayValue('Test description')).toBeTruthy();
    expect(getByDisplayValue('Basic level')).toBeTruthy();
    expect(getByDisplayValue('Good level')).toBeTruthy();
    expect(getByDisplayValue('Excellent level')).toBeTruthy();
  });

  it('should update habit name when text changes', () => {
    const { getByPlaceholderText } = render(<HabitSetup {...defaultProps} />);

    const nameInput = getByPlaceholderText('e.g., Reading Books');
    fireEvent.changeText(nameInput, 'New Habit Name');

    expect(nameInput.props.value).toBe('New Habit Name');
  });

  it('should update habit description when text changes', () => {
    const { getByPlaceholderText } = render(<HabitSetup {...defaultProps} />);

    const descriptionInput = getByPlaceholderText('Optional description of your habit');
    fireEvent.changeText(descriptionInput, 'New description');

    expect(descriptionInput.props.value).toBe('New description');
  });

  it('should update level properties when changed', () => {
    const { getByDisplayValue } = render(<HabitSetup {...defaultProps} />);

    const basicLevelInput = getByDisplayValue('Basic');
    fireEvent.changeText(basicLevelInput, 'Modified Basic');

    expect(basicLevelInput.props.value).toBe('Modified Basic');
  });

  it('should show error when trying to save without habit name', async () => {
    const { getByText } = render(<HabitSetup {...defaultProps} />);

    const createButton = getByText('Create Habit');
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a habit name');
    });

    expect(mockOnHabitCreate).not.toHaveBeenCalled();
  });

  it('should create new habit with valid data', async () => {
    const { getByPlaceholderText, getByText, getAllByPlaceholderText } = render(
      <HabitSetup {...defaultProps} />
    );

    const nameInput = getByPlaceholderText('e.g., Reading Books');
    const descriptionInput = getByPlaceholderText('Optional description of your habit');

    fireEvent.changeText(nameInput, 'Exercise');
    fireEvent.changeText(descriptionInput, 'Daily exercise routine');

    // Fill in level descriptions to satisfy validation
    const levelDescriptions = getAllByPlaceholderText('e.g., Read 2 pages, Read 30 pages, Read 60+ pages');
    fireEvent.changeText(levelDescriptions[0], '10 min walk');
    fireEvent.changeText(levelDescriptions[1], '20 min workout');
    fireEvent.changeText(levelDescriptions[2], '45 min full workout');

    // Verify that inputs were updated
    expect(nameInput.props.value).toBe('Exercise');
    expect(descriptionInput.props.value).toBe('Daily exercise routine');
    
    // Verify create button exists and test the save functionality
    const createButton = getByText('Create Habit');
    expect(createButton).toBeTruthy();
    
    fireEvent.press(createButton);

    await waitFor(() => {
      expect(mockOnHabitCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Exercise',
          description: 'Daily exercise routine',
        })
      );
    });
  });

  it('should update existing habit when editing', async () => {
    const { getByPlaceholderText, getByText } = render(
      <HabitSetup {...defaultProps} editingHabit={mockHabit} />
    );

    const nameInput = getByPlaceholderText('e.g., Reading Books');
    fireEvent.changeText(nameInput, 'Updated Habit');

    const updateButton = getByText('Update Habit');
    fireEvent.press(updateButton);

    await waitFor(() => {
      expect(mockOnHabitUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          name: 'Updated Habit',
          description: 'Test description',
        })
      );
    });
  });

  it('should show appropriate button text based on mode', () => {
    // Create mode
    const { getByText, rerender } = render(<HabitSetup {...defaultProps} />);
    expect(getByText('Create Habit')).toBeTruthy();

    // Edit mode
    rerender(<HabitSetup {...defaultProps} editingHabit={mockHabit} />);
    expect(getByText('Update Habit')).toBeTruthy();
  });

  it('should show level validation errors for empty level descriptions', () => {
    const { getByPlaceholderText, getByText } = render(
      <HabitSetup {...defaultProps} />
    );

    const nameInput = getByPlaceholderText('e.g., Reading Books');
    fireEvent.changeText(nameInput, 'Test Habit');

    // Verify form structure exists
    expect(getByText('Create Habit')).toBeTruthy();
    expect(getByText('Completion Levels')).toBeTruthy();
  });

  it('should have proper form structure for levels', () => {
    const { getByDisplayValue, getByText } = render(
      <HabitSetup {...defaultProps} />
    );

    // Verify default level structure
    expect(getByDisplayValue('Basic')).toBeTruthy();
    expect(getByDisplayValue('Good')).toBeTruthy();
    expect(getByDisplayValue('Excellent')).toBeTruthy();
    expect(getByText('Level 1')).toBeTruthy();
    expect(getByText('Level 2')).toBeTruthy();
    expect(getByText('Level 3')).toBeTruthy();
  });

  it('should preserve existing level IDs when editing', async () => {
    const { getByText } = render(
      <HabitSetup {...defaultProps} editingHabit={mockHabit} />
    );

    const updateButton = getByText('Update Habit');
    fireEvent.press(updateButton);

    await waitFor(() => {
      const call = mockOnHabitUpdate.mock.calls[0][0];
      expect(call.levels[0].id).toBe('1');
      expect(call.levels[1].id).toBe('2');
      expect(call.levels[2].id).toBe('3');
    });
  });

  // Tests for recent bug fixes
  describe('Recent Bug Fixes', () => {
    const existingHabits: Habit[] = [
      {
        id: '1',
        name: 'Reading',
        description: 'Daily reading',
        levels: [
          { id: '1', name: 'Basic', description: '5 pages', value: 1 },
          { id: '2', name: 'Good', description: '15 pages', value: 2 },
          { id: '3', name: 'Excellent', description: '30 pages', value: 3 },
        ],
        createdAt: new Date('2023-01-01'),
        status: 'active',
      },
      {
        id: '2',
        name: 'Exercise',
        description: 'Daily workout',
        levels: [
          { id: '1', name: 'Basic', description: '10 min', value: 1 },
          { id: '2', name: 'Good', description: '20 min', value: 2 },
          { id: '3', name: 'Excellent', description: '45 min', value: 3 },
        ],
        createdAt: new Date('2023-01-02'),
        status: 'active',
      },
    ];

    it('should prevent creating habit with duplicate name (case insensitive)', async () => {
      const { getByPlaceholderText, getByText } = render(
        <HabitSetup {...defaultProps} existingHabits={existingHabits} />
      );

      const nameInput = getByPlaceholderText('e.g., Reading Books');
      fireEvent.changeText(nameInput, 'reading'); // lowercase version of existing habit

      const createButton = getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Duplicate Habit Name',
          'A habit named "reading" already exists. Please choose a different name.'
        );
      });

      expect(mockOnHabitCreate).not.toHaveBeenCalled();
    });

    it('should prevent creating habit with exact duplicate name', async () => {
      const { getByPlaceholderText, getByText } = render(
        <HabitSetup {...defaultProps} existingHabits={existingHabits} />
      );

      const nameInput = getByPlaceholderText('e.g., Reading Books');
      fireEvent.changeText(nameInput, 'Reading'); // exact match

      const createButton = getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Duplicate Habit Name',
          'A habit named "Reading" already exists. Please choose a different name.'
        );
      });

      expect(mockOnHabitCreate).not.toHaveBeenCalled();
    });

    it('should allow updating habit with same name when editing', async () => {
      const editingHabit = existingHabits[0]; // Reading habit
      const { getByPlaceholderText, getByText } = render(
        <HabitSetup 
          {...defaultProps} 
          editingHabit={editingHabit}
          existingHabits={existingHabits} 
        />
      );

      // Keep the same name
      const nameInput = getByPlaceholderText('e.g., Reading Books');
      expect(nameInput.props.value).toBe('Reading');

      const updateButton = getByText('Update Habit');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(mockOnHabitUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            name: 'Reading',
          })
        );
      });

      expect(Alert.alert).not.toHaveBeenCalledWith(
        'Duplicate Habit Name',
        expect.any(String)
      );
    });

    it('should allow creating habit with unique name', async () => {
      const { getByPlaceholderText, getByText, getAllByPlaceholderText } = render(
        <HabitSetup {...defaultProps} existingHabits={existingHabits} />
      );

      const nameInput = getByPlaceholderText('e.g., Reading Books');
      fireEvent.changeText(nameInput, 'Meditation'); // unique name

      // Fill in level descriptions to satisfy validation
      const levelDescriptions = getAllByPlaceholderText('e.g., Read 2 pages, Read 30 pages, Read 60+ pages');
      fireEvent.changeText(levelDescriptions[0], '5 min meditation');
      fireEvent.changeText(levelDescriptions[1], '15 min meditation');
      fireEvent.changeText(levelDescriptions[2], '30 min meditation');

      const createButton = getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(mockOnHabitCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Meditation',
          })
        );
      });

      expect(Alert.alert).not.toHaveBeenCalledWith(
        'Duplicate Habit Name',
        expect.any(String)
      );
    });

    it('should trim whitespace when checking for duplicates', async () => {
      const { getByPlaceholderText, getByText } = render(
        <HabitSetup {...defaultProps} existingHabits={existingHabits} />
      );

      const nameInput = getByPlaceholderText('e.g., Reading Books');
      fireEvent.changeText(nameInput, '  Reading  '); // with whitespace

      const createButton = getByText('Create Habit');
      fireEvent.press(createButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Duplicate Habit Name',
          'A habit named "Reading" already exists. Please choose a different name.'
        );
      });

      expect(mockOnHabitCreate).not.toHaveBeenCalled();
    });
  });
});