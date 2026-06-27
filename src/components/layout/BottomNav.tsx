'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <nav
      className="safe-area-pb flex h-16 items-center justify-around border-t glass"
      style={{ borderColor: 'var(--color-border)' }}
      aria-label="Mobile navigation"
    >
      {TABS.map(({ href, icon: Icon, label }) => {
        const isActive = href === '/chat'
          ? pathname.startsWith('/chat')
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
  );
}
