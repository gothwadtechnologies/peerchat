import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Phone, Video, ArrowUpRight, ArrowDownLeft, PhoneMissed, Info, Lock, Users, Search, X, Plus, Loader2, Trash, Archive } from 'lucide-react';
import { useLayout } from '../../contexts/LayoutContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { useConversations } from './hooks/useConversations.ts';
import { useCalls } from './hooks/useCalls.ts';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { ChatUserList } from './components/ChatUserList.tsx';
import { supabase } from '../../lib/supabase';
import { getAcceptedChats, initializeAcceptedConversations } from '../../utils/acceptedChats';
import { storage } from '../../services/StorageService';
import { ImageService } from '../../services/ImageService';
import { transactionQueue } from '../../services/db/transactionQueueService';
import Avatar from '../../components/common/Avatar';
import CommonSearchBar from '../../components/common/CommonSearchBar';

interface StoryGroup {
  userId: string;
  username: string;
  fullName: string;
  photoURL: string;
  hasUnseen: boolean;
}

export default function ChatsTab() {
  const navigate = useNavigate();
  const { user: authUser, userData, refreshUserData } = useAuth();
  const { searchTerm, setSearchTerm } = useSearch();
  const { 
    activeFilters, 
    chatListFilter, 
    isChatSelectMode, 
    setChatSelectMode, 
    selectedChatIds, 
    setSelectedChatIds 
  } = useLayout();
  const activeFilter = activeFilters['chats'] || 'Chats';
  
  const { 
    conversations, 
    otherUsers, 
    loading: conversationsLoading,
    loadingMore: conversationsLoadingMore,
    hasMore: conversationsHasMore,
    loadMore: conversationsLoadMore
  } = useConversations(activeFilter);
  
  const { 
    calls, 
    loading: callsLoading,
    loadingMore: callsLoadingMore,
    hasMore: callsHasMore,
    loadMore: callsLoadMore
  } = useCalls(activeFilter);
  
  const loading = activeFilter === 'Calls' ? callsLoading : conversationsLoading;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrollable = target.scrollHeight > target.clientHeight;
    const closeToBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 100;
    if (isScrollable && target.scrollTop > 5 && closeToBottom) {
      if (activeFilter === 'Calls') {
        if (callsHasMore && !callsLoadingMore) {
          callsLoadMore();
        }
      } else {
        if (conversationsHasMore && !conversationsLoadingMore) {
          conversationsLoadMore();
        }
      }
    }
  }, [activeFilter, callsHasMore, callsLoadingMore, callsLoadMore, conversationsHasMore, conversationsLoadingMore, conversationsLoadMore]);

  const isSecretCodeEntered = !!(
    searchTerm && 
    userData?.hiddenChatSettings?.secretCode && 
    searchTerm.trim().toLowerCase() === userData.hiddenChatSettings.secretCode.trim().toLowerCase()
  );

  // Extract all user IDs that are part of hidden conversations
  const hiddenUserIds = React.useMemo(() => {
    if (!userData?.hiddenChats || !conversations) return [];
    return conversations
      .filter(c => userData.hiddenChats.includes(c.id))
      .map(c => c.otherUserId);
  }, [userData?.hiddenChats, conversations]);

  const filteredConversations = conversations.filter(c => {
    const isHidden = Array.isArray(userData?.hiddenChats) && userData.hiddenChats.includes(c.id);
    const isArchived = Array.isArray(userData?.archivedChats) && userData.archivedChats.includes(c.id);
    
    // Always hide hidden chats from the main chat lists/matches (they only show in unlocked /chats/hidden screen)
    if (isHidden) return false;
    if (isArchived) return false;

    // Apply strict direct-only filter
    if (c.type === 'group') return false;

    // Filter out Message Requests (not yet accepted)
    if (conversations.length > 0 && !storage.getItem('grix_accepted_chats_initialized')) {
      initializeAcceptedConversations(conversations.map(x => x.id));
    }

    const matchesSearch = (c.user || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (c.username || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredOtherUsers = otherUsers.filter(u => {
    // Hide users who are part of any hidden conversation from standard suggestions
    if (hiddenUserIds.includes(u.uid)) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (u.fullName || "")?.toLowerCase().includes(term) || 
           (u.username || "")?.toLowerCase().includes(term);
  });

  return (
    <div className="h-full flex flex-col bg-[var(--bg-card)] overflow-hidden animate-fade-in touch-pan-y">
      
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-[var(--bg-card)]">

        {/* Scrollable Reusable Search Bar */}
        <CommonSearchBar 
          placeholder="Search chats or messages..."
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
        />

        {/* User List (Chats or Calls) */}
        <div className="flex flex-col mt-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Loading {activeFilter === 'Calls' ? 'Calls' : 'Chats'}...</p>
            </div>
          ) : activeFilter === 'Calls' ? (
            (() => {
              const filteredCalls = calls.filter(call => !hiddenUserIds.includes(call.otherUserId));
              if (filteredCalls.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-4">
                    <div className="p-4 bg-[var(--bg-main)] rounded-full text-[var(--text-secondary)]">
                      <Phone size={40} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No calls yet</h3>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        Your recent calls will appear here.
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <div className="divide-y divide-[var(--border-color)]">
                  {filteredCalls.map((call) => (

                  <motion.div 
                    key={call.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-[15px] px-4 py-3 hover:bg-[var(--bg-main)] transition-all active:scale-[0.98] group"
                  >
                    <Avatar url={call.avatar} type="direct" size="custom" customSizeClass="w-[52px] h-[52px]" name={call.user} />
                    
                    <div className="flex-1 min-w-0 border-b border-[var(--border-color)]/50 pb-3 group-last:border-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={`text-[15px] truncate font-bold ${call.isMissed ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>
                          {call.user}
                        </h3>
                        <span className="text-[10px] whitespace-nowrap text-[var(--text-secondary)]">
                          {call.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[var(--text-secondary)] text-[11px]">
                        {call.isMissed ? (
                          <PhoneMissed size={12} className="text-rose-500" />
                        ) : call.isIncoming ? (
                          <ArrowDownLeft size={12} className="text-emerald-500" />
                        ) : (
                          <ArrowUpRight size={12} className="text-[var(--primary)]" />
                        )}
                        <span>{call.isMissed ? 'Missed' : call.isIncoming ? 'Incoming' : 'Outgoing'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-[var(--primary)]">
                      <Link to={`/call/${call.otherUserId}?type=${call.type}`}>
                        {call.type === 'video' ? <Video size={20} /> : <Phone size={20} />}
                      </Link>
                      <button className="text-[var(--text-secondary)]">
                        <Info size={20} />
                      </button>
                    </div>
                  </motion.div>
                ))}
                {callsLoadingMore && (
                  <div className="flex items-center justify-center py-4 gap-2 bg-[var(--bg-card)]">
                    <Loader2 size={16} className="text-[#0494f4] animate-spin" />
                    <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Loading more calls...</span>
                  </div>
                )}
              </div>
            );
          })()
          ) : (
            <>
              <ChatUserList 
                conversations={filteredConversations}
                otherUsers={searchTerm ? [] : filteredOtherUsers} // Only show "Others" if not searching or if search returns nothing? 
                                                                 // Actually the user said "others user" should be below.
                showGrixAI={!searchTerm} 
                archivedCount={userData?.archivedChats?.length || 0}
                showSecretHeader={isSecretCodeEntered}
                onSecretHeaderClick={() => navigate('/chats/hidden')}
                secretCount={userData?.hiddenChats?.length || 0}
                showHiddenChatsEntry={userData?.hiddenChatSettings?.showMenuEntry !== false}
                loading={loading}
                usersWithStories={[]}
              />
              {conversationsLoadingMore && (
                <div className="flex items-center justify-center py-4 gap-2 bg-[var(--bg-card)]">
                  <Loader2 size={16} className="text-[#0494f4] animate-spin" />
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">Loading more chats...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
