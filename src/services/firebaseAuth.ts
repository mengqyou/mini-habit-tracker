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
        webClientId: 'YOUR_WEB_CLIENT_ID', // You'll get this from Firebase Console
        offlineAccess: true,
      });
    } catch (error) {
      console.error('Firebase Auth initialization error:', error);
    }
  }

  static async signInWithGoogle(): Promise<User | null> {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Get the users ID token
      const { idToken } = await GoogleSignin.signIn();
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      return this.formatUser(userCredential.user);
    } catch (error) {
      console.error('Google Sign-In error:', error);
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