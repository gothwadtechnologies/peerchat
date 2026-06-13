import React from 'react';
import { Edit2, X } from 'lucide-react';

export const ChatEditPreview: React.FC<{
  editingMessage: any;
  setEditingMessage: (msg: any) => void;
  setNewMessage: (text: string) => void;
}> = ({ editingMessage, setEditingMessage, setNewMessage }) => {
  if (!editingMessage) return null;
  return (
    <div className="mb-2 mx-2 p-2 bg-black/20 rounded-xl border-l-[6px] border-[var(--primary)] flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 flex-1 min-w-0 px-2">
        <div className="p-1.5 bg-[var(--primary)]/10 rounded-full">
          <Edit2 size={14} className="text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-white uppercase tracking-widest opacity-80">Editing Message</p>
          <p className="text-[13px] text-white/70 font-medium truncate italic">"{editingMessage.content || editingMessage.text}"</p>
        </div>
      </div>
      <button 
        onClick={() => { setEditingMessage(null); setNewMessage(''); }} 
        className="p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-90"
      >
        <X size={18} className="text-white/70" />
      </button>
    </div>
  );
};
