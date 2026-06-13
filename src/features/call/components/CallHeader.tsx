import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Shield, Video, ArrowLeft, UserPlus, RotateCw } from 'lucide-react';
import { CallStatus, CallType } from '../types/callTypes';
import { CallTimer } from './CallTimer';

interface CallHeaderProps {
  receiver: any;
  callStatus: CallStatus;
  timer: number;
  type: CallType;
  onBack?: () => void;
  onFlipCamera?: () => void;
}

export const CallHeader: React.FC<CallHeaderProps> = ({
  receiver,
  callStatus,
  timer,
  type,
  onBack,
  onFlipCamera,
}) => {
  const getSubText = () => {
    switch (callStatus) {
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Calling...';
      case 'connected':
        return 'Connected';
      case 'offline':
        return 'Offline';
      case 'ended':
        return 'Call Ended';
      case 'error':
        return 'Error Connecting';
      default:
        return 'Connecting...';
    }
  };

  return (
    <div className="relative z-10 w-full flex-1 flex flex-col justify-between">
      {/* 1. Header Navigation Bar - Generous top padding for an elegant Android look & alignment */}
      <div className="w-full bg-transparent pt-10 pb-4 select-none shrink-0 relative">
        <div className="max-w-xl mx-auto w-full px-6 flex items-center justify-between">
          {/* Left Side: Back action and user name placed next to it */}
          <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
            <button 
              type="button"
              onClick={onBack} 
              className="w-[52px] h-[52px] rounded-full border border-[var(--border-color)]/30 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#0494f4] hover:border-[#0494f4] transition-all flex items-center justify-center active:scale-95 cursor-pointer shadow-sm shrink-0"
              title="Go Back"
            >
              <ArrowLeft size={20} strokeWidth={2.2} />
            </button>
            
            <div className="min-w-0">
              <h1 className="text-[15px] md:text-[17px] font-black text-[var(--text-primary)] leading-tight truncate uppercase tracking-widest drop-shadow-sm select-none">
                {receiver?.fullName || receiver?.full_name || receiver?.username || 'GrixChat User'}
              </h1>
            </div>
          </div>

          {/* Right Side: Camera Flip button if type is video */}
          <div className="flex items-center shrink-0">
            {type === 'video' && onFlipCamera ? (
              <button 
                type="button"
                onClick={onFlipCamera}
                className="w-[52px] h-[52px] rounded-full border border-[var(--border-color)]/30 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#0494f4] hover:border-[#0494f4] transition-all flex items-center justify-center active:scale-95 cursor-pointer shadow-sm"
                title="Flip Camera"
              >
                <RotateCw size={20} strokeWidth={2.2} />
              </button>
            ) : (
              <div className="w-[52px] h-[52px] shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Calling Card (Avatar & Status Tracking) */}
      <div className="flex-1 flex flex-col items-center justify-center text-center w-full px-4 py-2 md:py-4">
        {/* On Voice/Audio call, we display a beautiful huge avatar with WhatsApp pulsing visual rings */}
        {type === 'voice' && (
          <div className="relative my-4 md:my-8 flex items-center justify-center scale-90 md:scale-100">
            {/* Ambient Concentric Pulsing Ripples */}
            {callStatus === 'connected' && (
              <>
                <div className="absolute w-[180px] h-[180px] rounded-full border border-[#0494f4]/30 animate-pulse scale-[1.1] opacity-60"></div>
                <div className="absolute w-[240px] h-[240px] rounded-full border border-[#0494f4]/15 animate-pulse scale-[1.3] opacity-35"></div>
                <div className="absolute w-[300px] h-[300px] rounded-full border border-[#0494f4]/5 animate-pulse scale-[1.5] opacity-25"></div>
              </>
            )}
            
            {/* Ringing/Calling dynamic active pulses */}
            {(callStatus === 'ringing' || callStatus === 'connecting') && (
              <>
                <div className="absolute w-[180px] h-[180px] rounded-full bg-[#0494f4]/10 animate-ping opacity-50"></div>
                <div className="absolute w-[245px] h-[245px] rounded-full border border-white/5 animate-pulse scale-[1.2] opacity-30"></div>
              </>
            )}

            {/* Main Avatar Frame */}
            <div className={`w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 ${
              callStatus === 'connected' ? 'border-[#0494f4] shadow-[0_0_40px_rgba(4,148,244,0.25)]' : 'border-[var(--border-color)]/40 shadow-2xl'
            } transition-all duration-700 hover:scale-105 relative z-10 p-0 flex items-center justify-center`}>
              <img 
                src={receiver?.photoURL || receiver?.photo_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                className="w-full h-full object-cover"
                alt={receiver?.fullName || receiver?.full_name || 'GrixChat User'}
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {/* Dynamic status under the avatar */}
        <div className="relative z-10 flex flex-col items-center mt-1 md:mt-2">
          {/* Connection status tracker badge */}
          <div className="bg-[var(--bg-card)]/80 backdrop-blur-md px-4 py-1.5 md:px-5 md:py-2 rounded-2xl border border-[var(--border-color)]/20 flex items-center gap-2 shadow-md">
            <span className={`w-2 h-2 rounded-full ${
              callStatus === 'connected' 
                ? 'bg-[#0494f4]' 
                : callStatus === 'ringing' 
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-zinc-500 animate-pulse'
            }`}></span>
            
            <span className="text-[10px] md:text-[11px] font-black uppercase text-[var(--text-primary)] tracking-wider">
              {getSubText()}
            </span>
            
            {callStatus === 'connected' && (
              <>
                <div className="w-[1px] h-3 bg-[var(--border-color)]/40" />
                <CallTimer seconds={timer} className="text-[#0494f4] font-black text-xs" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallHeader;
