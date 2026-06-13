import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { useCall } from '../../providers/CallProvider';

import { CallStatus, CallType } from './types/callTypes';
import { CallHeader } from './components/CallHeader';
import { CallControlPanel } from './components/CallControlPanel';
import { VideoFeed } from './components/VideoFeed';

export default function CallScreen() {
  const { id: otherUserId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  
  const {
    activeCall,
    localStream,
    remoteStream,
    timer,
    isMuted,
    isVideoOff,
    speakerState,
    isScreenSharing,
    initiateCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
    flipCamera,
    stopSounds
  } = useCall();
  
  const queryParams = new URLSearchParams(location.search);
  const type = (queryParams.get('type') || 'voice') as CallType; 
  const isReceiver = queryParams.get('role') === 'receiver';

  const [receiver, setReceiver] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Retrieve recipient details from database as fallback if needed
  useEffect(() => {
    if (!supabase || !otherUserId) return;
    supabase
      .from('users')
      .select('*')
      .eq('id', otherUserId)
      .single()
      .then(({ data }) => {
        if (data) setReceiver(data);
      })
      .catch(e => console.warn("Error fetching calling recipient details:", e));
  }, [otherUserId]);

  // Initiate call if we are the caller and no active call exists
  useEffect(() => {
    if (!isReceiver && otherUserId && !activeCall) {
      initiateCall(otherUserId, type);
    }
  }, [isReceiver, otherUserId, activeCall, initiateCall, type]);

  // Ultra-reliable continuous polling and synchronization safeguard to bypass React parent/child mount delays
  useEffect(() => {
    const syncStreamTracks = () => {
      const localEl = localVideoRef.current;
      const remoteEl = remoteVideoRef.current;

      if (localEl && localStream) {
        if (localEl.srcObject !== localStream) {
          localEl.srcObject = localStream;
        }
        if (localEl.paused) {
          localEl.play().catch(() => {});
        }
      } else if (localEl && !localStream) {
        localEl.srcObject = null;
      }

      if (remoteEl && remoteStream) {
        if (remoteEl.srcObject !== remoteStream) {
          remoteEl.srcObject = remoteStream;
        }
        if (remoteEl.paused) {
          remoteEl.play().catch(err => {
            console.warn("[WebRTC] Remote stream auto playback blocked:", err);
          });
        }
        
        // Ensure volume matches speakerState cleanly
        if (speakerState === 0) {
          remoteEl.volume = 0;
          remoteEl.muted = true;
        } else if (speakerState === 1) {
          remoteEl.volume = 0.25;
          remoteEl.muted = false;
        } else {
          remoteEl.volume = 1.0;
          remoteEl.muted = false;
        }
      } else if (remoteEl && !remoteStream) {
        remoteEl.srcObject = null;
      }
    };

    syncStreamTracks();
    const interval = setInterval(syncStreamTracks, 500);
    return () => clearInterval(interval);
  }, [localStream, remoteStream, speakerState]);

  // Global touch & tap recovery listener to bypass modern mobile browser autoplay constraints
  useEffect(() => {
    const forcePlayback = () => {
      console.log("[WebRTC Gesture Recovery] Triggering safe manual play on user interaction...");
      const localEl = localVideoRef.current;
      const remoteEl = remoteVideoRef.current;

      if (localEl && localStream && localEl.paused) {
        localEl.play().catch(() => {});
      }
      if (remoteEl && remoteStream && remoteEl.paused) {
        remoteEl.play().then(() => {
          console.log("[WebRTC Gesture Recovery] Remote audio/video started successfully!");
        }).catch(e => console.warn("[WebRTC Gesture Recovery] Remote play failed:", e));
      }
    };

    window.addEventListener('click', forcePlayback, { passive: true });
    window.addEventListener('touchstart', forcePlayback, { passive: true });
    window.addEventListener('pointerdown', forcePlayback, { passive: true });

    return () => {
      window.removeEventListener('click', forcePlayback);
      window.removeEventListener('touchstart', forcePlayback);
      window.removeEventListener('pointerdown', forcePlayback);
    };
  }, [localStream, remoteStream]);

  const handleBack = () => {
    // Instead of terminating the call on back button, we navigate to /chats.
    // The call keeps running in the background and activates the top bar indicator.
    navigate('/chats');
  };

  const handleEndCall = () => {
    endCall();
    navigate('/chats', { replace: true });
  };

  // Safe navigation if call is closed or failed
  useEffect(() => {
    // If we are on the call screen but there is no active call, return to chats after a brief delay
    if (!activeCall) {
      const t = setTimeout(() => {
        navigate('/chats', { replace: true });
      }, 800);
      return () => clearTimeout(t);
    }

    if (activeCall && ['ended', 'denied', 'offline', 'error', 'rejected'].includes(activeCall.status)) {
      const t = setTimeout(() => {
        navigate('/chats', { replace: true });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [activeCall, navigate]);

  const currentStatus = activeCall?.status || 'connecting';
  const partnerUser = activeCall?.receiver || receiver;

  // Volume controls are now consolidated under the remote stream handler above

  return (
    <div className="absolute inset-0 z-[100] bg-[var(--bg-main)] flex flex-col items-center justify-between text-[var(--text-primary)] font-sans overflow-hidden select-none animate-fade-in">
      {/* Video Streams */}
      {type === 'video' && (
        <VideoFeed 
          localVideoRef={localVideoRef}
          remoteVideoRef={remoteVideoRef}
          isVideoOff={isVideoOff}
          callStatus={currentStatus}
          timer={timer}
        />
      )}

      {/* Invisible HTMLMediaElement to handle stream sink for pure voice calls */}
      {type === 'voice' && (
        <video
          ref={remoteVideoRef as any}
          autoPlay
          className="pointer-events-none opacity-0 absolute w-[1px] h-[1px] -z-50"
          playsInline
        />
      )}

      {/* Profile Details header */}
      <CallHeader 
        receiver={partnerUser}
        callStatus={currentStatus}
        timer={timer}
        type={type}
        onBack={handleBack}
        onFlipCamera={flipCamera}
      />

      {/* Embedded/Sticky Bottom control panel which matches WhatsApp aesthetics */}
      <CallControlPanel 
        type={type}
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        speakerState={speakerState}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onToggleSpeaker={toggleSpeaker}
        onToggleScreenShare={toggleScreenShare}
        onEndCall={handleEndCall}
      />
    </div>
  );
}
