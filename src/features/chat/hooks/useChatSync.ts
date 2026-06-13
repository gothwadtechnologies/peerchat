import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { isUserOnline } from '../../../utils/presence';

export function useChatSync(receiverId: string | undefined, chatId: string, convType: 'direct' | 'group') {
  const [receiver, setReceiver] = useState<any>(null);
  const [receiverStatus, setReceiverStatus] = useState<'online' | 'offline'>('offline');
  const [receiverActiveChatId, setReceiverActiveChatId] = useState<string | null>(null);
  const [receiverLastSeen, setReceiverLastSeen] = useState<any>(null);
  const [chatSettings, setChatSettings] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [watchData, setWatchData] = useState<any>(null);
  const [isWatchMode, setIsWatchMode] = useState(false);
  const { user, userData: authUser } = useAuth();

  useEffect(() => {
    // Clear old states immediately on receiverId change to prevent visual bleed from the previous conversation
    setReceiver(null);
    setReceiverStatus('offline');
    setReceiverLastSeen(null);

    if (!receiverId || !supabase) return;

    const fetchReceiver = async () => {
      if (convType === 'direct') {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', receiverId)
          .single();
        
        if (data) {
          setReceiver({
            uid: data.id,
            fullName: data.full_name,
            username: data.username,
            photoURL: data.photo_url,
            isOnline: data.is_online,
            lastSeen: data.last_seen
          });
          setReceiverStatus(isUserOnline(data.is_online, data.last_seen) ? 'online' : 'offline');
          setReceiverLastSeen(data.last_seen);
        }
      } else {
        const { data } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', receiverId)
          .single();
        if (data) setReceiver(data);
      }
    };

    fetchReceiver();

    const channel = supabase
      .channel(`sync:${receiverId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: convType === 'direct' ? 'users' : 'conversations',
        filter: `id=eq.${receiverId}`
      }, (payload) => {
        const data = payload.new as any;
        if (convType === 'direct') {
          setReceiverStatus(isUserOnline(data.is_online, data.last_seen) ? 'online' : 'offline');
          setReceiverLastSeen(data.last_seen);
          setReceiver(prev => ({ 
            ...prev, 
            isOnline: data.is_online, 
            lastSeen: data.last_seen,
            fullName: data.full_name,
            username: data.username,
            photoURL: data.photo_url
          }));
        } else {
          setReceiver(data);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [receiverId, convType]);

  // Periodically refresh the online status locally as time passes (heartbeat window check)
  useEffect(() => {
    if (convType !== 'direct' || !receiver) return;

    const interval = setInterval(() => {
      const currentOnline = isUserOnline(receiver.isOnline, receiverLastSeen);
      const expectedStatus = currentOnline ? 'online' : 'offline';
      setReceiverStatus(expectedStatus);
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [receiver?.isOnline, receiverLastSeen, convType]);

  useEffect(() => {
    // Clear old watch data states instantly when chatId changes
    setWatchData(null);
    setIsWatchMode(false);

    if (!user || !chatId || !supabase) return;

    // Fetch conversation data (including watch together state)
    const fetchChat = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', chatId)
        .single();
      
      if (data) {
        setWatchData(data);
        if (data.watch_together_url) setIsWatchMode(true);
      }
    };

    fetchChat();

    const channel = supabase
      .channel(`chat_sync:${chatId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'conversations',
        filter: `id=eq.${chatId}`
      }, (payload) => {
        const data = payload.new as any;
        setWatchData(data);
        // Add more specific sync logic for watch together if needed
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, user?.id]);

  useEffect(() => {
    if (authUser) setCurrentUserData(authUser);
  }, [authUser]);

  const updateWatchState = async (updates: any) => {
    // Implementation for Supabase
  };

  const toggleWatchMode = async () => {
    // Implementation for Supabase
  };

  return {
    receiver,
    receiverStatus,
    receiverActiveChatId,
    receiverLastSeen,
    chatSettings,
    currentUserData,
    watchData,
    isWatchMode,
    updateWatchState,
    toggleWatchMode
  };
}
