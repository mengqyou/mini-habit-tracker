import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { User } from '../services/firebaseAuth';
import { FirebaseAuthService } from '../services/firebaseAuth';
import { FirebaseStorageService } from '../services/firebaseStorage';
import { StorageService } from '../services/storage';

interface SettingsScreenProps {
  user: User | null;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout }) => {
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This will permanently remove all your habits, progress data, and statistics. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Final Confirmation',
      'This is your last chance to cancel. Your account and ALL data will be permanently deleted. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Everything',
          style: 'destructive',
          onPress: executeAccountDeletion,
        },
      ]
    );
  };

  const executeAccountDeletion = async () => {
    try {
      if (user && !user.isGuest) {
        // Delete from Firebase
        await FirebaseStorageService.deleteAllUserData(user.id);
        await FirebaseAuthService.deleteAccount();
      }
      
      // Clear local storage
      await StorageService.clearAllData();
      
      Alert.alert(
        'Account Deleted',
        'Your account and all data have been permanently deleted.',
        [{ text: 'OK', onPress: onLogout }]
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert(
        'Deletion Error',
        'There was an error deleting your account. Please try again or contact support at thinkfluxai@gmail.com',
        [{ text: 'OK' }]
      );
    }
  };

  const handleExportData = async () => {
    try {
      const habits = await StorageService.getHabits();
      const entries = await StorageService.getEntries();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        user: user?.email || 'Guest User',
        habits,
        entries,
      };
      
      Alert.alert(
        'Data Export',
        `Your data is ready for export:\n\n- ${habits.length} habits\n- ${entries.length} entries\n\nNote: In a full version, this would save a file to your device.`,
        [{ text: 'OK' }]
      );
      
      // In a production app, you would save this to a file or share it
      console.log('Export data:', JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://mengqyou.github.io/mini-habit-tracker/privacy-policy.html');
  };

  const openDeleteAccountPage = () => {
    Linking.openURL('https://mengqyou.github.io/mini-habit-tracker/delete-account.html');
  };

  const contactSupport = () => {
    const email = 'thinkfluxai@gmail.com';
    const subject = 'MiniHabitTracker Support Request';
    const body = `Hi,\n\nI need help with my MiniHabitTracker account.\n\nAccount: ${user?.email || 'Guest User'}\nIssue: [Please describe your issue here]\n\nThanks!`;
    
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    Linking.openURL(mailto);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>Status:</Text>
            <Text style={styles.accountValue}>
              {user?.isGuest ? 'Guest User (Local Storage)' : 'Signed In (Cloud Sync)'}
            </Text>
            {!user?.isGuest && (
              <>
                <Text style={styles.accountLabel}>Email:</Text>
                <Text style={styles.accountValue}>{user?.email}</Text>
              </>
            )}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingButton} onPress={handleExportData}>
            <Text style={styles.settingButtonText}>📥 Export My Data</Text>
            <Text style={styles.settingDescription}>Download your habits and progress</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>🗑️ Delete Account</Text>
            <Text style={styles.settingDescription}>Permanently delete all data</Text>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.settingButton} onPress={onLogout}>
            <Text style={styles.settingButtonText}>
              {user?.isGuest ? '🔄 Switch to Cloud Sync' : '🚪 Sign Out'}
            </Text>
            <Text style={styles.settingDescription}>
              {user?.isGuest ? 'Sign in to sync across devices' : 'Return to login screen'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Support</Text>
          
          <TouchableOpacity style={styles.linkButton} onPress={openPrivacyPolicy}>
            <Text style={styles.linkButtonText}>📋 Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={openDeleteAccountPage}>
            <Text style={styles.linkButtonText}>🌐 Data Deletion Request</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.linkButton} onPress={contactSupport}>
            <Text style={styles.linkButtonText}>📧 Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <Text style={styles.infoText}>MiniHabitTracker v1.0 (34)</Text>
          <Text style={styles.infoText}>Build better habits, track your progress</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  accountInfo: {
    paddingLeft: 10,
  },
  accountLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  accountValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  settingButton: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  settingButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  dangerButton: {
    backgroundColor: '#fff5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e53e3e',
    marginBottom: 5,
  },
  linkButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  linkButtonText: {
    fontSize: 16,
    color: '#2b6cb0',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 5,
  },
});