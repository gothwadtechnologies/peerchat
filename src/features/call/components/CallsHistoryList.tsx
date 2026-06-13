import React from 'react';
import { 
  Phone, 
  Video, 
  PhoneMissed, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PhoneCall
} from 'lucide-react';
import Avatar from '../../../components/common/Avatar';

interface CallRecord {
  id: string;
  otherUserId: string;
  user: string;
  avatar: string;
  type: string;
  isIncoming: boolean;
  isMissed: boolean;
  time: string;
}

interface CallsHistoryListProps {
  calls: CallRecord[];
  loading: boolean;
  onCall: (userId: string, type: 'voice' | 'video') => void;
  onReset: () => void;
}

export const CallsHistoryList: React.FC<CallsHistoryListProps> = ({
  calls,
  loading,
  onCall,
  onReset
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-8 h-8 border-3 border-[#0494f4]/20 border-t-[#0494f4] rounded-full animate-spin" />
        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em]">
          Loading Records...
        </p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#0494f4]/10 text-[#0494f4] flex items-center justify-center">
            <PhoneCall size={30} />
          </div>
          <div className="max-w-[240px]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No call history</h3>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              Log activities, connect with your friends via secure voice & video rooms.
            </p>
          </div>
          <button 
            onClick={onReset}
            className="mt-2 text-xs font-black uppercase tracking-wider bg-[#0494f4] hover:bg-[#0494f4]/90 text-white px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Refresh Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-card)]">
      {calls.map((call, index) => {
        const isMissed = call.isMissed;
        return (
          <div 
            key={call.id}
            className="flex items-center gap-3.5 px-4 py-2.5 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-all border-b border-[var(--border-color)]/5 last:border-0 group cursor-pointer select-none"
          >
            <Avatar url={call.avatar} name={call.user} />
            
            {/* Detailed Row matching ChatUserList layout */}
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <h4 className={`text-[14.5px] truncate font-semibold ${isMissed ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                  {call.user}
                </h4>
                
                <div className="flex items-center gap-1.5 mt-0.5 select-none animate-fade-in">
                  {call.isMissed ? (
                    call.isIncoming ? (
                      <ArrowDownLeft size={13} strokeWidth={3} className="text-rose-500 shrink-0" />
                    ) : (
                      <ArrowUpRight size={13} strokeWidth={3} className="text-amber-500 shrink-0" />
                    )
                  ) : call.isIncoming ? (
                    <ArrowDownLeft size={13} strokeWidth={3} className="text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowUpRight size={13} strokeWidth={3} className="text-[#0494f4] shrink-0" />
                  )}
                  
                  <span className="text-[13px] text-[var(--text-secondary)] opacity-75">
                    {call.type === 'video' ? 'Video' : 'Voice'} Call · {call.time}
                  </span>
                </div>
              </div>
 
              {/* Action Button styled cleanly on the right with official Avatar proportions and transparent color */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall(call.otherUserId, call.type === 'video' ? 'video' : 'voice');
                  }}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-transparent text-[#0494f4] hover:bg-[var(--border-color)]/10 active:scale-95 transition-all duration-150 cursor-pointer shrink-0"
                  title={call.type === 'video' ? "Video Call" : "Voice Call"}
                >
                  {call.type === 'video' ? (
                    <Video size={22} className="stroke-[2.2]" />
                  ) : (
                    <Phone size={22} className="stroke-[2.2]" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
