import React, { useState } from 'react';
import { 
  Users, 
  Radio, 
  EyeOff, 
  Settings, 
  ChevronRight, 
  ChevronLeft,
  MessageCircle,
  Check,
  User,
  UserPlus,
  CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext.tsx';

interface ChatTabDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  chatListFilter: 'all' | 'direct' | 'groups' | 'channels';
  setChatListFilter: (filter: 'all' | 'direct' | 'groups' | 'channels') => void;
  showHiddenChatsEntry: boolean;
}

export const ChatTabDropdown: React.FC<ChatTabDropdownProps> = ({
  isOpen,
  onClose,
  chatListFilter,
  setChatListFilter,
  showHiddenChatsEntry
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<1 | 2>(1);
  const { setChatSelectMode, setSelectedChatIds } = useLayout();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleFilterClick = (filter: 'all' | 'direct' | 'groups' | 'channels') => {
    setChatListFilter(filter);
    onClose();
  };

  const menuOptions = [
    { label: 'Add friends', icon: UserPlus, onClick: () => handleNavigation('/search') },
    { label: 'Select', icon: CheckSquare, onClick: () => {
        setChatSelectMode(true);
        setSelectedChatIds([]);
        onClose();
      } 
    },
    { label: 'New group', icon: Users, onClick: () => handleNavigation('/new-group?type=group') },
    { label: 'New channel', icon: Radio, onClick: () => handleNavigation('/new-group?type=channel') },
    { label: 'Settings', icon: Settings, onClick: () => handleNavigation('/settings') },
  ];

  const filterOptions = [
    { label: 'All Chats', filter: 'all', icon: MessageCircle },
    { label: 'Groups Only', filter: 'groups', icon: Users },
    { label: 'Channels Only', filter: 'channels', icon: Radio },
  ] as const;

  return (
    <>
      {/* Fallback backdrop to dismiss on click/tap */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent cursor-default" 
        onClick={onClose} 
      />

      {/* Symmetrical elegant dropdown matching ChatHeaderDropdown precisely */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="absolute right-0 top-11 z-[101] w-[190px] bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-[0_10px_35px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 flex flex-col gap-[1px] text-[var(--text-primary)] overflow-hidden select-none"
      >
        <AnimatePresence mode="wait">
          {page === 1 ? (
            <motion.div
              key="page1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col gap-[1px]"
            >
              {menuOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={opt.onClick}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  <opt.icon size={16} className="text-[var(--text-secondary)]" />
                  <span>{opt.label}</span>
                </button>
              ))}

              {/* Page Toggle Button: More Options */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPage(2); }}
                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0494f4] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center justify-between rounded-xl cursor-pointer border-none bg-transparent border-t border-[var(--border-color)]/30 mt-1 pt-2"
              >
                <span className="flex items-center gap-3">
                  <ChevronRight size={16} className="text-[#0494f4]" />
                  <span>More Options</span>
                </span>
                <ChevronRight size={15} className="text-[#0494f4]/80" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="page2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.1 }}
              className="flex flex-col gap-[1px]"
            >
              {filterOptions.map((opt) => {
                const isSelected = chatListFilter === opt.filter;
                return (
                  <button
                    key={opt.filter}
                    type="button"
                    onClick={() => handleFilterClick(opt.filter)}
                    className={`w-full px-4 py-2.5 text-left text-[13px] font-semibold transition-colors flex items-center justify-between rounded-xl cursor-pointer border-none bg-transparent ${
                      isSelected 
                        ? 'bg-[#0494f4]/10 text-[#0494f4] font-bold' 
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon size={16} className={isSelected ? 'text-[#0494f4]' : 'text-[var(--text-secondary)]'} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && (
                      <Check size={14} className="text-[#0494f4]" />
                    )}
                  </button>
                );
              })}

              {/* Page Toggle Button: Back */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPage(1); }}
                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0494f4] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center justify-between rounded-xl cursor-pointer border-none bg-transparent border-t border-[var(--border-color)]/30 mt-1 pt-2"
              >
                <span className="flex items-center gap-3">
                  <ChevronLeft size={16} className="text-[#0494f4]" />
                  <span>Back</span>
                </span>
                <ChevronLeft size={15} className="text-[#0494f4]/80" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
