import React, { useState, useEffect } from 'react';
import { UserMinus, UserPlus, Loader2, X } from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';
import Avatar from '../../components/common/Avatar';

export default function BlockedAccountsScreen() {
  const { userData, user: authUser } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchBlockedDetails = async () => {
      // Re-fetch to get fresh list
      const { data: userProfile } = await supabase
        .from('users')
        .select('blocked_users')
        .eq('id', authUser.id)
        .single();
      
      const blockedIds = userProfile?.blocked_users || [];
      if (blockedIds.length === 0) {
        setBlockedUsers([]);
        setLoading(false);
        return;
      }
      
      try {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', blockedIds);
        
        if (usersData) {
          setBlockedUsers(usersData);
        }
      } catch (err) {
        console.warn("Failed to fetch blocked user details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedDetails();
  }, [authUser?.id, userData?.blocked_users]);

  const handleUnblock = async (targetUid: string) => {
    if (!authUser || !supabase) return;
    setUnblockingId(targetUid);
    try {
      const currentBlocked = userData?.blocked_users || [];
      const newBlocked = currentBlocked.filter((id: string) => id !== targetUid);

      const { error } = await supabase
        .from('users')
        .update({ blocked_users: newBlocked } as any)
        .eq('id', authUser.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error unblocking user:", error);
    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden">
        <SettingHeader title="Blocked" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden">
      <SettingHeader title="Blocked" />
      
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {blockedUsers.length > 0 ? (
          <div className="py-4">
            <p className="px-6 mb-4 text-[11px] text-[var(--text-secondary)] font-medium">
              You have blocked {blockedUsers.length} accounts. Blocked people cannot see your profile or posts.
            </p>
            <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]">
              {blockedUsers.map((user, index) => (
                <div 
                  key={user.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    index !== blockedUsers.length - 1 ? 'border-b border-[var(--border-color)]/30' : ''
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
                    onClick={() => handleUnblock(user.id)}
                    disabled={unblockingId === user.id}
                    className="text-xs font-bold text-blue-500 hover:text-blue-600 disabled:opacity-50"
                  >
                    {unblockingId === user.id ? 'Working...' : 'Unblock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center py-20">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <UserMinus size={40} className="text-zinc-900" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">No blocked accounts</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-xs">
              When you block someone, they won't be able to find your profile, posts or story on GrixChat.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
