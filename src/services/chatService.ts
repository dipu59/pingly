import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  toDate,
} from '@/lib/firebase/firestore';
import {
  addDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  deleteField,
  increment,
} from 'firebase/firestore';
import { getChatId } from '@/lib/utils';
import { getUserById } from './userService';
import type { Chat, Message, MessageType } from '@/types/chat';
import type { DocumentData } from 'firebase/firestore';

// ─── Converters ──────────────────────────────────────────────────────────────

function docToMessage(id: string, data: DocumentData): Message {
  return {
    id,
    senderId: data.senderId,
    text: data.text,
    imageUrl: data.imageUrl,
    audioUrl: data.audioUrl,
    duration: data.duration,
    mediaURL: data.mediaURL, // for legacy fallback
    type: data.type ?? 'text',
    sentAt: toDate(data.sentAt) ?? new Date(),
    seenBy: data.seenBy ?? [],
    reactions: data.reactions ?? {},
    replyTo: data.replyTo,
    isEdited: data.isEdited,
    deletedAt: toDate(data.deletedAt),
    deletedFor: data.deletedFor ?? [],
  };
}

function docToChat(id: string, data: DocumentData): Chat {
  const lm = data.lastMessage;
  return {
    id,
    type: data.type ?? 'direct',
    members: data.members ?? [],
    lastMessage: lm
      ? {
          text: lm.text ?? '',
          senderId: lm.senderId ?? '',
          sentAt: toDate(lm.sentAt) ?? new Date(),
          type: (lm.type ?? 'text') as MessageType,
        }
      : null,
    createdAt: toDate(data.createdAt) ?? new Date(),
    name: data.name,
    photoURL: data.photoURL,
    admins: data.admins,
    unreadCount: data.unreadCount ?? {},
  };
}

// ─── Chat Operations ──────────────────────────────────────────────────────────

/**
 * Get or create a 1-to-1 chat between two users.
 * The chat document ID is deterministic: sorted(uid1, uid2).join('_')
 */
export async function getOrCreateDirectChat(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  const chatId = getChatId(currentUserId, otherUserId);
  const chatRef = doc(db, 'chats', chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      type: 'direct',
      members: [currentUserId, otherUserId],
      lastMessage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return chatId;
}

/** Create a new group chat */
export async function createGroupChat(
  creatorId: string,
  memberIds: string[],
  name: string,
  photoURL?: string
): Promise<string> {
  const chatRef = doc(collection(db, 'chats'));
  const allMembers = Array.from(new Set([creatorId, ...memberIds]));
  
  await setDoc(chatRef, {
    type: 'group',
    name,
    photoURL: photoURL ?? null,
    members: allMembers,
    admins: [creatorId],
    lastMessage: null,
    createdAt: serverTimestamp(),
  });
  
  return chatRef.id;
}

/** Subscribe to all chats for a user, ordered by last message */
export function subscribeToChats(
  userId: string,
  callback: (chats: Chat[]) => void
): () => void {
  const q = query(
    collection(db, 'chats'),
    where('members', 'array-contains', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const chats = snap.docs.map((d) => docToChat(d.id, d.data()));
      // Sort by lastMessage.sentAt descending
      chats.sort((a, b) => {
        const aTime = a.lastMessage?.sentAt?.getTime() ?? a.createdAt.getTime();
        const bTime = b.lastMessage?.sentAt?.getTime() ?? b.createdAt.getTime();
        return bTime - aTime;
      });
      callback(chats);
    },
    (error) => {
      console.error('🔥 Error subscribing to chats:', error);
      callback([]); // Pass empty array so it doesn't hang in loading state forever
    }
  );
}

/** Subscribe to messages in a chat */
export function subscribeToMessages(
  chatId: string,
  callback: (messages: Message[]) => void,
  limitCount = 50
): () => void {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('sentAt', 'asc')
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((d) => docToMessage(d.id, d.data()));
    callback(messages);
  });
}

/** Send a text or media message */
export async function sendMessage(
  chatId: string,
  senderId: string,
  payload: {
    text?: string;
    imageUrl?: string;
    audioUrl?: string;
    duration?: number;
    type: MessageType;
    replyTo?: { id: string; text: string; senderId: string };
  }
): Promise<void> {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const messageData = {
    senderId,
    ...payload,
    sentAt: serverTimestamp(),
    seenBy: [senderId],
    reactions: {},
  };

  await addDoc(messagesRef, messageData);

  // Update chat's lastMessage and unread counts
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);
  const unreadUpdates: Record<string, any> = {};
  
  if (chatSnap.exists()) {
    const members: string[] = chatSnap.data().members ?? [];
    
    await Promise.all(members.map(async (m) => {
      if (m !== senderId) {
        unreadUpdates[`unreadCount.${m}`] = increment(1);
        
        try {
          const userDoc = await getUserById(m);
          if (userDoc) {
            const isViewingThisChat = userDoc.isOnline && userDoc.activeChatId === chatId;
            
            if (!isViewingThisChat && userDoc.fcmTokens && userDoc.fcmTokens.length > 0) {
              const senderDoc = await getUserById(senderId);
              
              fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tokens: userDoc.fcmTokens,
                  title: senderDoc?.displayName || 'New Message',
                  body: payload.text || (payload.type === 'image' ? '📷 Photo' : '🎤 Voice note'),
                  data: { chatId }
                })
              }).catch(e => console.error('Push notification trigger failed', e));
            }
          }
        } catch (err) {
          console.error('Error checking smart notifications for user:', m, err);
        }
      }
    }));
  }

  await updateDoc(chatRef, {
    lastMessage: {
      text: payload.text ?? (payload.type === 'image' ? '📷 Photo' : '🎤 Voice note'),
      senderId,
      sentAt: serverTimestamp(),
      type: payload.type,
    },
    ...unreadUpdates,
  });
}

/** Mark all messages in a chat as seen by a user */
export async function markMessagesAsSeen(
  chatId: string,
  userId: string
): Promise<void> {
  // 1. Reset unread count on the chat document
  await updateDoc(doc(db, 'chats', chatId), {
    [`unreadCount.${userId}`]: 0,
  }).catch(() => {}); // ignore if chat doesn't exist

  // 2. Mark individual messages as seen
  // Avoid using 'not-in' with arrays, it's semantically problematic in Firestore.
  // Instead, fetch recent messages and filter client-side.
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('sentAt', 'desc') // fetch most recent first
  );
  
  const snap = await getDocs(q);
  const updates = snap.docs
    .filter((d) => d.data().senderId !== userId && !d.data().seenBy?.includes(userId)) // Client-side filter
    .map((d) => updateDoc(d.ref, { seenBy: arrayUnion(userId) }));
    
  await Promise.all(updates);
}

/** Soft-delete a message for everyone */
export async function deleteMessage(
  chatId: string,
  messageId: string
): Promise<void> {
  await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
    deletedAt: serverTimestamp(),
    text: deleteField(),
    imageUrl: deleteField(),
    audioUrl: deleteField(),
    mediaURL: deleteField(),
  });
}

/** Edit a message text */
export async function editMessage(
  chatId: string,
  messageId: string,
  newText: string
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(msgRef, {
    text: newText,
    isEdited: true,
  });
}

/** Add or toggle a reaction on a message */
export async function toggleReaction(
  chatId: string,
  messageId: string,
  userId: string,
  emoji: string
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  const snap = await getDoc(msgRef);
  if (!snap.exists()) return;

  const reactions: Record<string, string[]> = snap.data().reactions ?? {};
  const users = reactions[emoji] ?? [];
  const hasReacted = users.includes(userId);

  if (hasReacted) {
    reactions[emoji] = users.filter((u) => u !== userId);
    if (reactions[emoji].length === 0) delete reactions[emoji];
  } else {
    reactions[emoji] = [...users, userId];
  }

  await updateDoc(msgRef, { reactions });
}

/** Set typing status */
export async function setTypingStatus(
  chatId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const typingRef = doc(db, 'typing', chatId, 'users', userId);
  await setDoc(typingRef, {
    isTyping,
    updatedAt: serverTimestamp(),
  });
}

/** Subscribe to typing users in a chat */
export function subscribeToTyping(
  chatId: string,
  currentUserId: string,
  callback: (typingUserIds: string[]) => void
): () => void {
  const typingRef = collection(db, 'typing', chatId, 'users');
  return onSnapshot(typingRef, (snap) => {
    const now = Date.now();
    const typers = snap.docs
      .filter((d) => {
        const data = d.data();
        const updatedAt = toDate(data.updatedAt);
        const isRecent = updatedAt && now - updatedAt.getTime() < 5000; // 5s stale cutoff
        return d.id !== currentUserId && data.isTyping && isRecent;
      })
      .map((d) => d.id);
    callback(typers);
  });
}
