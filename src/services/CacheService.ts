// src/services/CacheService.ts

import { storage } from './StorageService';

export interface CachedUser {
  uid: string;
  fullName?: string;
  photoURL?: string;
  about?: string;
  username?: string;
  lastSeen?: any;
  isOnline?: boolean;
  timestamp: number;
}

const USER_CACHE_KEY = 'gx_user_cache';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// Memory cache to avoid excessive localStorage reads
let memoryCache: Record<string, CachedUser> | null = null;

export const CacheService = {
  getUsers: (): Record<string, CachedUser> => {
    if (memoryCache) return memoryCache;
    const data = storage.getItem(USER_CACHE_KEY);
    memoryCache = data ? JSON.parse(data) : {};
    return memoryCache || {};
  },

  getUser: (uid: string): CachedUser | null => {
    const cache = CacheService.getUsers();
    const user = cache[uid];
    if (user && Date.now() - user.timestamp < CACHE_EXPIRY) {
      return user;
    }
    return null;
  },

  saveUser: (uid: string, userData: any) => {
    const cache = CacheService.getUsers();
    cache[uid] = {
      ...userData,
      uid,
      timestamp: Date.now()
    };
    memoryCache = cache;
    // Debounce localStorage write or just do it once per save
    storage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
  },

  clearOldCache: () => {
    const cache = CacheService.getUsers();
    const now = Date.now();
    let changed = false;
    Object.keys(cache).forEach(uid => {
      if (now - cache[uid].timestamp > CACHE_EXPIRY * 24) { // Keep for 24 hours even if "expired" for refresh
        delete cache[uid];
        changed = true;
      }
    });
    if (changed) {
      memoryCache = cache;
      storage.setItem(USER_CACHE_KEY, JSON.stringify(cache));
    }
  }
};
