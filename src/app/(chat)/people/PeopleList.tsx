'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MessageSquarePlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { searchUsers } from '@/services/userService';
import { getOrCreateDirectChat } from '@/services/chatService';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types/user';

export default function PeopleList() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchUsers = async () => {
      try {
        const allUsers = await searchUsers('', user.uid, 500);
        setUsers(allUsers);
        setFilteredUsers(allUsers);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const lower = searchQuery.toLowerCase();
    const filtered = users.filter(u => 
      u.displayName.toLowerCase().includes(lower) || 
      u.email.toLowerCase().includes(lower)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const handleStartChat = async (selectedUser: User) => {
    if (!user || creating) return;
    setCreating(selectedUser.uid);
    try {
      const chatId = await getOrCreateDirectChat(user.uid, selectedUser.uid);
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="search"
          placeholder="Search people by name or email…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-violet-500/50"
          style={{
            background: 'rgba(39,39,42,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-violet)' }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-white">No people found</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Try adjusting your search terms
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8">
          <AnimatePresence>
            {filteredUsers.map((person, idx) => (
              <motion.div
                key={person.uid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                className="group relative flex flex-col items-center rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                style={{
                  background: 'rgba(24,24,27,0.6)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Avatar */}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams?.toString() ?? '');
                    params.set('profile', person.uid);
                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                  }}
                  className="relative mb-4 h-20 w-20 flex-shrink-0 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full"
                >
                  <div
                    className="h-full w-full rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shadow-xl"
                    style={{ background: 'var(--color-violet-muted)', color: 'var(--color-violet-light)' }}
                  >
                    {person.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={person.photoURL} alt={person.displayName} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(person.displayName)
                    )}
                  </div>
                  {person.isOnline && (
                    <span
                      className="absolute bottom-1 right-1 h-4 w-4 rounded-full ring-4 ring-[#18181b]"
                      style={{ background: 'var(--color-success)' }}
                    />
                  )}
                </button>

                {/* Info */}
                <button 
                  onClick={() => {
                    const params = new URLSearchParams(searchParams?.toString() ?? '');
                    params.set('profile', person.uid);
                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                  }}
                  className="hover:opacity-80 active:scale-95 transition-all outline-none"
                >
                  <h3 className="text-base font-semibold text-white text-center line-clamp-1">{person.displayName}</h3>
                </button>
                <p className="text-xs mt-1 text-center line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>
                  {person.email}
                </p>
                {person.bio && (
                  <p className="mt-3 text-sm text-center line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {person.bio}
                  </p>
                )}

                {/* Action */}
                <button
                  onClick={() => handleStartChat(person)}
                  disabled={!!creating}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                  style={{ background: 'var(--color-violet)' }}
                >
                  {creating === person.uid ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <MessageSquarePlus className="h-4 w-4" />
                      Message
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
