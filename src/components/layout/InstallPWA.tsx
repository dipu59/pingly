'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has previously dismissed the prompt in this session
    const hasDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
    if (hasDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If the app is already installed
    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
          className="fixed bottom-24 left-1/2 md:bottom-8 md:left-8 md:translate-x-0 z-[100] flex items-center gap-3 rounded-full px-4 py-2 shadow-2xl border"
          style={{
            background: 'rgba(9, 9, 11, 0.95)',
            backdropFilter: 'blur(10px)',
            borderColor: 'var(--color-border-strong)',
            color: 'var(--color-text-primary)'
          }}
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-full gradient-violet">
            <Download className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight text-white">Install Pingly</span>
            <span className="text-[10px] text-zinc-400 leading-tight">Fast, native app experience</span>
          </div>
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
            <button
              onClick={handleInstallClick}
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
