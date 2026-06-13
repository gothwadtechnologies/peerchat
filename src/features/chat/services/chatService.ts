import { supabase } from '../../../lib/supabase';

export const chatService = {
  async sendMessage(
    conversationId: string, 
    senderId: string, 
    content: string, 
    mediaData?: { url: string; type: string },
    replyTo?: any
  ) {
    if (!supabase) throw new Error("Supabase is not initialized");

    const insertPayload: any = {
      conversation_id: conversationId,
      sender_id: senderId,
      text: content,
      media_url: mediaData?.url,
      media_type: mediaData?.type,
    };

    if (replyTo && replyTo.id) {
      insertPayload.reply_to = replyTo.id;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    if (data) {
      data.content = data.text || data.content || '';
      if (replyTo) {
        data.reply_to = replyTo;
      }
    }

    // Update updated_at of conversation to trigger realtime updates and sort by activity
    await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        last_message: content || (mediaData ? `Sent a ${mediaData.type}` : 'Sent an attachment'),
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return data;
  },

  async getConversation(conversationId: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();
    
    if (error) {
      console.warn('Error fetching conversation:', error);
      return null;
    }
    return data;
  },

  async updateConversation(conversationId: string, data: any) {
    if (!supabase) return;
    const { error } = await supabase
      .from('conversations')
      .update(data as any)
      .eq('id', conversationId);
    
    if (error) throw error;
  },

  async getMessages(conversationId: string, limitCount = 50) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users (
          id,
          username,
          full_name,
          photo_url
        ),
        reply_to:reply_to (
          id,
          text,
          sender_id
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limitCount);
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    const messages = data || [];
    messages.forEach((m: any) => {
      m.content = m.text || m.content || '';
    });

    // Return in chronological order for UI
    return messages.reverse();
  },

  async getOrCreateDirectConversation(user1Id: string, user2Id: string) {
    if (!supabase) return null;

    let existingId: string | null = null;

    // 1. Try RPC check first (most efficient)
    try {
      const { data: existing, error: checkError } = await supabase
        .rpc('get_direct_conversation_id', { u1: user1Id, u2: user2Id });

      if (!checkError && existing) {
        existingId = existing;
      }
    } catch (rpcErr) {
      console.warn("RPC get_direct_conversation_id failed / missing. Falling back to query:", rpcErr);
    }

    // 2. Strong client-side query fallback if RPC is unavailable or returns null
    if (!existingId) {
      try {
        // Find conversation_participants for user1Id
        const { data: u1Convs, error: u1Error } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversation:conversations(id, type)')
          .eq('user_id', user1Id);

        if (!u1Error && u1Convs) {
          // Filter direct conversations that user1Id belongs to
          const directConvIds = u1Convs
            .filter(item => item.conversation && (item.conversation as any).type === 'direct')
            .map(item => item.conversation_id);

          if (directConvIds.length > 0) {
            // Find which of these also contains user2Id as participant
            const { data: matchedParticipant, error: u2Error } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .in('conversation_id', directConvIds)
              .eq('user_id', user2Id)
              .limit(1);

            if (!u2Error && matchedParticipant && matchedParticipant.length > 0) {
              existingId = matchedParticipant[0].conversation_id;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("Client fallback direct conversation match failed:", fallbackErr);
      }
    }

    if (existingId) return existingId;

    // Helper to generate UUID client-side securely
    const generateUUID = () => {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    const newConvId = generateUUID();

    // Create new DM conversation first
    const { error: convError } = await supabase
      .from('conversations')
      .insert({ id: newConvId, type: 'direct' } as any);

    if (convError) throw convError;

    // Add participants
    const { error: partError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConvId, user_id: user1Id },
        { conversation_id: newConvId, user_id: user2Id }
      ] as any);

    if (partError) throw partError;

    return newConvId;
  }
};
