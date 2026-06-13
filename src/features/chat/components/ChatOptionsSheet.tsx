import React from 'react';
import { 
  X, 
  User, 
  Archive, 
  ArchiveRestore, 
  EyeOff, 
  Eye, 
  Volume2, 
  VolumeX, 
  Trash, 
  UserX, 
  AlertTriangle,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../../components/common/Avatar';

interface ChatOptionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  receiver: any;
  receiverId: string | undefined;
  isArchived: boolean;
  isHidden: boolean;
  isMuted: boolean;
  archiveChat: () => void;
  hideChat: () => void;
  setIsMuted: (muted: boolean) => void;
  deleteChat: () => void;
  children?: React.ReactNode;
}

export const ChatOptionsSheet: React.FC<ChatOptionsSheetProps> = ({
  isOpen,
  onClose,
  receiver,
  receiverId,
  isArchived,
  isHidden,
  isMuted,
  archiveChat,
  hideChat,
  setIsMuted,
  deleteChat,
  children
}) => {
  const navigate = useNavigate();

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 40, 
              stiffness: 1200, 
              mass: 0.2,
              restDelta: 0.001 
            }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] z-[9999] rounded-t-[32px] border-t border-[var(--border-color)] flex flex-col overflow-hidden shadow-2xl safe-bottom max-h-[85vh]"
          >
            {/* Handle */}
            <div className="w-full flex justify-center py-2 shrink-0">
              <div className="w-10 h-1 bg-[var(--border-color)] rounded-full opacity-40" />
            </div>

            {/* Header */}
            <div className="px-6 py-1 flex items-center justify-between border-b border-[var(--border-color)]/20 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar 
                  url={receiver?.photoURL}
                  size="sm"
                  type="direct"
                  name={receiver?.fullName || receiver?.username}
                />
                <h3 className="text-[18px] font-black text-[var(--text-primary)] tracking-tight">Chat Options</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-colors text-[var(--text-secondary)]"
              >
                <X size={20} />
              </button>
            </div>

            {/* Options List */}
            <div className="p-2 space-y-1 pb-10 overflow-y-auto no-scrollbar">
              {children ? children : (
                <>
                  <button 
                    onClick={() => handleAction(() => receiverId === 'gx-ai' || receiverId === 'grix-ai' ? navigate('/profile/grix-ai') : navigate(`/user/${receiverId}`))} 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      <User size={20} />
                    </div>
                    <span>View Profile</span>
                  </button>

                  <button 
                    onClick={() => handleAction(archiveChat)} 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      {isArchived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
                    </div>
                    <span>{isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                  </button>

                  <button 
                    onClick={() => handleAction(hideChat)} 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      {isHidden ? <Eye size={20} /> : <EyeOff size={20} />}
                    </div>
                    <span>{isHidden ? 'Unhide Chat' : 'Hide Chat'}</span>
                  </button>

                  <button 
                    onClick={() => handleAction(() => setIsMuted(!isMuted))} 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      {isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </div>
                    <span>{isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                  </button>

                  <div className="h-px bg-[var(--border-color)]/20 mx-4 my-2" />

                  <button 
                    onClick={() => handleAction(deleteChat)} 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                      <Trash size={20} />
                    </div>
                    <span>Delete Conversation</span>
                  </button>

                  <button 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      <UserX size={20} />
                    </div>
                    <span>Block User</span>
                  </button>

                  <button 
                    className="w-full px-5 py-3.5 text-left text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] flex items-center gap-4 transition-colors rounded-2xl"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-secondary)]">
                      <AlertTriangle size={20} />
                    </div>
                    <span>Report User</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
