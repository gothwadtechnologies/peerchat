import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import { CacheService } from '../../../services/CacheService';

export const useCalls = () => {
  const { user, isAuthReady } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase || !isAuthReady) return;

    const fetchCalls = async () => {
      const { data: docs, error } = await supabase
        .from('calls')
        .select(`
          *,
          caller:users!calls_caller_id_fkey (id, username, full_name, photo_url),
          receiver:users!calls_receiver_id_fkey (id, username, full_name, photo_url)
        `)
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (!error && docs) {
        const callHistory = docs.map((data: any) => {
          const isCaller = data.caller_id === user.id;
          const otherUser = isCaller ? data.receiver : data.caller;
          
          return {
            id: data.id,
            ...data,
            timestamp: data.created_at,
            otherUserId: otherUser?.id,
            user: otherUser ? {
              ...otherUser,
              uid: otherUser.id,
              username: otherUser.username,
              displayName: otherUser.full_name,
              photoURL: otherUser.photo_url
            } : null
          };
        });
        setCalls(callHistory);
      }
      setLoading(false);
    };

    fetchCalls();

    const uniqueChannelId = `calls-history:${user.id}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(uniqueChannelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `caller_id=eq.${user.id}`
      }, () => fetchCalls())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${user.id}`
      }, () => fetchCalls())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, isAuthReady]);

  return { calls, loading };
};
