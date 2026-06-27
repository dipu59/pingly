'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Phone, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/chat', icon: MessageSquare, label: 'Chats' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/people', icon: Users, label: 'People' },
  { href: '/profile', icon: User, label: 'Profile' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  const isConversationOpen = pathname?.startsWith('/chat/') && pathname !== '/chat';

  return (
    <motion.div
      initial={false}
      animate={{
        height: isConversationOpen ? 0 : 64, // 64px is h-16
        opacity: isConversationOpen ? 0 : 1,
        y: isConversationOpen ? 20 : 0,
      }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="shrink-0 overflow-hidden"
    >
      <nav
        className="safe-area-pb flex h-16 w-full items-center justify-around border-t glass"
        style={{ borderColor: 'var(--color-border)' }}
        aria-label="Mobile navigation"
      >
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/chat'
          ? (pathname ?? '').startsWith('/chat')
          : pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 px-4 py-1 transition-all duration-200',
              isActive ? '' : 'opacity-40'
            )}
            aria-label={label}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: isActive ? 'var(--color-violet)' : 'var(--color-text-secondary)' }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? 'var(--color-violet)' : 'var(--color-text-muted)' }}
            >
              {label}
            </span>
          </Link>
        );
      })}
      </nav>
    </motion.div>
  );
}
