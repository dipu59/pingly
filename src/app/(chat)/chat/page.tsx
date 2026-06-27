import { MessageSquare } from 'lucide-react';

export default function ChatIndexPage() {
  return (
    // On mobile this view is never visible — MobileChatLayout shows ChatListPanel
    // at /chat instead. On desktop, this is the "select a conversation" placeholder.
    <div className="hidden h-full flex-col items-center justify-center gap-5 text-center px-8 md:flex">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(109,40,217,0.15) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative flex h-20 w-20 items-center justify-center rounded-3xl gradient-violet glow-violet"
        style={{ boxShadow: '0 0 60px rgba(139,92,246,0.3)' }}
      >
        <MessageSquare className="h-9 w-9 text-white" />
      </div>

      <div className="relative">
        <h2 className="text-2xl font-bold text-white">Your Messages</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          Select a conversation from the left, or start a new chat with someone.
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <div className="flex items-center gap-2">
          <span className="h-px w-12" style={{ background: 'var(--color-border)' }} />
          <span>End-to-end encrypted</span>
          <span className="h-px w-12" style={{ background: 'var(--color-border)' }} />
        </div>
        <p>Your messages are private and secure</p>
      </div>
    </div>
  );
}
