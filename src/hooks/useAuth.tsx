import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { isFirebaseConfigured } from '../lib/firebase-config';
import { dataService } from '../services/data-service';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: User | null;
  role: UserRole | null;
  isAdmin: boolean;
  isParent: boolean;
  isConfigured: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setError(null);
      if (fbUser) {
        setFirebaseUser(fbUser);
        try {
          const profile = await dataService.getUserProfile(fbUser.uid);
          if (profile) {
            if (profile.active) {
              setCurrentUser(profile);
            } else {
              setCurrentUser(null);
              setError('Your account has been deactivated. Please contact the administrator.');
            }
          } else {
            setCurrentUser(null);
            setError(
              `User profile document not found in Firestore at users/${fbUser.uid}. Please ensure an administrator has provisioned your user document.`
            );
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Failed to retrieve user profile.';
          setError(message);
          setCurrentUser(null);
        }
      } else {
        setFirebaseUser(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [configured]);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    setError(null);
    setLoading(true);

    if (!configured || !auth) {
      setLoading(false);
      const msg = 'Firebase is not configured. Please add your Firebase project credentials to .env.';
      setError(msg);
      throw new Error(msg);
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const profile = await dataService.getUserProfile(cred.user.uid);

      if (!profile) {
        await firebaseSignOut(auth);
        const msg = `Authentication succeeded, but no role profile was found in Firestore at users/${cred.user.uid}. Contact your administrator.`;
        setError(msg);
        throw new Error(msg);
      }

      if (!profile.active) {
        await firebaseSignOut(auth);
        const msg = 'Your account has been deactivated by the administrator.';
        setError(msg);
        throw new Error(msg);
      }

      setCurrentUser(profile);
      setFirebaseUser(cred.user);
      return profile;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    if (auth) {
      await firebaseSignOut(auth);
    }
    setFirebaseUser(null);
    setCurrentUser(null);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!configured || !auth) {
      throw new Error('Firebase Authentication is not configured. Please configure your .env file.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const clearError = () => setError(null);

  const role = currentUser?.role || null;
  const isAdmin = role === 'ADMIN';
  const isParent = role === 'PARENT';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        role,
        isAdmin,
        isParent,
        isConfigured: configured,
        loading,
        error,
        login,
        logout,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
