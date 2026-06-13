import React, { useEffect, useState } from 'react';
import { MessageCircle, Share2, User, Phone, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { motion } from 'motion/react';
import { LocalDataCache } from '../../services/LocalDataCache';

export default function TabBottom() {
  const { user: authUser, userData } = useAuth();
  const location = useLocation();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [unreadGroupsCount, setUnreadGroupsCount] = useState(0);

  const [conversationsList, setConversationsList] = useState<string[]>([]);
  const [triggerFetch, setTriggerFetch] = useState(0);

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchUnread = async () => {
      try {
        // Fetch participant conversations with their participants
        const { data: participants, error: pError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversation:conversations (
              type,
              participants:conversation_participants (
                user_id
              )
            )
          `)
          .eq('user_id', authUser.id);

        if (pError || !participants) return;

        // Fetch mutual follows to filter out non-friends from direct chats
        const { data: followRows } = await supabase
          .from('follows')
          .select('follower_id, following_id')
          .or(`follower_id.eq.${authUser.id},following_id.eq.${authUser.id}`);

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

        const mutualFriendsSet = new Set<string>();
        IFollow.forEach(id => {
          if (FollowsMe.has(id)) {
            mutualFriendsSet.add(id);
          }
        });

        // Build a mapping of conversation_id -> type
        const convTypeMap: Record<string, string> = {};
        participants.forEach((p: any) => {
          if (p.conversation_id && p.conversation) {
            const conv = p.conversation;
            const isGroup = conv.type === 'group';
            if (isGroup) {
              convTypeMap[p.conversation_id] = 'group';
            } else {
              // Find other participant user id
              const otherId = conv.participants?.find((part: any) => part.user_id !== authUser.id)?.user_id;
              if (otherId && mutualFriendsSet.has(otherId)) {
                convTypeMap[p.conversation_id] = 'direct';
              }
            }
          }
        });

        // Fetch unread messages
        const myConvIds = Object.keys(convTypeMap).sort();
        setConversationsList(prev => {
          const isIdentical = prev.length === myConvIds.length && prev.every((id, idx) => id === myConvIds[idx]);
          return isIdentical ? prev : myConvIds;
        });

        if (myConvIds.length === 0) {
          setUnreadChatsCount(0);
          setUnreadGroupsCount(0);
          return;
        }

        const { data: messages, error: mError } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('is_read', false)
          .neq('sender_id', authUser.id)
          .in('conversation_id', myConvIds);
        
        if (!mError && messages) {
          const distinctConversations = Array.from(new Set(messages.map(m => m.conversation_id as string)));
          
          let chatsUnread = 0;
          let groupsUnread = 0;

          distinctConversations.forEach((cid: string) => {
            const type = convTypeMap[cid];
            if (type === 'group') {
              groupsUnread++;
            } else if (type === 'direct') {
              chatsUnread++;
            }
          });

          setUnreadChatsCount(chatsUnread);
          setUnreadGroupsCount(groupsUnread);
        } else {
          setUnreadChatsCount(0);
          setUnreadGroupsCount(0);
        }
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchUnread();

    const unreadChannelId = `tab-bottom-unread:${authUser.id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(unreadChannelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${authUser.id}`
      }, () => {
        fetchUnread();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `follower_id=eq.${authUser.id}`
      }, () => {
        fetchUnread();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${authUser.id}`
      }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id, triggerFetch]);

  useEffect(() => {
    if (!authUser) return;

    // Listen to local cache updates for instant, Zero-Egress count adjustments!
    const unsubscribeCache = LocalDataCache.subscribe('conversations', (updatedList) => {
      if (updatedList && Array.isArray(updatedList)) {
        let chatsUnread = 0;
        let groupsUnread = 0;
        updatedList.forEach((conv: any) => {
          if (conv.unread) {
            if (conv.type === 'group') {
              groupsUnread++;
            } else if (conv.type === 'direct') {
              chatsUnread++;
            }
          }
        });
        setUnreadChatsCount(chatsUnread);
        setUnreadGroupsCount(groupsUnread);
        
        const ids = updatedList.map((c: any) => c.id);
        const isIdentical = conversationsList.length === ids.length && conversationsList.every((id, idx) => id === ids[idx]);
        if (!isIdentical) {
          setConversationsList(ids);
        }
      }
    });

    return () => {
      unsubscribeCache();
    };
  }, [authUser?.id, conversationsList]);
  
  const navItems = [
    { icon: MessageCircle, path: '/chats', label: 'Chats', badge: unreadChatsCount, activeColor: 'text-[var(--header-text)]' },
    { icon: Share2, path: '/share', label: 'Share', activeColor: 'text-[var(--header-text)]' },
    { icon: Search, path: '/search', label: 'Search', activeColor: 'text-[var(--header-text)]' },
    { icon: Phone, path: '/calls', label: 'Calls', activeColor: 'text-[var(--header-text)]' },
    { icon: User, path: '/profile', label: 'Profile', activeColor: 'text-[var(--header-text)]' },
  ];

  return (
    <div className="w-full bg-[var(--header-bg)] px-2 min-h-[64px] pb-safe flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0 border-t border-[var(--border-color)] rounded-t-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || (item.path === '/chats' && (location.pathname === '/' || location.pathname.startsWith('/chat/')));
        
        return (
          <Link 
            key={item.path} 
            to={item.path} 
            className="relative flex flex-col items-center justify-center h-full min-w-[64px] transition-all duration-300 group"
          >
            <div className="relative flex flex-col items-center">
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -1 : 0
                }}
                className={`transition-colors duration-300 flex items-center justify-center ${isActive ? item.activeColor : 'text-[var(--header-text)]/50 group-hover:text-[var(--header-text)]'}`}
              >
                {Icon && <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  fill={isActive ? 'currentColor' : 'none'}
                  fillOpacity={isActive ? 0.15 : 0}
                />}
              </motion.div>
              
              {item.badge !== undefined && item.badge > 0 && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-[#0494f4] text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[var(--header-bg)] shadow-sm z-10"
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </motion.div>
              )}
            </div>
            
            <span className={`text-[10px] mt-1 font-bold transition-all duration-300 ${isActive ? 'text-[var(--header-text)] opacity-100' : 'text-[var(--header-text)]/50 opacity-75 group-hover:opacity-100'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
