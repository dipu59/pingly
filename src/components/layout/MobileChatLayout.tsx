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
    <div className="relative flex-1 overflow-hidden" style={{ background: 'rgba(12,12,14,0.98)' }}>
      {/* Chat List */}
      <div
        className={`absolute inset-0 flex flex-col transform-gpu will-change-transform transition-transform duration-200 ease-out ${
          isChatRoot ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isChatRoot}
      >
        <ChatListPanel />
      </div>

      {/* Main Content Area (Chat Window) */}
      <div
        className={`absolute inset-0 flex flex-col transform-gpu will-change-transform transition-transform duration-200 ease-out ${
          isChatRoot ? 'translate-x-full' : 'translate-x-0'
        }`}
        aria-hidden={isChatRoot}
      >
        <main className="flex h-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
