import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Shield, Wifi, Radio, Server } from 'lucide-react';

interface GrixAICallOverlayProps {
  recipient: {
    fullName: string;
    photoURL?: string;
    username?: string;
  };
  onEndCall: (durationSecStr: string) => void;
}

export const GrixAICallOverlay: React.FC<GrixAICallOverlayProps> = ({ recipient, onEndCall }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [callStatus, setCallStatus] = useState('Initializing Secure Line Link...');
  const [logs, setLogs] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);

  // Hologram frequency bars
  const bars = Array.from({ length: 22 }, (_, i) => i);

  useEffect(() => {
    // Simulated progressive connection logs
    const connectionLogs = [
      `[PROT] Requesting secure uplink: Node-IN4...`,
      `[AUTH] Handshaking cryptographic public key keys...`,
      `[SYNC] P2P tunnel established with peer gateway.`,
      `[OPUS] Voice payload codec allocated: UHD 480Kbps.`,
      `[GRID] Carrier path: Grix Mumbai -> Bangalore -> Delhi Secure.`,
      `[CALL] Ringing remote peer device...`
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < connectionLogs.length) {
        setLogs(prev => [...prev, connectionLogs[logIndex]]);
        setCallStatus(logIndex === connectionLogs.length - 1 ? 'Ringing...' : 'Linking Route...');
        logIndex++;
      } else {
        clearInterval(logInterval);
        // Start simulated connected timer
        setCallStatus('Connected • Encrypted P2P HD audio');
      }
    }, 850);

    return () => clearInterval(logInterval);
  }, []);

  // Set up second counter
  useEffect(() => {
    if (callStatus.startsWith('Connected')) {
      const timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [callStatus]);

  const formatTime = (timeInSecs: number) => {
    const mins = Math.floor(timeInSecs / 60);
    const secs = timeInSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDisconnect = () => {
    const min = Math.floor(duration / 60);
    const sec = duration % 60;
    const durStr = duration > 0 ? `${min}m ${sec}s` : 'Ringing Cancelled';
    onEndCall(durStr);
  };

  return (
    <div className="absolute inset-0 bg-neutral-950 text-white z-[200] flex flex-col justify-between overflow-hidden p-6 font-sans">
      {/* Blueprint Grid Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{
          backgroundImage: `
            radial-gradient(circle, #3b82f6 1.2px, transparent 1.2px)
          `,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Security Header */}
      <div className="flex items-center justify-between z-10 text-[10px] uppercase font-black tracking-widest text-zinc-500 border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-1 text-indigo-400">
          <Shield size={12} className="animate-pulse" />
          <span>AES-256 Grix Link</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi size={12} />
          <span>UHD 48Khz Voice Link</span>
        </div>
      </div>

      {/* Main Calling Profile Card */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 py-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative mb-6"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping" />
          <div className="w-28 h-28 rounded-full overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-900 relative">
            {recipient.photoURL ? (
              <img src={recipient.photoURL} alt={recipient.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="text-2xl font-black text-indigo-400 uppercase">
                {recipient.fullName.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="absolute bottom-1 right-1 bg-indigo-500 p-1 rounded-full border-2 border-neutral-950">
            <Radio size={14} className="text-white" />
          </div>
        </motion.div>

        <h2 className="text-xl font-black tracking-tight text-white mb-1">
          {recipient.fullName}
        </h2>
        <p className="text-xs text-zinc-400 font-medium mb-3">
          {recipient.username ? `@${recipient.username}` : 'Direct Link Member'}
        </p>

        {/* Dynamic Connected Clock */}
        <div className="h-6 flex items-center justify-center">
          <span className="text-xs tracking-wider bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-zinc-300 font-black">
            {callStatus.startsWith('Connected') ? formatTime(duration) : callStatus}
          </span>
        </div>

        {/* Dynamic Holographic Audio Bars */}
        <div className="flex items-end justify-center gap-[3px] h-12 mt-6 w-full max-w-xs">
          {bars.map((i) => {
            const h = Math.abs(Math.sin((i + duration * 1.5)) * 100);
            return (
              <motion.div 
                key={i}
                className="w-1.5 rounded-t bg-gradient-to-t from-indigo-500 to-indigo-300"
                animate={{ height: `${Math.max(4, h * 0.42)}px` }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  ease: 'easeInOut',
                  repeatType: 'reverse'
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Terminal logs section */}
      <div className="bg-black/40 border border-zinc-900 p-3.5 rounded-2xl mb-6 z-10 font-mono text-[9px] text-zinc-400 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
        <div className="text-zinc-500 font-black text-[8px] uppercase tracking-wider mb-1 flex items-center gap-1 border-b border-zinc-900 pb-1">
          <Server size={10} /> Live Telemetry Output
        </div>
        {logs.map((log, idx) => (
          <div key={idx} className="truncate">
            {log}
          </div>
        ))}
        {callStatus.startsWith('Connected') && (
          <div className="text-emerald-400 animate-pulse">
            [CONN] Active Voice Session key verification signature OK.
          </div>
        )}
      </div>

      {/* Control Actions Panel */}
      <div className="grid grid-cols-3 gap-4 pb-4 z-10">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all cursor-pointer ${isMuted ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          <span className="text-[9px] font-bold uppercase tracking-wider">Mute</span>
        </button>

        <button 
          onClick={handleDisconnect}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 border border-rose-500/20 text-white shadow-lg shadow-rose-950/50 scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <PhoneOff size={20} />
          <span className="text-[9px] font-black uppercase tracking-wider">End Link</span>
        </button>

        <button 
          onClick={() => setIsSpeaker(!isSpeaker)}
          className={`flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border transition-all cursor-pointer ${isSpeaker ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}
        >
          {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
          <span className="text-[9px] font-bold uppercase tracking-wider">Speaker</span>
        </button>
      </div>
    </div>
  );
};
