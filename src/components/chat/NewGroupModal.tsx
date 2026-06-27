'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Users, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { searchUsers } from '@/services/userService';
import { createGroupChat } from '@/services/chatService';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types/user';

interface NewGroupModalProps {
  onClose: () => void;
  onGroupCreated: (chatId: string) => void;
}

export default function NewGroupModal({ onClose, onGroupCreated }: NewGroupModalProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const toggleUser = (u: User) => {
    if (selectedUsers.find((su) => su.uid === u.uid)) {
      setSelectedUsers((prev) => prev.filter((su) => su.uid !== u.uid));
    } else {
      setSelectedUsers((prev) => [...prev, u]);
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      const memberIds = selectedUsers.map((u) => u.uid);
      const chatId = await createGroupChat(user.uid, memberIds, groupName.trim());
      onGroupCreated(chatId);
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
      >
        <div className="glass rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: 'var(--color-violet)' }} />
              New Group Chat
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-zinc-700/50 text-zinc-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Group Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Group Name</label>
              <input
                type="text"
                placeholder="E.g. Weekend Trip"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl py-2.5 px-4 text-sm outline-none transition-all focus:ring-1 focus:ring-violet-500/40 bg-zinc-800/50 border border-zinc-700/50 text-white placeholder:text-zinc-600"
              />
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Members ({selectedUsers.length})</label>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {selectedUsers.map((u) => (
                      <motion.div
                        key={u.uid}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-1.5 bg-violet-500/20 text-violet-200 px-2 py-1 rounded-full text-xs border border-violet-500/30"
                      >
                        <span>{u.displayName}</span>
                        <button onClick={() => toggleUser(u)} className="hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Search */}
            <div>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search to add members..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:ring-1 focus:ring-violet-500/40 bg-zinc-800/50 border border-zinc-700/50 text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="min-h-[150px] max-h-48 overflow-y-auto border border-zinc-700/30 rounded-xl bg-zinc-900/50 p-1">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                  </div>
                ) : results.length === 0 && query.trim() ? (
                  <p className="py-6 text-center text-xs text-zinc-500">No users found</p>
                ) : results.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-500">Search for people</p>
                ) : (
                  results.map((result) => {
                    const isSelected = !!selectedUsers.find(u => u.uid === result.uid);
                    return (
                      <button
                        key={result.uid}
                        onClick={() => toggleUser(result)}
                        className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                          isSelected ? 'bg-violet-500/10' : 'hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="h-8 w-8 flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-semibold bg-violet-900/50 text-violet-300">
                          {result.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={result.photoURL} alt="" className="h-full w-full object-cover" />
                          ) : getInitials(result.displayName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">{result.displayName}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-violet-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50">
            <button
              onClick={handleCreateGroup}
              disabled={creating || !groupName.trim() || selectedUsers.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Group'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
