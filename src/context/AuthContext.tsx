import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';

type User = {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
} | null;

type AuthContextType = {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = (firebaseUser: FirebaseUser): User => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    emailVerified: firebaseUser.emailVerified,
  };
};

// Helper function to get error message
const getErrorMessage = (error: any): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    console.log('🔍 Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? `User logged in: ${firebaseUser.email}` : 'No user');
      
      if (firebaseUser) {
        console.log('✅ Firebase user details:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        });
        
        const convertedUser = convertFirebaseUser(firebaseUser);
        setUser(convertedUser);
        console.log('🚀 User state updated, navigation should trigger automatically');
      } else {
        console.log('🚪 User logged out, clearing user state');
        setUser(null);
      }
      
      setIsLoading(false);
      console.log('⚙️ Auth loading completed');
    });

    return unsubscribe;
  }, []);

  // Login with Firebase Auth
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      await signInWithEmailAndPassword(auth, email, password);
      
      // The onAuthStateChanged listener will automatically update the user state
      // No need to manually set user state here
      
      return { success: true };
    } catch (error: any) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: getErrorMessage(error)
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout with Firebase Auth
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Register with Firebase Auth
  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Register function called with:', { email, name });
      setIsLoading(true);
      
      // Create user account
      console.log('Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('User account created successfully:', firebaseUser.uid);
      
      // Update user profile with display name
      console.log('Updating user profile with name:', name);
      await updateProfile(firebaseUser, {
        displayName: name,
      });
      console.log('User profile updated successfully');
      
      // The onAuthStateChanged listener will automatically update the user state
      // No need to manually set user state here
      
      console.log('Registration completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error during registration:', error);
      return { 
        success: false, 
        error: getErrorMessage(error)
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password with Firebase Auth
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Error during password reset:', error);
      return { 
        success: false, 
        error: getErrorMessage(error)
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
