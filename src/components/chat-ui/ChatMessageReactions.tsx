import React from 'react';

export const ChatMessageReactions: React.FC<{
  onReact: (emoji: string) => void;
  onClose: () => void;
  position: 'left' | 'right';
}> = ({ onReact, onClose, position }) => {
  const emojis = ['❤️', '😂', '😮', '😢', '🔥', '👍'];
  return (
    <div 
      className={`absolute bottom-full mb-2 flex items-center gap-1 bg-[var(--bg-card)] rounded-full shadow-xl border border-[var(--border-color)] p-1 z-[9999] animate-in zoom-in-95 duration-150 ${position === 'right' ? 'right-0' : 'left-0'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => { onReact(emoji); onClose(); }}
          className="w-9 h-9 flex items-center justify-center hover:bg-[var(--bg-main)] rounded-full transition-all active:scale-125 text-xl"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
