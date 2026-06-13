import React from 'react';
import { 
  History, 
  PhoneMissed, 
  Users, 
  LogIn, 
  Video,
  Check,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface CallsTabDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallsTabDropdown: React.FC<CallsTabDropdownProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  // Retrieve current active filter safely to support restricted sandbox iframes
  const safeGetActiveFilter = (): string => {
    try {
      return localStorage.getItem('grixchat-calls-filter') || 'calls';
    } catch (e) {
      return (window as any).__fallbackStorage?.['grixchat-calls-filter'] || 'calls';
    }
  };

  const safeSetActiveFilter = (filter: string) => {
    try {
      localStorage.setItem('grixchat-calls-filter', filter);
    } catch (e) {
      if (!(window as any).__fallbackStorage) {
        (window as any).__fallbackStorage = {};
      }
      (window as any).__fallbackStorage['grixchat-calls-filter'] = filter;
    }
  };

  const activeFilter = safeGetActiveFilter();

  const handleOptionClick = (filter: string) => {
    safeSetActiveFilter(filter);
    window.dispatchEvent(new CustomEvent('calls-tab-filter-change', { detail: { filter } }));
    onClose();
  };

  const handleCreateMeeting = () => {
    window.dispatchEvent(new CustomEvent('calls-tab-create-meeting'));
    onClose();
  };

  const options = [
    { label: 'Recents', value: 'calls', icon: History, color: 'text-[var(--text-secondary)]' },
    { label: 'Missed', value: 'missed', icon: PhoneMissed, color: 'text-rose-500' },
    { label: 'Contacts', value: 'contacts', icon: Users, color: 'text-[var(--text-secondary)]' },
    { label: 'Join', value: 'join', icon: LogIn, color: 'text-[var(--text-secondary)]' },
  ];

  return (
    <>
      {/* Backdrop to close the dropdown on click outside */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent cursor-default" 
        onClick={onClose} 
      />

      {/* Symmetrical elegant dropdown matching ChatTabDropdown precisely */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="absolute right-0 top-11 z-[101] w-[190px] bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-[0_10px_35px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 flex flex-col gap-[1px] text-[var(--text-primary)] overflow-hidden select-none"
      >
        {options.map((opt) => {
          const isSelected = activeFilter === opt.value;
          const IconComponent = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleOptionClick(opt.value)}
              className={`w-full px-4 py-2.5 text-left text-[13px] font-semibold transition-colors flex items-center justify-between rounded-xl cursor-pointer border-none bg-transparent ${
                isSelected 
                  ? 'bg-[#0494f4]/10 text-[#0494f4] font-bold' 
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-main)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent size={16} className={isSelected ? 'text-[#0494f4]' : opt.color} />
                <span>{opt.label}</span>
              </div>
              {isSelected && (
                <Check size={14} className="text-[#0494f4]" />
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="h-px bg-[var(--border-color)]/30 mx-2 my-1" />

        {/* Emerald green instant option */}
        <button
          type="button"
          onClick={handleCreateMeeting}
          className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-emerald-500 hover:bg-emerald-500/10 transition-colors flex items-center justify-between rounded-xl cursor-pointer border-none bg-transparent"
        >
          <div className="flex items-center gap-3">
            <Video size={16} className="text-emerald-500" />
            <span>Meeting</span>
          </div>
          <ChevronRight size={14} className="text-emerald-400 opacity-80" />
        </button>
      </motion.div>
    </>
  );
};
