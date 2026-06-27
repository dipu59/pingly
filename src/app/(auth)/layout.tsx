import type { Metadata } from 'next';
import AuthGuard from '@/components/auth/AuthGuard';

export const metadata: Metadata = {
  title: 'Sign in — Pingly',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh flex items-center justify-center overflow-hidden">
      {/* Ambient background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(109,40,217,0.35) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 100%, rgba(6,182,212,0.15) 0%, transparent 60%)',
        }}
      />
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative z-10 w-full max-w-md px-4">
        <AuthGuard redirectIfAuthed={true}>
          {children}
        </AuthGuard>
      </div>
    </div>
  );
}
