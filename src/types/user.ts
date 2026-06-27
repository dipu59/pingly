export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  bio: string;
  isOnline: boolean;
  lastSeen: Date | null;
  createdAt: Date;
  fcmTokens?: string[];
  pinnedChats: string[];
  archivedChats: string[];
  activeChatId?: string | null;
}
