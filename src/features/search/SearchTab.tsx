import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ChevronRight,
  Loader2,
  Wifi, 
  Shield, 
  Globe, 
  ArrowRight, 
  CornerDownRight, 
  Check, 
  RefreshCw,
  Copy,
  Activity,
  Cpu,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider.tsx';
import { supabase, safeLocalStorage } from '../../lib/supabase';
import { P2PService } from '../../services/P2PService';
import { isUserOnline } from '../../utils/presence';
import Avatar from '../../components/common/Avatar';
import CommonSearchBar from '../../components/common/CommonSearchBar';

interface UserProfile {
  uid: string;
  username: string;
  fullName: string;
  photoURL: string;
  isOnline?: boolean;
}

export default function SearchTab() {
  const navigate = useNavigate();
  const { user: authUser, userData } = useAuth();
  
  // Tab-specific search state
  const [discoverSearchTerm, setDiscoverSearchTerm] = useState('');
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [userResults, setUserResults] = useState<UserProfile[]>([]);
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([]);

  // P2P Connection Hub State
  const [peerId, setPeerId] = useState('');
  const [peerName, setPeerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');

  // Local state mirrored from WebRTC P2P Service
  const [wsStatus, setWsStatus] = useState(P2PService.wsStatus);
  const [rtcStatus, setRtcStatus] = useState(P2PService.rtcConnectionStatus);
  const [peers, setPeers] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Synchronize P2P details on-load & on updates
  useEffect(() => {
    setPeerId(safeLocalStorage.getItem('grix_peer_id') || '');
    setPeerName(safeLocalStorage.getItem('grix_peer_name') || '');
    setActiveRoom(safeLocalStorage.getItem('grix_active_room_id') || '');

    const unsubscribe = P2PService.registerStatusListener(() => {
      setWsStatus(P2PService.wsStatus);
      setRtcStatus(P2PService.rtcConnectionStatus);
      setLogs([...P2PService.logs]);
      
      const peerList: any[] = [];
      P2PService.connectedPeers.forEach((p, pid) => {
        peerList.push({ id: pid, name: p.peerName });
      });
      setPeers(peerList);
    });

    setLogs([...P2PService.logs]);

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch hidden user IDs to filter search results
  useEffect(() => {
    if (!supabase || !authUser?.id || !userData?.hiddenChats || userData.hiddenChats.length === 0) {
      setHiddenUserIds([]);
      return;
    }
    const fetchHiddenUserIds = async () => {
      try {
        const { data } = await supabase
          .from('conversation_participants')
          .select('conversation_id, user_id')
          .in('conversation_id', userData.hiddenChats)
          .neq('user_id', authUser.id);
        
        if (data) {
          setHiddenUserIds(data.map(d => d.user_id));
        }
      } catch (e) {
        console.warn("Failed to fetch hidden user ids inside search tab:", e);
      }
    };
    fetchHiddenUserIds();
  }, [userData?.hiddenChats, authUser?.id]);

  // Handle Discover User Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (discoverSearchTerm.trim()) {
        const handleSearch = async () => {
          const term = discoverSearchTerm.toLowerCase().trim();
          if (!supabase || !authUser?.id) return;
          setDiscoverLoading(true);
          try {
            const { data } = await supabase
              .from('users')
              .select('id, username, full_name, photo_url, is_online, last_seen')
              .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
              .neq('id', authUser?.id)
              .limit(40);
            
            if (data) {
              setUserResults(
                data.map(u => ({
                  uid: u.id,
                  username: u.username,
                  fullName: u.full_name,
                  photoURL: u.photo_url || '',
                  isOnline: isUserOnline(u.is_online, u.last_seen)
                }))
              );
            }
          } catch (error) {
            console.error('Error searching in search tab:', error);
          } finally {
            setDiscoverLoading(false);
          }
        };

        handleSearch();
      } else {
        setUserResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [discoverSearchTerm, authUser?.id]);

  const handleCopyPeerId = () => {
    navigator.clipboard.writeText(peerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyRoomId = () => {
    if (activeRoom) {
      navigator.clipboard.writeText(activeRoom);
      setCopiedRoom(true);
      setTimeout(() => setCopiedRoom(false), 2000);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomId.trim()) return;
    P2PService.joinRoom(inputRoomId.trim().toUpperCase());
    setActiveRoom(inputRoomId.trim().toUpperCase());
    setInputRoomId('');
  };

  const handleCreateNewRoom = () => {
    const randomRoomId = 'GRIX-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9000);
    P2PService.joinRoom(randomRoomId);
    setActiveRoom(randomRoomId);
  };

  const renderUserRow = (profile: UserProfile) => {
    return (
      <div 
        key={profile.uid}
        onClick={() => navigate(`/user/${profile.uid}`)}
        className="flex items-center gap-3.5 px-4 py-3 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 border-b border-[var(--border-color)]/5 transition-colors group cursor-pointer select-none"
      >
        <Avatar 
          url={profile.photoURL} 
          name={profile.fullName || profile.username || 'GrixUser'} 
          isOnline={profile.isOnline} 
        />
        
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h4 className="text-[14.5px] truncate font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
              {profile.fullName || profile.username || 'GrixChat User'}
            </h4>
            <p className="text-[12.5px] text-[var(--text-secondary)] opacity-75 font-medium mt-0.5 leading-tight">@{profile.username || 'username'}</p>
          </div>
          <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
        </div>
      </div>
    );
  };

  const renderInlineHeader = (title: string, count?: number) => {
    return (
      <div className="px-4 py-2 bg-[var(--bg-main)]/30 border-b border-t border-[var(--border-color)]/5 select-none flex items-center justify-between first:border-t-0 font-sans">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0494f4]"></span>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[9.5px] font-bold text-[#0494f4] bg-[#0494f4]/15 px-1.5 h-4 rounded-full flex items-center justify-center font-mono">
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] min-h-[100dvh] pb-32 overflow-y-auto no-scrollbar font-sans">
      
      {/* Top Search Section */}
      <div className="p-4 bg-zinc-900/10 border-b border-[var(--border-color)]/10 shrink-0">
        <CommonSearchBar 
          placeholder="Translate credentials or search profiles by username..."
          value={discoverSearchTerm}
          onChange={setDiscoverSearchTerm}
          onClear={() => setDiscoverSearchTerm('')}
        />
      </div>

      <div className="p-5 flex flex-col gap-6 max-w-4xl mx-auto w-full">
        {discoverSearchTerm ? (
          /* Search results matching standard profiles */
          <div className="flex flex-col rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md divide-y divide-[var(--border-color)]/5 overflow-hidden">
            {renderInlineHeader("Global Query Results", userResults.filter(p => !hiddenUserIds.includes(p.uid)).length)}
            
            {discoverLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 bg-[var(--bg-card)]">
                <Loader2 className="animate-spin text-[#0494f4]" size={22} />
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Browsing matches...</p>
              </div>
            ) : userResults.filter(p => !hiddenUserIds.includes(p.uid)).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4 gap-2 bg-[var(--bg-card)]">
                <Users size={22} className="text-[var(--text-secondary)] opacity-50 shrink-0" />
                <div>
                  <h4 className="text-[13px] font-bold text-[var(--text-primary)]">No profiles matched</h4>
                  <p className="text-[11.5px] text-[var(--text-secondary)] px-4 leading-normal mt-0.5 max-w-sm mx-auto">
                    Please check the spelling of your query, or connect using the direct WebRTC peer handshakes workspace below.
                  </p>
                </div>
              </div>
            ) : (
              userResults.filter(p => !hiddenUserIds.includes(p.uid)).map(profile => renderUserRow(profile))
            )}
          </div>
        ) : (
          /* Unified P2P Connection Control Suite */
          <div className="flex flex-col gap-6">
            
            {/* Title Block */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-primary)]">
                  P2P Discovery & handshakes
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">Pair directly with off-grid servers and remote WebRTC nodes</p>
              </div>
            </div>

            {/* Twin diagnostic rows */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Identity Box */}
              <div className="md:col-span-2 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                <div className="absolute right-[-10px] top-[-10px] opacity-5 pointer-events-none text-emerald-500">
                  <Cpu size={120} strokeWidth={1} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[var(--text-secondary)] flex items-center gap-1">
                    <Sparkles size={11} className="text-yellow-500" />
                    Device Credentials
                  </p>
                  <h2 className="text-md font-black text-white mt-1 tracking-tight">
                    {peerName || 'My Unknown Device'}
                  </h2>
                  <code className="text-xs text-blue-400 font-mono mt-1.5 block select-all break-all bg-zinc-950/40 p-1.5 rounded-lg border border-[var(--border-color)]/10 text-left">
                    {peerId}
                  </code>
                </div>
                <button 
                  onClick={handleCopyPeerId}
                  className="mt-3.5 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs text-[var(--text-primary)] font-bold flex items-center justify-center gap-1.5 border border-zinc-700/30 transition-all self-start active:scale-95 shadow-sm"
                >
                  {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedId ? 'Copied' : 'Copy Fingerprint'}</span>
                </button>
              </div>

              {/* Status block */}
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md flex flex-col justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Shield size={14} className="text-blue-400" />
                  Realtime Health
                </h3>

                <div className="flex flex-col gap-2 font-sans">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--text-secondary)]">Bridge:</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      wsStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {wsStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--text-secondary)]">Mesh Status:</span>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      rtcStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {rtcStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[var(--text-secondary)]">Mesh Nodes:</span>
                    <span className="text-white bg-blue-500/20 px-1.5 py-0.5 rounded text-[10px] font-black">
                      {peers.length} active
                    </span>
                  </div>
                </div>

                <div className="animate-pulse flex items-center gap-1 text-[9px] text-[var(--text-secondary)] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Handshaker running
                </div>
              </div>

            </div>

            {/* Handshake workspace */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Wifi size={14} />
                Handshake Room Channels
              </h3>

              {activeRoom ? (
                <div className="bg-zinc-950/20 p-4 rounded-xl border border-[var(--border-color)]/10 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Connected to Room
                    </span>
                    <p className="text-sm font-mono text-white font-bold select-all">{activeRoom}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyRoomId}
                    className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-emerald-400 rounded-xl transition-all border border-zinc-700/20"
                  >
                    {copiedRoom ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                  A peer handshake room establishes immediate metadata signaling so you can negotiate peer-to-peer data channels offline. Join a Room ID shared by your partner below.
                </p>
              )}

              {/* Form trigger entry points */}
              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Insert shared GRIX-ROOM-ID..."
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  className="flex-1 bg-zinc-950/40 border border-[var(--border-color)]/20 px-4 py-3 rounded-xl text-xs text-white placeholder-zinc-600 font-mono focus:outline-none focus:border-emerald-500/80"
                />
                <button 
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-black px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                >
                  Join <ArrowRight size={14} />
                </button>
              </form>

              <button
                type="button"
                onClick={handleCreateNewRoom}
                className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 text-[var(--text-primary)] hover:text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all border border-[var(--border-color)]/20 active:scale-[0.98] shadow-md shadow-zinc-950/20"
              >
                <RefreshCw size={14} className="text-emerald-400" />
                Generate Secure Connection Room
              </button>
            </div>

            {/* Active mesh nodes list */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-3">
                <span>Active Nodes ({peers.length})</span>
                <span className="text-[9px] bg-zinc-950/40 px-2 py-0.5 rounded font-bold">ICE Session</span>
              </h3>

              {peers.length > 0 ? (
                <div className="divide-y divide-[var(--border-color)]/5 bg-zinc-950/20 border border-[var(--border-color)]/10 rounded-xl overflow-hidden">
                  {peers.map((peer, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-black text-white">{peer.name}</span>
                      </div>
                      <span className="text-[9px] text-[var(--text-secondary)] font-mono truncate max-w-[150px] bg-zinc-900 px-2 py-0.5 rounded-full">{peer.id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[var(--text-secondary)] font-bold italic bg-zinc-950/10 rounded-xl border border-dashed border-[var(--border-color)]/10">
                  Waiting for active signals on joined channel room...
                </div>
              )}
            </div>

            {/* Terminal logs pane */}
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/20 shadow-md">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-3">
                <span>Diagnostic Logs</span>
                <span className="text-[9px] text-zinc-500 font-mono">STUN/TURN</span>
              </h3>
              
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 h-40 font-mono text-[10px] text-emerald-400/90 overflow-y-auto space-y-1.5 scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="text-zinc-600 italic">No handshake records found yet.</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 text-left items-start">
                      <CornerDownRight size={10} className="mt-0.5 text-zinc-700 shrink-0" />
                      <span className="break-all leading-normal">{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
