import AuthGuard from '@/components/auth/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import ChatListPanel from '@/components/chat/ChatListPanel';
import MobileChatLayout from '@/components/layout/MobileChatLayout';
import UserProfileModal from '@/components/modals/UserProfileModal';
import PhotoViewerModal from '@/components/modals/PhotoViewerModal';
import NotificationManager from '@/components/chat/NotificationManager';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {/* Desktop: 3-panel layout */}
      <div className="hidden h-dvh md:flex">
        {/* Nav Rail */}
        <Sidebar />

        {/* Chat List Panel */}
        <div
          className="flex h-full w-[300px] flex-shrink-0 flex-col border-r"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ChatListPanel />
        </div>

        {/* Main Content Panel */}
        <main className="relative flex flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>

      {/* Mobile: handled by MobileChatLayout */}
      <div className="flex h-dvh flex-col md:hidden">
        <MobileChatLayout>{children}</MobileChatLayout>
        <BottomNav />
      </div>

      {/* Global URL-driven Modals & Managers */}
      <UserProfileModal />
      <PhotoViewerModal />
      <NotificationManager />
    </AuthGuard>
  );
}
