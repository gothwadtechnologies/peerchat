import React from 'react';
import { motion } from 'motion/react';
import { VideoOff } from 'lucide-react';
import { CallStatus } from '../types/callTypes';
import { CallTimer } from './CallTimer';

interface VideoFeedProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  isVideoOff: boolean;
  callStatus: CallStatus;
  timer: number;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({
  localVideoRef,
  remoteVideoRef,
  isVideoOff,
  callStatus,
  timer,
}) => {
  return (
    <div className="absolute inset-0 z-0 bg-black">
      <video 
        ref={remoteVideoRef as any} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      
      {/* Local Video Overlay (Pip) */}
      <motion.div 
        drag
        dragMomentum={false}
        dragConstraints={{ left: -200, right: 200, top: -400, bottom: 400 }}
        className="absolute top-[80px] md:top-[100px] right-4 w-28 h-40 md:w-32 md:h-48 bg-zinc-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl z-20 cursor-move"
      >
        <video 
          ref={localVideoRef as any} 
          autoPlay 
          playsInline 
          muted 
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : 'block'}`}
        />
        {isVideoOff && (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900">
            <VideoOff size={24} className="text-zinc-650" />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoFeed;
