'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subscribeToChats } from '@/services/chatService';

export default function NotificationManager() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const previousChatsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const currentUserId = user?.uid;

  useEffect(() => {
    if (!currentUserId) return;

    // We can use the existing subscribeToChats, since it fetches the user's chats and lastMessage
    const unsub = subscribeToChats(currentUserId, (chats) => {
      chats.forEach(chat => {
        const lastMsgTime = chat.lastMessage?.sentAt?.getTime() || 0;
        const prevTime = previousChatsRef.current[chat.id] || 0;
        
        // If this is a newly arrived message (timestamp is newer) and it's not from us
        if (lastMsgTime > prevTime && chat.lastMessage?.senderId !== currentUserId) {
          // Rule 1 & 2: Check if viewing this chat
          const isViewingChat = pathnameRef.current === `/chat/${chat.id}`;
          
          if (!isViewingChat && prevTime !== 0) { // prevTime !== 0 ensures we don't beep on initial load
            // Rule 2: Play sound + show notification
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(e => {
                console.warn('Autoplay prevented. User needs to interact with the document first.', e);
              });
              
              if (Notification.permission === 'granted') {
                new Notification(chat.name || 'New Message', {
                  body: chat.lastMessage?.text || 'Sent an attachment',
                  icon: '/icon-192x192.png'
                });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission();
              }
            } catch (e) {
              console.error('Notification failed', e);
            }
          }
        }
        
        previousChatsRef.current[chat.id] = lastMsgTime;
      });
    });

    return unsub;
  }, [currentUserId]);

  return null;
}
