import React, { useState, useEffect } from 'react';
import { Star, Search, UserPlus, Loader2, X } from 'lucide-react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import Avatar from '../../components/common/Avatar';

export default function FavoritesScreen() {
  const { user: authUser, userData: currentUserData } = useAuth();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchFavorites = async () => {
      // Re-fetch user data to get fresh favorites list or use currentUserData
      const { data: userProfile } = await supabase
        .from('users')
        .select('favorites')
        .eq('id', authUser.id)
        .single();
      
      const favoriteIds = userProfile?.favorites || [];
      
      if (favoriteIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('*')
          .in('id', favoriteIds);
        
        if (usersData) {
          setFavorites(usersData);
        }
      } else {
        setFavorites([]);
      }
      setLoading(false);
    };

    fetchFavorites();

    const channel = supabase
      .channel(`favorites:${authUser.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${authUser.id}`
      }, (payload) => {
        fetchFavorites();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  const handleRemoveFavorite = async (uid: string) => {
    if (!authUser || !supabase) return;
    setRemovingId(uid);
    try {
      const currentFavorites = currentUserData?.favorites || [];
      const newFavorites = currentFavorites.filter((id: string) => id !== uid);
      
      const { error } = await supabase
        .from('users')
        .update({ favorites: newFavorites } as any)
        .eq('id', authUser.id);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error removing favorite:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const filteredFavorites = favorites.filter(fav => 
    fav.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (fav.full_name || fav.fullName)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden">
        <SettingHeader title="Favorites" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[var(--bg-main)] h-full overflow-hidden font-sans">
      <SettingHeader title="Favorites" />
      
      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input 
            type="text" 
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-[var(--primary)] transition-colors text-[var(--text-primary)]"
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredFavorites.length > 0 ? (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden mb-8">
              {filteredFavorites.map((user, index) => (
                <div 
                  key={user.id}
                  className={`flex items-center justify-between px-6 py-4 ${
                    index !== filteredFavorites.length - 1 ? 'border-b border-[var(--border-color)]/30' : ''
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
                        {user.full_name || user.username || user.fullName}
                      </h4>
                      <p className="text-[11px] text-[var(--text-secondary)]">@{user.username}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFavorite(user.id)}
                    disabled={removingId === user.id}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
             <div className="text-center py-10 opacity-50">
                <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest">No matching favorites</p>
             </div>
          ) : (
            <div className="flex flex-col items-center text-center py-10">
              <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                <Star size={32} className="text-zinc-900" />
              </div>
              <h2 className="text-lg font-black text-[var(--text-primary)] mb-2">No favorites yet</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-8 max-w-xs">
                Posts from your favorites will appear higher in feed. We don't send notifications when you add or remove people.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
