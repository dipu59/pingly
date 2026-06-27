export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="bubble-in flex items-center gap-1 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="typing-dot h-1.5 w-1.5 rounded-full"
            style={{
              background: 'var(--color-text-muted)',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
