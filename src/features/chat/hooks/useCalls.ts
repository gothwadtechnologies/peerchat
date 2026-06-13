import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { toDate } from '../../../utils/dateUtils.ts';

export const useCalls = (activeFilter: string) => {
  const { user, userData } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(15);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPaginating, setIsPaginating] = useState(false);

  useEffect(() => {
    if (!user || !supabase) return;
    if (activeFilter !== 'Calls') return;

    if (isPaginating) {
      setLoadingMore(true);
    } else if (limit === 15 && calls.length === 0) {
      setLoading(true);
    }

    const fetchCalls = async () => {
      try {
        let hiddenUserIds: string[] = [];
        if (userData?.hiddenChats && userData.hiddenChats.length > 0) {
          try {
            const { data: partData } = await supabase
              .from('conversation_participants')
              .select('user_id')
              .in('conversation_id', userData.hiddenChats)
              .neq('user_id', user.id);
            
            if (partData) {
              hiddenUserIds = partData.map((d: any) => d.user_id).filter(Boolean);
            }
          } catch (err) {
            console.warn("Failed to fetch hidden user ids for calls hook:", err);
          }
        }

        const { data, error } = await supabase
          .from('calls')
          .select(`
            *,
            caller:users!calls_caller_id_fkey (id, full_name, username, photo_url),
            receiver:users!calls_receiver_id_fkey (id, full_name, username, photo_url)
          `)
          .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .eq('status', 'ended')
          .order('created_at', { ascending: false })
          .limit(limit + 1);

        if (error) {
          console.error('Error fetching calls:', error);
          return;
        }

        let hasMoreData = false;
        let queryData = data || [];
        if (queryData.length > limit) {
          hasMoreData = true;
          queryData = queryData.slice(0, limit);
        }
        setHasMore(hasMoreData);

        const callList = queryData
          .map((call: any) => {
            const isCaller = call.caller_id === user.id;
            const otherUser = isCaller ? call.receiver : call.caller;
            
            if (otherUser && hiddenUserIds.includes(otherUser.id)) {
              return null;
            }
            
            return {
              id: call.id,
              otherUserId: otherUser?.id,
              user: otherUser?.full_name || otherUser?.username || 'Unknown User',
              avatar: otherUser?.photo_url || `https://cdn-icons-png.flaticon.com/512/149/149071.png`,
              type: call.type, // 'audio' or 'video'
              isIncoming: !isCaller,
              isMissed: call.is_missed || false,
              time: toDate(call.created_at) ? new Date(toDate(call.created_at)!).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'
            };
          })
          .filter(Boolean);

        setCalls(callList);
      } catch (err) {
        console.error('Error executing fetchCalls:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsPaginating(false);
      }
    };

    fetchCalls();

    // Subscribe to changes in calls table filtered for this user
    const subscription = supabase
      .channel(`calls-realtime-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls',
        filter: `caller_id=eq.${user.id}`
      }, () => {
        fetchCalls();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls',
        filter: `receiver_id=eq.${user.id}`
      }, () => {
        fetchCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [activeFilter, user, limit, isPaginating]);

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setIsPaginating(true);
      setLimit(prev => prev + 15);
    }
  };

  return { calls, loading, loadingMore, hasMore, loadMore };
};
