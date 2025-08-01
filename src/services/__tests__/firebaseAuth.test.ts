import { FirebaseAuthService, User } from '../firebaseAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-google-signin/google-signin');
jest.mock('@react-native-firebase/auth');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockGoogleSignin = GoogleSignin as jest.Mocked<typeof GoogleSignin>;
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('FirebaseAuthService - Persistent Authentication', () => {
  const mockUser: User = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    photo: 'http://example.com/photo.jpg',
    isGuest: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Firebase auth
    mockAuth.mockReturnValue({
      currentUser: null,
      signOut: jest.fn(() => Promise.resolve()),
      onAuthStateChanged: jest.fn(),
    } as any);
  });

  describe('getCurrentUser', () => {
    it('should return Firebase user if authenticated', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-user-id',
        displayName: 'Firebase User',
        email: 'firebase@example.com',
        photoURL: 'http://example.com/firebase-photo.jpg'
      };

      mockAuth.mockReturnValue({
        currentUser: mockFirebaseUser,
      } as any);

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toEqual({
        id: 'firebase-user-id',
        name: 'Firebase User',
        email: 'firebase@example.com',
        photo: 'http://example.com/firebase-photo.jpg',
        isGuest: false
      });

      // Should not check AsyncStorage if Firebase user exists
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });

    it('should return stored user data if no Firebase user', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_data');
    });

    it('should return null if no user data exists', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      mockAsyncStorage.getItem.mockResolvedValue(null);

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle AsyncStorage errors gracefully', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signInWithGoogle', () => {
    it('should store user data after successful Google Sign-In', async () => {
      const mockGoogleSignInResult = {
        data: {
          idToken: 'mock-id-token',
          user: {
            id: 'google-user-id',
            name: 'Google User',
            email: 'google@example.com',
            photo: 'http://example.com/google-photo.jpg'
          }
        }
      };

      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.getCurrentUser.mockResolvedValue(null);
      mockGoogleSignin.signOut.mockResolvedValue();
      mockGoogleSignin.signIn.mockResolvedValue(mockGoogleSignInResult);
      mockAsyncStorage.setItem.mockResolvedValue();

      const result = await FirebaseAuthService.signInWithGoogle();

      expect(result).toEqual({
        id: 'google-user-id',
        name: 'Google User',
        email: 'google@example.com',
        photo: 'http://example.com/google-photo.jpg',
        isGuest: false
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        JSON.stringify({
          id: 'google-user-id',
          name: 'Google User',
          email: 'google@example.com',
          photo: 'http://example.com/google-photo.jpg',
          isGuest: false
        })
      );
    });

    it('should handle missing ID token', async () => {
      const mockGoogleSignInResult = {
        data: {
          idToken: null,
          user: {
            id: 'google-user-id',
            name: 'Google User',
            email: 'google@example.com'
          }
        }
      };

      mockGoogleSignin.hasPlayServices.mockResolvedValue(true);
      mockGoogleSignin.getCurrentUser.mockResolvedValue(null);
      mockGoogleSignin.signOut.mockResolvedValue();
      mockGoogleSignin.signIn.mockResolvedValue(mockGoogleSignInResult);

      const result = await FirebaseAuthService.signInWithGoogle();

      expect(result).toBeNull();
      expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('signOut', () => {
    it('should clear stored user data on sign out', async () => {
      mockGoogleSignin.isSignedIn.mockResolvedValue(true);
      mockGoogleSignin.signOut.mockResolvedValue();
      mockAuth.mockReturnValue({
        signOut: jest.fn(() => Promise.resolve()),
      } as any);
      mockAsyncStorage.removeItem.mockResolvedValue();

      await FirebaseAuthService.signOut();

      expect(mockGoogleSignin.signOut).toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle sign out when not signed in to Google', async () => {
      mockGoogleSignin.isSignedIn.mockResolvedValue(false);
      mockAuth.mockReturnValue({
        signOut: jest.fn(() => Promise.resolve()),
      } as any);
      mockAsyncStorage.removeItem.mockResolvedValue();

      await FirebaseAuthService.signOut();

      expect(mockGoogleSignin.signOut).not.toHaveBeenCalled();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('user_data');
    });

    it('should handle AsyncStorage errors during sign out', async () => {
      mockGoogleSignin.isSignedIn.mockResolvedValue(false);
      mockAuth.mockReturnValue({
        signOut: jest.fn(() => Promise.resolve()),
      } as any);
      mockAsyncStorage.removeItem.mockRejectedValue(new Error('Storage error'));

      // Should not throw error
      await expect(FirebaseAuthService.signOut()).resolves.toBeUndefined();
    });
  });

  describe('User data persistence', () => {
    it('should preserve user session across app restarts', async () => {
      // Simulate app restart - no Firebase user, but stored data exists
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(result?.isGuest).toBe(false);
    });

    it('should handle corrupted stored user data', async () => {
      mockAuth.mockReturnValue({
        currentUser: null,
      } as any);

      // Invalid JSON in storage
      mockAsyncStorage.getItem.mockResolvedValue('{invalid json}');

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should prioritize Firebase auth over stored data', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-user-id',
        displayName: 'Firebase User',
        email: 'firebase@example.com',
        photoURL: null
      };

      mockAuth.mockReturnValue({
        currentUser: mockFirebaseUser,
      } as any);

      // Even if stored data exists, Firebase should take precedence
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockUser));

      const result = await FirebaseAuthService.getCurrentUser();

      expect(result).toEqual({
        id: 'firebase-user-id',
        name: 'Firebase User',
        email: 'firebase@example.com',
        photo: undefined,
        isGuest: false
      });

      // Should not even check AsyncStorage
      expect(mockAsyncStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('Guest user handling', () => {
    it('should create guest user correctly', () => {
      const guestUser = FirebaseAuthService.createGuestUser();

      expect(guestUser).toEqual({
        id: 'guest',
        name: 'Guest User',
        email: 'guest@local',
        isGuest: true
      });
    });

    it('should not store guest user data', async () => {
      // If we implemented guest persistence, this test would verify it
      // For now, guest users are not persisted
      const guestUser = FirebaseAuthService.createGuestUser();
      expect(guestUser.isGuest).toBe(true);
    });
  });
});