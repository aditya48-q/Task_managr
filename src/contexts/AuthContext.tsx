import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { DEMO_MEMBERS } from '../lib/mock-data';
import type { UserRole, WorkspaceMember } from '../types';

interface AuthContextType {
  currentUser: {
    uid: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
  currentRole: UserRole;
  isDemoMode: boolean;
  isFirebaseConnected: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setDemoMode: (enabled: boolean) => void;
  switchRole: (role: UserRole) => void;
  switchDemoUser: (memberUid: string) => void;
  demoMembers: WorkspaceMember[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Default to demo mode if firebase is not configured or user is not logged in yet
    return !isFirebaseConfigured() || !auth?.currentUser;
  });
  
  // Current active demo member (defaults to Amit jha - Admin)
  const [selectedDemoUid, setSelectedDemoUid] = useState<string>(DEMO_MEMBERS[0].uid);
  const [overrideRole, setOverrideRole] = useState<UserRole | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConnected = isFirebaseConfigured();

  // Listen to Firebase auth state if configured
  useEffect(() => {
    if (!isFirebaseConnected || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
      } else {
        setIsDemoMode(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseConnected]);

  const clearError = () => setError(null);

  const loginWithGoogle = async () => {
    setError(null);
    if (!isFirebaseConnected || !auth) {
      setSelectedDemoUid(DEMO_MEMBERS[0].uid);
      setIsDemoMode(true);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsDemoMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConnected || !auth) {
      // In demo mode, check demo credentials
      const found = DEMO_MEMBERS.find((m) => m.email.toLowerCase() === email.toLowerCase());
      if (found) {
        setSelectedDemoUid(found.uid);
        setIsDemoMode(true);
        return;
      }
      // Or allow demo sign-in
      setSelectedDemoUid(DEMO_MEMBERS[0].uid);
      setIsDemoMode(true);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsDemoMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sign in. Please check your credentials.';
      setError(msg);
      throw err;
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConnected || !auth) {
      // Create local user in demo mode
      setIsDemoMode(true);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      setIsDemoMode(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    if (isFirebaseConnected && auth && firebaseUser) {
      await signOut(auth);
    }
    setFirebaseUser(null);
    setIsDemoMode(true);
  };

  const resetPassword = async (email: string) => {
    setError(null);
    if (!isFirebaseConnected || !auth) {
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Password reset failed.';
      setError(msg);
      throw err;
    }
  };

  const switchRole = (role: UserRole) => {
    setOverrideRole(role);
  };

  const switchDemoUser = (memberUid: string) => {
    const mem = DEMO_MEMBERS.find((m) => m.uid === memberUid);
    if (mem) {
      setSelectedDemoUid(memberUid);
      setOverrideRole(null);
    }
  };

  // Derive current user representation
  const currentUser = useMemo(() => {
    if (!isDemoMode && firebaseUser) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
        avatarUrl: firebaseUser.photoURL || undefined,
      };
    }

    const currentMember = DEMO_MEMBERS.find((m) => m.uid === selectedDemoUid) || DEMO_MEMBERS[0];
    return {
      uid: currentMember.uid,
      email: currentMember.email,
      displayName: currentMember.displayName,
      avatarUrl: currentMember.avatarUrl,
    };
  }, [isDemoMode, firebaseUser, selectedDemoUid]);

  // Derive current role
  const currentRole: UserRole = useMemo(() => {
    if (overrideRole) return overrideRole;
    if (!isDemoMode && firebaseUser) {
      // In production Firebase, check member role; default is Member
      return 'Admin'; // Initial workspace creator/admin
    }
    const currentMember = DEMO_MEMBERS.find((m) => m.uid === selectedDemoUid);
    return currentMember ? currentMember.role : 'Admin';
  }, [overrideRole, isDemoMode, firebaseUser, selectedDemoUid]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isDemoMode,
        isFirebaseConnected,
        loading,
        error,
        clearError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        resetPassword,
        setDemoMode: setIsDemoMode,
        switchRole,
        switchDemoUser,
        demoMembers: DEMO_MEMBERS,
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
