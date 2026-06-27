'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Check, CheckCheck, MoreHorizontal, Pin, PinOff, Archive, ArchiveRestore } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToUser, togglePinChat, toggleArchiveChat } from '@/services/userService';
import { formatChatTime, truncate, getInitials, cn } from '@/lib/utils';
import type { Chat } from '@/types/chat';
import type { User } from '@/types/user';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  onClick: () => void;
}

export default function ChatListItem({ chat, currentUserId, onClick }: ChatListItemProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const isActive = pathname === `/chat/${chat.id}`;

  useEffect(() => {
    if (chat.type !== 'direct') return;
    const otherId = chat.members.find((m) => m !== currentUserId);
    if (!otherId) return;
    // Live subscription — updates online status, name, avatar in real time
    const unsub = subscribeToUser(otherId, setOtherUser);
    return unsub;
  }, [chat, currentUserId]);

  const displayName = chat.type === 'group' ? (chat.name ?? 'Group') : (otherUser?.displayName ?? '…');
  const avatarUrl = chat.type === 'group' ? chat.photoURL : otherUser?.photoURL;
  const isOnline = chat.type === 'direct' ? otherUser?.isOnline : false;
  const lastMsg = chat.lastMessage;
  const isMine = lastMsg?.senderId === currentUserId;

  const previewText = lastMsg
    ? lastMsg.type === 'image' ? '📷 Photo'
    : lastMsg.type === 'voice' ? '🎤 Voice note'
    : truncate(lastMsg.text ?? '', 38)
    : 'No messages yet';

  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  const isPinned = user?.pinnedChats?.includes(chat.id);
  const isArchived = user?.archivedChats?.includes(chat.id);

  return (
    <div className="relative group">
    <button
      id={`chat-item-${chat.id}`}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150',
        'mx-2 w-[calc(100%-16px)]',
        isActive
          ? 'bg-violet-500/10 ring-1 ring-violet-500/20'
          : 'hover:bg-zinc-800/50'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {isPinned && (
          <div className="absolute -top-1 -left-1 z-10 rounded-full p-0.5" style={{ background: 'var(--color-bg)' }}>
            <Pin className="h-3 w-3" style={{ fill: 'var(--color-violet)', color: 'var(--color-violet)' }} />
          </div>
        )}
        <button
          onClick={(e) => {
            if (chat.type === 'direct' && otherUser?.uid) {
              e.stopPropagation();
              e.preventDefault();
              const params = new URLSearchParams(searchParams?.toString() ?? '');
              params.set('profile', otherUser.uid);
              router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
          }}
          className={cn(
            "h-11 w-11 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold transition-transform",
            chat.type === 'direct' && "hover:ring-2 hover:ring-violet-500 hover:ring-offset-2 hover:ring-offset-zinc-900 active:scale-95 cursor-pointer"
          )}
          style={{
            background: 'var(--color-violet-muted)',
            color: 'var(--color-violet-light)',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            getInitials(displayName)
          )}
        </button>
        {/* Online indicator */}
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 h-3 w-3 rounded-full"
            style={{
              background: 'var(--color-success)',
              boxShadow: '0 0 6px rgba(16,185,129,0.6), 0 0 0 2px #09090B',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-semibold text-white">{displayName}</span>
          {lastMsg && (
            <span className="ml-2 flex-shrink-0 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {formatChatTime(lastMsg.sentAt)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {isMine && lastMsg && (
              <span style={{ color: 'var(--color-text-muted)' }}>
                <Check className="h-3.5 w-3.5" />
              </span>
            )}
            <span
              className="truncate text-xs"
              style={{ color: isActive || unreadCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
            >
              {previewText}
            </span>
          </div>
          {unreadCount > 0 && (
            <div
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm"
              style={{ background: 'var(--color-violet)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
      </div>
    </button>
    
    {/* Hover Actions Menu */}
    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-zinc-900/90 rounded-lg shadow-lg p-1 border border-white/10 backdrop-blur-sm">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (user) togglePinChat(user.uid, chat.id, !!isPinned);
        }}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        title={isPinned ? 'Unpin chat' : 'Pin chat'}
      >
        {isPinned ? <PinOff className="h-4 w-4 text-zinc-400" /> : <Pin className="h-4 w-4 text-zinc-400" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (user) toggleArchiveChat(user.uid, chat.id, !!isArchived);
        }}
        className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
        title={isArchived ? 'Unarchive chat' : 'Archive chat'}
      >
        {isArchived ? <ArchiveRestore className="h-4 w-4 text-zinc-400" /> : <Archive className="h-4 w-4 text-zinc-400" />}
      </button>
    </div>
    </div>
  );
}
