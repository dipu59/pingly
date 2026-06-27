'use client';

// 🔒 This page is only accessible in development mode.
// In production, it returns a 404 to prevent abuse.
import { notFound } from 'next/navigation';

if (process.env.NODE_ENV === 'production') {
  notFound();
}

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { Loader2 } from 'lucide-react';

const demoUsers = [
  {
    email: 'alice@example.com',
    password: 'password123',
    displayName: 'Alice Smith',
    bio: 'Software Engineer & Coffee enthusiast',
    photoURL: 'https://i.pravatar.cc/150?u=alice@example.com',
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    displayName: 'Bob Johnson',
    bio: 'Designer by day, gamer by night',
    photoURL: 'https://i.pravatar.cc/150?u=bob@example.com',
  },
  {
    email: 'charlie@example.com',
    password: 'password123',
    displayName: 'Charlie Brown',
    bio: 'Music producer',
    photoURL: 'https://i.pravatar.cc/150?u=charlie@example.com',
  },
  {
    email: 'diana@example.com',
    password: 'password123',
    displayName: 'Diana Prince',
    bio: 'Product Manager',
    photoURL: 'https://i.pravatar.cc/150?u=diana@example.com',
  },
];

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const handleSeed = async () => {
    setLoading(true);
    setLogs([]);
    addLog('Starting seed process...');

    for (const user of demoUsers) {
      try {
        addLog(`Creating user: ${user.email}`);
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        
        const userDoc = {
          uid: userCredential.user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          bio: user.bio,
          isOnline: false,
          lastSeen: serverTimestamp(),
          createdAt: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
        addLog(`✅ Successfully created user: ${user.displayName}`);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          addLog(`User ${user.email} already exists in Auth. Logging in and setting document...`);
          try {
            const cred = await signInWithEmailAndPassword(auth, user.email, user.password);
            const userDoc = {
              uid: cred.user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              bio: user.bio,
              isOnline: false,
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', cred.user.uid), userDoc, { merge: true });
            addLog(`✅ Successfully updated existing user: ${user.displayName}`);
          } catch (innerError: any) {
            addLog(`❌ Failed to login and update ${user.email}: ${innerError.message}`);
          }
        } else {
          addLog(`❌ Failed to create user ${user.email}: ${error.message}`);
        }
      }
    }
    
    addLog('🎉 Seeding complete!');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="max-w-md w-full glass p-8 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Seed Demo Users</h1>
          <p className="text-sm text-zinc-400">
            Click the button below to add Alice, Bob, Charlie, and Diana to your Firebase Authentication and Firestore Database.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? 'Seeding...' : 'Seed Database'}
        </button>

        {logs.length > 0 && (
          <div className="mt-4 bg-zinc-900 rounded-xl p-4 border border-zinc-800 h-64 overflow-y-auto">
            <h3 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Logs</h3>
            <div className="flex flex-col gap-1.5 font-mono text-xs text-zinc-300">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
