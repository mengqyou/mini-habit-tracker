import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as Keychain from 'react-native-keychain';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

export class AuthService {
  static async initialize() {
    try {
      GoogleSignin.configure({
        webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with your actual web client ID from Google Cloud Console
        offlineAccess: true,
      });
    } catch (error) {
      console.error('Google Sign-In configuration error:', error);
    }
  }

  static async signIn(): Promise<User | null> {
    try {
      // For now, Google Sign-In is disabled until proper configuration
      // TODO: Set up Google Cloud Console and configure webClientId
      throw new Error('Google Sign-In temporarily disabled - please continue as guest');
      
      // Uncomment and configure when ready:
      // await GoogleSignin.hasPlayServices();
      // const userInfo = await GoogleSignin.signIn();
      // 
      // if (userInfo && userInfo.user) {
      //   const user: User = {
      //     id: userInfo.user.id,
      //     name: userInfo.user.name || '',
      //     email: userInfo.user.email,
      //     photo: userInfo.user.photo || undefined,
      //   };
      //   
      //   await this.storeUserInfo(user);
      //   return user;
      // }
      // 
      // return null;
    } catch (error: any) {
      console.log('Google Sign-In not configured yet, using guest mode');
      return null;
    }
  }

  static async signOut(): Promise<void> {
    try {
      await GoogleSignin.signOut();
      await this.clearUserInfo();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo && userInfo.user) {
          return {
            id: userInfo.user.id,
            name: userInfo.user.name || '',
            email: userInfo.user.email,
            photo: userInfo.user.photo || undefined,
          };
        }
      }
      
      return await this.getStoredUserInfo();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  private static async storeUserInfo(user: User): Promise<void> {
    try {
      await Keychain.setInternetCredentials(
        'minihabittracker_user',
        user.email,
        JSON.stringify(user)
      );
    } catch (error) {
      console.error('Error storing user info:', error);
    }
  }

  private static async getStoredUserInfo(): Promise<User | null> {
    try {
      const credentials = await Keychain.getInternetCredentials('minihabittracker_user');
      if (credentials && credentials.password) {
        return JSON.parse(credentials.password) as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user info:', error);
      return null;
    }
  }

  private static async clearUserInfo(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials('minihabittracker_user');
    } catch (error) {
      console.error('Error clearing user info:', error);
    }
  }
}