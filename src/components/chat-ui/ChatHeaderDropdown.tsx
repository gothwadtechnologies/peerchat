import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Video, 
  Volume2, 
  VolumeX, 
  Archive, 
  ArchiveRestore, 
  Eye, 
  EyeOff, 
  Trash2, 
  Eraser, 
  Search,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface ChatHeaderDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string | undefined;
  receiver: any;
  isGroup: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isArchived: boolean;
  archiveChat?: () => void;
  isHidden: boolean;
  hideChat?: () => void;
  deleteChat: () => void;
  clearChat?: () => Promise<void>;
  startCall: (callType: 'voice' | 'video') => void;
  triggerSearch: () => void;
}

export const ChatHeaderDropdown: React.FC<ChatHeaderDropdownProps> = ({
  isOpen,
  onClose,
  receiverId,
  receiver,
  isGroup,
  isMuted,
  setIsMuted,
  isArchived,
  archiveChat,
  isHidden,
  hideChat,
  deleteChat,
  clearChat,
  startCall,
  triggerSearch
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleProfileClick = () => {
    onClose();
    if (receiverId === 'gx-ai' || receiverId === 'grix-ai') {
      navigate('/profile/grix-ai');
    } else if (isGroup) {
      navigate(`/group-settings/${receiverId}`);
    } else {
      navigate(`/user/${receiverId}`);
    }
  };

  const handleCall = (type: 'voice' | 'video') => {
    onClose();
    startCall(type);
  };

  const handleClearHistory = async () => {
    onClose();
    if (window.confirm("Are you sure you want to clear all messages under this chat history? This action cannot be undone.")) {
      if (clearChat) {
        await clearChat();
      }
    }
  };

  const handleDelete = () => {
    onClose();
    if (window.confirm("Are you sure you want to delete this chat interaction completely?")) {
      deleteChat();
    }
  };

  const handleSearchClick = () => {
    onClose();
    triggerSearch();
  };

  return (
    <>
      {/* Absolute fallback backdrop to dismiss on click/tap */}
      <div 
        className="fixed inset-0 z-[100] bg-transparent cursor-default" 
        onClick={onClose} 
      />

      {/* Symmetrical elegant dropdown with matching action menu width: w-48 or w-[190px] */}
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
              {/* Profile */}
              <button
                type="button"
                onClick={handleProfileClick}
                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <User size={16} className="text-[var(--text-secondary)]" />
                <span>View Profile</span>
              </button>

              {/* Search Chat */}
              <button
                type="button"
                onClick={handleSearchClick}
                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <Search size={16} className="text-[var(--text-secondary)]" />
                <span>Search Chat</span>
              </button>

              {/* Calls only for non-AI users / non-groups */}
              {receiverId !== 'gx-ai' && receiverId !== 'grix-ai' && !isGroup && (
                <>
                  <button
                    type="button"
                    onClick={() => handleCall('voice')}
                    className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0494f4] hover:bg-[#0494f4]/10 active:bg-[#0494f4]/25 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                  >
                    <Phone size={16} className="text-[#0494f4]" />
                    <span>Voice Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCall('video')}
                    className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#0494f4] hover:bg-[#0494f4]/10 active:bg-[#0494f4]/25 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                  >
                    <Video size={16} className="text-[#0494f4]" />
                    <span>Video Call</span>
                  </button>
                </>
              )}

              {/* Delete Chat */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-[#ff595a] hover:bg-[#ff595a]/10 active:bg-[#ff595a]/20 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
              >
                <Trash2 size={16} className="text-[#ff595a]" />
                <span>Delete Chat</span>
              </button>

              {/* Page Toggle Button: More */}
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
              {/* Archive */}
              {archiveChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    archiveChat();
                  }}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  {isArchived ? (
                    <>
                      <ArchiveRestore size={16} className="text-[var(--text-secondary)]" />
                      <span>Unarchive Chat</span>
                    </>
                  ) : (
                    <>
                      <Archive size={16} className="text-[var(--text-secondary)]" />
                      <span>Archive Chat</span>
                    </>
                  )}
                </button>
              )}

              {/* Hide Chat */}
              {hideChat && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    hideChat();
                  }}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  {isHidden ? (
                    <>
                      <Eye size={16} className="text-[var(--text-secondary)]" />
                      <span>Unhide Chat</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} className="text-[var(--text-secondary)]" />
                      <span>Hide Chat</span>
                    </>
                  )}
                </button>
              )}

              {/* Mute Notifications */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  setIsMuted(!isMuted);
                }}
                className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] active:bg-[var(--bg-main)]/80 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
              >
                {isMuted ? (
                  <>
                    <Volume2 size={16} className="text-[var(--text-secondary)]" />
                    <span>Unmute Chat</span>
                  </>
                ) : (
                  <>
                    <VolumeX size={16} className="text-[var(--text-secondary)]" />
                    <span>Mute Chat</span>
                  </>
                )}
              </button>

              {/* Clear History */}
              {clearChat && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-[#ffaf40] hover:bg-[#ffaf40]/10 active:bg-[#ffaf40]/20 transition-colors flex items-center gap-3 rounded-xl cursor-pointer border-none bg-transparent"
                >
                  <Eraser size={16} className="text-[#ffaf40]" />
                  <span>Clear History</span>
                </button>
              )}

              {/* Page Toggle Button: Less */}
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
