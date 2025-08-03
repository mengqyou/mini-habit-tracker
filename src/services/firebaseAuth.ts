import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  isGuest?: boolean;
}

export class FirebaseAuthService {
  static async initialize() {
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: '523546718810-2a1k7bgtavglerirheigtibpagm4g4ia.apps.googleusercontent.com',
        offlineAccess: true,
      });
    } catch (error) {
      console.error('Firebase Auth initialization error:', error);
    }
  }

  static async signInWithGoogle(): Promise<User | null> {
    try {
      console.log('🔵 [GoogleAuth] Starting Google Sign-In process...');
      console.log('🔍 [GoogleAuth] Configuration check...');
      console.log('🔍 [GoogleAuth] WebClientId:', '523546718810-2a1k7bgtavglerirheigtibpagm4g4ia.apps.googleusercontent.com');
      
      // Check if your device supports Google Play
      console.log('🔵 [GoogleAuth] Checking Google Play Services...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('✅ [GoogleAuth] Google Play Services available');
      
      // Check current configuration
      console.log('🔵 [GoogleAuth] Getting current configuration...');
      const currentUser = await GoogleSignin.getCurrentUser();
      console.log('🔍 [GoogleAuth] Current user:', currentUser ? 'Signed in' : 'Not signed in');
      
      // Sign out any previous user to ensure clean state
      console.log('🔵 [GoogleAuth] Signing out previous user...');
      await GoogleSignin.signOut();
      console.log('✅ [GoogleAuth] Previous user signed out');
      
      // Get the users ID token
      console.log('🔵 [GoogleAuth] Initiating Google Sign-In dialog...');
      const signInResult = await GoogleSignin.signIn();
      console.log('✅ [GoogleAuth] Google Sign-In dialog completed');
      console.log('🔍 [GoogleAuth] SignIn result type:', typeof signInResult);
      console.log('🔍 [GoogleAuth] SignIn result keys:', Object.keys(signInResult || {}));
      console.log('🔍 [GoogleAuth] SignIn result:', JSON.stringify(signInResult, null, 2));
      
      const { idToken } = signInResult.data;
      if (!idToken) {
        console.error('❌ [GoogleAuth] No ID token in result:', signInResult);
        throw new Error('No ID token received from Google Sign-In');
      }
      console.log('✅ [GoogleAuth] ID token received, length:', idToken.length);
      console.log('🔍 [GoogleAuth] ID token preview:', idToken.substring(0, 50) + '...');
      
      // Skip Firebase credential creation for now - use Google data directly
      console.log('🔵 [GoogleAuth] Using Google user data directly...');
      const googleUser = signInResult.data.user;
      console.log('✅ [GoogleAuth] Google Sign-In successful');
      console.log('🔍 [GoogleAuth] User info:', {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name
      });
      
      // Store user data for persistence
      const user = {
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        photo: googleUser.photo,
        isGuest: false
      };
      
      await this.storeUserData(user);
      console.log('✅ [GoogleAuth] User data stored for persistence');
      
      // Return user data formatted for our app
      return user;
    } catch (error: any) {
      console.error('❌ [GoogleAuth] Sign-In failed:', error);
      console.error('❌ [GoogleAuth] Error code:', error.code);
      console.error('❌ [GoogleAuth] Error message:', error.message);
      console.error('❌ [GoogleAuth] Error stack:', error.stack);
      console.error('❌ [GoogleAuth] Full error object:', JSON.stringify(error, null, 2));
      
      // Google Sign-In specific error codes
      if (error.code === '12501') {
        console.error('❌ [GoogleAuth] SIGN_IN_CANCELLED - User canceled the sign-in flow');
      } else if (error.code === '10') {
        console.error('❌ [GoogleAuth] DEVELOPER_ERROR - Developer error, check SHA-1 and configuration');
      } else if (error.code === '7') {
        console.error('❌ [GoogleAuth] NETWORK_ERROR - Network error during sign-in');
      } else if (error.code === '8') {
        console.error('❌ [GoogleAuth] INTERNAL_ERROR - Internal error during sign-in');
      } else if (error.code === 'auth/api-key-not-valid') {
        console.error('❌ [GoogleAuth] Firebase API key not configured properly');
      } else if (error.code === 'auth/invalid-api-key') {
        console.error('❌ [GoogleAuth] Invalid Firebase API key');
      } else if (error.code === 'auth/app-not-authorized') {
        console.error('❌ [GoogleAuth] App not authorized - SHA-1 fingerprint issue');
      }
      
      return null;
    }
  }

  static async signInWithEmailAndPassword(email: string, password: string): Promise<User | null> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return this.formatUser(userCredential.user);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    }
  }

  static async createUserWithEmailAndPassword(email: string, password: string, displayName: string): Promise<User | null> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Update the user profile with display name
      await userCredential.user.updateProfile({
        displayName: displayName,
      });
      
      return this.formatUser(userCredential.user);
    } catch (error) {
      console.error('Email registration error:', error);
      throw error;
    }
  }

  static async signOut(): Promise<void> {
    try {
      // Sign out from Google
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
      
      // Sign out from Firebase
      await auth().signOut();
      
      // Clear stored user data
      await this.clearStoredUserData();
      console.log('✅ [Auth] User data cleared from storage');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    console.log('🔵 [Auth] getCurrentUser called');
    
    // First check Firebase auth state
    const firebaseUser = auth().currentUser;
    console.log('🔍 [Auth] Firebase currentUser:', firebaseUser ? 'exists' : 'null');
    if (firebaseUser) {
      console.log('🔵 [Auth] Using Firebase user data');
      return this.formatUser(firebaseUser);
    }
    
    // If no Firebase user, check stored Google Sign-In data
    console.log('🔵 [Auth] Checking AsyncStorage for stored user data...');
    try {
      const storedUser = await this.getStoredUserData();
      console.log('🔍 [Auth] AsyncStorage result:', storedUser ? 'found user data' : 'no data');
      if (storedUser) {
        console.log('🔵 [Auth] Found stored user data:', { id: storedUser.id, name: storedUser.name, isGuest: storedUser.isGuest });
        return storedUser;
      }
    } catch (error) {
      console.error('❌ [Auth] Error getting stored user data:', error);
    }
    
    // If no stored user data, attempt to restore from Google Sign-In silently
    console.log('🔵 [Auth] Attempting silent Google Sign-In restore...');
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      console.log('🔍 [Auth] Google isSignedIn:', isSignedIn);
      
      if (isSignedIn) {
        const googleUser = await GoogleSignin.getCurrentUser();
        console.log('🔍 [Auth] Google getCurrentUser result:', googleUser ? 'exists' : 'null');
        
        if (googleUser?.data?.user) {
          console.log('🔵 [Auth] Restoring user from Google Sign-In state');
          const user = {
            id: googleUser.data.user.id,
            name: googleUser.data.user.name,
            email: googleUser.data.user.email,
            photo: googleUser.data.user.photo,
            isGuest: false
          };
          
          // Store the restored user data
          await this.storeUserData(user);
          console.log('✅ [Auth] User data restored and stored');
          return user;
        }
      }
    } catch (error) {
      console.error('❌ [Auth] Error during silent restore:', error);
    }
    
    console.log('🔍 [Auth] No user found - returning null');
    return null;
  }

  static createGuestUser(): User {
    return {
      id: 'guest',
      name: 'Guest User',
      email: 'guest@local',
      isGuest: true,
    };
  }

  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        callback(this.formatUser(firebaseUser));
      } else {
        callback(null);
      }
    });
  }

  private static formatUser(firebaseUser: FirebaseAuthTypes.User): User {
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'User',
      email: firebaseUser.email || '',
      photo: firebaseUser.photoURL || undefined,
      isGuest: false,
    };
  }

  static async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  static async updateUserProfile(displayName: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (user) {
        await user.updateProfile({ displayName });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Store user data for persistence across app restarts
  private static async storeUserData(user: User): Promise<void> {
    try {
      console.log('🔵 [Auth] Storing user data to AsyncStorage:', { id: user.id, name: user.name, isGuest: user.isGuest });
      await AsyncStorage.setItem('user_data', JSON.stringify(user));
      console.log('✅ [Auth] User data stored successfully');
      
      // Verify the data was stored correctly
      const verification = await AsyncStorage.getItem('user_data');
      console.log('🔍 [Auth] Verification read:', verification ? 'data exists' : 'no data');
    } catch (error) {
      console.error('❌ [Auth] Error storing user data:', error);
    }
  }

  // Get stored user data
  private static async getStoredUserData(): Promise<User | null> {
    try {
      console.log('🔵 [Auth] Reading from AsyncStorage key: user_data');
      const userData = await AsyncStorage.getItem('user_data');
      console.log('🔍 [Auth] AsyncStorage raw data:', userData ? 'data exists' : 'null');
      if (userData) {
        const parsedUser = JSON.parse(userData) as User;
        console.log('🔵 [Auth] Parsed user data:', { id: parsedUser.id, name: parsedUser.name, isGuest: parsedUser.isGuest });
        return parsedUser;
      }
    } catch (error) {
      console.error('❌ [Auth] Error getting stored user data:', error);
    }
    console.log('🔍 [Auth] No stored user data found');
    return null;
  }

  // Clear stored user data
  private static async clearStoredUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error clearing stored user data:', error);
    }
  }

  // Delete user account completely
  static async deleteAccount(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (user) {
        // Delete the Firebase user account
        await user.delete();
        console.log('✅ [Auth] Firebase user account deleted');
      }
      
      // Sign out from Google
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
        console.log('✅ [Auth] Google Sign-In signed out');
      }
      
      // Clear stored user data
      await this.clearStoredUserData();
      console.log('✅ [Auth] Stored user data cleared');
    } catch (error) {
      console.error('❌ [Auth] Error deleting account:', error);
      throw error;
    }
  }
}