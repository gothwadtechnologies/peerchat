import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, EyeOff, MessageCircle, Lock, Settings } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useConversations } from './hooks/useConversations';
import { ChatUserList } from './components/ChatUserList';
import { CommonSearchBar } from '../../components/common/CommonSearchBar';

export default function HideChatScreen() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { conversations, loading } = useConversations('Chats');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only hidden chats matching search term
  const hiddenConversations = conversations.filter(c => {
    const isHidden = userData?.hiddenChats?.includes(c.id);
    if (!isHidden) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.user || '').toLowerCase().includes(term) ||
      (c.username || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 min-h-[56px] pt-safe pb-1.5 bg-[var(--header-bg)] z-50 shadow-sm border-b border-[var(--border-color)]/35 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={22} className="text-[var(--header-text)]" />
          </button>
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-[var(--header-text)] opacity-60" />
            <h1 className="text-xl font-black text-[var(--header-text)] tracking-tight">
              Hidden chats
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => {/* Lock logic */}}
            className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
          >
            <Lock size={20} className="text-[var(--header-text)]" />
          </button>
          <button 
            onClick={() => navigate('/chats/hidden/settings')}
            className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings size={20} className="text-[var(--header-text)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10 animate-fade-in scroll-smooth">
        <CommonSearchBar 
          placeholder="Search hidden chats..."
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        <ChatUserList 
          conversations={hiddenConversations}
          loading={loading}
          emptyMessage={searchTerm ? "No matches found" : "No hidden chats"}
          emptySubMessage={searchTerm ? "Try searching for another name or username." : "Secret conversations can be tucked away here for maximum privacy."}
        />
      </div>
    </div>
  );
}
