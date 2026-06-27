'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { registerWithEmail, loginWithGoogle } from '@/services/authService';
import { cn } from '@/lib/utils';

export default function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email, password, displayName);
      router.push('/chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      router.push('/chat');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="glass rounded-2xl p-8 shadow-2xl"
    >
      {/* Logo */}
      <div className="mb-7 flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl gradient-violet glow-violet-sm">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white">Create account ✨</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Join Pingly today
        </p>
      </div>

      {/* Google Sign-In */}
      <button
        id="google-signup-btn"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
          color: 'var(--color-text-primary)',
        }}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continue with Google
      </button>

      <div className="relative mb-4 flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.10)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or</span>
        <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.10)' }} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <InputField
          id="signup-name"
          type="text"
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChange={setDisplayName}
          icon={<User className="h-4 w-4" />}
        />
        <InputField
          id="signup-email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={setEmail}
          icon={<Mail className="h-4 w-4" />}
        />

        <div className="relative">
          <InputField
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={setPassword}
            icon={<Lock className="h-4 w-4" />}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <InputField
          id="signup-confirm-password"
          type="password"
          label="Confirm Password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<Lock className="h-4 w-4" />}
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'var(--color-error-muted)',
              color: 'var(--color-error)',
            }}
          >
            {error}
          </motion.p>
        )}

        <button
          id="signup-submit-btn"
          type="submit"
          disabled={loading || googleLoading}
          className={cn(
            'mt-1 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3',
            'text-sm font-semibold text-white transition-all duration-200',
            'gradient-violet hover:opacity-90 active:scale-[0.98] glow-violet-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium transition-opacity hover:opacity-80"
          style={{ color: 'var(--color-violet-light)' }}
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

function InputField({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  icon,
}: {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-violet-500/50"
          style={{
            background: 'rgba(39,39,42,0.8)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function friendlyError(message: string): string {
  if (message.includes('email-already-in-use'))
    return 'This email is already registered. Try signing in.';
  if (message.includes('weak-password'))
    return 'Password is too weak.';
  if (message.includes('invalid-email'))
    return 'Please enter a valid email address.';
  return message;
}
