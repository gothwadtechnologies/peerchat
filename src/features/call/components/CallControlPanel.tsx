import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone,
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Volume1,
  Volume2, 
  VolumeX,
  UserPlus,
  RotateCw,
  Sparkles,
  Zap,
  Check,
  ShieldAlert,
  Sliders,
  AudioLines,
  ScreenShare
} from 'lucide-react';
import { CallType } from '../types/callTypes';

interface CallControlPanelProps {
  type: CallType;
  isMuted: boolean;
  isVideoOff: boolean;
  speakerState: number; // 0 = mute, 1 = earpiece, 2 = loudspeaker
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
}

export const CallControlPanel: React.FC<CallControlPanelProps> = ({
  type,
  isMuted,
  isVideoOff,
  speakerState,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onToggleScreenShare,
  onEndCall,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [hdActive, setHdActive] = useState(false);
  const [vocalFilter, setVocalFilter] = useState('Default Voice');
  const [cameraFlipped, setCameraFlipped] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  const displayNotification = (text: string) => {
    setStatusNotification(text);
    setTimeout(() => {
      setStatusNotification(null);
    }, 2000);
  };

  const handleToggleHD = () => {
    setHdActive(prev => !prev);
    displayNotification(!hdActive ? "HD High-Fidelity Audio Active" : "Standard Audio Active");
  };

  const handleFlipCamera = () => {
    setCameraFlipped(prev => !prev);
    displayNotification(cameraFlipped ? "Switched to Front Camera" : "Switched to Rear Camera");
  };

  const handleSetVocalFilter = (filter: string) => {
    setVocalFilter(filter);
    displayNotification(`Voice filter set to: ${filter}`);
  };

  return (
    <div className="w-full bg-transparent border-none select-none relative z-50 mt-auto shrink-0 pb-5 md:pb-10 pt-2.2 md:pt-4">
      
      {/* Dynamic Floating Quick Feedback Toast inside the call screen */}
      <AnimatePresence>
        {statusNotification && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-[#0494f4] text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-lg border border-[#0494f4]/20 z-[60]"
          >
            {statusNotification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bar Button Layout */}
      <div className="max-w-xl mx-auto px-6 flex items-center justify-around">
        {/* 1. SPEAKER toggle (3-state: 0 = voice muted, 1 = earpiece, 2 = loudspeaker) */}
        <button 
          onClick={onToggleSpeaker}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            speakerState === 0
              ? 'border border-[#ff3b30]/40 bg-[var(--bg-card)] text-[#ff3b30] hover:bg-[#ff3b30]/5'
              : speakerState === 1
                ? 'border border-[var(--border-color)]/30 bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[#0494f4] hover:text-[#0494f4]'
                : 'bg-[#0494f4] text-white shadow-lg shadow-[#0494f4]/20 border-none'
          }`}
          title={
            speakerState === 0 
              ? "Speaker: Muted" 
              : speakerState === 1 
                ? "Speaker: Earpiece mode" 
                : "Speaker: Loudspeaker mode"
          }
        >
          {speakerState === 0 ? (
            <VolumeX size={20} strokeWidth={2.2} />
          ) : (
            <Volume2 size={20} strokeWidth={2.2} />
          )}
        </button>

        {/* 2. VIDEO toggle */}
        <button 
          onClick={onToggleVideo}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            !isVideoOff 
              ? 'bg-[#0494f4] text-white shadow-lg shadow-[#0494f4]/20 border-none' 
              : 'border border-[#ff3b30]/40 bg-[var(--bg-card)] text-[#ff3b30] hover:bg-[#ff3b30]/5'
          }`}
          title={!isVideoOff ? "Turn Video Off" : "Turn Video On"}
        >
          {!isVideoOff ? <Video size={20} strokeWidth={2.2} /> : <VideoOff size={20} strokeWidth={2.2} />}
        </button>

        {/* 3. MIC toggle */}
        <button 
          onClick={onToggleMute}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            !isMuted 
              ? 'bg-[#0494f4] text-white shadow-lg shadow-[#0494f4]/20 border-none' 
              : 'border border-[#ff3b30]/40 bg-[var(--bg-card)] text-[#ff3b30] hover:bg-[#ff3b30]/5'
          }`}
          title={!isMuted ? "Mute Microphone" : "Unmute Microphone"}
        >
          {!isMuted ? <Mic size={20} strokeWidth={2.2} /> : <MicOff size={20} strokeWidth={2.2} />}
        </button>

        {/* 4. RED CUT/END CALL button */}
        <button 
          onClick={onEndCall}
          className="w-[52px] h-[52px] bg-[#ff3b30] hover:bg-[#e03126] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#ff3b30]/20 transition-all active:scale-95 border-none cursor-pointer"
          title="End Call"
        >
          <Phone size={20} strokeWidth={2.5} className="rotate-[135deg]" />
        </button>

        {/* 5. ADD USER / OPTIONS toggle */}
        <button 
          onClick={() => setShowMoreMenu(prev => !prev)}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
            showMoreMenu 
              ? 'bg-[#0494f4] text-white shadow-lg shadow-[#0494f4]/20 border-none' 
              : 'border border-[var(--border-color)]/30 bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[#0494f4] hover:border-[#0494f4]'
          }`}
          title="More Options / Add User"
        >
          <UserPlus size={20} strokeWidth={2.2} />
        </button>
      </div>

      {/* WhatsApp clone slide-up bottom drawer menu */}
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop click-away trigger */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            />
            
            {/* Content box of the bottom drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)]/20 rounded-t-[2rem] px-6 py-6 pb-12 z-50 max-w-2xl mx-auto shadow-[0_-15px_40px_rgba(0,0,0,0.15)]"
            >
              {/* Header drag line indicator */}
              <div className="w-12 h-1.5 bg-[var(--border-color)]/60 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowMoreMenu(false)} />
              
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[17px] font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Sliders size={18} className="text-[#0494f4]" />
                  <span>Call Operations</span>
                </h3>
                <span className="text-[10px] bg-[#0494f4]/15 text-[#0494f4] border border-[#0494f4]/25 px-2.5 py-0.5 rounded-full font-black tracking-widest uppercase">
                  ACTIVE TUNNEL
                </span>
              </div>

              {/* Grid of Interactive Actions */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Switch Camera */}
                <div 
                  onClick={handleFlipCamera}
                  className="bg-[var(--box-bg)] hover:bg-[var(--border-color)]/20 p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-[90px] border border-[var(--border-color)]/10 active:scale-[0.98]"
                >
                  <RotateCw size={18} className="text-[#0494f4]" />
                  <div>
                    <h4 className="text-[13px] font-extrabold text-[var(--text-primary)] leading-tight">Switch Camera</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] font-bold mt-0.5">Flip feed orientation</p>
                  </div>
                </div>

                {/* HD Stream */}
                <div 
                  onClick={handleToggleHD}
                  className={`p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-[90px] border active:scale-[0.98] ${
                    hdActive 
                      ? 'bg-[#0494f4]/15 border-[#0494f4] text-[#0494f4]' 
                      : 'bg-[var(--box-bg)] hover:bg-[var(--border-color)]/20 border-[var(--border-color)]/10 text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <Zap size={18} className={hdActive ? 'text-[#0494f4]' : 'text-[var(--text-secondary)]'} />
                    {hdActive && <Check size={14} className="text-[#0494f4] stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold leading-tight">HD Video Calling</h4>
                    <p className={`text-[10px] font-bold mt-0.5 ${hdActive ? 'text-[#0494f4]' : 'text-[var(--text-secondary)]'}`}>
                      {hdActive ? 'Premium HD Active' : 'Toggle extra bandwidth'}
                    </p>
                  </div>
                </div>

                {/* Share Screen */}
                <div 
                  onClick={() => {
                    onToggleScreenShare();
                    displayNotification(!isScreenSharing ? "Screen sharing initiated" : "Screen sharing stopped");
                  }}
                  className={`p-4 rounded-2xl cursor-pointer col-span-2 transition-all flex flex-col justify-between h-[90px] border active:scale-[0.98] ${
                    isScreenSharing 
                      ? 'bg-amber-500/15 border-amber-500 text-amber-500 shadow-md' 
                      : 'bg-[var(--box-bg)] hover:bg-[var(--border-color)]/20 border-[var(--border-color)]/10 text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <ScreenShare size={18} className={isScreenSharing ? 'text-amber-500' : 'text-[#0494f4]'} />
                    {isScreenSharing && <Check size={14} className="text-amber-500 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold leading-tight">Share Your Screen</h4>
                    <p className={`text-[10px] font-bold mt-0.5 ${isScreenSharing ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`}>
                      {isScreenSharing ? 'Screen sharing is currently active' : 'Cast your desktop or select screen'}
                    </p>
                  </div>
                </div>

                {/* Voice Effects */}
                <div 
                  className="bg-[var(--box-bg)] col-span-2 p-4 rounded-2xl border border-[var(--border-color)]/10"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AudioLines size={18} className="text-[#0494f4]" />
                    <h4 className="text-[13px] font-extrabold text-[var(--text-primary)]">Active Vocal Equalizer</h4>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {['Default Voice', 'Studio Filter', 'Ambient Clear', 'Vocal Boost'].map((filterName) => (
                      <button
                        key={filterName}
                        onClick={() => handleSetVocalFilter(filterName)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider shrink-0 transition-all border-none ${
                          vocalFilter === filterName
                            ? 'bg-[#0494f4] text-white shadow-md'
                            : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]/25 hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {filterName}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Safety Encrypted Label */}
              <div className="mt-6 pt-4 border-t border-[var(--border-color)]/10 flex items-center justify-center gap-2 text-[10px] font-bold text-center text-[var(--text-secondary)]">
                <Sparkles size={12} className="text-[#0494f4]" />
                <span className="uppercase tracking-[0.2em] text-[#0494f4]">GrixChat Secure Encryption Line</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CallControlPanel;
