'use client';

import { usePathname, useRouter } from 'next/navigation';
import ChatListPanel from '@/components/chat/ChatListPanel';

/**
 * MobileChatLayout — handles the two-screen mobile UX:
 *
 *  Screen A  (/chat)           → shows ChatListPanel full-screen
 *  Screen B  (/chat/[chatId])  → shows ChatWindow full-screen (children)
 *
 * On desktop this component is never mounted (hidden by md:hidden on the wrapper).
 */
export default function MobileChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Chat list is shown ONLY on the exact /chat route
  const isChatRoot = pathname === '/chat';

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* Chat List — visible only on the root /chat path */}
      <div
        className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
          isChatRoot ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'rgba(12,12,14,0.98)' }}
        aria-hidden={!isChatRoot}
      >
        <ChatListPanel />
      </div>

      {/* Main Content Area (Children) — visible on all other paths (/chat/[id], /people, /profile) */}
      <div
        className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-in-out ${
          isChatRoot ? 'translate-x-full' : 'translate-x-0'
        }`}
        aria-hidden={isChatRoot}
      >
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
