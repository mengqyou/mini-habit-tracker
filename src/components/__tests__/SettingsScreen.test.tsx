import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { SettingsScreen } from '../SettingsScreen';
import { FirebaseAuthService } from '../../services/firebaseAuth';
import { FirebaseStorageService } from '../../services/firebaseStorage';
import { StorageService } from '../../services/storage';

// Mock services
jest.mock('../../services/firebaseAuth');
jest.mock('../../services/firebaseStorage');
jest.mock('../../services/storage');
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(() => Promise.resolve()),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  isGuest: false,
};

const mockGuestUser = {
  id: 'guest',
  name: 'Guest User',
  email: 'guest@local',
  isGuest: true,
};

describe('SettingsScreen', () => {
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Information Display', () => {
    it('should display signed-in user information correctly', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      expect(getByText('Signed In (Cloud Sync)')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should display guest user information correctly', () => {
      const { getByText } = render(
        <SettingsScreen user={mockGuestUser} onLogout={mockOnLogout} />
      );

      expect(getByText('Guest User (Local Storage)')).toBeTruthy();
    });
  });

  describe('Account Deletion Flow', () => {
    it('should show initial deletion confirmation dialog', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🗑️ Delete Account'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Account',
        'Are you sure you want to delete your account? This will permanently remove all your habits, progress data, and statistics. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: expect.any(Function),
          },
        ]
      );
    });

    it('should show final confirmation dialog after first confirmation', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🗑️ Delete Account'));

      // Get the first confirmation callback and call it
      const firstConfirmation = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      firstConfirmation();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Final Confirmation',
        'This is your last chance to cancel. Your account and ALL data will be permanently deleted. Are you absolutely sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Delete Everything',
            style: 'destructive',
            onPress: expect.any(Function),
          },
        ]
      );
    });

    it('should execute account deletion for signed-in user', async () => {
      const mockDeleteAllUserData = jest.fn().mockResolvedValue(undefined);
      const mockDeleteAccount = jest.fn().mockResolvedValue(undefined);
      const mockClearAllData = jest.fn().mockResolvedValue(undefined);

      (FirebaseStorageService.deleteAllUserData as jest.Mock) = mockDeleteAllUserData;
      (FirebaseAuthService.deleteAccount as jest.Mock) = mockDeleteAccount;
      (StorageService.clearAllData as jest.Mock) = mockClearAllData;

      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🗑️ Delete Account'));

      // Execute both confirmations
      const firstConfirmation = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      firstConfirmation();

      const finalConfirmation = (Alert.alert as jest.Mock).mock.calls[1][2][1].onPress;
      await finalConfirmation();

      await waitFor(() => {
        expect(mockDeleteAllUserData).toHaveBeenCalledWith('test-user-id');
        expect(mockDeleteAccount).toHaveBeenCalled();
        expect(mockClearAllData).toHaveBeenCalled();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Account Deleted',
        'Your account and all data have been permanently deleted.',
        [{ text: 'OK', onPress: mockOnLogout }]
      );
    });

    it('should execute account deletion for guest user', async () => {
      const mockClearAllData = jest.fn().mockResolvedValue(undefined);
      (StorageService.clearAllData as jest.Mock) = mockClearAllData;

      const { getByText } = render(
        <SettingsScreen user={mockGuestUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🗑️ Delete Account'));

      // Execute both confirmations
      const firstConfirmation = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      firstConfirmation();

      const finalConfirmation = (Alert.alert as jest.Mock).mock.calls[1][2][1].onPress;
      await finalConfirmation();

      await waitFor(() => {
        expect(mockClearAllData).toHaveBeenCalled();
      });

      // Should not call Firebase services for guest user
      expect(FirebaseStorageService.deleteAllUserData).not.toHaveBeenCalled();
      expect(FirebaseAuthService.deleteAccount).not.toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      const mockDeleteAllUserData = jest.fn().mockRejectedValue(new Error('Firebase error'));
      (FirebaseStorageService.deleteAllUserData as jest.Mock) = mockDeleteAllUserData;

      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🗑️ Delete Account'));

      const firstConfirmation = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress;
      firstConfirmation();

      const finalConfirmation = (Alert.alert as jest.Mock).mock.calls[1][2][1].onPress;
      await finalConfirmation();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Deletion Error',
          'There was an error deleting your account. Please try again or contact support at thinkfluxai@gmail.com',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('Data Export', () => {
    it('should export user data successfully', async () => {
      const mockHabits = [{ id: '1', name: 'Exercise' }];
      const mockEntries = [{ id: '1', habitId: '1', date: '2023-01-01' }];

      (StorageService.getHabits as jest.Mock).mockResolvedValue(mockHabits);
      (StorageService.getEntries as jest.Mock).mockResolvedValue(mockEntries);

      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('📥 Export My Data'));

      await waitFor(() => {
        expect(StorageService.getHabits).toHaveBeenCalled();
        expect(StorageService.getEntries).toHaveBeenCalled();
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Data Export',
        expect.stringContaining('1 habits'),
        [{ text: 'OK' }]
      );
    });

    it('should handle export errors', async () => {
      (StorageService.getHabits as jest.Mock).mockRejectedValue(new Error('Export error'));

      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('📥 Export My Data'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Export Error',
          'Failed to export data. Please try again.',
          expect.any(Array)
        );
      });
    });
  });

  describe('External Links', () => {
    it('should open privacy policy link', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('📋 Privacy Policy'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://mengqyou.github.io/mini-habit-tracker/privacy-policy.html'
      );
    });

    it('should open data deletion page', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🌐 Data Deletion Request'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://mengqyou.github.io/mini-habit-tracker/delete-account.html'
      );
    });

    it('should open support email', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('📧 Contact Support'));

      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('mailto:thinkfluxai@gmail.com')
      );
    });
  });

  describe('Account Actions', () => {
    it('should call onLogout when sign out is pressed', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      fireEvent.press(getByText('🚪 Sign Out'));

      expect(mockOnLogout).toHaveBeenCalled();
    });

    it('should show switch to cloud sync option for guest users', () => {
      const { getByText } = render(
        <SettingsScreen user={mockGuestUser} onLogout={mockOnLogout} />
      );

      expect(getByText('🔄 Switch to Cloud Sync')).toBeTruthy();
      
      fireEvent.press(getByText('🔄 Switch to Cloud Sync'));
      expect(mockOnLogout).toHaveBeenCalled();
    });
  });

  describe('UI Rendering', () => {
    it('should render all main sections', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      expect(getByText('Settings')).toBeTruthy();
      expect(getByText('Account Information')).toBeTruthy();
      expect(getByText('Data Management')).toBeTruthy();
      expect(getByText('Account Actions')).toBeTruthy();
      expect(getByText('Privacy & Support')).toBeTruthy();
      expect(getByText('App Information')).toBeTruthy();
    });

    it('should display correct app version', () => {
      const { getByText } = render(
        <SettingsScreen user={mockUser} onLogout={mockOnLogout} />
      );

      expect(getByText('MiniHabitTracker v1.0 (34)')).toBeTruthy();
    });
  });
});