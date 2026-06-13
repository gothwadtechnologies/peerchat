import React from 'react';
import { 
  Users, 
  Radio, 
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface GroupsTabDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupsTabDropdown: React.FC<GroupsTabDropdownProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  const menuOptions = [
    { label: 'New group', icon: Users, path: '/new-group?type=group' },
    { label: 'New channel', icon: Radio, path: '/new-group?type=channel' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <>
      {/* Fallback backdrop to dismiss on click/tap */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent cursor-default" 
        onClick={onClose} 
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className="absolute right-0 top-11 z-[101] w-[190px] bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-[0_10px_35px_rgba(0,0,0,0.15)] rounded-2xl p-1.5 flex flex-col gap-[1px] text-[var(--text-primary)] overflow-hidden select-none"
      >
        <div className="flex flex-col gap-[1px]">
          {menuOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleNavigation(opt.path)}
              className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
            >
              <opt.icon size={16} className="text-[var(--text-secondary)]" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  );
};
