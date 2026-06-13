import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Archive, MessageCircle } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useConversations } from './hooks/useConversations';
import { ChatUserList } from './components/ChatUserList';

export default function ArchivedChatScreen() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { conversations, loading } = useConversations('Chats');

  // Filter only archived chats
  const archivedConversations = conversations.filter(c => 
    userData?.archivedChats?.includes(c.id)
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 min-h-[56px] pt-safe pb-1.5 bg-[var(--header-bg)] z-50 shadow-sm border-b border-[var(--border-color)]/35 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={22} className="text-[var(--header-text)]" />
          </button>
          <h1 className="text-xl font-black text-[var(--header-text)] tracking-tight">
            Archived chats
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <ChatUserList 
          conversations={archivedConversations}
          loading={loading}
          emptyMessage="No archived chats"
          emptySubMessage="Archived chats will stay hidden until you unarchive them."
        />
      </div>
    </div>
  );
}
