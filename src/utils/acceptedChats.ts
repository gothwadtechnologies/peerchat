import { storage } from '../services/StorageService';

export const getAcceptedChats = (): string[] => {
  try {
    const data = storage.getItem('grix_accepted_chats');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const acceptChat = (conversationId: string) => {
  try {
    const list = getAcceptedChats();
    if (!list.includes(conversationId)) {
      list.push(conversationId);
      storage.setItem('grix_accepted_chats', JSON.stringify(list));
    }
  } catch (e) {}
};

export const declineChat = (conversationId: string) => {
  try {
    // Save to ignored/declined list so it doesn't show up again
    const declined = getDeclinedChats();
    if (!declined.includes(conversationId)) {
      declined.push(conversationId);
      storage.setItem('grix_declined_chats', JSON.stringify(declined));
    }
  } catch (e) {}
};

export const getDeclinedChats = (): string[] => {
  try {
    const data = storage.getItem('grix_declined_chats');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const initializeAcceptedConversations = (conversationIds: string[]) => {
  try {
    const initialized = storage.getItem('grix_accepted_chats_initialized');
    if (!initialized) {
      storage.setItem('grix_accepted_chats', JSON.stringify(conversationIds));
      storage.setItem('grix_accepted_chats_initialized', 'true');
    }
  } catch (e) {}
};
