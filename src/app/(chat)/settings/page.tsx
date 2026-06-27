'use client';

import { Settings, Download, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Also check if our global InstallPrompt stashed it
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || (window as any).deferredPwaPrompt;
    if (!prompt) {
      alert("Installation is not supported on this browser or the app is already installed.");
      return;
    }
    
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setIsStandalone(true);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    }
  };

  return (
    <div className="flex h-full flex-col p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
          <Settings className="h-6 w-6" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            App preferences and account settings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* App Installation Section */}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-violet-400" />
                Get the App
              </h3>
              <p className="mt-1 text-sm text-zinc-400 max-w-sm">
                Install Pingly on your device for a faster, native experience with offline support and push notifications.
              </p>
            </div>
            
            {!isStandalone ? (
              <button
                onClick={handleInstallClick}
                className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-700 active:scale-95 shadow-lg shadow-violet-500/20"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            ) : (
              <div className="rounded-lg bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-400 border border-green-500/20">
                Installed
              </div>
            )}
          </div>
        </section>

        {/* Placeholder for other settings */}
        <section className="rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
          <h3 className="text-lg font-semibold text-white">Account</h3>
          <p className="mt-1 text-sm text-zinc-400">Account settings coming soon.</p>
        </section>
      </div>
    </div>
  );
}
