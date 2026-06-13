import React from 'react';
import { Smile } from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import { useTheme } from '../../contexts/ThemeContext';

export const EmojiPickerMenu: React.FC<{
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement | null>;
  onEmojiSelect: (emoji: string) => void;
}> = ({ showEmojiPicker, setShowEmojiPicker, emojiPickerRef, onEmojiSelect }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  return (
    <div className="relative" ref={emojiPickerRef}>
      <button 
        type="button" 
        onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
        className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-main)] rounded-full transition-colors shrink-0"
      >
        <Smile size={24} />
      </button>
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 mb-3 z-[9999] animate-in slide-in-from-bottom-2 duration-200 shadow-2xl rounded-2xl overflow-hidden">
          <EmojiPicker 
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
            }}
            theme={isDark ? EmojiTheme.DARK : EmojiTheme.LIGHT}
            lazyLoadEmojis={true}
            searchPlaceholder="Search emojis..."
            width={300}
            height={400}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}
    </div>
  );
};
