/**
 * LockService handles the logic for the App Lock system.
 * It now interacts with Supabase to ensure the lock is synchronized across devices.
 */

import { supabase } from '../lib/supabase';

export type LockType = 'pin4' | 'pin6' | 'alpha' | null;

interface LockData {
  isEnabled: boolean;
  type: LockType;
  hash: string | null;
}

export const LockService = {
  // Pass the userData from the context to get current lock status instantly
  getLockDataFromProfile: (profile: any): LockData => {
    if (profile?.settings?.lock) {
      return profile.settings.lock;
    }
    if (profile?.lock) {
      return profile.lock;
    }
    return { isEnabled: false, type: null, hash: null };
  },

  enableLock: async (type: LockType, value: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const lockData: LockData = {
      isEnabled: true,
      type,
      hash: value
    };
    
    // 1. Try to update the 'lock' column directly
    try {
      const { error } = await supabase
        .from('users')
        .update({ lock: lockData } as any)
        .eq('id', user.id);
        
      if (!error) return; // Success!
      console.warn("Direct lock column update failed, trying settings column fallback:", error);
    } catch (err) {
      console.warn("Direct lock update threw error, trying settings fallback:", err);
    }

    // 2. Fallback: Save inside settings JSONB field
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();
      
      const currentSettings = profile?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        lock: lockData
      };

      const { error: fallbackError } = await supabase
        .from('users')
        .update({ settings: updatedSettings } as any)
        .eq('id', user.id);
      
      if (fallbackError) throw fallbackError;
    } catch (err) {
      console.error('Lock fallback failed:', err);
      throw err;
    }
  },

  disableLock: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const lockData: LockData = {
      isEnabled: false,
      type: null,
      hash: null
    };
    
    // 1. Try to update the 'lock' column directly
    try {
      const { error } = await supabase
        .from('users')
        .update({ lock: lockData } as any)
        .eq('id', user.id);
        
      if (!error) return; // Success
      console.warn("Direct lock disable column update failed, trying settings fallback:", error);
    } catch (err) {
      console.warn("Direct lock disable check failed, using settings fallback:", err);
    }

    // 2. Fallback: Save inside settings JSONB field
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('settings')
        .eq('id', user.id)
        .single();
      
      const currentSettings = profile?.settings || {};
      const updatedSettings = {
        ...currentSettings,
        lock: lockData
      };

      const { error: fallbackError } = await supabase
        .from('users')
        .update({ settings: updatedSettings } as any)
        .eq('id', user.id);
      
      if (fallbackError) throw fallbackError;
    } catch (err) {
      console.error('Lock disable fallback failed:', err);
      throw err;
    }
  },

  verifyLock: (value: string, hash: string | null): boolean => {
    return hash === value;
  }
};
