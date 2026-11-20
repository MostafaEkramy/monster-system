import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, CommitteeName } from '@/types';

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  committee: CommitteeName;
  university?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isMagicInitialized: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMagicInitialized] = useState<boolean>(true);

  // Listen to auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const isMasterMagicEmail = currentUser.email?.toLowerCase() === 'monstermagic@gmail.com';
        const userDocRef = doc(db, 'users', currentUser.uid);

        const defaultMagicProfile: UserProfile = {
          id: currentUser.uid,
          email: 'monstermagic@gmail.com',
          fullName: 'Monsters Magic Admin',
          phone: '01000000000',
          university: 'Mansoura National University',
          committee: 'hr',
          role: 'magic',
          status: 'approved',
          currentSeasonPoints: 0,
          currentSeasonRank: 1,
          attendancePercentage: 100,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          joinDate: Timestamp.now(),
        };

        // If master magic, immediately grant magic profile in UI so user is never blocked
        if (isMasterMagicEmail) {
          setUserProfile(defaultMagicProfile);
          setLoading(false);

          // Try to sync to Firestore in background
          try {
            await setDoc(userDocRef, defaultMagicProfile, { merge: true });
            await setDoc(
              doc(db, 'systemSettings', 'config'),
              { magicInitialized: true, updatedAt: Timestamp.now() },
              { merge: true }
            );
          } catch (e) {
            console.warn('Background sync to Firestore (check rules in console):', e);
          }
        }

        // Setup real-time listener for profile updates
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (isMasterMagicEmail) {
                // Ensure role remains magic
                setUserProfile({
                  id: docSnap.id,
                  ...data,
                  role: 'magic',
                  status: 'approved',
                } as UserProfile);
              } else {
                setUserProfile({ id: docSnap.id, ...data } as UserProfile);
              }
            } else if (isMasterMagicEmail) {
              setUserProfile(defaultMagicProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Notice listening to profile:', err?.message || err);
            if (isMasterMagicEmail) {
              setUserProfile(defaultMagicProfile);
            }
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      const newProfile: Omit<UserProfile, 'id'> = {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        university: data.university || '',
        committee: data.committee,
        role: 'member',
        status: 'pending', // Requires Magic approval
        joinDate: Timestamp.now(),
        currentSeasonPoints: 0,
        currentSeasonRank: 0,
        attendancePercentage: 100,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'users', uid), newProfile);

      // Create notification for Magic
      try {
        await setDoc(doc(collection(db, 'notifications')), {
          userId: 'magic',
          type: 'registration',
          title: 'New Member Registration',
          titleAr: 'طلب تسجيل عضو جديد',
          message: `${data.fullName} registered for ${data.committee} committee and awaits approval.`,
          messageAr: `سجل ${data.fullName} في لجنة ${data.committee} وبانتظار الموافقة.`,
          isRead: false,
          targetId: uid,
          targetType: 'user',
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn('Could not post notification:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setUserProfile({ id: snap.id, ...snap.data() } as UserProfile);
      }
    } catch (e) {
      console.warn('Could not refresh profile:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isMagicInitialized,
        login,
        register,
        logout,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
