import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider';

export const useTypingStatus = (chatId: string, receiverId: string) => {
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<any>(null);
  const otherTypingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const amITypingRef = useRef<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !supabase || !chatId || !receiverId) return;

    // Fast, lightweight broadcast channel for typing events
    const channel = supabase.channel(`typing:${chatId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload && payload.userId === receiverId) {
          setIsOtherTyping(payload.isTyping);
          
          // Clear any auto-clear timer
          if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
          
          // Fallback UI reset timer in case the offline/exit event is ever missed
          if (payload.isTyping) {
            otherTypingTimeoutRef.current = setTimeout(() => {
              setIsOtherTyping(false);
            }, 6000);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Typing Sync] Subscribed to broadcast: typing:${chatId}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      amITypingRef.current = false;
    };
  }, [chatId, receiverId, user?.id]);

  const handleTyping = () => {
    if (!channelRef.current || !user) return;

    // Throttle: Only send typing:true broadcast if we weren't already marked as typing
    if (!amITypingRef.current) {
      amITypingRef.current = true;
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: true }
      });
    }

    // Reset fallback timeout to mark idle/not-typing after 3 seconds of silence
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && user && amITypingRef.current) {
        amITypingRef.current = false;
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, isTyping: false }
        });
      }
    }, 3000);
  };

  return { isOtherTyping, handleTyping };
};
