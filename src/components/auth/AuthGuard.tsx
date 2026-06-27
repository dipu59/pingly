'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, redirect authenticated users away (for auth pages) */
  redirectIfAuthed?: boolean;
}

export default function AuthGuard({ children, redirectIfAuthed = false }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (redirectIfAuthed && user) {
      router.replace('/chat');
    } else if (!redirectIfAuthed && !user) {
      router.replace('/login');
    }
  }, [user, loading, router, redirectIfAuthed]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full typing-dot"
              style={{
                background: 'var(--color-violet)',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (redirectIfAuthed && user) return null;
  if (!redirectIfAuthed && !user) return null;

  return <>{children}</>;
}
