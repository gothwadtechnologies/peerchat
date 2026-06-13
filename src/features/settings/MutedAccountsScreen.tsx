import React, { useState, useEffect } from 'react';
import { VolumeX, Loader2, X } from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import Avatar from '../../components/common/Avatar';

export default function MutedAccountsScreen() {
  const { user: authUser, userData: currentUserData } = useAuth();
  const [mutedUsers, setMutedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unmutingId, setUnmutingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchMutedDetails = async () => {
      // Re-fetch user data to get fresh muted list
      const { data: userProfile } = await supabase
        .from('users')
        .select('muted_users')
        .eq('id', authUser.id)
        .single();
      
      const mutedIds = userProfile?.muted_users || [];
      if (mutedIds.length === 0) {
        setMutedUsers([]);
        setLoading(false);
        return;
      }
      
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', mutedIds);
        
        if (usersData) {
          setMutedUsers(usersData);
        }
      } catch (err) {
        console.warn("Failed to fetch muted user details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMutedDetails();

    const channel = supabase
      .channel(`muted:${authUser.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${authUser.id}`
      }, () => fetchMutedDetails())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  const handleUnmute = async (targetUid: string) => {
    if (!authUser || !supabase) return;
    setUnmutingId(targetUid);
    try {
      const currentMuted = currentUserData?.muted_users || [];
      const newMuted = currentMuted.filter((id: string) => id !== targetUid);

      const { error } = await supabase
        .from('users')
        .update({ muted_users: newMuted } as any)
        .eq('id', authUser.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error unmuting user:", error);
    } finally {
      setUnmutingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden">
        <SettingHeader title="Muted accounts" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden font-sans">
      <SettingHeader title="Muted accounts" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {mutedUsers.length > 0 ? (
          <div className="py-4">
            <p className="px-6 mb-4 text-[11px] text-[var(--text-secondary)] font-medium uppercase tracking-widest">
              MUTED ACCOUNTS ({mutedUsers.length})
            </p>
            <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]">
              {mutedUsers.map((user, index) => (
                <div 
                  key={user.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    index !== mutedUsers.length - 1 ? 'border-b border-[var(--border-color)]/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar 
                      url={user.photo_url || user.photoURL} 
                      type="direct"
                      size="custom"
                      customSizeClass="w-10 h-10"
                      name={user.username}
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">
                        {user.full_name || user.fullName || user.username}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">@{user.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnmute(user.id)}
                    disabled={unmutingId === user.id}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 disabled:opacity-50"
                  >
                    {unmutingId === user.id ? 'Working...' : 'Unmute'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center py-20">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <VolumeX size={40} className="text-zinc-900" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">No muted accounts</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-xs">
              When you mute someone, you won't see their posts or stories in your feed. They won't know you've muted them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
