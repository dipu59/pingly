'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, Trash2, SmilePlus, Reply, Edit2, Copy } from 'lucide-react';
import { formatChatTime, cn } from '@/lib/utils';
import { deleteMessage, toggleReaction } from '@/services/chatService';
import type { Message } from '@/types/chat';
import { useAuth } from '@/context/AuthContext';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  chatId: string;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
}

export default function MessageBubble({ message, isOwn, chatId, onReply, onEdit }: MessageBubbleProps) {
  const { user } = useAuth();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const isDeleted = !!message.deletedAt;

  const handleDelete = async () => {
    try {
      await deleteMessage(chatId, message.id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!user) return;
    setShowReactions(false);
    try {
      await toggleReaction(chatId, message.id, user.uid, emoji);
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  const reactionEntries = Object.entries(message.reactions ?? {}).filter(
    ([, users]) => users.length > 0
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'group relative flex items-end gap-2',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        'mb-1'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
      }}
    >
      {/* Message bubble */}
      <div className={cn('max-w-[72%] min-w-[60px]', isOwn ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
        {isDeleted ? (
          <div
            className="rounded-2xl px-4 py-2.5 text-sm italic"
            style={{
              background: 'rgba(39,39,42,0.5)',
              color: 'var(--color-text-muted)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            🚫 This message was deleted
          </div>
        ) : (
          <>
            {/* Replied to message preview */}
            {message.replyTo && (
              <div 
                className={cn(
                  'mb-1 rounded-lg border-l-4 px-3 py-1.5 text-xs opacity-80',
                  isOwn ? 'border-white/50 bg-white/10' : 'border-violet-500 bg-zinc-800'
                )}
              >
                <div className="font-semibold mb-0.5">
                  {message.replyTo.senderId === user?.uid ? 'You' : 'Someone'}
                </div>
                <div className="truncate text-white/80">
                  {message.replyTo.text}
                </div>
              </div>
            )}

            {/* Image message */}
            {message.type === 'image' && (message.imageUrl || message.mediaURL) && (
              <div className={cn('overflow-hidden rounded-xl', isOwn ? 'rounded-br-sm' : 'rounded-bl-sm')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.imageUrl || message.mediaURL}
                  alt="Image"
                  className="max-h-60 max-w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Voice message */}
            {message.type === 'voice' && (message.audioUrl || message.mediaURL) && (
              <div className={cn('p-2', isOwn ? 'bubble-out' : 'bubble-in')}>
                <audio controls src={message.audioUrl || message.mediaURL} className="h-10 w-48 max-w-[200px]" />
              </div>
            )}

            {/* Text bubble */}
            {(message.type === 'text' || message.text) && (
              <div className={cn(isOwn ? 'bubble-out' : 'bubble-in', 'px-4 py-2.5')}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.text}
                </p>
              </div>
            )}
          </>
        )}

        {/* Timestamp + seen receipt */}
        <div
          className={cn('flex items-center gap-1 px-1', isOwn ? 'flex-row-reverse' : 'flex-row')}
        >
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            {formatChatTime(message.sentAt)}
          </span>
          {message.isEdited && !isDeleted && (
            <span className="text-[9px] italic opacity-60" style={{ color: 'var(--color-text-muted)' }}>
              (edited)
            </span>
          )}
          {isOwn && !isDeleted && (
            <span>
              {message.seenBy.length > 1 ? (
                <CheckCheck className="h-3.5 w-3.5" style={{ color: 'var(--color-violet-light)' }} />
              ) : (
                <Check className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
              )}
            </span>
          )}
        </div>

        {/* Reactions display */}
        {reactionEntries.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactionEntries.map(([emoji, users]) => (
              <span
                key={emoji}
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
              >
                {emoji}
                <span style={{ color: 'var(--color-text-muted)' }}>{users.length}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover action bar */}
      {!isDeleted && (
        <div
          className={cn(
            'flex items-center gap-1 transition-all duration-150',
            showActions ? 'opacity-100' : 'opacity-0 pointer-events-none',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {/* Reaction button */}
          <button
            aria-label="React to message"
            onClick={() => setShowReactions(!showReactions)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>

          {/* Copy button (text messages only) */}
          {message.type === 'text' && message.text && (
            <button
              aria-label="Copy message"
              onClick={() => navigator.clipboard.writeText(message.text ?? '')}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Reply button */}
          <button
            aria-label="Reply to message"
            onClick={() => onReply?.(message)}
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
          >
            <Reply className="h-3.5 w-3.5" />
          </button>

          {/* Edit button (own text messages only) */}
          {isOwn && message.type === 'text' && (
            <button
              aria-label="Edit message"
              onClick={() => onEdit?.(message)}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Delete (own messages only) */}
          {isOwn && (
            <button
              aria-label="Delete message"
              onClick={handleDelete}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{ background: 'var(--color-error-muted)', color: 'var(--color-error)' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Quick reaction picker */}
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute bottom-full mb-2 flex gap-1 rounded-full px-2 py-1.5 shadow-xl"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border-strong)',
                left: isOwn ? 'auto' : 0,
                right: isOwn ? 0 : 'auto',
              }}
            >
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
