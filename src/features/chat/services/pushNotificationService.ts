import { supabase } from '../../../lib/supabase';

export const pushNotificationService = {
  /**
   * Retrieves FCM tokens of all participants (except sender) for a given conversation,
   * then triggers the bulk push notification proxy API.
   */
  async sendNotificationForMessage(
    conversationId: string,
    senderId: string,
    senderName: string,
    messageText: string,
    mediaType?: string
  ) {
    if (!supabase) return;

    try {
      // 1. Fetch all participants in this conversation
      const { data: participants, error: partError } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (partError || !participants) {
        console.warn('FCM: Failed to fetch participants for push notification:', partError);
        return;
      }

      // Filter out the sender
      const recipientIds = participants
        .map(p => p.user_id)
        .filter(id => id !== senderId);

      if (recipientIds.length === 0) return;

      // 2. Fetch recipient user profiles to extract active fcm_tokens and muted_users configuration
      const { data: profiles, error: profError } = await supabase
        .from('users')
        .select('id, fcm_tokens, muted_users')
        .in('id', recipientIds);

      if (profError || !profiles) {
        console.warn('FCM: Failed to fetch recipient profiles for push:', profError);
        return;
      }

      // Collect active FCM tokens from unmuted recipients
      const allTokens: string[] = [];
      profiles.forEach(profile => {
        const isMuted = Array.isArray(profile.muted_users) && profile.muted_users.includes(senderId);
        if (!isMuted && Array.isArray(profile.fcm_tokens)) {
          allTokens.push(...profile.fcm_tokens);
        }
      });

      if (allTokens.length === 0) {
        console.log('FCM: No active registration tokens found for receiver(s).');
        return;
      }

      const bodyText = messageText || (mediaType ? `Sent a ${mediaType}` : 'Sent an attachment');

      // 3. Dispatch bulk send request through our proxy API
      console.log(`FCM: Dispatching push dispatch for conversation ${conversationId} to ${allTokens.length} tokens.`);
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: allTokens,
          title: senderName || "New Chat Alert",
          body: bodyText,
          data: {
            click_action: `/chats/${conversationId}`,
            conversationId,
            senderId
          }
        })
      });

      const responseText = await response.text();
      let resData: any = null;
      try {
        resData = responseText ? JSON.parse(responseText) : null;
      } catch (parseErr) {
        console.warn(`FCM: Received non-JSON response from server. Status: ${response.status}. Response body: ${responseText.substring(0, 500)}`);
        throw new Error(`Failed to parse FCM server response: ${responseText.substring(0, 150) || '(empty)'}`);
      }
      console.log('FCM: Push notification service response:', resData);
    } catch (err) {
      console.warn('FCM: pushNotificationService exception encountered:', err);
    }
  }
};
export default pushNotificationService;
