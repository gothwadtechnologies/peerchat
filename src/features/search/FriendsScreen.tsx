import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { Search, X, Loader2, MessageSquare, ArrowLeft, Users, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isUserOnline } from '../../utils/presence';
import Avatar from '../../components/common/Avatar';

interface FriendProfile {
  id: string;
  username: string;
  fullName: string;
  photoURL: string;
  isOnline?: boolean;
}

export default function FriendsScreen() {
  const navigate = useNavigate();
  const { user: authUser, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase || !authUser?.id || !userData?.hiddenChats || userData.hiddenChats.length === 0) {
      setHiddenUserIds([]);
      return;
    }
    const fetchHiddenUserIds = async () => {
      try {
        const { data } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', userData.hiddenChats)
          .neq('user_id', authUser.id);
        
        if (data) {
          setHiddenUserIds(data.map(d => d.user_id));
        }
      } catch (e) {
        console.warn("Failed to fetch hidden user ids inside friends screen:", e);
      }
    };
    fetchHiddenUserIds();
  }, [userData?.hiddenChats, authUser?.id]);

  useEffect(() => {
    fetchFriends();
  }, [authUser]);

  const fetchFriends = async () => {
    if (!authUser?.id || !supabase) return;
    try {
      setLoading(true);
      setError(null);

      // Get following IDs and follower IDs from follows table representing mutual friend links
      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${authUser.id},following_id.eq.${authUser.id}`);
      
      if (followError) throw followError;

      const IFollow = new Set<string>();
      const FollowsMe = new Set<string>();

      followRows?.forEach((row: any) => {
        if (row.follower_id === authUser.id) {
          IFollow.add(row.following_id);
        }
        if (row.following_id === authUser.id) {
          FollowsMe.add(row.follower_id);
        }
      });

      const mutualIds = Array.from(IFollow).filter(id => FollowsMe.has(id));
      
      if (mutualIds.length > 0) {
        const { data: friendsData, error: friendsError } = await supabase
          .from('users')
          .select('id, username, full_name, photo_url, is_online, last_seen')
          .in('id', mutualIds)
          .limit(100);
        
        if (friendsError) throw friendsError;

        if (friendsData) {
          setFriends(friendsData.map(f => ({
            id: f.id,
            username: f.username,
            fullName: f.full_name,
            photoURL: f.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            isOnline: isUserOnline(f.is_online, f.last_seen)
          })));
        }
      } else {
        setFriends([]);
      }
    } catch (err: any) {
      console.error('Error fetching friends:', err);
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends
    .filter(friend => !hiddenUserIds.includes(friend.id))
    .filter(friend => {
      const term = searchTerm.toLowerCase().trim();
      if (!term) return true;
      return (
        (friend.fullName || '').toLowerCase().includes(term) ||
        (friend.username || '').toLowerCase().includes(term)
      );
    });

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="px-5 py-4 shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 flex items-center gap-4 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-[var(--bg-main)] rounded-full border border-[var(--border-color)] text-[var(--text-primary)] active:scale-95 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">GrixChat Friends</h2>
          <p className="text-[11px] text-[var(--text-secondary)] font-medium leading-none mt-1">
            {filteredFriends.length} {filteredFriends.length === 1 ? 'connection' : 'connections'} on Grix
          </p>
        </div>
      </div>

      {/* Styled Search Bar */}
      <div className="px-5 py-3.5 shrink-0 bg-[var(--bg-card)] border-b border-[var(--border-color)]/10 z-10">
        <div className="flex items-center bg-[var(--bg-main)] hover:bg-[var(--bg-main)]/90 focus-within:bg-[var(--bg-main)] rounded-2xl px-4 h-11 border border-[var(--border-color)]/30 focus-within:border-[#0494f4]/55 focus-within:ring-2 focus-within:ring-[#0494f4]/5 shadow-sm transition-all duration-250">
          <Search size={16} className="text-[var(--text-secondary)] mr-2.5 opacity-60" />
          <input 
            type="text" 
            placeholder="Search friends..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={14} className="text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      </div>

      {/* Friends Scrollable List */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-16 bg-[var(--bg-card)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-[#0494f4]" size={28} />
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Loading friends list...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <p className="text-xs font-bold text-red-500 mb-2">{error}</p>
            <button 
              onClick={fetchFriends}
              className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-lg leading-normal"
            >
              Retry Load
            </button>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none">
            <div className="w-16 h-16 bg-[var(--bg-main)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]/30 text-[var(--text-secondary)]">
              <Users size={24} className="opacity-40" />
            </div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">No friends found</h4>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
              {searchTerm 
                ? "No matching connections found for your current filter query." 
                : "You aren't following anyone yet. Search people under Discovery and hit connect to see them here!"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]/10">
            {filteredFriends.map((friend) => (
              <div 
                key={friend.id}
                onClick={() => navigate(`/user/${friend.id}`)}
                className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[var(--bg-main)]/30 transition-all cursor-pointer group select-none"
              >
                <Avatar url={friend.photoURL} type="direct" size="md" name={friend.username} isOnline={friend.isOnline} />
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-extrabold text-[var(--text-primary)] truncate group-hover:text-[#0494f4] transition-colors">
                    {friend.fullName || friend.username}
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)]/80 font-bold truncate">@{friend.username}</p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/chat/${friend.id}`);
                  }}
                  className="px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0494f4]/95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 shadow-md shrink-0 cursor-pointer border border-[#0494f4]/10"
                >
                  <MessageSquare size={12} strokeWidth={3} />
                  <span>Message</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
