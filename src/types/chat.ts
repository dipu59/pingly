export type MessageType = 'text' | 'image' | 'voice';

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  duration?: number;
  type: MessageType;
  sentAt: Date;
  seenBy: string[];
  reactions: Record<string, string[]>; // emoji → [userId]
  replyTo?: { id: string, text: string, senderId: string };
  isEdited?: boolean;
  deletedAt?: Date | null;
  deletedFor?: string[];
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  members: string[];
  lastMessage: {
    text: string;
    senderId: string;
    sentAt: Date;
    type: MessageType;
  } | null;
  createdAt: Date;
  // Group-only fields
  name?: string;
  photoURL?: string;
  admins?: string[];
  unreadCount?: Record<string, number>;
}

export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  updatedAt: Date;
}
