import React from 'react';
import { History, PhoneMissed, Users, LogIn, Video } from 'lucide-react';

export type StatusFilterOption = 'calls' | 'missed' | 'contacts' | 'join' | 'meeting';

interface CallsQuickActionsProps {
  statusFilter: StatusFilterOption;
  onStatusChange: (filter: StatusFilterOption) => void;
  onCreateMeeting: () => void;
}

export const CallsQuickActions: React.FC<CallsQuickActionsProps> = ({
  statusFilter,
  onStatusChange,
  onCreateMeeting,
}) => {
  return (
    <div 
      className="px-4 pt-1 pb-1 bg-bg-card border-b border-border-color/10 z-10 shrink-0"
      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
    >
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
        
        {/* 1. Recents */}
        <div 
          onClick={() => onStatusChange('calls')}
          className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-all"
          id="action-recents"
        >
          <div className="relative">
            <div 
              className={`w-14 h-14 rounded-full p-[2.5px] border transition-all flex items-center justify-center bg-bg-card shadow-sm ${
                statusFilter === 'calls' 
                  ? 'border-2 border-[#0494f4]' 
                  : 'border border-border-color/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                statusFilter === 'calls'
                  ? 'bg-[#0494f4] text-white shadow-sm'
                  : 'bg-box-bg text-text-secondary hover:bg-[#0494f4]/5 hover:text-[#0494f4]'
              }`}>
                <History size={20} className="stroke-[2.2]" />
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold mt-1.5 max-w-[65px] truncate transition-colors text-center tracking-tight ${
            statusFilter === 'calls' ? 'text-[#0494f4] font-black' : 'text-text-secondary group-hover:text-[#0494f4]'
          }`}>
            Recents
          </span>
        </div>

        {/* 2. Missed */}
        <div 
          onClick={() => onStatusChange('missed')}
          className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-all"
          id="action-missed"
        >
          <div className="relative">
            <div 
              className={`w-14 h-14 rounded-full p-[2.5px] border transition-all flex items-center justify-center bg-bg-card shadow-sm ${
                statusFilter === 'missed' 
                  ? 'border-2 border-[#0494f4]' 
                  : 'border border-border-color/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                statusFilter === 'missed'
                  ? 'bg-[#0494f4] text-white shadow-sm'
                  : 'bg-box-bg text-text-secondary hover:bg-[#0494f4]/5 hover:text-[#0494f4]'
              }`}>
                <PhoneMissed size={20} className="stroke-[2.2]" />
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold mt-1.5 max-w-[65px] truncate transition-colors text-center tracking-tight ${
            statusFilter === 'missed' ? 'text-[#0494f4] font-black' : 'text-text-secondary group-hover:text-[#0494f4]'
          }`}>
            Missed
          </span>
        </div>

        {/* 3. Contacts */}
        <div 
          onClick={() => onStatusChange('contacts')}
          className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-all"
          id="action-contacts"
        >
          <div className="relative">
            <div 
              className={`w-14 h-14 rounded-full p-[2.5px] border transition-all flex items-center justify-center bg-bg-card shadow-sm ${
                statusFilter === 'contacts' 
                  ? 'border-2 border-[#0494f4]' 
                  : 'border border-border-color/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                statusFilter === 'contacts'
                  ? 'bg-[#0494f4] text-white shadow-sm'
                  : 'bg-box-bg text-text-secondary hover:bg-[#0494f4]/5 hover:text-[#0494f4]'
              }`}>
                <Users size={20} className="stroke-[2.2]" />
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold mt-1.5 max-w-[65px] truncate transition-colors text-center tracking-tight ${
            statusFilter === 'contacts' ? 'text-[#0494f4] font-black' : 'text-text-secondary group-hover:text-[#0494f4]'
          }`}>
            Contacts
          </span>
        </div>

        {/* 4. Join */}
        <div 
          onClick={() => onStatusChange('join')}
          className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-all"
          id="action-join"
        >
          <div className="relative">
            <div 
              className={`w-14 h-14 rounded-full p-[2.5px] border transition-all flex items-center justify-center bg-bg-card shadow-sm ${
                statusFilter === 'join' 
                  ? 'border-2 border-[#0494f4]' 
                  : 'border border-border-color/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                statusFilter === 'join'
                  ? 'bg-[#0494f4] text-[#ffffff] shadow-sm'
                  : 'bg-box-bg text-text-secondary hover:bg-[#0494f4]/5 hover:text-[#0494f4]'
              }`}>
                <LogIn size={20} className="stroke-[2.2]" />
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold mt-1.5 max-w-[65px] truncate transition-colors text-center tracking-tight ${
            statusFilter === 'join' ? 'text-[#0494f4] font-black' : 'text-text-secondary group-hover:text-[#0494f4]'
          }`}>
            Join
          </span>
        </div>

        {/* 5. Meeting Option */}
        <div 
          onClick={onCreateMeeting}
          className="flex flex-col items-center shrink-0 cursor-pointer group active:scale-95 transition-all"
          id="action-meeting"
        >
          <div className="relative">
            <div 
              className={`w-14 h-14 rounded-full p-[2.5px] border transition-all flex items-center justify-center bg-bg-card shadow-sm ${
                statusFilter === 'meeting' 
                  ? 'border-2 border-[#0494f4]' 
                  : 'border border-border-color/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              <div className={`w-full h-full rounded-full flex items-center justify-center transition-all ${
                statusFilter === 'meeting'
                  ? 'bg-[#0494f4] text-white shadow-sm'
                  : 'bg-box-bg text-text-secondary hover:bg-[#0494f4]/5 hover:text-[#0494f4]'
              }`}>
                <Video size={20} className="stroke-[2.2]" />
              </div>
            </div>
          </div>
          <span className={`text-[10px] font-extrabold mt-1.5 max-w-[65px] truncate transition-colors text-center tracking-tight ${
            statusFilter === 'meeting' ? 'text-[#0494f4] font-black' : 'text-text-secondary group-hover:text-[#0494f4]'
          }`}>
            Meeting
          </span>
        </div>

      </div>
    </div>
  );
};

export default CallsQuickActions;
