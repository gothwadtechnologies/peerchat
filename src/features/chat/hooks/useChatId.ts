import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { chatService } from '../services/chatService';
import { LocalDataCache } from '../../../services/LocalDataCache';

export function useChatId(receiverId: string | undefined) {
  const [chatId, setChatId] = useState<string>('');
  const [convType, setConvType] = useState<'direct' | 'group'>('direct');
  const { user } = useAuth();

  useEffect(() => {
    // Clear old chatId instantly when receiverId changes to avoid leaking messages to the previous chat!
    setChatId('');

    if (!receiverId || !user || !supabase) {
      return;
    }

    let foundInCache = false;
    const cachedConvs = LocalDataCache.getConversations(user.id);
    if (cachedConvs && Array.isArray(cachedConvs)) {
      // 1. Try match by ID
      const matchById = cachedConvs.find(c => c.id === receiverId);
      if (matchById) {
        setChatId(matchById.id);
        setConvType(matchById.type || 'direct');
        foundInCache = true;
      } else {
        // 2. Try match by other user ID (DM)
        const matchByOtherUser = cachedConvs.find(c => c.otherUserId === receiverId);
        if (matchByOtherUser) {
          setChatId(matchByOtherUser.id);
          setConvType(matchByOtherUser.type || 'direct');
          foundInCache = true;
        }
      }
    }
    
    const resolveChatId = async () => {
      try {
        const myId = user.id;

        // Check if receiverId is a user (DM)
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('id', receiverId)
          .single();

        if (userData) {
          // It's a user, get/create DM
          const id = await chatService.getOrCreateDirectConversation(myId, receiverId);
          if (id) {
            setChatId(id);
            setConvType('direct');
          }
        } else {
          // Assume it's a conversation ID already
          setChatId(receiverId);
          
          const { data: convData } = await supabase
            .from('conversations')
            .select('type')
            .eq('id', receiverId)
            .single();
          
          if (convData) {
            setConvType(convData.type);
          } else {
            setConvType('group'); // Fallback
          }
        }
      } catch (err) {
        console.error("Exception in resolveChatId:", err);
        // Fallback: If cache lookup didn't succeed, and we failed to query, set the ID as receiverId just as failsafe!
        if (!foundInCache) {
          setChatId(receiverId);
          setConvType('direct');
        }
      }
    };

    resolveChatId();
  }, [receiverId, user?.id]);

  return { chatId, convType };
}
