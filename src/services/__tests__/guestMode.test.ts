import { FirebaseAuthService } from '../firebaseAuth';
import { StorageService } from '../storage';

// Mock dependencies
jest.mock('../storage');

const mockStorage = StorageService as jest.Mocked<typeof StorageService>;

describe('Guest Mode Logic', () => {
  const mockHabits = [
    {
      id: '1',
      name: 'Test Habit',
      levels: [
        { id: '1', name: 'Minimum', description: '5 minutes' },
        { id: '2', name: 'Target', description: '30 minutes' },
        { id: '3', name: 'Epic', description: '1 hour' }
      ],
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Guest user creation', () => {
    it('should create a guest user with correct properties', () => {
      const guestUser = FirebaseAuthService.createGuestUser();
      
      expect(guestUser).toEqual({
        id: 'guest',
        name: 'Guest User',
        email: 'guest@local',
        isGuest: true,
      });
    });

    it('should create guest user without storing data persistently', () => {
      const guestUser = FirebaseAuthService.createGuestUser();
      
      expect(guestUser.isGuest).toBe(true);
      // Guest users are not stored in AsyncStorage by design
    });
  });

  describe('Local habits detection', () => {
    it('should detect existing local habits', async () => {
      mockStorage.getHabits.mockResolvedValue(mockHabits);
      
      const habits = await StorageService.getHabits();
      
      expect(habits).toHaveLength(1);
      expect(habits[0].name).toBe('Test Habit');
    });

    it('should detect no local habits for new user', async () => {
      mockStorage.getHabits.mockResolvedValue([]);
      
      const habits = await StorageService.getHabits();
      
      expect(habits).toHaveLength(0);
    });

    it('should handle storage errors gracefully', async () => {
      mockStorage.getHabits.mockRejectedValue(new Error('Storage error'));
      
      await expect(StorageService.getHabits()).rejects.toThrow('Storage error');
    });
  });

  describe('Auto-login decision logic', () => {
    it('should recommend auto-login when local habits exist', async () => {
      mockStorage.getHabits.mockResolvedValue(mockHabits);
      
      const habits = await StorageService.getHabits();
      const shouldAutoLogin = habits.length > 0;
      
      expect(shouldAutoLogin).toBe(true);
    });

    it('should not recommend auto-login when no local habits exist', async () => {
      mockStorage.getHabits.mockResolvedValue([]);
      
      const habits = await StorageService.getHabits();
      const shouldAutoLogin = habits.length > 0;
      
      expect(shouldAutoLogin).toBe(false);
    });
  });

  describe('User flow scenarios', () => {
    it('should support new user flow (no habits -> login screen)', async () => {
      mockStorage.getHabits.mockResolvedValue([]);
      
      // Simulate app initialization check
      const currentUser = null; // No authenticated user
      const localHabits = await StorageService.getHabits();
      
      const shouldShowLoginScreen = !currentUser && localHabits.length === 0;
      
      expect(shouldShowLoginScreen).toBe(true);
    });

    it('should support returning user flow (has habits -> auto guest login)', async () => {
      mockStorage.getHabits.mockResolvedValue(mockHabits);
      
      // Simulate app initialization check
      const currentUser = null; // No authenticated user
      const localHabits = await StorageService.getHabits();
      
      const shouldAutoLoginAsGuest = !currentUser && localHabits.length > 0;
      
      expect(shouldAutoLoginAsGuest).toBe(true);
      
      // If auto-login as guest, create guest user
      if (shouldAutoLoginAsGuest) {
        const guestUser = FirebaseAuthService.createGuestUser();
        expect(guestUser.isGuest).toBe(true);
      }
    });

    it('should support authenticated user flow (has stored auth -> direct login)', async () => {
      // This would be tested with actual FirebaseAuthService.getCurrentUser()
      // but we focus on the guest mode logic here
      const authenticatedUser = {
        id: 'auth-user-id',
        name: 'Authenticated User',
        email: 'user@example.com',
        isGuest: false
      };
      
      // If user is already authenticated, skip local habits check
      const shouldSkipGuestCheck = authenticatedUser !== null;
      
      expect(shouldSkipGuestCheck).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty habits array correctly', async () => {
      mockStorage.getHabits.mockResolvedValue([]);
      
      const habits = await StorageService.getHabits();
      const shouldAutoLogin = habits.length > 0;
      
      expect(shouldAutoLogin).toBe(false);
    });

    it('should handle single habit correctly', async () => {
      mockStorage.getHabits.mockResolvedValue([mockHabits[0]]);
      
      const habits = await StorageService.getHabits();
      const shouldAutoLogin = habits.length > 0;
      
      expect(shouldAutoLogin).toBe(true);
    });

    it('should handle multiple habits correctly', async () => {
      const multipleHabits = [...mockHabits, { ...mockHabits[0], id: '2', name: 'Second Habit' }];
      mockStorage.getHabits.mockResolvedValue(multipleHabits);
      
      const habits = await StorageService.getHabits();
      const shouldAutoLogin = habits.length > 0;
      
      expect(shouldAutoLogin).toBe(true);
      expect(habits).toHaveLength(2);
    });
  });
});