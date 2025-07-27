import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { AuthService, User } from '../services/auth';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await AuthService.signIn();
      if (user) {
        onLoginSuccess(user);
      } else {
        Alert.alert(
          'Google Sign-In Not Available', 
          'Google Sign-In is not configured yet. Please continue as guest to use the app.',
          [
            { text: 'Continue as Guest', onPress: handleSkipLogin },
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Google Sign-In Not Available', 
        'Google Sign-In is not configured yet. Please continue as guest to use the app.',
        [
          { text: 'Continue as Guest', onPress: handleSkipLogin },
          { text: 'OK' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipLogin = () => {
    const guestUser: User = {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@local',
    };
    onLoginSuccess(guestUser);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mini Habit Tracker</Text>
        <Text style={styles.subtitle}>Track your daily habits and build consistency</Text>
        
        <View style={styles.features}>
          <Text style={styles.featureItem}>✓ Create custom habits with 3 levels</Text>
          <Text style={styles.featureItem}>✓ Daily tracking with easy buttons</Text>
          <Text style={styles.featureItem}>✓ View weekly, monthly & yearly summaries</Text>
          <Text style={styles.featureItem}>✓ Track streaks and progress over time</Text>
        </View>
        
        <View style={styles.loginSection}>
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={handleSkipLogin}
            disabled={isLoading}
          >
            <Text style={styles.guestButtonText}>Start Using App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <View style={styles.googleIconContainer}>
                  <Text style={styles.googleIcon}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.note}>
            Google Sign-In coming soon! For now, use the app without an account.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    lineHeight: 22,
  },
  features: {
    marginBottom: 50,
  },
  featureItem: {
    fontSize: 16,
    color: '#555',
    marginBottom: 12,
    paddingLeft: 20,
  },
  loginSection: {
    alignItems: 'center',
  },
  guestButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
    justifyContent: 'center',
  },
  guestButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
    justifyContent: 'center',
  },
  googleIconContainer: {
    backgroundColor: 'white',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});