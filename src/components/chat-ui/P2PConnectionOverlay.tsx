// Serverless Grix P2P Connectivity Dashboard
// Renders active peer identification, signaling channels, and live WebRTC ICE loggers.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { P2PService } from '../../services/P2PService';
import { safeLocalStorage } from '../../lib/supabase';
import { Copy, Wifi, Shield, Globe, Users, ArrowRight, CornerDownRight, Check, RefreshCw } from 'lucide-react';

interface P2POverlayProps {
  onClose: () => void;
}

export default function P2PConnectionOverlay({ onClose }: P2POverlayProps) {
  const [peerId, setPeerId] = useState('');
  const [peerName, setPeerName] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRoom, setCopiedRoom] = useState(false);
  const [activeRoom, setActiveRoom] = useState('');

  // Local state mirrored from service coordinator
  const [wsStatus, setWsStatus] = useState(P2PService.wsStatus);
  const [rtcStatus, setRtcStatus] = useState(P2PService.rtcConnectionStatus);
  const [peers, setPeers] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Read local identities
    setPeerId(safeLocalStorage.getItem('grix_peer_id') || '');
    setPeerName(safeLocalStorage.getItem('grix_peer_name') || '');
    setActiveRoom(safeLocalStorage.getItem('grix_active_room_id') || '');

    // Synchronize updates on connection state changes
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

    // Populate initial logs
    setLogs([...P2PService.logs]);

    return () => {
      unsubscribe();
    };
  }, []);

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#202124] border border-[#2c2d30] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2c2d30] flex justify-between items-center bg-[#292a2d]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <Shield size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-md font-bold text-white tracking-tight">Decentralized P2P Mesh</h2>
              <p className="text-xs text-[var(--text-secondary)]">Serverless Room handshake & RTCDataChannel</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2c2d30] text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 progress-scroll">
          {/* My Identity */}
          <div className="bg-[#292a2d] border border-[#2c2d30] rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Device Fingerprint Info</p>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-white">{peerName}</p>
                <p className="text-xs text-gray-400 font-mono select-all truncate max-w-[280px]">Peer-ID: {peerId}</p>
              </div>
              <button 
                type="button"
                onClick={handleCopyPeerId}
                className="p-2 bg-[#2c2d30] hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs"
              >
                {copiedId ? <Check size={14} /> : <Copy size={14} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Network Status Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Signaling Server */}
            <div className="bg-[#292a2d] border border-[#2c2d30] rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-[var(--primary)] mb-1">
                <Wifi size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Signaling Bridge</span>
              </div>
              <p className="text-lg font-black text-white capitalize">{wsStatus}</p>
              <p className="text-[10px] text-gray-500 leading-none">Keeps rooms signaling active</p>
            </div>

            {/* WebRTC Connection State */}
            <div className="bg-[#292a2d] border border-[#2c2d30] rounded-2xl p-4 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 mb-1">
                <Globe size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">P2P Mesh Channels</span>
              </div>
              <p className="text-lg font-black text-white capitalize">{rtcStatus}</p>
              <p className="text-[10px] text-gray-500 leading-none">{peers.length} active off-grid connections</p>
            </div>
          </div>

          {/* Active room handling */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">P2P Handshake Rooms</h3>
            {activeRoom ? (
              <div className="bg-[#292a2d] p-4 rounded-2xl border border-[#2c2d30] flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded-full">Connected to Room</span>
                  <p className="text-sm font-mono text-white font-bold select-all">{activeRoom}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="p-2 bg-[#2c2d30] hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-500 rounded-xl transition-all cursor-pointer"
                >
                  {copiedRoom ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No active room channel joined on this session. Create or join a Room ID below to pair with another peer.</p>
            )}

            {/* Join Form / Create */}
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter shared GRIX-ROOM-ID..."
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                className="flex-1 bg-[#292a2d] border border-[#2c2d30] px-4 py-3 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--primary)] font-mono"
              />
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer select-none active:scale-95 transition-all"
              >
                Join <ArrowRight size={14} />
              </button>
            </form>

            <button
              type="button"
              onClick={handleCreateNewRoom}
              className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <RefreshCw size={14} className="animate-spin-slow" />
              Generate New P2P Connection Room
            </button>
          </div>

          {/* Connected Peers list */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Connected Nodes ({peers.length})</h3>
            {peers.length > 0 ? (
              <div className="divide-y divide-[#2c2d30] bg-[#292a2d] border border-[#2c2d30] rounded-2xl overflow-hidden">
                {peers.map((peer, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping-slow" />
                      <span className="text-xs font-bold text-white">{peer.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono truncate max-w-[120px] bg-[#2c2d30] px-2 py-0.5 rounded-full">{peer.id}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Waiting for peer handshakes inside the room...</p>
            )}
          </div>

          {/* Ice / WebRTC logs */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Handshake logs</h3>
            <div className="bg-[#18181b] border border-[#2c2d30] rounded-2xl p-4 h-36 font-mono text-[10px] text-emerald-500 overflow-y-auto space-y-1.5 progress-scroll">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <CornerDownRight size={10} className="mt-0.5 text-gray-600" />
                  <span className="break-all">{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
