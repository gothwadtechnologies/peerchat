import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';
import { storage } from '../StorageService';

// Throttled update tracker to minimize DB writes on free tier (Issue 2)
let lastPresenceWriteTime = 0;
let lastKnownStatusState: boolean | null = null;

export const userProfileService = {
  // Throttled online/offline status update
  throttledSetStatus: async (userId: string, isOnline: boolean, force = false): Promise<void> => {
    if (!supabase || !userId) return;

    const now = Date.now();
    const timeSinceLastWrite = now - lastPresenceWriteTime;
    const statusChanged = lastKnownStatusState !== isOnline;

    // Throttle heartbeat to once every 45-60s unless it's a critical state transition
    if (!force && !statusChanged && timeSinceLastWrite < 45000) {
      return; // Skip write to conserve Supabase Free Tier throughput
    }

    try {
      lastPresenceWriteTime = now;
      lastKnownStatusState = isOnline;

      await supabase.from('users')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        } as any)
        .eq('id', userId);
    } catch (e) {
      console.warn('Unable to notify presence status change:', e);
    }
  },

  // Safely fetch client profile, autogenerate username, and fetch followers/followings
  fetchFullProfileData: async (
    currentUserId: string,
    email: string,
    userMetadata: any
  ): Promise<{ profileData: UserProfile | null; following: string[] }> => {
    if (!supabase) return { profileData: null, following: [] };

    try {
      // Offline fallback check first (Issue 7 / Sandbox fallback)
      if (!navigator.onLine) {
        const cachedRaw = storage.getItem('grix_cached_userdata');
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.id === currentUserId) {
            return { profileData: cached, following: cached.following || [] };
          }
        }
      }

      let { data: profile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle();

      if (fetchError) {
        console.warn('Error fetching profile:', fetchError);
        const cachedRaw = storage.getItem('grix_cached_userdata');
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            if (cached && cached.id === currentUserId) {
              return { profileData: cached, following: cached.following || [] };
            }
          } catch (_) {}
        }
      }

      // Automatically truncate legacy too-long user names on load (under 15 chars)
      if (profile && profile.username && profile.username.length > 15) {
        const truncated = profile.username.substring(0, 15);
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({ username: truncated } as any)
          .eq('id', currentUserId)
          .select()
          .maybeSingle();

        if (!updateError && updatedProfile) {
          profile = updatedProfile;
        } else {
          profile.username = truncated;
        }
      }

      if (!profile) {
        if (!navigator.onLine) {
          return { profileData: null, following: [] };
        }
        
        const emailPrefix = email ? email.split('@')[0] : 'grix_user';
        const baseUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const finalUsername = `${baseUsername || 'user'}_${randomSuffix}`.substring(0, 15);
        const fullName = userMetadata?.full_name || emailPrefix || 'Grix User';
        const photoUrl = userMetadata?.avatar_url || `https://cdn-icons-png.flaticon.com/512/149/149071.png`;

        console.log('Inserting auto-generated profile for', currentUserId);
        const { data: insertedProfile, error: insertError } = await supabase
          .from('users')
          .upsert({
            id: currentUserId,
            email: email,
            full_name: fullName,
            username: finalUsername,
            photo_url: photoUrl,
            updated_at: new Date().toISOString()
          } as any)
          .select()
          .maybeSingle();

        if (insertError) {
          console.error('Error inserting auto-generated profile:', insertError);
        } else if (insertedProfile) {
          profile = insertedProfile;
        }
      } else if (!profile.username) {
        const emailPrefix = (profile.email || email || '').split('@')[0] || 'grix_user';
        const baseUsername = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const finalUsername = `${baseUsername || 'user'}_${randomSuffix}`.substring(0, 15);

        console.log('Updating missing username for existing profile', currentUserId);
        const { data: updatedProfile, error: updateError } = await supabase
          .from('users')
          .update({ username: finalUsername } as any)
          .eq('id', currentUserId)
          .select()
          .maybeSingle();

        if (updateError) {
          console.error('Error updating missing username:', updateError);
        } else if (updatedProfile) {
          profile = updatedProfile;
        }
      }

      // Fetch following & followers with safety blocks
      let following: string[] = [];
      let followerIds: string[] = [];
      try {
        const [followingsRes, followersRes] = await Promise.all([
          supabase.from('follows').select('following_id').eq('follower_id', currentUserId),
          supabase.from('follows').select('follower_id').eq('following_id', currentUserId)
        ]);

        following = followingsRes.data?.map(f => f.following_id) || [];
        followerIds = followersRes.data?.map(f => f.follower_id) || [];
      } catch (followsErr) {
        console.warn('Error fetching follows offline, falling back to cache:', followsErr);
        const cachedRaw = storage.getItem('grix_cached_userdata');
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw);
            following = cached.following || [];
            followerIds = cached.followers || [];
          } catch (_) {}
        }
      }

      if (!profile) {
        return { profileData: null, following: [] };
      }

      const p = profile as any;
      const formatted: UserProfile = {
        id: p.id,
        uid: p.id,
        email: p.email,
        fullName: p.full_name,
        username: p.username,
        photoURL: p.photo_url,
        bio: p.bio,
        isVerified: p.is_verified,
        profileType: p.profile_type,
        lastSeen: p.last_seen,
        status: p.is_online ? 'online' : 'offline',
        hiddenChats: p.hidden_chats || [],
        archivedChats: p.archived_chats || [],
        hiddenChatSettings: p.hidden_chat_settings || p.settings?.hidden_chat_settings || {},
        fcmTokens: p.fcm_tokens || [],
        settings: p.settings,
        lock: p.lock,
        saved_posts: p.saved_posts || [],
        blockedUsers: p.blocked_users || [],
        blocked_users: p.blocked_users || [],
        muted_users: p.muted_users || [],
        favorites: p.favorites || [],
        following,
        followers: followerIds
      } as any;

      return { profileData: formatted, following };
    } catch (err) {
      console.warn('Major profile query catcher:', err);
      const cachedRaw = storage.getItem('grix_cached_userdata');
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          if (cached && cached.id === currentUserId) {
            return { profileData: cached, following: cached.following || [] };
          }
        } catch (_) {}
      }
      return { profileData: null, following: [] };
    }
  }
};
