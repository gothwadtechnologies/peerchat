import React, { useState, useEffect } from 'react';
import { X, Search, SendHorizontal, CheckCircle2, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { LocalDataCache } from '../../services/LocalDataCache';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatForwardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: any;
  currentUserId: string;
  onForwardComplete: (targetConversationIds: string[]) => Promise<void>;
}

export const ChatForwardOverlay: React.FC<ChatForwardOverlayProps> = ({
  isOpen,
  onClose,
  messageToForward,
  currentUserId,
  onForwardComplete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const loadChatsAndUsers = async () => {
      setLoading(true);
      // 1. Get cached conversations
      const cachedConvs = LocalDataCache.getConversations(currentUserId) || [];
      const convoItems = cachedConvs.map((c: any) => ({
        id: c.id,
        isConversation: true,
        name: c.user || c.name || 'Grix Chat',
        username: c.username || '',
        photoURL: c.photoURL || '',
      }));

      // 2. Fetch alternative users from Supabase to allow initiating DMs
      try {
        if (supabase) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, username, full_name, photo_url')
            .neq('id', currentUserId)
            .limit(30);

          if (usersData) {
            const userItems = usersData
              .filter(u => !cachedConvs.some((c: any) => c.otherUserId === u.id))
              .map(u => ({
                id: u.id,
                isConversation: false,
                name: u.full_name || u.username || 'Grix User',
                username: u.username || '',
                photoURL: u.photo_url || '',
              }));

            setItems([...convoItems, ...userItems]);
          } else {
            setItems(convoItems);
          }
        } else {
          setItems(convoItems);
        }
      } catch (err) {
        console.error('Error loading contacts for forward:', err);
        setItems(convoItems);
      } finally {
        setLoading(false);
      }
    };

    loadChatsAndUsers();
  }, [isOpen, currentUserId]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.username.toLowerCase().includes(term)
    );
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      await onForwardComplete(selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (err) {
      console.error('Forwarding actions failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex flex-col bg-[var(--bg-card)] text-[var(--text-primary)]">
        {/* Modern Synced App-Style Header Overlay */}
        <div className="h-16 flex items-center px-4 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 shadow-sm gap-3 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={22} className="stroke-[2.5]" />
          </button>
          
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-[var(--text-primary)]">Forward message</h2>
            <p className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wide">
              {selectedIds.length === 0 ? 'Select contacts' : `${selectedIds.length} contact${selectedIds.length > 1 ? 's' : ''} selected`}
            </p>
          </div>
        </div>

        {/* Search bar container aligned with system colors */}
        <div className="p-3 bg-[var(--bg-card)] border-b border-[var(--border-color)]/10 flex items-center justify-center shrink-0">
          <div className="w-full flex items-center bg-[var(--bg-main)] border border-[var(--border-color)]/25 rounded-2xl px-3.5 py-2.5 gap-2.5 shadow-sm">
            <Search size={18} className="text-[var(--text-secondary)]/70" />
            <input 
              type="text"
              placeholder="Search chats or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 outline-none w-full border-none"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-none bg-transparent cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Contacts scrolling lists */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 bg-[var(--bg-card)]">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#0494f4]" />
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Loading contacts...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 text-sm text-[var(--text-secondary)] font-medium">
              No contacts or chats found.
            </div>
          ) : (
            filteredItems.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`w-full flex items-center px-3.5 py-3 rounded-2xl transition-all duration-150 gap-3 text-left border-none cursor-pointer bg-transparent ${
                    isSelected 
                      ? 'bg-[var(--bg-main)]/80 shadow-sm border border-[#0494f4]/20' 
                      : 'hover:bg-[var(--bg-main)]/40 active:bg-[var(--bg-main)] border border-transparent'
                  }`}
                >
                  {/* Rounded avatar element */}
                  <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-[var(--bg-main)] flex items-center justify-center border border-[var(--border-color)]/25 shadow-sm shrink-0">
                    {item.photoURL ? (
                      <img 
                        src={item.photoURL} 
                        alt={item.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="text-[var(--text-secondary)]/80" size={20} />
                    )}
                  </div>

                  {/* Profile Metadata */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.name}</p>
                    <p className="text-xs font-medium text-[var(--text-secondary)]/80 truncate mt-0.5">
                      {item.isConversation ? 'Active chat session' : `@${item.username || 'user'}`}
                    </p>
                  </div>

                  {/* Synchronized Select Indicator with Theme Accent Blue `#0494f4` */}
                  <div className="shrink-0 ml-1">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#0494f4] flex items-center justify-center text-white shadow-[0_0_6px_rgba(4,148,244,0.3)] animate-scaleIn">
                        <CheckCircle2 size={13} className="stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border-color)]/50 transition-colors" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* WhatsApp Theme Bottom Bar Preview & Send row styled matching typing bar capsule exactly */}
        {selectedIds.length > 0 && (
          <div className="w-full bg-[var(--bg-card)] border-t border-[var(--border-color)]/20 px-4 py-3 flex items-center gap-2 shadow-[0_-5px_15px_rgba(0,0,0,0.06)] shrink-0 z-[10015]">
            {/* Elegant Typing Capsule Layout */}
            <div className={`flex-1 min-w-0 rounded-[24px] px-4 py-2.5 flex flex-col transition-all shadow-sm ${
              isDark ? 'bg-[#2a2c30]' : 'bg-[#f0f2f5]'
            }`}>
              <p className="text-[10px] text-[#0494f4] font-extrabold uppercase tracking-widest mb-0.5 select-none">
                Forwarding to {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''}
              </p>
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-zinc-700'} italic select-none`}>
                "{messageToForward?.content || messageToForward?.text || (messageToForward?.media_type ? `Sent a ${messageToForward.media_type}` : 'Media file')}"
              </p>
            </div>
            
            {/* Right Side Rounded Clickable Send Button matching standard typing bar send button exactly */}
            <button
              type="button"
              disabled={loading}
              onClick={handleSend}
              className="shrink-0 w-[48px] h-[48px] flex items-center justify-center rounded-full bg-[#0494f4] hover:bg-[#0382d6] text-white shadow-md active:scale-95 transition-all duration-100 cursor-pointer border-none disabled:opacity-40"
              title="Send Forwarded Message"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <SendHorizontal size={24} className="text-white" />
              )}
            </button>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
