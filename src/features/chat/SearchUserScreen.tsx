import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { Search, X, ArrowLeft, Loader2, Play, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { isUserOnline } from '../../utils/presence';
import Avatar from '../../components/common/Avatar';

interface UserProfile {
  uid: string;
  username: string;
  fullName: string;
  photoURL: string;
  isOnline?: boolean;
}

type SearchTab = 'users' | 'videos' | 'reels';

const UserItem = ({ 
  user, 
  navigate
}: { 
  user: UserProfile; 
  navigate: any; 
}) => (
  <div 
    onClick={() => navigate(`/user/${user.uid}`)}
    className="flex items-center gap-3 p-4 hover:bg-[var(--bg-main)] transition-colors cursor-pointer group"
  >
    <Avatar url={user.photoURL} type="direct" size="md" name={user.username} isOnline={user.isOnline} />
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">{user.fullName || user.username}</h4>
      <p className="text-xs text-[var(--text-secondary)] truncate">@{user.username}</p>
    </div>
    <button 
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/chat/${user.uid}`);
      }}
      className="px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0494f4]/90 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 min-w-[85px] shadow-sm shrink-0"
    >
      <MessageSquare size={12} strokeWidth={2.5} />
      <span>Message</span>
    </button>
  </div>
);

const VideoGridItem = ({ video, onClick }: { video: any, onClick: () => void }) => (
  <div onClick={onClick} className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-md group cursor-pointer border border-[var(--border-color)]/20">
    <img src={video.thumbnail_url || video.thumbnail} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={video.title} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
      <h4 className="text-[11px] font-bold text-white line-clamp-1">{video.title}</h4>
      <p className="text-[9px] text-white/70 line-clamp-1">{video.user?.full_name || video.userName}</p>
    </div>
    <div className="absolute top-2 right-2 px-1 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">
      {video.duration || '0:00'}
    </div>
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
        <Play className="text-white fill-current" size={20} />
      </div>
    </div>
  </div>
);

const ReelGridItem = ({ reel, onClick }: { reel: any, onClick: () => void }) => (
  <div onClick={onClick} className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-md group cursor-pointer border border-[var(--border-color)]/20">
    <img src={reel.thumbnail_url || reel.video_url || reel.videoUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={reel.caption} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <Play size={10} className="text-white fill-current" />
        <span className="text-[10px] font-bold text-white truncate">{reel.likes_count || reel.likes || 0}</span>
      </div>
    </div>
  </div>
);

export default function SearchUserScreen() {
  const navigate = useNavigate();
  const { user: authUser, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    if (!supabase) return;
    try {
      setLoading(true);
      
      // Fetch Suggested Users
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, full_name, photo_url, is_online, last_seen')
        .neq('id', authUser?.id)
        .limit(20);
      
      if (usersData) {
        setSuggestedUsers(usersData.map(u => ({
          uid: u.id,
          username: u.username,
          fullName: u.full_name,
          photoURL: u.photo_url,
          isOnline: isUserOnline(u.is_online, u.last_seen)
        })));
      }

    } catch (error) {
      console.error('Error fetching discovery data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchInitialData();
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    const term = searchTerm.toLowerCase();
    if (!supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('id, username, full_name, photo_url, is_online, last_seen')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .neq('id', authUser?.id)
        .limit(30);
      
      if (data) {
        setUserResults(data.map(u => ({
          uid: u.id,
          username: u.username,
          fullName: u.full_name,
          photoURL: u.photo_url,
          isOnline: isUserOnline(u.is_online, u.last_seen)
        })));
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      {/* Header (TabHeader style) */}
      <div className="w-full bg-[var(--header-bg)] px-4 h-14 flex items-center z-50 shrink-0 relative border-b border-[var(--border-color)] shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={24} className="text-[var(--header-text)]" />
          </button>
          <h1 className="text-xl font-black text-[var(--header-text)] tracking-tighter">
            Search Users
          </h1>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="px-4 py-4 z-40 shrink-0">
        <div className="flex items-center bg-[var(--bg-card)] rounded-xl px-4 h-[50px] border border-[var(--border-color)] shadow-sm">
          <Search size={20} className="text-[var(--text-secondary)] mr-3 opacity-50" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search by username or name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/40"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={18} className="text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {loading && !searchTerm ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Finding Connections...</p>
          </div>
        ) : (
          <div className="space-y-1 flex flex-col">
            <div className="flex items-center justify-between px-6 mb-2">
              <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">
                {searchTerm ? 'Search Results' : 'Suggested For You'}
              </h3>
              {!searchTerm && suggestedUsers.length > 0 && (
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">See All</span>
              )}
            </div>
            {(searchTerm ? userResults : suggestedUsers).map(user => (
              <UserItem 
                key={user.uid} user={user} navigate={navigate} 
              />
            ))}
            
            {!loading && searchTerm && userResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 bg-[var(--bg-card)] rounded-full flex items-center justify-center mb-4 border border-[var(--border-color)]">
                  <Search size={24} className="text-[var(--text-secondary)] opacity-20" />
                </div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">No users found</h4>
                <p className="text-xs text-[var(--text-secondary)]">Try searching for a different name or username</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
