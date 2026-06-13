import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  ShieldAlert, 
  UserX, 
  Info,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  Bell,
  Settings,
  QrCode,
  ChevronRight,
  Edit3,
  UserPlus,
  UserCheck,
  LockKeyhole,
  X,
  Loader2,
  Check,
  Plus,
  Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { profileService } from './services/profileService';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { truncateToChars } from '../../utils/bioHelper';
import { chatService } from '../chat/services/chatService';
import { acceptChat } from '../../utils/acceptedChats';
import { isUserOnline, formatLastSeen } from '../../utils/presence';
import { LocalDataCache } from '../../services/LocalDataCache';

export default function UserProfileScreen() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, userData: myUserData } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const [isFriend, setIsFriend] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [requestProgress, setRequestProgress] = useState(false);
  const [hasActiveStories, setHasActiveStories] = useState(false);

  const [friendsCount, setFriendsCount] = useState(0);

  const DEFAULT_LOGO = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  useEffect(() => {
    if (!userId) return;

    const fetchSearchedUserFriendsCount = async () => {
      if (!supabase) return;
      try {
        const { data: followRows, error: followError } = await supabase
          .from('follows')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

        if (followError) throw followError;

        const IFollow = new Set<string>();
        const FollowsMe = new Set<string>();

        followRows?.forEach((row: any) => {
          if (row.follower_id === userId) {
            IFollow.add(row.following_id);
          }
          if (row.following_id === userId) {
            FollowsMe.add(row.follower_id);
          }
        });

        const mutualCount = Array.from(IFollow).filter(id => FollowsMe.has(id)).length;
        setFriendsCount(mutualCount);
      } catch (err) {
        console.error('Error fetching searched user\'s friends count:', err);
      }
    };

    fetchSearchedUserFriendsCount();
  }, [userId]);

  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data) {
          const u = data as any;
          setUser({
            uid: u.id,
            fullName: u.full_name,
            username: u.username,
            photoURL: u.photo_url,
            bio: u.bio,
            profileType: u.profile_type,
            hidePhoto: u.hide_photo,
            is_online: u.is_online,
            last_seen: u.last_seen,
            followers: [],
            following: []
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };

    const checkFriendship = async () => {
      if (!authUser?.id || !userId) return;
      try {
        // Fetch follow rows determining requests and mutual friendship
        const { data: followRows } = await supabase
          .from('follows')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${authUser.id},following_id.eq.${authUser.id}`);

        const IFollow = new Set<string>();
        const FollowsMe = new Set<string>();

        followRows?.forEach(row => {
          if (row.follower_id === authUser.id) {
            IFollow.add(row.following_id);
          }
          if (row.following_id === authUser.id) {
            FollowsMe.add(row.follower_id);
          }
        });

        const isMutual = IFollow.has(userId) && FollowsMe.has(userId);
        const hasRequested = IFollow.has(userId) && !FollowsMe.has(userId);
        const isIncomingRequest = FollowsMe.has(userId) && !IFollow.has(userId);

        setIsFriend(isMutual);
        setIsRequested(hasRequested);
        setIsIncoming(isIncomingRequest);
      } catch (e) {
        console.error("Error checkFriendship:", e);
      }
    };

    const checkStories = async () => {
      try {
        const { data } = await supabase
          .from('stories')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        setHasActiveStories(data && data.length > 0 ? true : false);
      } catch (err) {
        console.error("Error checkStories:", err);
      }
    };

    fetchUser();
    checkFriendship();
    checkStories();

    // Sync isBlocked
    if (myUserData) {
      setIsBlocked(myUserData.blockedUsers?.includes(userId) || false);
    }

  }, [userId, myUserData, authUser?.id]);

  const handleToggleBlock = async () => {
    if (!authUser || !userId) return;
    
    try {
      const newBlockedState = !isBlocked;
      const currentBlocked = myUserData?.blockedUsers || [];
      const newBlocked = newBlockedState 
        ? [...currentBlocked, userId] 
        : currentBlocked.filter((id: string) => id !== userId);

      await supabase.from('users').update({ blocked_users: newBlocked } as any).eq('id', authUser.id);
      
      setIsBlocked(newBlockedState);
      setShowMenu(false);
    } catch (error) {
      console.error("Error toggling block:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-main)] p-6 text-center">
        <p className="text-[var(--text-secondary)] mb-4">User not found or has been removed.</p>
        <button onClick={() => navigate(-1)} className="text-[var(--primary)] font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      {/* Header */}
      <div className="w-full bg-[var(--header-bg)] px-4 min-h-[56px] pt-safe pb-1.5 flex justify-between items-center z-50 shrink-0 relative border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <ArrowLeft size={22} className="text-[var(--header-text)]" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[var(--header-text)] tracking-tight">{user.fullName || 'GrixChat User'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors cursor-pointer">
            <Bell size={22} className="text-[var(--header-text)] opacity-80" />
          </button>
          <button 
            onClick={() => setShowMenu(true)}
            className="w-12 h-12 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <MoreVertical size={22} className="text-[var(--header-text)] opacity-80" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="px-4 pt-4">
          {/* Beautiful and Compact Profile Card (Centered Telegram Style) */}
          <div className="flex flex-col items-center text-center bg-[var(--bg-card)] py-5 px-4 rounded-2xl border border-[var(--border-color)]/60 shadow-sm mb-4 relative overflow-hidden">
            <div className="relative mb-3 shrink-0">
              <div 
                onClick={() => hasActiveStories && navigate(`/stories/view/${userId}`)}
                className={`w-20 h-20 rounded-full p-[2px] border-2 bg-[var(--bg-main)] flex items-center justify-center shrink-0 ${hasActiveStories ? 'border-[#0494f4] cursor-pointer active:scale-95 transition-all shadow-md' : 'border-zinc-300 dark:border-zinc-700'}`}
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[var(--bg-main)]">
                  <img 
                    src={user.hidePhoto ? DEFAULT_LOGO : (user.photoURL || DEFAULT_LOGO)} 
                    className="w-full h-full object-cover shrink-0"
                    referrerPolicy="no-referrer"
                    alt="Profile"
                  />
                </div>
              </div>

              {/* Symmetrical action overlay icon in place of pencil icon */}
              {isFriend ? (
                <button 
                  onClick={() => navigate(`/chat/${userId}`)}
                  title="Send Message"
                  className="absolute bottom-0 right-0 w-6.5 h-6.5 bg-[#0494f4] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-card)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <MessageSquare size={11} strokeWidth={2.5} />
                </button>
              ) : isIncoming ? (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!supabase || !authUser?.id || !userId || requestProgress) return;
                    try {
                      setRequestProgress(true);
                      
                      const { error } = await supabase.from('follows').insert({
                        follower_id: authUser.id,
                        following_id: userId
                      });
                      if (error) throw error;

                      const convId = await chatService.getOrCreateDirectConversation(authUser.id, userId);
                      if (convId) {
                        acceptChat(convId);
                      }

                      LocalDataCache.invalidateConversations(authUser.id);

                      setIsFriend(true);
                      setIsIncoming(false);
                    } catch (err) {
                      console.error("Error accepting request:", err);
                    } finally {
                      setRequestProgress(false);
                    }
                  }}
                  disabled={requestProgress}
                  title="Accept Request"
                  className="absolute bottom-0 right-0 w-6.5 h-6.5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-card)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  {requestProgress ? (
                    <Loader2 size={11} className="animate-spin text-white" />
                  ) : (
                    <Check size={11} strokeWidth={3} />
                  )}
                </button>
              ) : isRequested ? (
                <div 
                  title="Request Sent"
                  className="absolute bottom-0 right-0 w-6.5 h-6.5 bg-emerald-500/80 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-card)] cursor-default select-none"
                >
                  <Check size={11} strokeWidth={3} />
                </div>
              ) : (
                <button 
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!supabase || !authUser?.id || !userId || requestProgress) return;
                    try {
                      setRequestProgress(true);
                      setIsRequested(true); // Optimistic UI update

                      const { error } = await supabase.from('follows').insert({
                        follower_id: authUser.id,
                        following_id: userId
                      });
                      if (error) throw error;

                      LocalDataCache.invalidateConversations(authUser.id);
                    } catch (err) {
                      console.error("Error creating request:", err);
                    } finally {
                      setRequestProgress(false);
                    }
                  }}
                  disabled={requestProgress}
                  title="Send Friend Request"
                  className="absolute bottom-0 right-0 w-6.5 h-6.5 bg-[#0494f4] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-[var(--bg-card)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  {requestProgress ? (
                    <Loader2 size={11} className="animate-spin text-white" />
                  ) : (
                    <Plus size={11} strokeWidth={3} />
                  )}
                </button>
              )}
            </div>

            <h2 className="text-base font-black tracking-tight text-[var(--text-primary)] leading-tight">
              {user.fullName || 'GrixChat User'}
            </h2>
            <span className="text-[10px] text-[#0494f4] font-semibold font-mono tracking-wide mt-1.5 px-2.5 py-0.5 bg-[#0494f4]/10 rounded-full select-none">
              @{user.username || 'username'}
            </span>

            {/* Bio & Status section */}
            <div className="mt-3.5 pt-3 border-t border-[var(--border-color)]/30 w-full text-center">
              <span className="text-[8.5px] font-black text-[var(--text-secondary)] uppercase tracking-wider block mb-0.5 font-mono opacity-80">
                Bio & status
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-normal max-w-xs mx-auto break-words whitespace-pre-line font-medium">
                {user.bio ? truncateToChars(user.bio) : 'Available'}
              </p>
            </div>
          </div>

          {/* Stats Block - matches ProfileTab design */}
          <div className="mb-4">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]/50 overflow-hidden shadow-sm py-3 px-4 flex justify-between items-center select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#0494f4]/10 rounded-xl text-[#0494f4]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--text-primary)]">Contact Stats</h4>
                  <p className="text-[10px] text-[var(--text-secondary)]">Total mutual contacts on GrixChat</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-[#0494f4] bg-[#0494f4]/10 px-3 py-1 rounded-xl">
                  {friendsCount} Friends
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Action Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/40 z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] rounded-t-3xl z-[70] p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Options</h3>
                <button onClick={() => setShowMenu(false)} className="p-2 hover:bg-[var(--bg-main)] rounded-full">
                  <X size={20} className="text-[var(--text-secondary)]" />
                </button>
              </div>
              
              <div className="space-y-2">
                <button 
                  onClick={handleToggleBlock}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-main)] rounded-2xl transition-colors text-red-600"
                >
                  <UserX size={20} />
                  <span className="font-bold">{isBlocked ? 'Unblock User' : 'Block User'}</span>
                </button>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[var(--bg-main)] rounded-2xl transition-colors text-orange-600"
                >
                  <ShieldAlert size={20} />
                  <span className="font-bold">Report User</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
