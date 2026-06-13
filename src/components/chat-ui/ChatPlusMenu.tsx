import React from 'react';
import { Plus, Mic, Image as ImageIcon, FileText } from 'lucide-react';

export const ChatPlusMenu: React.FC<{
  showPlusMenu: boolean;
  setShowPlusMenu: (show: boolean) => void;
  plusMenuRef: React.RefObject<HTMLDivElement | null>;
  onMediaClick?: () => void;
  onFileClick?: () => void;
  chatId?: string;
}> = ({ showPlusMenu, setShowPlusMenu, plusMenuRef, onMediaClick, onFileClick, chatId }) => {
  return (
    <div className="relative" ref={plusMenuRef}>
      <button type="button" onClick={() => setShowPlusMenu(!showPlusMenu)} className="p-2 text-[var(--text-primary)] hover:bg-[var(--bg-main)] rounded-full transition-colors shrink-0">
        <Plus size={24} />
      </button>
      {showPlusMenu && (
        <div className="absolute bottom-full left-0 mb-3 w-40 bg-[var(--bg-card)] rounded-xl shadow-2xl border border-[var(--border-color)] py-1 z-[9999] overflow-hidden">
          <button className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-3 transition-colors">
            <div className="w-7 h-7 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--primary)]"><Mic size={16} /></div> Microphone
          </button>
          <button 
            onClick={() => { onMediaClick?.(); setShowPlusMenu(false); }}
            className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-3 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--primary)]"><ImageIcon size={16} /></div> Media
          </button>
          <button 
            onClick={() => { onFileClick?.(); setShowPlusMenu(false); }}
            className="w-full px-3 py-2.5 text-left text-[13px] font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-3 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--primary)]"><FileText size={16} /></div> Files
          </button>
        </div>
      )}
    </div>
  );
};
