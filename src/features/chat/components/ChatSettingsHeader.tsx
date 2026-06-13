import React from 'react';
import { ArrowLeft, MoreVertical, Edit2, ImageIcon, Play, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatSettingsHeaderProps {
  displayName: string;
  onBack: () => void;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  onSetNickname: () => void;
  onSetPhoto: () => void;
  onClearHistory: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatSettingsHeader({
  displayName,
  onBack,
  showDropdown,
  setShowDropdown,
  onSetNickname,
  onSetPhoto,
  onClearHistory,
  dropdownRef
}: ChatSettingsHeaderProps) {
  return (
    <div className="w-full bg-[var(--header-bg)] px-4 h-14 flex justify-between items-center z-50 shrink-0 relative border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
      {/* Back button */}
      <button 
        onClick={onBack} 
        id="btn_chat_settings_back"
        className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer active:scale-95"
      >
        <ArrowLeft size={22} className="text-[var(--header-text)]" />
      </button>

      {/* Centered large Title - Name ONLY */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
        <h1 
          id="lbl_chat_settings_title"
          className="text-base sm:text-lg font-bold text-[var(--header-text)] tracking-tight truncate max-w-[200px]"
        >
          {displayName}
        </h1>
      </div>

      {/* 3 dots on the absolute right */}
      <div className="relative flex items-center" ref={dropdownRef}>
        <button 
          onClick={() => setShowDropdown(!showDropdown)} 
          id="btn_chat_settings_menu"
          className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all active:scale-95 text-[var(--header-text)] opacity-90 cursor-pointer"
        >
          <MoreVertical size={22} />
        </button>
        
        {/* Dropdown Options matching Android-style chat menus */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute right-0 top-11 w-52 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl py-1.5 z-50 overflow-hidden"
            >
              <button
                onClick={() => { onSetNickname(); setShowDropdown(false); }}
                id="btn_menu_set_nickname"
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Edit2 size={15} className="text-[var(--primary)]" />
                <span>Set Nickname</span>
              </button>
              
              <button
                onClick={() => { onSetPhoto(); setShowDropdown(false); }}
                id="btn_menu_custom_photo"
                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <ImageIcon size={15} className="text-[var(--primary)]" />
                <span>Custom Chat Photo</span>
              </button>
              
              <div className="h-px bg-[var(--border-color)]/60 my-1" />
              
              <button
                onClick={() => { onClearHistory(); setShowDropdown(false); }}
                id="btn_menu_clear_history"
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
                <span>Clear Chat History</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
