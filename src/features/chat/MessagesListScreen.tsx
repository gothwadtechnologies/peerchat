import React, { useState } from 'react';
import { Search, ArrowLeft, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { useConversations } from './hooks/useConversations.ts';
import { ChatUserList } from './components/ChatUserList.tsx';

export default function MessagesListScreen() {
  const navigate = useNavigate();
  const { user, userData: currentUserData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { conversations, loading } = useConversations('Chats');

  const filteredConversations = conversations.filter(c => 
    c.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 h-16 bg-[var(--header-bg)] z-50 shadow-sm border-b border-[var(--border-color)]/35 rounded-b-2xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-[var(--header-text)]" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--header-text)]/70 uppercase tracking-widest leading-none mb-1">Messages</span>
            <h2 className="text-sm font-black text-[var(--header-text)] tracking-tight">@{currentUserData?.username || 'My Chats'}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Edit size={22} className="text-[var(--header-text)]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {/* Search */}
        <div className="px-4 my-6">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50 group-focus-within:opacity-100 transition-opacity" size={18} />
            <input 
              type="text" 
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)]/50 rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)]/30 transition-all placeholder:text-[var(--text-secondary)]/50"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex flex-col h-full">
          <ChatUserList 
            conversations={filteredConversations}
            loading={loading}
          />
        </div>

        {/* Footer Info */}
        <div className="py-10 flex flex-col items-center gap-2 opacity-30 mt-auto">
          <span className="text-[var(--text-secondary)] text-[10px] font-black tracking-[0.3em] uppercase">GrixChat Messages</span>
          <div className="flex items-center gap-1.5 grayscale">
            <div className="h-0.5 w-4 bg-[var(--text-secondary)] opacity-20"></div>
            <span className="text-[var(--text-secondary)] text-[8px] font-bold uppercase tracking-tighter">End-to-end encrypted</span>
            <div className="h-0.5 w-4 bg-[var(--text-secondary)] opacity-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
