import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  toDate,
  arrayUnion,
  arrayRemove,
} from '@/lib/firebase/firestore';
import type { User } from '@/types/user';
import type { DocumentData } from 'firebase/firestore';

function docToUser(id: string, data: DocumentData): User {
  return {
    uid: id,
    displayName: data.displayName ?? 'Unknown',
    email: data.email ?? '',
    photoURL: data.photoURL ?? null,
    bio: data.bio ?? '',
    isOnline: data.isOnline ?? false,
    lastSeen: toDate(data.lastSeen),
    createdAt: toDate(data.createdAt) ?? new Date(),
    pinnedChats: data.pinnedChats ?? [],
    archivedChats: data.archivedChats ?? [],
  };
}

export async function getUserById(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return docToUser(snap.id, snap.data());
}

export async function searchUsers(
  searchTerm: string,
  currentUserId: string,
  maxResults = 20
): Promise<User[]> {
  const lower = searchTerm.toLowerCase().trim();
  
  // Fetch all users to allow client-side filtering on multiple fields
  // In a production app with millions of users, you'd use a search engine like Algolia,
  // but for this scale, client-side filtering satisfies the multi-field search requirement.
  const q = query(collection(db, 'users'), limit(500));
  const snap = await getDocs(q);
  
  let users = snap.docs
    .map((d) => docToUser(d.id, d.data()))
    .filter((u) => u.uid !== currentUserId);

  if (lower) {
    users = users.filter((u) => 
      u.displayName.toLowerCase().includes(lower) || 
      u.email.toLowerCase().includes(lower)
    );
  }

  return users.slice(0, maxResults);
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<User, 'displayName' | 'photoURL' | 'bio'>>
): Promise<void> {
  const data: Record<string, unknown> = { ...updates };
  if (updates.displayName) {
    data.displayNameLower = updates.displayName.toLowerCase();
  }
  await updateDoc(doc(db, 'users', uid), data);
}

/** Subscribe to a single user's presence and profile changes */
export function subscribeToUser(
  uid: string,
  callback: (user: User | null) => void
): () => void {
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(docToUser(snap.id, snap.data()));
  });
}

export async function saveFcmToken(uid: string, token: string) {
  await updateDoc(doc(db, 'users', uid), {
    fcmTokens: arrayUnion(token),
  });
}



export async function togglePinChat(userId: string, chatId: string, isPinned: boolean) {
  await updateDoc(doc(db, 'users', userId), {
    pinnedChats: isPinned ? arrayRemove(chatId) : arrayUnion(chatId),
  });
}

export async function toggleArchiveChat(userId: string, chatId: string, isArchived: boolean) {
  await updateDoc(doc(db, 'users', userId), {
    archivedChats: isArchived ? arrayRemove(chatId) : arrayUnion(chatId),
  });
}
