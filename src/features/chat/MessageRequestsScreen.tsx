import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, Loader2, Users, Flame, Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { getAcceptedChats, acceptChat, declineChat } from '../../utils/acceptedChats';
import { chatService } from './services/chatService';
import { LocalDataCache } from '../../services/LocalDataCache';
import Avatar from '../../components/common/Avatar';

export default function MessageRequestsScreen() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  
  const [subTab, setSubTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [authUser]);

  const fetchRequests = async () => {
    if (!authUser?.id || !supabase) return;
    try {
      setLoading(true);

      // Fetch follow rows determining requests and mutual friendship
      const { data: followRows } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${authUser.id},following_id.eq.${authUser.id}`);

      const IFollow = new Set<string>();
      const FollowsMe = new Set<string>();

      followRows?.forEach(row => {
        if (row.follower_id === authUser.id) {
          IFollow.add(row.following_id);
        }
        if (row.following_id === authUser.id) {
          FollowsMe.add(row.follower_id);
        }
      });

      const incomingIds = Array.from(FollowsMe).filter(id => !IFollow.has(id));
      const outgoingIds = Array.from(IFollow).filter(id => !FollowsMe.has(id));

      let incomingList: any[] = [];
      if (incomingIds.length > 0) {
        const { data: incUsers } = await supabase
          .from('users')
          .select('*')
          .in('id', incomingIds);
        
        if (incUsers) {
          incomingList = incUsers.map(u => ({
            id: u.id,
            otherUser: {
              id: u.id,
              username: u.username,
              fullName: u.full_name,
              photoURL: u.photo_url || '',
              bio: u.bio,
              isOnline: u.is_online
            }
          }));
        }
      }

      let outgoingList: any[] = [];
      if (outgoingIds.length > 0) {
        const { data: outUsers } = await supabase
          .from('users')
          .select('*')
          .in('id', outgoingIds);
        
        if (outUsers) {
          outgoingList = outUsers.map(u => ({
            id: u.id,
            otherUser: {
              id: u.id,
              username: u.username,
              fullName: u.full_name,
              photoURL: u.photo_url || '',
              bio: u.bio,
              isOnline: u.is_online
            }
          }));
        }
      }

      setIncoming(incomingList);
      setOutgoing(outgoingList);
    } catch (error) {
      console.error('Error classifying requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (otherId: string) => {
    if (!supabase || !authUser?.id) return;
    try {
      setActionId(otherId);

      // Establish mutual friendship follow connections in DB
      const { error } = await supabase.from('follows').insert({
        follower_id: authUser.id,
        following_id: otherId
      });
      if (error) throw error;

      // Pre-accept and pre-create direct chat conversation so it's fully ready
      const convId = await chatService.getOrCreateDirectConversation(authUser.id, otherId);
      if (convId) {
        acceptChat(convId);
      }

      // Explicitly invalidate conversations cache to update chat screen instantly
      LocalDataCache.invalidateConversations(authUser.id);

      // Remove from list
      setIncoming(prev => prev.filter(req => req.id !== otherId));
    } catch (e) {
      console.error('Error accepting friend request:', e);
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (otherId: string) => {
    if (!supabase || !authUser?.id) return;
    try {
      setActionId(otherId);

      // Decline means we delete their follow to us
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', otherId)
        .eq('following_id', authUser.id);

      if (error) throw error;

      // Explicitly invalidate conversations cache to update chat screen instantly
      LocalDataCache.invalidateConversations(authUser.id);

      setIncoming(prev => prev.filter(req => req.id !== otherId));
    } catch (e) {
      console.error('Error declining request:', e);
    } finally {
      setActionId(null);
    }
  };

  const handleCancelRequest = async (otherId: string) => {
    if (!supabase || !authUser?.id) return;
    try {
      setActionId(otherId);

      // Cancel outgoing request from us to them
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', authUser.id)
        .eq('following_id', otherId);

      if (error) throw error;

      // Explicitly invalidate conversations cache to update chat screen instantly
      LocalDataCache.invalidateConversations(authUser.id);

      setOutgoing(prev => prev.filter(req => req.id !== otherId));
    } catch (e) {
      console.error('Error canceling request:', e);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 min-h-[56px] pt-safe pb-1.5 bg-[var(--header-bg)] z-55 shadow-sm border-b border-[var(--border-color)]/35 rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer text-[var(--header-text)]">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-black text-[var(--header-text)] tracking-tight">
            Requests Board
          </h1>
        </div>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="flex bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 p-2 gap-2 select-none shrink-0">
        <button 
          onClick={() => setSubTab('incoming')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'incoming'
              ? 'bg-[#0494f4] text-white shadow-md shadow-[#0494f4]/15'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50'
          }`}
        >
          <ArrowDownLeft size={14} className={subTab === 'incoming' ? 'text-white' : 'text-[#0494f4]'} />
          <span>Incoming ({incoming.length})</span>
        </button>
        <button 
          onClick={() => setSubTab('outgoing')}
          className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'outgoing'
              ? 'bg-[#0494f4] text-white shadow-md shadow-[#0494f4]/15'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-main)]/50'
          }`}
        >
          <ArrowUpRight size={14} className={subTab === 'outgoing' ? 'text-white' : 'text-[#0494f4]'} />
          <span>Outgoing ({outgoing.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-[var(--bg-card)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="animate-spin text-[#0494f4]" size={28} />
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em]">Analyzing connections...</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-color)]/10 animate-fade-in">
            {subTab === 'incoming' ? (
              // INCOMING TAB
              incoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none">
                  <div className="w-16 h-16 bg-[#0494f4]/10 rounded-2xl flex items-center justify-center mb-4 text-[#0494f4]">
                    <Users size={26} />
                  </div>
                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">No incoming requests</h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed font-semibold">
                    You haven't received any new connect requests from other users yet.
                  </p>
                </div>
              ) : (
                incoming.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--bg-main)]/30 transition-all border-b border-[var(--border-color)]/10"
                  >
                    {/* User profile details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/user/${item.otherUser.id}`)}>
                      <Avatar url={item.otherUser.photoURL} type="direct" size="md" name={item.otherUser.fullName || item.otherUser.username} isOnline={item.otherUser.isOnline} />
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-extrabold text-[var(--text-primary)] truncate block">
                          {item.otherUser.fullName}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] font-bold block">@{item.otherUser.username}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleAccept(item.id)}
                        disabled={actionId !== null}
                        className="px-3.5 py-1.5 bg-[#0494f4] hover:bg-[#0381d6] disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={3} />}
                        <span>Accept</span>
                      </button>

                      <button 
                        onClick={() => handleDecline(item.id)}
                        disabled={actionId !== null}
                        className="px-3 py-1.5 bg-[var(--bg-main)] hover:bg-[var(--border-color)]/50 border border-[var(--border-color)]/50 hover:text-[var(--text-primary)] text-[var(--text-secondary)] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} strokeWidth={3} />}
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            ) : (
              // OUTGOING TAB
              outgoing.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center select-none">
                  <div className="w-16 h-16 bg-[#0494f4]/10 rounded-2xl flex items-center justify-center mb-4 text-[#0494f4]">
                    <Send size={24} />
                  </div>
                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">No outgoing requests</h4>
                  <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed font-semibold">
                    You don't have any pending outgoing connect requests outstanding right now.
                  </p>
                </div>
              ) : (
                outgoing.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-[var(--bg-main)]/30 transition-all border-b border-[var(--border-color)]/10"
                  >
                    {/* User profile details */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/user/${item.otherUser.id}`)}>
                      <Avatar url={item.otherUser.photoURL} type="direct" size="md" name={item.otherUser.fullName || item.otherUser.username} isOnline={item.otherUser.isOnline} />
                      <div className="min-w-0 flex-1">
                        <span className="text-[13px] font-extrabold text-[var(--text-primary)] truncate block">
                          {item.otherUser.fullName}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)] font-bold block">@{item.otherUser.username}</span>
                        <div className="text-[9px] text-[#0494f4] uppercase font-black tracking-widest mt-0.5 flex items-center gap-1.5 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0494f4] animate-pulse shrink-0" />
                          <span>Awaiting</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center shrink-0">
                      <button 
                        onClick={() => handleCancelRequest(item.id)}
                        disabled={actionId !== null}
                        className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {actionId === item.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} strokeWidth={3} />}
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
