'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Phone,
  Users,
  Bookmark,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logout } from '@/services/authService';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/chat', icon: MessageSquare, label: 'Chats' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/people', icon: Users, label: 'People' },
  { href: '/saved', icon: Bookmark, label: 'Saved' },
  { href: '/settings', icon: Settings, label: 'Settings' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <aside
      className="flex h-full w-16 flex-col items-center border-r py-4 gap-1"
      style={{
        background: 'rgba(9,9,11,0.95)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <Link
        href="/chat"
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl gradient-violet glow-violet-sm transition-transform duration-200 hover:scale-105"
        aria-label="Pingly home"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
        </svg>
      </Link>

      {/* Nav Items */}
      <nav className="flex flex-1 flex-col items-center gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/chat'
            ? pathname.startsWith('/chat')
            : pathname === href;

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                'group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200',
                isActive
                  ? 'gradient-violet glow-violet-sm text-white'
                  : 'hover:bg-zinc-800/70 text-zinc-400 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100 z-50"
                style={{
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border-strong)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute -right-[1px] top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-l-full"
                  style={{ background: 'var(--color-violet)' }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: User avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition-all duration-200 hover:bg-zinc-800/70 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <Link
          href="/profile"
          className="h-9 w-9 rounded-full ring-2 ring-violet-500/50 overflow-hidden flex items-center justify-center text-xs font-semibold transition-transform hover:scale-105"
          style={{ background: 'var(--color-violet-muted)', color: 'var(--color-violet-light)' }}
        >
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt={user.displayName ?? ''} className="h-full w-full object-cover" />
          ) : (
            getInitials(user?.displayName ?? 'U')
          )}
        </Link>
      </div>
    </aside>
  );
}
