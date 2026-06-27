'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { searchUsers } from '@/services/userService';
import { getOrCreateDirectChat } from '@/services/chatService';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types/user';

interface UserSearchModalProps {
  onClose: () => void;
  onSelectUser: (chatId: string) => void;
}

export default function UserSearchModal({ onClose, onSelectUser }: UserSearchModalProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || !user) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await searchUsers(query, user.uid);
        setResults(users);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user]);

  const handleSelectUser = async (selectedUser: User) => {
    if (!user || creating) return;
    setCreating(selectedUser.uid);
    try {
      const chatId = await getOrCreateDirectChat(user.uid, selectedUser.uid);
      onSelectUser(chatId);
    } catch (err) {
      console.error('Failed to create chat:', err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
      >
        <div className="glass rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-4" style={{ borderColor: 'var(--color-border)' }}>
            <Search className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-violet)' }} />
            <input
              ref={inputRef}
              id="user-search-input"
              type="text"
              placeholder="Search by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
              style={{ color: 'var(--color-text-primary)' }}
            />
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-zinc-700/50"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto py-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--color-violet)' }} />
              </div>
            ) : results.length === 0 && query.trim() ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                No users found for &ldquo;{query}&rdquo;
              </p>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Type a name to search
              </p>
            ) : (
              <AnimatePresence>
                {results.map((result, idx) => (
                  <motion.button
                    key={result.uid}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleSelectUser(result)}
                    disabled={!!creating}
                    className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/50 disabled:opacity-50"
                  >
                    {/* Avatar */}
                    <div
                      className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center text-sm font-semibold"
                      style={{ background: 'var(--color-violet-muted)', color: 'var(--color-violet-light)' }}
                    >
                      {result.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={result.photoURL} alt={result.displayName} className="h-full w-full object-cover" />
                      ) : (
                        getInitials(result.displayName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-white">{result.displayName}</p>
                      <p className="truncate text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {result.bio || result.email}
                      </p>
                    </div>
                    {/* Online dot */}
                    {result.isOnline && (
                      <span
                        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                        style={{ background: 'var(--color-success)' }}
                      />
                    )}
                    {creating === result.uid && (
                      <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" style={{ color: 'var(--color-violet)' }} />
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
