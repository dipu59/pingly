'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToUser } from '@/services/userService';
import { getOrCreateDirectChat } from '@/services/chatService';
import { getInitials, formatChatTime } from '@/lib/utils';
import type { User } from '@/types/user';

export default function UserProfileModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const profileId = searchParams?.get('profile');
  
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!profileId) {
      setProfileUser(null);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUser(profileId, (user) => {
      setProfileUser(user);
      setLoading(false);
    });
    return unsub;
  }, [profileId]);

  const handleClose = () => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('profile');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleMessage = async () => {
    if (!currentUser || !profileUser) return;
    setMessaging(true);
    try {
      const chatId = await getOrCreateDirectChat(currentUser.uid, profileUser.uid);
      // Navigate to chat and close modal by omitting the profile query param
      router.push(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to create/open chat:', err);
    } finally {
      setMessaging(false);
    }
  };

  const handleAvatarClick = () => {
    if (!profileUser?.photoURL || !pathname) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('photo', encodeURIComponent(profileUser.photoURL));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <AnimatePresence>
      {profileId && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full overflow-hidden rounded-t-3xl bg-zinc-900/95 shadow-2xl sm:max-w-sm sm:rounded-3xl border border-white/10 backdrop-blur-md"
          >
            {/* Header/Cover */}
            <div className="h-24 w-full bg-gradient-to-br from-violet-600/30 to-zinc-900" />
            
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 hover:bg-black/70 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {loading && !profileUser ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
              </div>
            ) : profileUser ? (
              <div className="px-6 pb-8 pt-0 text-center">
                {/* Avatar */}
                <div className="relative mx-auto -mt-12 mb-4 h-24 w-24 rounded-full ring-4 ring-zinc-900 bg-zinc-800">
                  <button
                    onClick={handleAvatarClick}
                    className="h-full w-full rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-transform active:scale-95"
                  >
                    {profileUser.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profileUser.photoURL} alt={profileUser.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-violet-500/20 text-2xl font-semibold text-violet-300">
                        {getInitials(profileUser.displayName)}
                      </div>
                    )}
                  </button>
                  {profileUser.isOnline && (
                    <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-zinc-900" />
                  )}
                </div>

                {/* Info */}
                <h2 className="text-xl font-bold text-white mb-1">{profileUser.displayName}</h2>
                <p className="text-sm text-zinc-400 mb-4">
                  {profileUser.isOnline ? (
                    <span className="text-emerald-400 font-medium">Online now</span>
                  ) : profileUser.lastSeen ? (
                    `Last seen ${formatChatTime(profileUser.lastSeen)}`
                  ) : (
                    'Offline'
                  )}
                </p>

                {profileUser.bio && (
                  <div className="mb-6 rounded-xl bg-white/5 p-4 text-sm text-zinc-300 text-left leading-relaxed">
                    {profileUser.bio}
                  </div>
                )}

                {/* Actions */}
                {currentUser?.uid !== profileUser.uid && (
                  <button
                    onClick={handleMessage}
                    disabled={messaging}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50"
                  >
                    {messaging ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                    Message
                  </button>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-zinc-400">User not found</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
