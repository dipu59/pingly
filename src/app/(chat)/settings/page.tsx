import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'var(--color-surface-2)' }}>
        <Settings className="h-7 w-7" style={{ color: 'var(--color-text-secondary)' }} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          App preferences and account settings
        </p>
      </div>
    </div>
  );
}
