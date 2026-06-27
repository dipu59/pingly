'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Phone, Video, Search, MoreVertical } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToMessages,
  subscribeToTyping,
  markMessagesAsSeen,
} from '@/services/chatService';
import { subscribeToUser } from '@/services/userService';
import { db, doc, onSnapshot } from '@/lib/firebase/firestore';
import { getInitials } from '@/lib/utils';
import type { Message, Chat } from '@/types/chat';
import type { User } from '@/types/user';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import BlockEasterEggModal from '../modals/BlockEasterEggModal';

interface ChatWindowProps {
  chatId: string;
  otherUserId?: string; // For 1-to-1 chats
}

export default function ChatWindow({ chatId, otherUserId: otherUserIdProp }: ChatWindowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | undefined>(otherUserIdProp);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  // Subscribe to chat metadata
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'chats', chatId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        setChat({ id: snap.id, ...data } as Chat);
      }
    });
    return unsub;
  }, [chatId]);

  // Resolve otherUserId for direct chats
  useEffect(() => {
    if (!user || chat?.type === 'group') return;
    if (chat && !otherUserId) {
      const other = chat.members.find((m: string) => m !== user.uid);
      if (other) setOtherUserId(other);
    }
  }, [chat, user, otherUserId]);

  // Subscribe to messages
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = subscribeToMessages(chatId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      // Auto-scroll on initial load or if near bottom
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50);
      } else {
        // Check if we're near the bottom before auto-scrolling
        const container = bottomRef.current?.parentElement;
        if (container) {
          const { scrollTop, scrollHeight, clientHeight } = container;
          const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
          if (distanceFromBottom < 200) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
    return unsub;
  }, [chatId, user]);

  // Subscribe to other user's profile
  useEffect(() => {
    if (!otherUserId || chat?.type === 'group') return;
    return subscribeToUser(otherUserId, setOtherUser);
  }, [otherUserId, chat]);

  // Subscribe to typing
  useEffect(() => {
    if (!user) return;
    return subscribeToTyping(chatId, user.uid, setTypingUserIds);
  }, [chatId, user]);

  // Mark messages as seen
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const unseen = messages.filter(
      (m) => m.senderId !== user.uid && !m.seenBy.includes(user.uid)
    );
    if (unseen.length > 0) {
      markMessagesAsSeen(chatId, user.uid);
    }
  }, [messages, chatId, user]);

  const isGroup = chat?.type === 'group';
  const displayName = isGroup ? chat.name ?? 'Group Chat' : (otherUser?.displayName ?? 'Chat');
  const photoURL = isGroup ? chat.photoURL : otherUser?.photoURL;
  const isOnline = isGroup ? false : (otherUser?.isOnline ?? false);
  const groupMemberCount = isGroup ? chat.members?.length ?? 0 : 0;
  
  const handleToggleBlock = (e: React.MouseEvent | React.PointerEvent) => {
    console.log('[DEBUG] Block button clicked! Triggering modal...');
    e.preventDefault();
    e.stopPropagation();
    setShowMenu(false);
    setShowBlockModal(true);
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    if (m.type !== 'text') return false;
    return (m.text ?? '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Chat Header */}
      <header
        className="relative z-20 flex flex-shrink-0 items-center gap-3 border-b px-4 py-3"
        style={{
          background: 'rgba(9,9,11,0.95)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Mobile back button — hidden on desktop */}
        <button
          onClick={() => router.push('/chat')}
          aria-label="Back to chats"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 hover:bg-zinc-800/60 md:hidden"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold"
            style={{ background: 'var(--color-violet-muted)', color: 'var(--color-violet-light)' }}
          >
            {photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoURL} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              getInitials(displayName)
            )}
          </div>
          {isOnline && (
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2"
              style={{ background: 'var(--color-success)', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }}
            />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <h2 className="truncate text-sm font-semibold text-white">{displayName}</h2>
          <p className="text-xs" style={{ color: isOnline ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
            {isGroup ? `${groupMemberCount} members` : (isOnline ? '● Online' : 'Offline')}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {[
            { icon: Phone, label: 'Call', id: 'call-btn' },
            { icon: Video, label: 'Video call', id: 'video-btn' },
          ].map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              id={id}
              aria-label={label}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:bg-zinc-800/60"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            id="search-msgs-btn"
            aria-label="Search messages"
            onClick={() => {
              setShowSearchInput(!showSearchInput);
              if (showSearchInput) setSearchQuery('');
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:bg-zinc-800/60"
            style={{ color: showSearchInput ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}
          >
            <Search className="h-4 w-4" />
          </button>
          {/* More options button with dropdown */}
          <div className="relative">
            <button
              id="more-btn"
              aria-label="More options"
              onClick={() => setShowMenu((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 hover:bg-zinc-800/60"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl z-50 overflow-hidden"
                    style={{
                      background: 'rgba(24,24,27,0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid var(--color-border-strong)',
                    }}
                  >
                    {!isGroup && otherUser && (
                      <button
                        type="button"
                        onClick={handleToggleBlock}
                        onPointerDown={handleToggleBlock}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-zinc-800/50"
                        style={{ color: 'var(--color-error)' }}
                      >
                        Block user
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search Input Bar */}
      <AnimatePresence>
        {showSearchInput && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b px-4 py-2"
            style={{ background: 'rgba(9,9,11,0.95)', borderColor: 'var(--color-border)' }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
              <input
                type="text"
                autoFocus
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md py-1.5 pl-9 pr-4 text-sm outline-none bg-zinc-800/50 focus:bg-zinc-800"
                style={{ color: 'var(--color-text-primary)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="relative flex-1 overflow-y-auto px-4 py-4">
        {/* Subtle background pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(139,92,246,1) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-2.5 w-2.5 rounded-full typing-dot" style={{ background: 'var(--color-violet)', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col gap-1">
            {/* Date separator (simplified: one "Today" for now) */}
            {filteredMessages.length > 0 && !searchQuery && (
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                <span className="rounded-full px-3 py-1 text-xs" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                  Today
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
              </div>
            )}

            <AnimatePresence initial={false}>
              {filteredMessages.length === 0 && searchQuery ? (
                <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  No messages found for "{searchQuery}"
                </div>
              ) : (
                filteredMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.uid}
                    chatId={chatId}
                    onReply={(msg) => { setReplyingTo(msg); setEditingMessage(null); }}
                    onEdit={(msg) => { setEditingMessage(msg); setReplyingTo(null); }}
                  />
                ))
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {typingUserIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} className="h-px" />
          </div>
        )}
      </div>

      <MessageInput 
        chatId={chatId} 
        replyingTo={replyingTo} 
        onCancelReply={() => setReplyingTo(null)} 
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />
      {showBlockModal && (
        <BlockEasterEggModal onClose={() => setShowBlockModal(false)} />
      )}
    </div>
  );
}
