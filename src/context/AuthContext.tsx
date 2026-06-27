'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { db } from '@/lib/firebase/firestore';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleGoogleRedirect } from '@/services/authService';
import { subscribeToUser } from '@/services/userService';
import type { User as AppUser } from '@/types/user';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserToFirestore = useCallback(async (firebaseUser: FirebaseUser) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      await setDoc(
        userRef,
        {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? 'Anonymous',
          email: firebaseUser.email ?? '',
          photoURL: firebaseUser.photoURL ?? null,
          isOnline: true,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      console.error(
        '🔥 Failed to sync user to Firestore! If you see PERMISSION_DENIED, your Firestore Security Rules are blocking the write.',
        error
      );
    }
  }, []);

  const setOffline = useCallback(async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        isOnline: false,
        lastSeen: serverTimestamp(),
      });
    } catch {
      // User doc might not exist yet, ignore
    }
  }, []);

  useEffect(() => {
    // Process redirect result if coming back from Google Sign-In
    handleGoogleRedirect().catch(console.error);

    let userUnsub: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await syncUserToFirestore(fbUser);
        setFirebaseUser(fbUser);
        // Subscribe to Firestore user doc
        userUnsub = subscribeToUser(fbUser.uid, (appUser) => {
          setUser(appUser);
          setLoading(false);
        });
      } else {
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        if (userUnsub) userUnsub();
      }
    });

    // --- Reliable presence detection ---
    // `beforeunload` with async calls is unreliable — the browser kills the
    // JS runtime before the write completes. Instead we use `visibilitychange`
    // which fires synchronously and gives us enough time to write.
    const handleVisibilityChange = () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      if (document.visibilityState === 'hidden') {
        // Fire-and-forget — page is going background/closing
        setOffline(uid);
      } else {
        // Page came back to foreground — mark online again
        updateDoc(doc(db, 'users', uid), {
          isOnline: true,
          lastSeen: serverTimestamp(),
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      if (userUnsub) userUnsub();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark offline on unmount (app closes / navigates away)
      const uid = auth.currentUser?.uid;
      if (uid) setOffline(uid);
    };
  }, [syncUserToFirestore, setOffline]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
