import { FirebaseAuthService } from '../firebaseAuth';
import { FirebaseStorageService } from '../firebaseStorage';
import { StorageService } from '../storage';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';

// Mock dependencies
jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-google-signin/google-signin');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-firebase/firestore');

describe('Account Deletion Services', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    delete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FirebaseAuthService.deleteAccount', () => {
    it('should delete Firebase user account successfully', async () => {
      (auth as jest.MockedFunction<any>).mockReturnValue({
        currentUser: mockUser,
      });
      (GoogleSignin.isSignedIn as jest.Mock).mockResolvedValue(true);
      (GoogleSignin.signOut as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await FirebaseAuthService.deleteAccount();

      expect(mockUser.delete).toHaveBeenCalled();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle case when no Firebase user exists', async () => {
      (auth as jest.MockedFunction<any>).mockReturnValue({
        currentUser: null,
      });
      (GoogleSignin.isSignedIn as jest.Mock).mockResolvedValue(false);

      await expect(FirebaseAuthService.deleteAccount()).resolves.not.toThrow();
      expect(GoogleSignin.signOut).not.toHaveBeenCalled();
    });

    it('should handle Google Sign-In sign out when user is signed in', async () => {
      (auth as jest.MockedFunction<any>).mockReturnValue({
        currentUser: mockUser,
      });
      (GoogleSignin.isSignedIn as jest.Mock).mockResolvedValue(true);
      (GoogleSignin.signOut as jest.Mock).mockResolvedValue(undefined);

      await FirebaseAuthService.deleteAccount();

      expect(GoogleSignin.isSignedIn).toHaveBeenCalled();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
    });

    it('should handle errors during account deletion', async () => {
      const deleteError = new Error('Firebase deletion failed');
      (auth as jest.MockedFunction<any>).mockReturnValue({
        currentUser: {
          ...mockUser,
          delete: jest.fn().mockRejectedValue(deleteError),
        },
      });

      await expect(FirebaseAuthService.deleteAccount()).rejects.toThrow('Firebase deletion failed');
    });
  });

  describe('FirebaseStorageService.deleteAllUserData', () => {
    const mockBatch = {
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    const mockHabitsSnapshot = {
      size: 2,
      docs: [
        { ref: { id: 'habit1' } },
        { ref: { id: 'habit2' } },
      ],
    };

    const mockEntriesSnapshot = {
      size: 3,
      docs: [
        { ref: { id: 'entry1' } },
        { ref: { id: 'entry2' } },
        { ref: { id: 'entry3' } },
      ],
    };

    beforeEach(() => {
      const mockWhereChain = {
        get: jest.fn()
          .mockResolvedValueOnce(mockHabitsSnapshot)
          .mockResolvedValueOnce(mockEntriesSnapshot),
      };
      
      const mockCollection = {
        where: jest.fn().mockReturnValue(mockWhereChain),
        doc: jest.fn().mockReturnValue({ id: 'user-doc' }),
      };

      (firestore as jest.MockedFunction<any>).mockReturnValue({
        collection: jest.fn().mockReturnValue(mockCollection),
        batch: jest.fn().mockReturnValue(mockBatch),
      });

      // Reset the static properties to use the mocked firestore
      (FirebaseStorageService as any).habitsCollection = mockCollection;
      (FirebaseStorageService as any).entriesCollection = mockCollection;
      (FirebaseStorageService as any).usersCollection = mockCollection;
    });

    it('should delete all user data successfully', async () => {
      await FirebaseStorageService.deleteAllUserData('test-user-id');

      // Should delete all found documents
      expect(mockBatch.delete).toHaveBeenCalledTimes(6); // 2 habits + 3 entries + 1 user doc
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should handle empty collections gracefully', async () => {
      const emptySnapshot = { size: 0, docs: [] };
      const emptyMockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      
      const emptyMockWhereChain = {
        get: jest.fn().mockResolvedValue(emptySnapshot),
      };
      
      const emptyMockCollection = {
        where: jest.fn().mockReturnValue(emptyMockWhereChain),
        doc: jest.fn().mockReturnValue({ id: 'user-doc' }),
      };

      (firestore as jest.MockedFunction<any>).mockReturnValue({
        collection: jest.fn().mockReturnValue(emptyMockCollection),
        batch: jest.fn().mockReturnValue(emptyMockBatch),
      });

      // Reset the static properties to use the mocked firestore
      (FirebaseStorageService as any).habitsCollection = emptyMockCollection;
      (FirebaseStorageService as any).entriesCollection = emptyMockCollection;
      (FirebaseStorageService as any).usersCollection = emptyMockCollection;

      await FirebaseStorageService.deleteAllUserData('test-user-id');

      // Should still delete user document even if no habits/entries
      expect(emptyMockBatch.delete).toHaveBeenCalledTimes(1); // Only user doc
      expect(emptyMockBatch.commit).toHaveBeenCalled();
    });

    it('should handle Firestore errors', async () => {
      const firestoreError = new Error('Firestore connection failed');
      const errorMockWhereChain = {
        get: jest.fn().mockRejectedValue(firestoreError),
      };
      
      const errorMockCollection = {
        where: jest.fn().mockReturnValue(errorMockWhereChain),
        doc: jest.fn().mockReturnValue({ id: 'user-doc' }),
      };

      (firestore as jest.MockedFunction<any>).mockReturnValue({
        collection: jest.fn().mockReturnValue(errorMockCollection),
        batch: jest.fn().mockReturnValue(mockBatch),
      });

      // Reset the static properties to use the mocked firestore
      (FirebaseStorageService as any).habitsCollection = errorMockCollection;
      (FirebaseStorageService as any).entriesCollection = errorMockCollection;
      (FirebaseStorageService as any).usersCollection = errorMockCollection;

      await expect(FirebaseStorageService.deleteAllUserData('test-user-id'))
        .rejects.toThrow('Firestore connection failed');
    });
  });

  describe('StorageService.clearAllData', () => {
    it('should clear all local storage data', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      await StorageService.clearAllData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['mini_habit_tracker_habits', 'mini_habit_tracker_entries']);
    });

    it('should handle AsyncStorage errors', async () => {
      const storageError = new Error('AsyncStorage failed');
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(storageError);

      await expect(StorageService.clearAllData()).rejects.toThrow('AsyncStorage failed');
    });
  });

  describe('Integration: Full Account Deletion Flow', () => {
    it('should execute complete deletion flow for signed-in user', async () => {
      // Setup mocks
      (auth as jest.MockedFunction<any>).mockReturnValue({
        currentUser: mockUser,
      });
      (GoogleSignin.isSignedIn as jest.Mock).mockResolvedValue(true);
      (GoogleSignin.signOut as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      const integrationMockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };

      const integrationMockWhereChain = {
        get: jest.fn().mockResolvedValue({ size: 0, docs: [] }),
      };
      
      const integrationMockCollection = {
        where: jest.fn().mockReturnValue(integrationMockWhereChain),
        doc: jest.fn().mockReturnValue({ id: 'user-doc' }),
      };

      (firestore as jest.MockedFunction<any>).mockReturnValue({
        collection: jest.fn().mockReturnValue(integrationMockCollection),
        batch: jest.fn().mockReturnValue(integrationMockBatch),
      });

      // Reset the static properties to use the mocked firestore
      (FirebaseStorageService as any).habitsCollection = integrationMockCollection;
      (FirebaseStorageService as any).entriesCollection = integrationMockCollection;
      (FirebaseStorageService as any).usersCollection = integrationMockCollection;

      // Execute full flow
      await FirebaseStorageService.deleteAllUserData('test-user-id');
      await FirebaseAuthService.deleteAccount();
      await StorageService.clearAllData();

      // Verify all services were called
      expect(integrationMockBatch.commit).toHaveBeenCalled();
      expect(mockUser.delete).toHaveBeenCalled();
      expect(GoogleSignin.signOut).toHaveBeenCalled();
      expect(AsyncStorage.multiRemove).toHaveBeenCalled();
    });

    it('should execute guest user deletion flow', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockResolvedValue(undefined);

      // For guest users, only local data should be cleared
      await StorageService.clearAllData();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['mini_habit_tracker_habits', 'mini_habit_tracker_entries']);
      
      // Firebase services should not be called for guest users
      expect(mockUser.delete).not.toHaveBeenCalled();
    });
  });
});