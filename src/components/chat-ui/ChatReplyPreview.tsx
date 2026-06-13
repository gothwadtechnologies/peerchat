import React from 'react';
import { Reply, X } from 'lucide-react';

export const ChatReplyPreview: React.FC<{
  replyingTo: any;
  setReplyingTo: (msg: any) => void;
  receiver: any;
  currentUserUid: string | undefined;
}> = ({ replyingTo, setReplyingTo, receiver, currentUserUid }) => {
  if (!replyingTo) return null;
  return (
    <div className="mb-2 mx-2 p-2 bg-black/20 rounded-xl border-l-[6px] border-[var(--primary)] flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3 flex-1 min-w-0 px-2">
        <div className="p-1.5 bg-[var(--primary)]/10 rounded-full">
          <Reply size={14} className="text-[var(--primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black text-white uppercase tracking-widest opacity-80">
            Replying to {replyingTo.sender_id === currentUserUid ? 'yourself' : receiver?.fullName}
          </p>
          <p className="text-[13px] text-white/70 font-medium truncate italic">"{replyingTo.content || replyingTo.text}"</p>
        </div>
      </div>
      <button 
        onClick={() => setReplyingTo(null)} 
        className="p-1.5 hover:bg-white/10 rounded-full transition-all active:scale-90"
      >
        <X size={18} className="text-white/70" />
      </button>
    </div>
  );
};
