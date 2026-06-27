'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BlockEasterEggModalProps {
  onClose: () => void;
}

export default function BlockEasterEggModal({ onClose }: BlockEasterEggModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Dark overlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          key={`modal-step-${step}`}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(24,24,27,0.85)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 0 40px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Subtle purple glow inside the modal */}
          <div className="pointer-events-none absolute -inset-20 z-0 bg-violet-600/10 blur-[80px]" />

          <div className="relative z-10 px-6 py-8 text-center">
            {step === 1 ? (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <span className="text-3xl">🥺</span>
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">You can't block me</h3>
                
                <div className="mb-8 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  <p>After everything we've been through...</p>
                  <p>you really want to block me?</p>
                  <br />
                  <p>I sent your messages.</p>
                  <p>I delivered your voice notes.</p>
                  <p>I even handled your bugs.</p>
                  <p className="mt-4 font-medium text-white/90">And this is how you treat me? 💔</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-600 active:scale-95"
                    style={{ background: 'var(--color-violet)' }}
                  >
                    Nooo sorry
                  </button>
                  
                  <button
                    onClick={() => setStep(2)}
                    className="w-full rounded-xl py-2.5 text-sm font-medium transition-all hover:bg-zinc-800/80 active:scale-95"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Still block
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10">
                  <span className="text-3xl">😼</span>
                </div>

                <h3 className="mb-2 text-xl font-bold text-white">Nice try</h3>
                
                <div className="mb-8 space-y-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  <p>Blocking is disabled in Pingly.</p>
                  <p className="font-medium text-white/90">You’re stuck with them.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-600 active:scale-95"
                    style={{ background: 'var(--color-violet)' }}
                  >
                    Okay bro
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
