import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { chatService } from '../services/chatService';
import { useAuth } from '../../../providers/AuthProvider.tsx';
import { SupabaseStorageService } from '../../../services/SupabaseStorageService.ts';
import { LocalDataCache } from '../../../services/LocalDataCache';
import { pushNotificationService } from '../services/pushNotificationService';
import { P2PService } from '../../../services/P2PService';

export const useChatActions = (conversationId: string, receiverId: string) => {
  const { user, userData } = useAuth();

  const sendMessage = useCallback(async ({
    text,
    file,
    localPreviewUrl,
    replyTo,
    onProgress
  }: {
    text: string;
    file?: File | Blob | null;
    localPreviewUrl?: string;
    replyTo?: any;
    onProgress?: (progress: number) => void;
  }) => {
    if (!user || !conversationId || !supabase) return;

    let mediaData: { url: string; type: string } | undefined;

    if (file) {
      const fileName = (file as File).name || (file.type.startsWith('audio/') ? 'voice_message.webm' : 'file');
      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type.startsWith('video/') ? 'video' : 
                       file.type.startsWith('audio/') ? 'audio' : 'file';
      
      try {
        // Simple upload (progress can be added later if storage service supports it)
        const finalUrl = await SupabaseStorageService.uploadDocument(file as File);
        mediaData = { url: finalUrl, type: fileType };
      } catch (error) {
        console.error('Upload failed:', error);
        return;
      }
    }

    try {
      const displayContent = text || (mediaData ? `Sent a ${mediaData.type}` : 'Sent a file');
      LocalDataCache.updateLastMessage(user.id, conversationId, displayContent);
      const dbMessage = await chatService.sendMessage(conversationId, user.id, text, mediaData, replyTo);
      
      if (dbMessage) {
        dbMessage.content = dbMessage.text || dbMessage.content || '';
        
        // Broadcast over serverless P2P mesh live
        try {
          const fileAttrs = mediaData ? {
            url: mediaData.url,
            type: mediaData.type,
            name: mediaData.type === 'image' ? 'photo.png' : 'file'
          } : undefined;
          
          P2PService.sendMessage(text, fileAttrs, replyTo?.id, dbMessage.id);
        } catch (p2pErr) {
          console.warn("P2P transmission skipped or errored:", p2pErr);
        }

        const stableMessage = {
          ...dbMessage,
          sender: {
            id: user.id,
            username: userData?.username || 'user',
            full_name: userData?.fullName || 'User',
            photo_url: userData?.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
          }
        };

        // Dispatch background push alert logic
        pushNotificationService.sendNotificationForMessage(
          conversationId,
          user.id,
          userData?.fullName || userData?.username || 'GrixChat User',
          text,
          mediaData?.type
        ).catch(err => console.warn('pushNotificationService activation errored:', err));

        // Background failsafe auto-pruner to cap Supabase message count in this chat to 60.
        // If count hits >= 60, we remove the oldest 20 messages so only 40 are left.
        (async () => {
          try {
            const { count, error: countErr } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conversationId);

            if (!countErr && count && count >= 60) {
              const { data: oldest, error: selectErr } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })
                .limit(20);

              if (!selectErr && oldest && oldest.length > 0) {
                const idsToDelete = oldest.map(o => o.id);
                await supabase
                  .from('messages')
                  .delete()
                  .in('id', idsToDelete);
                console.log(`[Message Pruning] Successfully pruned oldest 20 messages in conversation ${conversationId}.`);
              }
            }
          } catch (e) {
            console.error('[Message Pruning] Failsafe error:', e);
          }
        })();

        return stableMessage;
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [conversationId, user, userData, receiverId]);

  const editMessage = useCallback(async (msgId: string, newText: string) => {
    if (!supabase) return;
    if (user?.id) {
      LocalDataCache.updateLastMessage(user.id, conversationId, newText);
    }

    // Instantly/optimistically update local messages cache and notify listeners
    const cached = LocalDataCache.getMessages(conversationId) || [];
    const updated = cached.map((m: any) => {
      if (m.id === msgId) {
        return {
          ...m,
          text: newText,
          content: newText,
          is_edited: true
        };
      }
      return m;
    });
    LocalDataCache.saveMessages(conversationId, updated);
    LocalDataCache.notify(`messages:${conversationId}`, updated);

    try {
      // First try to update both text and is_edited
      const { error } = await supabase
        .from('messages')
        .update({ text: newText, is_edited: true } as any)
        .eq('id', msgId);
      
      if (error) {
        console.warn('Error updating message with is_edited column (falling back to text-only):', error);
        // Fallback to text-only if SQL column doesn't exist yet
        const { error: fallbackError } = await supabase
          .from('messages')
          .update({ text: newText } as any)
          .eq('id', msgId);
        if (fallbackError) {
          console.error('Failed to edit message in fallback mode:', fallbackError);
        }
      }
    } catch (err) {
      console.error('Failed to update message:', err);
    }
  }, [conversationId, user]);

  const deleteMessage = useCallback(async (msgId: string, deleteType: 'me' | 'everyone' = 'everyone') => {
    if (!supabase || !user) return;

    // Instantly/optimistically update local messages cache and notify listeners
    const cached = LocalDataCache.getMessages(conversationId) || [];
    
    // For both cases, we filter out this specific message from the local UI cache so there is no trace left
    const updated = cached.filter((m: any) => m.id !== msgId);

    LocalDataCache.saveMessages(conversationId, updated);
    LocalDataCache.notify(`messages:${conversationId}`, updated);

    // Update the conversation list's last message and status optimistically
    const nextLatest = updated.length > 0 ? updated[updated.length - 1] : null;
    const lastMsgText = nextLatest 
      ? (nextLatest.text || (nextLatest.media_type ? `Sent a ${nextLatest.media_type}` : 'Sent a file'))
      : 'New Conversation';
    const lastMsgTimestamp = nextLatest ? nextLatest.created_at : new Date().toISOString();
    const nextMsgSenderId = nextLatest ? nextLatest.sender_id : null;
    const lastMsgStatusVal = nextMsgSenderId ? (nextMsgSenderId === user.id ? 'Sent' : 'Received') : undefined;

    LocalDataCache.updateLastMessage(user.id, conversationId, lastMsgText, lastMsgTimestamp, lastMsgStatusVal);

    try {
      if (deleteType === 'me') {
        // Fetch existing deleted_by array first
        const { data: currentMsg, error: fetchErr } = await supabase
          .from('messages')
          .select('deleted_by')
          .eq('id', msgId)
          .maybeSingle();

        if (fetchErr) {
          console.error('Error fetching message for delete for me:', fetchErr);
        }

        const currentDeletedBy = Array.isArray(currentMsg?.deleted_by) ? currentMsg.deleted_by : [];
        if (!currentDeletedBy.includes(user.id)) {
          const updatedDeletedBy = [...currentDeletedBy, user.id];
          const { error } = await supabase
            .from('messages')
            .update({ deleted_by: updatedDeletedBy })
            .eq('id', msgId);
          if (error) {
            console.error('Error setting deleted_by in Supabase:', error);
          }
        }
      } else {
        // Delete for Everyone: Physically delete the row from DB completely
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', msgId);
        if (error) {
          console.error('Error deleting for everyone in Supabase:', error);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }, [conversationId, user]);

  const reactToMessage = useCallback(async (msgId: string, emoji: string) => {
    if (!user || !supabase || !conversationId) return;

    // 1. Optimistic cache update to make reaction instant in the active UI
    const cached = LocalDataCache.getMessages(conversationId) || [];
    const updated = cached.map((m: any) => {
      if (m.id === msgId) {
        const reactions = { ...(m.reactions || {}) };
        if (reactions[user.id] === emoji) {
          delete reactions[user.id];
        } else {
          reactions[user.id] = emoji;
        }
        return { ...m, reactions };
      }
      return m;
    });
    LocalDataCache.saveMessages(conversationId, updated);
    LocalDataCache.notify(`messages:${conversationId}`, updated);

    // 2. Perform the server update
    try {
      const { data: msg } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', msgId)
        .single();
      
      const dbReactions = (msg?.reactions as any) || {};
      if (dbReactions[user.id] === emoji) {
        delete dbReactions[user.id];
      } else {
        dbReactions[user.id] = emoji;
      }

      await supabase
        .from('messages')
        .update({ reactions: dbReactions } as any)
        .eq('id', msgId);
    } catch (err) {
      console.error('Error updating reaction in database:', err);
    }
  }, [user, conversationId]);

  const clearChat = useCallback(async () => {
    if (!supabase || !conversationId) return;
    await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', conversationId);
  }, [conversationId]);

  return { sendMessage, editMessage, deleteMessage, reactToMessage, clearChat };
};
