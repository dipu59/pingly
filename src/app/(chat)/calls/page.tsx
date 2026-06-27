import { Phone } from 'lucide-react';

export default function CallsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(6,182,212,0.15)' }}>
        <Phone className="h-7 w-7" style={{ color: '#06B6D4' }} />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Calls</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Audio & video calls coming soon
        </p>
      </div>
    </div>
  );
}
