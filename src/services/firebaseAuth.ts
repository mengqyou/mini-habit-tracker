import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

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
      
      // Return user data formatted for our app
      return {
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        photo: googleUser.photo,
        isGuest: false
      };
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
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }

  static getCurrentUser(): User | null {
    const firebaseUser = auth().currentUser;
    if (firebaseUser) {
      return this.formatUser(firebaseUser);
    }
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
}