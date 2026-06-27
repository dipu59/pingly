import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  type DocumentData,
  type QuerySnapshot,
  type DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

export {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
};
export type { DocumentData, QuerySnapshot, DocumentSnapshot };

/** Convert Firestore Timestamp → JS Date (handles null gracefully) */
export function toDate(ts: Timestamp | null | undefined): Date | null {
  if (!ts) return null;
  return ts.toDate();
}

export { db };
