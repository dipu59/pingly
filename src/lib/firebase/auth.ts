import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './config';

const googleProvider = new GoogleAuthProvider();

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred;
}

export async function signInWithGoogle() {
  return signInWithRedirect(auth, googleProvider);
}

export async function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

export async function logout() {
  return signOut(auth);
}

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}
