import { supabase } from '../../../lib/supabase';

export const profileService = {
  async getProfile(uid: string) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }

    // Map to camelCase for frontend
    const profile = data as any;
    return {
      uid: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      username: profile.username,
      photoURL: profile.photo_url,
      bio: profile.bio,
      isVerified: profile.is_verified,
      profileType: profile.profile_type,
      lastSeen: profile.last_seen,
      status: profile.is_online ? 'online' : 'offline',
      settings: profile.settings
    };
  },

  async updateProfile(uid: string, data: any) {
    if (!supabase) return;
    
    // Map camelCase to snake_case
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.photoURL !== undefined) updateData.photo_url = data.photoURL;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.profileType !== undefined) updateData.profile_type = data.profileType;
    if (data.settings !== undefined) updateData.settings = data.settings;

    const { error } = await supabase
      .from('users')
      .update(updateData as any)
      .eq('id', uid);
    
    if (error) throw error;
  },

  async followUser(currentUid: string, targetUid: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: currentUid, following_id: targetUid } as any);
    
    if (error && error.code !== '23505') throw error; // Ignore duplicate follows
  },

  async unfollowUser(currentUid: string, targetUid: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id: currentUid, following_id: targetUid } as any);
    
    if (error) throw error;
  },

  async setOnlineStatus(uid: string, isOnline: boolean) {
    if (!supabase) return;
    return supabase
      .from('users')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      } as any)
      .eq('id', uid);
  }
};
