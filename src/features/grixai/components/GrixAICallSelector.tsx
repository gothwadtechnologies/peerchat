import React from 'react';
import { motion } from 'motion/react';
import { X, Phone, User, Users, Globe } from 'lucide-react';
import { LocalDataCache } from '../../../services/LocalDataCache';

interface GrixAICallSelectorProps {
  currentUserId: string;
  onClose: () => void;
  onSelectRecipient: (recipient: { fullName: string; photoURL?: string; username?: string }) => void;
}

export const GrixAICallSelector: React.FC<GrixAICallSelectorProps> = ({ 
  currentUserId, 
  onClose, 
  onSelectRecipient 
}) => {
  // Retrieve conversations using secure local cached context
  const cachedConversations = currentUserId ? (LocalDataCache.getConversations(currentUserId) || []) : [];

  const eligibleContacts = cachedConversations.map((chat: any) => {
    if (chat.type === 'group') {
      return {
        id: chat.id,
        fullName: chat.name || 'Unnamed Group Chat',
        username: 'group',
        photoURL: chat.isGroup ? undefined : '/assets/favicon.png',
        isGroup: true
      };
    } else {
      const otherPart = chat.participants?.find((p: any) => p.user?.id !== currentUserId);
      const name = otherPart?.user?.full_name || otherPart?.user?.fullName || 'GrixChat User';
      const username = otherPart?.user?.username || 'unknown';
      const photoURL = otherPart?.user?.photo_url || otherPart?.user?.photoURL;
      return {
        id: chat.id,
        fullName: name,
        username,
        photoURL,
        isGroup: false
      };
    }
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-[150] transition-all">
      <motion.div 
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-3xl sm:rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] shadow-2xl"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--header-bg)]">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Phone size={16} />
            </span>
            <span className="text-xs font-black uppercase text-[var(--header-text)] tracking-wider">
              Select Link Recipient
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full text-[var(--header-text)] cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider pl-1">
            Active Chat Contacts ({eligibleContacts.length})
          </p>

          <div className="space-y-1.5">
            {eligibleContacts.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[var(--border-color)] rounded-xl space-y-3">
                <Globe size={24} className="text-[var(--text-secondary)] mx-auto animate-pulse" />
                <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
                  No other active chat contacts found on this device's Grix state.
                </p>
                <div className="h-px bg-[var(--border-color)]/30" />
                <button
                  onClick={() => onSelectRecipient({ fullName: 'Grix AI Terminal Proxy', username: 'ai_hologram' })}
                  className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all text-center inline-flex items-center justify-center gap-1.5"
                >
                  <Phone size={12} /> Test Code Hologram Link
                </button>
              </div>
            ) : (
              eligibleContacts.map((contact, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectRecipient(contact)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)]/50 hover:bg-[var(--bg-main)] hover:border-indigo-500/50 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-center overflow-hidden shrink-0 relative">
                      {contact.photoURL ? (
                        <img src={contact.photoURL} alt={contact.fullName} className="w-full h-full object-cover" />
                      ) : contact.isGroup ? (
                        <Users size={16} className="text-[var(--text-primary)]" />
                      ) : (
                        <User size={16} className="text-[var(--text-primary)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[var(--text-primary)] group-hover:text-indigo-500 transition-colors truncate">
                        {contact.fullName}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                        {contact.isGroup ? 'Group channel' : `@${contact.username}`}
                      </div>
                    </div>
                  </div>
                  
                  <span className="p-2 bg-indigo-500/5 group-hover:bg-indigo-500 text-indigo-500 group-hover:text-white rounded-xl transition-all">
                    <Phone size={14} />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[var(--bg-main)] border-t border-[var(--border-color)] text-center text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
          P2P Secure Encrypted Carrier Matrix
        </div>
      </motion.div>
    </div>
  );
};
