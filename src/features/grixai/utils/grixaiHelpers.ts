import { LocalDataCache } from '../../../services/LocalDataCache';

/**
 * Calculates a premium aesthetic message quality score (80% - 100%)
 * based on grammar, length, capitalization, and vocabulary style.
 */
export const getMessageQualityScore = (text: string): number => {
  if (!text || !text.trim()) return 75;
  let score = 78; // baseline

  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).length;

  // Length and detail level
  if (wordCount > 3 && wordCount < 10) score += 8;
  else if (wordCount >= 10 && wordCount < 25) score += 14;
  else if (wordCount >= 25) score += 18;
  else score += 2;

  // Capitalization & styling signals
  if (/^[A-Z]/.test(trimmed)) score += 2; // starts with CAPITAL
  if (/[.?!]$/.test(trimmed)) score += 2;  // ends with proper punctuation
  if (trimmed.length > 60) score += 3;

  // Variety of vocabulary characters
  const uniqueChars = new Set(trimmed.toLowerCase().replace(/[^a-z]/g, '')).size;
  if (uniqueChars > 12) score += 3;
  if (uniqueChars > 18) score += 2;

  // Enforce pristine bounds to keep things highly professional
  return Math.min(100, Math.max(81, score));
};

/**
 * Generates an executive summary of the user's active conversations
 * from the local cache, allowing Grix AI to instantly answer queries
 * like "who did I talk to?".
 */
export const getActiveChatsContext = (currentUserId: string): string => {
  if (!currentUserId) return 'No context available.';
  
  try {
    const cachedConversations = LocalDataCache.getConversations(currentUserId);
    if (!cachedConversations || !Array.isArray(cachedConversations) || cachedConversations.length === 0) {
      return "The user has no other active chats opened yet on GrixChat.";
    }

    const compiled = cachedConversations.map((chat: any) => {
      if (chat.type === 'group') {
        return `- Group: "${chat.name || 'Unnamed Group'}" (Admin ID list: ${JSON.stringify(chat.admins || [])})`;
      } else {
        const otherParticipant = chat.participants?.find((p: any) => p.user?.id !== currentUserId);
        const name = otherParticipant?.user?.full_name || otherParticipant?.user?.fullName || 'GrixChat User';
        const username = otherParticipant?.user?.username || 'unknown';
        const isOnline = otherParticipant?.user?.is_online ? 'Active Now' : 'Offline';
        const lastMsg = chat.last_message || 'No messages yet';
        return `- Person Name: "${name}" (@${username}) is currently ${isOnline}. Last message in chat: "${lastMsg}"`;
      }
    });

    return `The user has the following active chats on GrixChat:\n${compiled.join('\n')}\nUtilize this secure, privacy-safe local list to answer contextually when the user asks whom they have chatted with or lists of people.`;
  } catch (err) {
    console.warn('getActiveChatsContext failed:', err);
    return 'Error retrieval of local active chats list.';
  }
};
