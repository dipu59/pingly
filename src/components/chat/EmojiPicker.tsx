'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// Curated set of 120 common emojis grouped by category
const EMOJI_GROUPS = [
  {
    label: 'Smileys',
    emojis: ['😀','😁','😂','🤣','😊','😍','🥰','😘','😎','🤩','😏','🙂','🤗','😜','🤪','😋','😛','😝','🤭','🫡','😶','😑','🙄','😒','😞','😔','😟','😕','🫤','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡'],
  },
  {
    label: 'Gestures',
    emojis: ['👍','👎','👋','🤙','✌️','🤞','🤟','🤘','👌','🤌','🫳','🫴','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','💪','🦾','🙌','👏','🫶','🤝','🙏','✍️','💅'],
  },
  {
    label: 'Hearts & Symbols',
    emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','💕','💞','💓','💗','💖','💝','💘','💟','☮️','✝️','⭐','🌟','💫','✨','🔥','💥','🎉','🎊','🏆'],
  },
  {
    label: 'Nature',
    emojis: ['🌸','🌺','🌹','🌷','🌼','🌻','🍀','🌿','🌱','🌲','🌳','🍁','🍂','🍃','🌾','🌵','🎋','🎍','🍄','🌊','🌈','⚡','❄️','🌙','☀️','⛅','🌤️','🌦️','🌧️','🌩️'],
  },
  {
    label: 'Food',
    emojis: ['🍕','🍔','🌮','🌯','🍜','🍣','🍩','🎂','🍰','🧁','🍪','🍫','🍭','🍬','🍦','🥤','☕','🧋','🍺','🥂'],
  },
  {
    label: 'Activity',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🎯','🎱','🏓','🎮','🎲','🎸','🎺','🎻','🥁','🎤','🎧','🎬','🎨','📷'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
      className="absolute bottom-full left-0 mb-2 z-50 w-72 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-strong)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-h-64 overflow-y-auto p-2">
        {EMOJI_GROUPS.map((group) => (
          <div key={group.label} className="mb-2">
            <p className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
              {group.label}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onSelect(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all duration-100 hover:scale-110 hover:bg-zinc-700/60"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
