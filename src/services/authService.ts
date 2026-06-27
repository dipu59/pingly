import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  logout,
  getGoogleRedirectResult,
} from '@/lib/firebase/auth';
import { db } from '@/lib/firebase/firestore';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmail(email, password);
}

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await signUpWithEmail(email, password, displayName);
  try {
    // Create initial user document in Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      displayName,
      email,
      photoURL: null,
      bio: '',
      isOnline: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    console.log('Successfully created user document in Firestore.');
  } catch (error: any) {
    console.error('🔥 FIRESTORE WRITE FAILED during signup! Root cause is likely restrictive Firestore Security Rules blocking the write.', error);
    // Rollback: Delete the user from Authentication so they aren't left in a broken state
    if (cred.user) {
      await cred.user.delete().catch((deleteErr) => {
        console.error('Failed to rollback Auth user creation:', deleteErr);
      });
    }
    throw new Error('Database write failed (likely missing Firestore permissions). Please contact support or check Firestore rules.');
  }

  return cred;
}

export async function loginWithGoogle() {
  // Initiates redirect, page will navigate away
  await signInWithGoogle();
}

export async function handleGoogleRedirect() {
  const cred = await getGoogleRedirectResult();
  if (cred?.user) {
    // setDoc with merge handles both new and returning Google users
    await setDoc(
      doc(db, 'users', cred.user.uid),
      {
        uid: cred.user.uid,
        displayName: cred.user.displayName ?? 'Google User',
        email: cred.user.email ?? '',
        photoURL: cred.user.photoURL ?? null,
        bio: '',
        isOnline: true,
        lastSeen: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
  return cred;
}

export { logout };
