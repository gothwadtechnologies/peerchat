import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Bell, 
  MoreVertical, 
  Settings, 
  UserPlus, 
  Users, 
  Laptop, 
  Star, 
  Archive,
  EyeOff,
  Heart,
  Plus,
  Camera,
  LayoutGrid,
  BarChart2,
  Play,
  Volume2,
  VolumeX,
  Lock,
  PlaySquare,
  Radio,
  MessageCircle,
  Info,
  LogOut,
  X,
  Trash
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { useLayout } from '../../contexts/LayoutContext.tsx';
import { ChatTabDropdown } from '../chat-ui/ChatTabDropdown';
import { SearchTabDropdown } from '../chat-ui/SearchTabDropdown';
import { CallsTabDropdown } from '../chat-ui/CallsTabDropdown';
export default function TabHeader() {
  const { userData, user: authUser, refreshUserData } = useAuth();
  const { setIsSearchOpen } = useSearch();
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUnreadLikes, setHasUnreadLikes] = useState(false);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleProfileLogout = async () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchUnread = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read')
        .eq('user_id', authUser.id)
        .eq('is_read', false)
        .limit(20);
      
      if (!error && data) {
        const hasLikes = data.some(d => ["like", "comment"].includes(d.type));
        const hasNotifs = data.some(d => ["follow", "system"].includes(d.type));
        
        setHasUnreadLikes(hasLikes);
        setHasUnreadNotifs(hasNotifs);
      }
    };

    fetchUnread();

    const headerChannelId = `tab-header-notifs:${authUser.id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(headerChannelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${authUser.id}`
      }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  const { chatListFilter, setChatListFilter, isChatSelectMode, setChatSelectMode, selectedChatIds, setSelectedChatIds } = useLayout();

  const menuOptions = [
    { label: 'Archived', icon: Archive, path: '/chats/archived' },
    ...(userData?.hiddenChatSettings?.showMenuEntry !== false ? [
      { label: 'Hidden chats', icon: EyeOff, path: '/chats/hidden' }
    ] : []),
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const filterOptions = [
    { label: 'All Chats', filter: 'all', icon: MessageCircle },
    { label: 'Private Chats', filter: 'direct', icon: Lock },
  ] as const;

  const isChatsPage = location.pathname === '/' || location.pathname === '/chats';
  const isReelsPage = location.pathname === '/reels';
  const isPostsPage = location.pathname === '/posts';
  const isSearchPage = location.pathname === '/search';
  const isProfilePage = location.pathname === '/profile';
  const isCallsPage = location.pathname === '/calls';

  if (isChatSelectMode && isChatsPage) {
    return (
      <div className="w-full px-4 min-h-[56px] flex justify-between items-center z-50 shrink-0 relative animate-fade-in select-none">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => {
              setChatSelectMode(false);
              setSelectedChatIds([]);
            }} 
            className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer active:scale-95 duration-100"
          >
            <X size={22} className="text-[#0494f4]" />
          </button>
          <span className="font-black text-[18px] text-[#0494f4]">
            {selectedChatIds.length} Selected
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Mute action */}
          <button 
            type="button"
            disabled={selectedChatIds.length === 0}
            onClick={() => {
              alert("Muted selected chats!");
              setChatSelectMode(false);
              setSelectedChatIds([]);
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              selectedChatIds.length > 0 
                ? 'text-[var(--header-text)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-90' 
                : 'text-[var(--header-text)]/20 cursor-not-allowed'
            }`}
          >
            <VolumeX size={22} />
          </button>

          {/* Archive action */}
          <button 
            type="button"
            disabled={selectedChatIds.length === 0}
            onClick={async () => {
              if (userData && authUser) {
                try {
                  const currentArchived = Array.isArray(userData.archivedChats) ? userData.archivedChats : [];
                  const updatedArchived = [...new Set([...currentArchived, ...selectedChatIds])];
                  
                  if (supabase) {
                    const targetId = authUser.id || authUser.uid;
                    await supabase
                      .from('users')
                      .update({ archived_chats: updatedArchived })
                      .eq('id', targetId);
                    
                    if (refreshUserData) {
                      await refreshUserData();
                    }
                  }
                } catch (err) {
                  console.error('Failed to archive chats:', err);
                }
              }
              setSelectedChatIds([]);
              setChatSelectMode(false);
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              selectedChatIds.length > 0 
                ? 'text-[var(--header-text)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-90' 
                : 'text-[var(--header-text)]/20 cursor-not-allowed'
            }`}
          >
            <Archive size={22} />
          </button>

          {/* Delete (Hide) action */}
          <button 
            type="button"
            disabled={selectedChatIds.length === 0}
            onClick={async () => {
              if (userData && authUser) {
                try {
                  const currentHidden = Array.isArray(userData.hiddenChats) ? userData.hiddenChats : [];
                  const updatedHidden = [...new Set([...currentHidden, ...selectedChatIds])];
                  
                  if (supabase) {
                    const targetId = authUser.id || authUser.uid;
                    await supabase
                      .from('users')
                      .update({ hidden_chats: updatedHidden })
                      .eq('id', targetId);
                    
                    if (refreshUserData) {
                      await refreshUserData();
                    }
                  }
                } catch (err) {
                  console.error('Failed to hide selected chats:', err);
                }
              }
              setSelectedChatIds([]);
              setChatSelectMode(false);
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all cursor-pointer ${
              selectedChatIds.length > 0 
                ? 'text-rose-500 hover:bg-rose-500/10 active:scale-90' 
                : 'text-[var(--header-text)]/20 cursor-not-allowed'
            }`}
          >
            <Trash size={22} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 min-h-[56px] flex justify-between items-center z-50 shrink-0 relative">
      <div className="flex items-center">
        <Link to="/chats" className="flex items-center gap-2">
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">
            GrixChat
          </h1>
        </Link>
      </div>
      <div className="flex items-center gap-1">
        {/* Heart Icon - Show on Reels */}
        {isReelsPage && (
          <Link to="/notifications/likes" className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer group relative">
            <Heart size={22} className="text-[var(--header-text)] group-active:scale-110 transition-transform stroke-[2.5]" fill={location.pathname === '/notifications/likes' ? "currentColor" : "none"} />
            {hasUnreadLikes && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#0494f4] rounded-full border-2 border-[var(--header-bg)]" />
            )}
          </Link>
        )}

        {/* Bell Icon - Show on Reels */}
        {isReelsPage && (
          <Link to="/notifications" className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer group relative">
            <Bell size={22} className="text-[var(--header-text)] group-active:scale-110 transition-transform stroke-[2.5]" />
            {hasUnreadNotifs && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#0494f4] rounded-full border-2 border-[var(--header-bg)]" />
            )}
          </Link>
        )}

        {/* 3 Dots Menu - Show on Chats and Search pages */}
        {(isChatsPage || isSearchPage) && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(prev => !prev)}
              className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer relative active:scale-95 duration-100"
              id="header-three-dots"
            >
              <MoreVertical size={22} className="text-[var(--header-text)]" />
            </button>
            <AnimatePresence>
              {showMenu && (
                isChatsPage ? (
                  <ChatTabDropdown 
                    isOpen={showMenu}
                    onClose={() => setShowMenu(false)}
                    chatListFilter={chatListFilter}
                    setChatListFilter={setChatListFilter}
                    showHiddenChatsEntry={userData?.hiddenChatSettings?.showMenuEntry !== false}
                  />
                ) : (
                  <SearchTabDropdown 
                    isOpen={showMenu}
                    onClose={() => setShowMenu(false)}
                  />
                )
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 3 Dots Menu - Show on Calls Tab */}
        {isCallsPage && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(prev => !prev)}
              className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer relative active:scale-95 duration-100"
              id="header-three-dots-calls"
            >
              <MoreVertical size={22} className="text-[var(--header-text)]" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <CallsTabDropdown 
                  isOpen={showMenu}
                  onClose={() => setShowMenu(false)}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 3 Dots Menu - Show on Profile Tab with direct slide-out Logout action */}
        {isProfilePage && (
          <div className="relative flex items-center gap-2" ref={profileMenuRef}>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.button
                  initial={{ opacity: 0, x: 8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleProfileLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer select-none"
                  id="btn_header_logout"
                >
                  <LogOut size={13} strokeWidth={2.5} />
                  <span>Logout</span>
                </motion.button>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="w-12 h-12 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer relative active:scale-95 duration-100"
              id="header-profile-three-dots"
            >
              <MoreVertical size={22} className="text-[var(--header-text)]" />
            </button>
          </div>
        )}

        {/* Settings button is removed from header since it is mixed into the profile tab */}
      </div>
    </div>
  );
}
