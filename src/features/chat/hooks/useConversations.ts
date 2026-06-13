import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { LocalDataCache } from '../../../services/LocalDataCache';
import { isUserOnline } from '../../../utils/presence';

export const useConversations = (activeFilter: string) => {
  const { user, isAuthReady, userData } = useAuth();
  
  // Use cached data instantly if it exists to prevent loader flickering
  const [conversations, setConversations] = useState<any[]>(() => {
    if (user?.id) {
      const cached = LocalDataCache.getConversations(user.id);
      if (cached && Array.isArray(cached)) {
        return cached;
      }
    }
    return [];
  });
  
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  
  // If we already have cached conversations, we don't need a full-screen loading spinner
  const [loading, setLoading] = useState(() => {
    if (user?.id) {
      const cached = LocalDataCache.getConversations(user.id);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return false;
      }
    }
    return true;
  });

  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);

  const chatChannelsRef = useRef<any[]>([]);
  const subscribedIdsRef = useRef<string[]>([]);

  const formatTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!user || activeFilter === 'Calls' || !supabase || !isAuthReady) return;
    const myId = user.id;
    const cached = LocalDataCache.getConversations(myId);
    
    if (isPaginating) {
      setLoadingMore(true);
    } else if (limit === 15) {
      if (!cached || cached.length === 0) {
        setLoading(true);
      }
    }

    try {
      // 1. Fetch all conversation IDs the user is part of
      const { data: participations, error: pError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', myId);

      if (pError) {
        console.error('Error fetching participant IDs:', pError);
        return;
      }

      const convIds = (participations || []).map(p => p.conversation_id);
      if (convIds.length === 0) {
        setConversations([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        setIsPaginating(false);
        return;
      }

      // 2. Fetch details for these conversations, ordering by newest activity (updated_at) primarily to ensure live updates bubble to the top
      const { data: convData, error: cError } = await supabase
        .from('conversations')
        .select(`
          *,
          participants:conversation_participants (
            user:users (*)
          )
        `)
        .in('id', convIds)
        .order('updated_at', { ascending: false })
        .order('last_message_at', { ascending: false })
        .limit(limit + 1);

      if (cError) {
        console.error('Error fetching conversations details:', cError);
        return;
      }

      let hasMoreData = false;
      let queryData = (convData || []).map(conv => ({ conversation: conv }));
      if (queryData.length > limit) {
        hasMoreData = true;
        queryData = queryData.slice(0, limit);
      }
      setHasMore(hasMoreData);

      // Fetch missing hidden or archived chats so they are never lost from local state
      const fetchedIds = new Set(queryData.map((item: any) => item.conversation?.id).filter(Boolean));
      const missingHiddenIds = (userData?.hiddenChats || []).filter((id: string) => !fetchedIds.has(id));
      const missingArchivedIds = (userData?.archivedChats || []).filter((id: string) => !fetchedIds.has(id));
      const allMissingIds = [...missingHiddenIds, ...missingArchivedIds];

      if (allMissingIds.length > 0) {
        const { data: missingData, error: missingError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation:conversations (
              *,
              participants:conversation_participants (
                user:users (*)
              )
            )
          `)
          .eq('user_id', myId)
          .in('conversation_id', allMissingIds);
        
        if (!missingError && missingData && missingData.length > 0) {
          queryData = [...queryData, ...missingData];
        }
      }

      // Fetch mutual follows to filter out non-friends from direct chats
      const { data: followRows } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${myId},following_id.eq.${myId}`);

      const IFollow = new Set<string>();
      const FollowsMe = new Set<string>();

      followRows?.forEach((row: any) => {
        if (row.follower_id === myId) {
          IFollow.add(row.following_id);
        }
        if (row.following_id === myId) {
          FollowsMe.add(row.follower_id);
        }
      });

      const mutualFriendsSet = new Set<string>();
      IFollow.forEach(id => {
        if (FollowsMe.has(id)) {
          mutualFriendsSet.add(id);
        }
      });

      const conversationIds = queryData.map((item: any) => item.conversation?.id).filter(Boolean);

      // Fetch unread messages count for all my conversations at once
      let unreadData: any[] = [];
      if (conversationIds.length > 0) {
        const { data: res } = await supabase
          .from('messages')
          .select('conversation_id')
          .eq('is_read', false)
          .neq('sender_id', myId)
          .in('conversation_id', conversationIds);
        unreadData = res || [];
      }

      const unreadMap: Record<string, number> = {};
      unreadData.forEach(m => {
        unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
      });

      // Fetch the actual newest message from messages table for each conversation to prevent race conditions
      const latestMessagesMap: Record<string, any> = {};
      const hasMessagesInDb = new Set<string>();

      if (conversationIds.length > 0) {
        const { data: latestMsgs } = await supabase
          .from('messages')
          .select('conversation_id, text, media_type, created_at, sender_id, deleted_by')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        latestMsgs?.forEach((m: any) => {
          hasMessagesInDb.add(m.conversation_id);
          // Filter out if deleted by key-user (Delete for me)
          if (Array.isArray(m.deleted_by) && m.deleted_by.includes(myId)) {
            return;
          }
          if (!latestMessagesMap[m.conversation_id]) {
            latestMessagesMap[m.conversation_id] = m;
          }
        });
      }

      const rawList = queryData
        .map((item: any) => {
          const conv = item.conversation;
          if (!conv) return null;
          const isGroup = conv.type === 'group';
          const otherParticipants = conv.participants.filter((p: any) => p?.user?.id !== myId);
          const firstOther = otherParticipants[0]?.user;

          if (!isGroup && !firstOther) return null;

          // CRITICAL: direct messaging is only allowed and shown for mutual GrixChat Friends
          if (!isGroup && firstOther && !mutualFriendsSet.has(firstOther.id)) {
            return null;
          }

          const unreadCount = unreadMap[conv.id] || 0;
          const latestDbMsg = latestMessagesMap[conv.id];

          let lastMsgVal = (conv as any).last_message || 'New Conversation';
          let lastMsgAtVal = (conv as any).last_message_at || conv.updated_at || conv.created_at;
          let lastMsgSenderId = (conv as any).last_message_sender_id;

          if (latestDbMsg) {
            lastMsgVal = latestDbMsg.text || (latestDbMsg.media_type ? `Sent a ${latestDbMsg.media_type}` : 'Sent a file');
            lastMsgAtVal = latestDbMsg.created_at;
            lastMsgSenderId = latestDbMsg.sender_id;
          } else if (hasMessagesInDb.has(conv.id)) {
            // All messages in this conversation were deleted/hidden for this user
            lastMsgVal = 'New Conversation';
          }

          // Clean any forward tagging indicators for raw display in Chat List
          if (typeof lastMsgVal === 'string') {
            if (lastMsgVal.startsWith('\u200B[FWD_MANY]\u200B')) {
              lastMsgVal = '↪ Forwarded many times: ' + lastMsgVal.replace('\u200B[FWD_MANY]\u200B', '');
            } else if (lastMsgVal.startsWith('\u200B[FWD]\u200B')) {
              lastMsgVal = '↪ Forwarded: ' + lastMsgVal.replace('\u200B[FWD]\u200B', '');
            }
          }

          let lastMsgStatusVal: 'Sent' | 'Received' | undefined = undefined;
          if (lastMsgSenderId && lastMsgVal !== 'New Conversation') {
            lastMsgStatusVal = lastMsgSenderId === myId ? 'Sent' : 'Received';
          }

          return {
            id: conv.id,
            type: conv.type,
            otherUserId: isGroup ? conv.id : firstOther.id,
            user: isGroup ? (conv.name || 'Group') : (firstOther.full_name || firstOther.username || 'Unknown'),
            username: isGroup ? 'group' : firstOther?.username,
            fullName: isGroup ? conv.name : firstOther?.full_name,
            lastMsg: lastMsgVal,
            lastMsgAt: lastMsgAtVal,
            time: formatTime(new Date(lastMsgAtVal)),
            avatar: isGroup 
              ? (conv.photo_url || `https://cdn-icons-png.flaticon.com/512/166/166258.png`)
              : (firstOther?.photo_url || `https://cdn-icons-png.flaticon.com/512/149/149071.png`),
            unread: unreadCount > 0,
            unreadCount: unreadCount,
            isOnline: isGroup ? false : isUserOnline(firstOther?.is_online, firstOther?.last_seen),
            lastMsgStatus: lastMsgStatusVal
          };
        })
        .filter(Boolean);

      // De-duplicate direct conversations: Keep only the one with the most recent activity / actual messages
      const seenDict: Record<string, any> = {};
      rawList.forEach((conv: any) => {
        if (conv.type !== 'direct') return;
        const existing = seenDict[conv.otherUserId];
        if (!existing) {
          seenDict[conv.otherUserId] = conv;
        } else {
          // If one has real messages and the other is empty ('New Conversation'), keep the real one
          const currentHasMsg = conv.lastMsg && conv.lastMsg !== 'New Conversation';
          const existingHasMsg = existing.lastMsg && existing.lastMsg !== 'New Conversation';

          if (currentHasMsg && !existingHasMsg) {
            seenDict[conv.otherUserId] = conv;
          } else if (!currentHasMsg && existingHasMsg) {
            // keep existing, do nothing
          } else {
            // both have messages or both are empty, keep the one with the more recent lastMsgAt
            if (new Date(conv.lastMsgAt).getTime() > new Date(existing.lastMsgAt).getTime()) {
              seenDict[conv.otherUserId] = conv;
            }
          }
        }
      });

      const formattedList = rawList
        .filter((conv: any) => {
          if (conv.type !== 'direct') return true;
          return seenDict[conv.otherUserId]?.id === conv.id;
        })
        .sort((a, b) => {
          return new Date(b.lastMsgAt).getTime() - new Date(a.lastMsgAt).getTime();
        });

      LocalDataCache.saveConversations(myId, formattedList);
      setConversations(formattedList);
    } catch (err) {
      console.error('Crash in fetchConversations execution details:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsPaginating(false);
    }
  }, [user, activeFilter, isAuthReady, formatTime, limit, isPaginating, userData]);

  useEffect(() => {
    if (!user || activeFilter === 'Calls' || !supabase || !isAuthReady) return;

    // Subscribe to Cache Updates for instant off-line updates
    const unsubscribeCache = LocalDataCache.subscribe('conversations', (updatedList) => {
      if (updatedList && Array.isArray(updatedList)) {
        setConversations(updatedList);
      } else {
        fetchConversations();
      }
    });

    fetchConversations();

    // Subscribe to conversation updates and new participants
    const channelId = `conversations-realtime-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants', filter: `user_id=eq.${user.id}` }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${user.id}` }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows', filter: `following_id=eq.${user.id}` }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribeCache();
    };
  }, [user, activeFilter, isAuthReady, fetchConversations]);

  // Subscribe dynamically to new messages/conversations for all of the user's active conversations
  useEffect(() => {
    if (!supabase || !user || conversations.length === 0) return;

    const currentIds = conversations.map(c => c.id).sort();
    const prevIds = [...subscribedIdsRef.current].sort();

    const isIdentical = currentIds.length === prevIds.length && 
                        currentIds.every((id, idx) => id === prevIds[idx]);

    if (isIdentical) {
      return; // Save resources by not re-subscribing if conversation list hasn't structurally changed
    }

    // Unsubscribe from existing chat channels
    chatChannelsRef.current.forEach(ch => {
      try {
        supabase.removeChannel(ch);
      } catch (err) {
        console.warn('Error removing channel:', err);
      }
    });
    chatChannelsRef.current = [];

    const newChannels = conversations.map(c => c.id).map(convId => {
      const channelName = `sub-chat-${convId}-${Math.random().toString(36).substring(2, 7)}`;
      const ch = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${convId}`
        }, () => {
          fetchConversations();
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${convId}`
        }, () => {
          fetchConversations();
        })
        .subscribe();
      return ch;
    });

    chatChannelsRef.current = newChannels;
    subscribedIdsRef.current = conversations.map(c => c.id);

    return () => {
      chatChannelsRef.current.forEach(ch => {
        try {
          supabase.removeChannel(ch);
        } catch (err) {
          console.warn('Error removing channel on cleanup:', err);
        }
      });
      chatChannelsRef.current = [];
      subscribedIdsRef.current = [];
    };
  }, [conversations, user?.id, supabase, fetchConversations]);

  // Suggested users fetch
  useEffect(() => {
    if (!user || !supabase || !isAuthReady) return;
    const fetchSuggested = async () => {
      const { data } = await supabase
        .from('users')
        .select('*')
        .neq('id', user.id)
        .limit(5);
      
      if (data) {
        setOtherUsers(data.map((u: any) => ({
          uid: u.id,
          username: u.username,
          fullName: u.full_name,
          photoURL: u.photo_url,
          isOnline: isUserOnline(u.is_online, u.last_seen)
        })));
      }
    };
    fetchSuggested();
  }, [user, isAuthReady]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      setIsPaginating(true);
      setLimit(prev => prev + 15);
    }
  }, [loading, loadingMore, hasMore]);

  return { conversations, otherUsers, loading, loadingMore, hasMore, loadMore };
};
