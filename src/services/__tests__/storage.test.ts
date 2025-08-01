import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService } from '../storage';
import { Habit, HabitEntry } from '../../types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('StorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  const mockEntry: HabitEntry = {
    id: '1',
    habitId: '1',
    date: '2023-01-01',
    levelId: '1',
    timestamp: new Date('2023-01-01T10:00:00Z'),
  };

  describe('getHabits', () => {
    it('should return empty array when no habits stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.getHabits();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('mini_habit_tracker_habits');
    });

    it('should return parsed habits with Date objects', async () => {
      const storedHabits = [
        {
          ...mockHabit,
          createdAt: mockHabit.createdAt.toISOString(),
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedHabits));

      const result = await StorageService.getHabits();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockHabit);
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should return empty array on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await StorageService.getHabits();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading habits:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('saveHabit', () => {
    it('should add new habit to storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await StorageService.saveHabit(mockHabit);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_habits',
        JSON.stringify([mockHabit])
      );
    });

    it('should update existing habit in storage', async () => {
      const existingHabits = [mockHabit];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingHabits));

      const updatedHabit = { ...mockHabit, name: 'Updated Habit' };
      await StorageService.saveHabit(updatedHabit);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_habits',
        JSON.stringify([updatedHabit])
      );
    });

    it('should throw error on storage failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(StorageService.saveHabit(mockHabit)).rejects.toThrow('Storage error');
    });
  });

  describe('deleteHabit', () => {
    it('should remove habit and its entries', async () => {
      const habits = [mockHabit, { ...mockHabit, id: '2' }];
      const entries = [mockEntry, { ...mockEntry, id: '2', habitId: '2' }];

      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(habits))
        .mockResolvedValueOnce(JSON.stringify(entries));

      await StorageService.deleteHabit('1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_habits',
        JSON.stringify([{ ...mockHabit, id: '2' }])
      );
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_entries',
        JSON.stringify([{ ...mockEntry, id: '2', habitId: '2' }])
      );
    });

    it('should throw error on storage failure', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(StorageService.deleteHabit('1')).rejects.toThrow('Storage error');
    });
  });

  describe('getEntries', () => {
    it('should return empty array when no entries stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await StorageService.getEntries();

      expect(result).toEqual([]);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('mini_habit_tracker_entries');
    });

    it('should return parsed entries with Date objects', async () => {
      const storedEntries = [
        {
          ...mockEntry,
          timestamp: mockEntry.timestamp.toISOString(),
        },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(storedEntries));

      const result = await StorageService.getEntries();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockEntry);
      expect(result[0].timestamp).toBeInstanceOf(Date);
    });

    it('should return empty array on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await StorageService.getEntries();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading entries:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('saveEntry', () => {
    it('should add new entry to storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      await StorageService.saveEntry(mockEntry);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_entries',
        JSON.stringify([mockEntry])
      );
    });

    it('should update existing entry in storage', async () => {
      const existingEntries = [mockEntry];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(existingEntries));

      const updatedEntry = { ...mockEntry, levelId: '2' };
      await StorageService.saveEntry(updatedEntry);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'mini_habit_tracker_entries',
        JSON.stringify([updatedEntry])
      );
    });

    it('should throw error on storage failure', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

      await expect(StorageService.saveEntry(mockEntry)).rejects.toThrow('Storage error');
    });
  });

  describe('getEntriesForHabit', () => {
    it('should return entries for specific habit', async () => {
      const entries = [
        mockEntry,
        { ...mockEntry, id: '2', habitId: '2' },
      ];
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(entries));

      const result = await StorageService.getEntriesForHabit('1');

      expect(result).toHaveLength(1);
      expect(result[0].habitId).toBe('1');
    });

    it('should return empty array on error', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await StorageService.getEntriesForHabit('1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading entries:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});