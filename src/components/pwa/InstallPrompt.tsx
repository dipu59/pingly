'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

// Extend window interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed / running as standalone PWA
    const checkStandalone = () => {
      const isIOSStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
      const isModernStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isIOSStandalone || isModernStandalone);
    };
    
    checkStandalone();

    // Check if device is iOS (iOS doesn't support beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice && !isStandalone) {
      // For iOS, we might want to show a custom prompt telling them to use "Add to Home Screen"
      // But let's only show it if they haven't dismissed it before
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[80px] left-4 right-4 z-[100] md:bottom-6 md:left-auto md:right-6 md:w-96"
      >
        <div 
          className="flex items-center justify-between gap-4 rounded-2xl p-4 shadow-2xl backdrop-blur-xl"
          style={{ 
            background: 'rgba(39, 39, 42, 0.85)',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500 shadow-inner">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Install Pingly</h3>
              <p className="text-xs text-zinc-300">
                {isIOS 
                  ? 'Tap Share \u2193 then "Add to Home Screen"' 
                  : 'Add to home screen for a better experience.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isIOS && (
              <button
                onClick={handleInstallClick}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white transition-transform hover:scale-105 active:scale-95"
                aria-label="Install App"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
