import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Phone, PhoneOff, Video, Volume2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CallStatus, CallType } from '../features/call/types/callTypes';

// Highly-polished Web Audio API sound designer for native-like offline-resilient calling sounds
class PhoneRingtones {
  private static audioCtx: AudioContext | null = null;
  private static ringInterval: any = null;

  static playRingtone() {
    this.stop();
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Elegant dual-frequency telephone ring cadences with ambient secondary harmonic harmonics
      const ringPattern = () => {
        const now = ctx.currentTime;
        
        // Main standard frequencies for high-fidelity ringers
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.linearRampToValueAtTime(450, now + 0.1);
        osc1.frequency.linearRampToValueAtTime(400, now + 0.5);
        osc1.frequency.linearRampToValueAtTime(450, now + 0.9);
        osc1.frequency.linearRampToValueAtTime(400, now + 1.3);

        osc2.frequency.setValueAtTime(480, now);
        osc2.frequency.linearRampToValueAtTime(520, now + 0.2);
        osc2.frequency.linearRampToValueAtTime(480, now + 0.6);
        osc2.frequency.linearRampToValueAtTime(520, now + 1.0);

        // Professional envelope 1.8s active state, 2.2s dead state
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + 1.0);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 1.7);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.85);
        osc2.stop(now + 1.85);
      };

      ringPattern();
      this.ringInterval = setInterval(() => {
        ringPattern();
      }, 4000);
    } catch (e) {
      console.warn('Ringtone failed to generate:', e);
    }
  }

  static playOutgoingBeep() {
    this.stop();
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = this.audioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const beepPattern = () => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(425, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
        gain.gain.setValueAtTime(0.05, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.30);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.35);
      };

      beepPattern();
      this.ringInterval = setInterval(() => {
        beepPattern();
      }, 4000);
    } catch (e) {
      console.warn('Outgoing tone generation failed:', e);
    }
  }

  static stop() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

interface ActiveCallState {
  id: string; // db call id
  otherUserId: string;
  type: CallType;
  role: 'caller' | 'receiver';
  status: CallStatus;
  receiver: any; // user profile details
}

interface CallContextType {
  incomingCall: any | null;
  caller: any | null;
  activeCall: ActiveCallState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  timer: number;
  isMuted: boolean;
  isVideoOff: boolean;
  speakerState: number; // 0=muted, 1=earpiece, 2=loudspeaker
  isScreenSharing: boolean;
  setIsVideoOff: React.Dispatch<React.SetStateAction<boolean>>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  initiateCall: (otherUserId: string, callType: 'voice' | 'video') => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => Promise<void>;
  flipCamera: () => Promise<void>;
  playOutgoingBeep: () => void;
  stopSounds: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  // Basic incoming states
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [caller, setCaller] = useState<any>(null);

  // Advanced WebRTC state
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [speakerState, setSpeakerState] = useState(2); // 0=muted, 1=earpiece, 2=loudspeaker
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // WebRTC internal refs
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const activeCallChannelRef = useRef<any>(null);
  const initiatingCallRef = useRef<boolean>(false);

  // Reset sounds on status change
  useEffect(() => {
    if (activeCall && ['connected', 'ended', 'denied', 'error', 'offline'].includes(activeCall.status)) {
      PhoneRingtones.stop();
    }
  }, [activeCall?.status]);

  // Defensive Auto-reconciliation of stale zombie calls matching current user
  useEffect(() => {
    if (!authUser || !supabase) return;

    const cleanupStaleZombieCalls = async () => {
      try {
        const thresholdDate = new Date(Date.now() - 40000).toISOString();
        
        // Find existing ringing calls where the user was a caller/receiver and they have timed out
        const { data: staleCalls } = await supabase
          .from('calls')
          .select('id')
          .eq('status', 'ringing')
          .or(`caller_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
          .lt('created_at', thresholdDate);

        if (staleCalls && staleCalls.length > 0) {
          const ids = staleCalls.map(c => c.id);
          console.log("[Call System] Auto-cleaning stale zombie calls: ", ids);
          await supabase
            .from('calls')
            .update({ status: 'ended' } as any)
            .in('id', ids);
        }
      } catch (err) {
        console.warn("[Call System] Auto zombie cleanup error:", err);
      }
    };

    cleanupStaleZombieCalls();
    
    // Periodically sweep every 30 seconds to prevent lingering items on this session
    const timer = setInterval(cleanupStaleZombieCalls, 30000);
    return () => clearInterval(timer);
  }, [authUser?.id]);

  // Handle active call duration timer
  useEffect(() => {
    let interval: any;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeCall?.status]);

  // Insert chat room logs dynamically
  const addLoggingMessage = async (status: 'started' | 'ended' | 'missed', cid: string, partnerId: string, callType: CallType) => {
    if (!authUser || !partnerId || !supabase) return;
    try {
      const { data: convId } = await supabase.rpc('get_direct_conversation_id', { u1: authUser.id, u2: partnerId });
      let finalConvId = convId;

      if (!finalConvId) {
        const generatedId = crypto.randomUUID();
        const { error } = await supabase.from('conversations').insert({ id: generatedId, type: 'direct' } as any);
        if (!error) {
          await supabase.from('conversation_participants').insert([
            { conversation_id: generatedId, user_id: authUser.id },
            { conversation_id: generatedId, user_id: partnerId }
          ]);
          finalConvId = generatedId;
        }
      }

      if (finalConvId) {
        const textMessage = status === 'started' ? `📞 Started a ${callType} call` : 
                     status === 'missed' ? `📥 Missed ${callType} call` : 
                     `🏁 ${callType.charAt(0).toUpperCase() + callType.slice(1)} call ended`;
        
        await supabase.from('messages').insert({
          conversation_id: finalConvId,
          sender_id: authUser.id,
          text: textMessage,
          media_type: 'system'
        } as any);
      }
    } catch (e) {
      console.warn("Error adding call logging message:", e);
    }
  };

  // Helper local shutdown
  const handleEndCallLocally = () => {
    // 1. Stop screensharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (err) {}
      });
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // 2. Stop local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
          track.enabled = false;
        } catch (err) {}
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // 3. Clear PeerConnection
    if (pcRef.current) {
      if (pcRef.current.signalingState !== 'closed') {
        try {
          pcRef.current.close();
        } catch (err) {}
      }
      pcRef.current = null;
    }
    setRemoteStream(null);

    // 4. Remove active real-time channel
    if (activeCallChannelRef.current) {
      try {
        supabase.removeChannel(activeCallChannelRef.current);
      } catch (err) {}
      activeCallChannelRef.current = null;
    }

    pendingCandidatesRef.current = [];
    PhoneRingtones.stop();
    setActiveCall(null);
    setIncomingCall(null);
    setCaller(null);
    setTimer(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setSpeakerState(2);
  };

  // Monitor incoming calls for the logged-in user
  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchIncomingCall = async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*, users:users!calls_caller_id_fkey (username, photo_url, full_name)')
        .eq('receiver_id', authUser.id)
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const callData = data[0];
        // Ensure call is created within last 30 seconds to avoid stale rings
        const callAgeMs = new Date().getTime() - new Date(callData.created_at).getTime();
        if (callAgeMs < 30000) {
          setIncomingCall(callData);
          setCaller({
            id: callData.caller_id,
            userName: callData.users?.username,
            fullName: callData.users?.full_name,
            photoURL: callData.users?.photo_url
          });
          
          PhoneRingtones.playRingtone();
          if (navigator.vibrate) {
            navigator.vibrate([400, 300, 400, 300, 400]);
          }
        } else {
          // Explicit cleanup for stale, unanswered rings fetched from database
          setIncomingCall(null);
          setCaller(null);
          PhoneRingtones.stop();
        }
      } else {
        setIncomingCall(null);
        setCaller(null);
        PhoneRingtones.stop();
      }
    };

    fetchIncomingCall();

    const channel = supabase
      .channel(`calls-for-${authUser.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'calls', 
        filter: `receiver_id=eq.${authUser.id}` 
      }, (payload: any) => {
        const eventType = payload.eventType;
        const currentData = payload.new as any;

        if (eventType === 'DELETE') {
          // If the calling row is strictly deleted, clean up immediately
          setIncomingCall(null);
          setCaller(null);
          PhoneRingtones.stop();
          return;
        }

        if (currentData) {
          if (['ended', 'rejected', 'denied', 'accepted'].includes(currentData.status)) {
            // Strictly close incoming calls if updated to non-ringing status
            setIncomingCall(null);
            setCaller(null);
            PhoneRingtones.stop();
          } else if (currentData.status === 'ringing') {
            // Trigger rings only when status is strictly ringing
            fetchIncomingCall();
          }
        } else {
          // Fallback check
          fetchIncomingCall();
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      PhoneRingtones.stop();
    };
  }, [authUser]);

  // RECEIVER accepting call
  const acceptCall = async () => {
    if (!incomingCall || !authUser || !supabase) return;

    PhoneRingtones.stop();
    const cid = incomingCall.id;
    const otherUserId = incomingCall.caller_id;
    const callType = (incomingCall.type === 'audio' ? 'voice' : incomingCall.type) as CallType;

    // 1. Fetch caller profile
    let callerProfile: any = null;
    try {
      const { data } = await supabase.from('users').select('*').eq('id', otherUserId).single();
      callerProfile = data;
    } catch (e) {
      console.warn("Error fetching caller profile details:", e);
    }

    // Set initial receiver call state
    const initialCall: ActiveCallState = {
      id: cid,
      otherUserId,
      type: callType,
      role: 'receiver',
      status: 'connecting',
      receiver: callerProfile,
    };
    setActiveCall(initialCall);
    setIncomingCall(null);
    setCaller(null);
    setIsVideoOff(callType === 'voice');

    // Navigate to call screen immediately
    navigate(`/call/${otherUserId}?type=${callType}&role=receiver&callId=${cid}`);

    // 2. Setup RTCPeerConnection & Media Streams
    try {
      pcRef.current = new RTCPeerConnection(servers);

      remoteStreamRef.current = new MediaStream();
      setRemoteStream(remoteStreamRef.current);

      pcRef.current.ontrack = (event) => {
        console.log("[WebRTC Receiver] Remote track received:", event.track.kind);
        
        let incomingStream = event.streams[0];
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        
        if (incomingStream) {
          incomingStream.getTracks().forEach(track => {
            if (remoteStreamRef.current && !remoteStreamRef.current.getTracks().some(t => t.id === track.id)) {
              remoteStreamRef.current.addTrack(track);
            }
          });
        } else {
          if (!remoteStreamRef.current.getTracks().some(t => t.id === event.track.id)) {
            remoteStreamRef.current.addTrack(event.track);
          }
        }
        
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        setActiveCall(prev => {
          if (prev && prev.status !== 'connected') {
            return { ...prev, status: 'connected' };
          }
          return prev;
        });
      };

      pcRef.current.oniceconnectionstatechange = () => {
        if (!pcRef.current) return;
        const state = pcRef.current.iceConnectionState;
        if (state === 'disconnected' || state === 'failed') {
          handleEndCallLocally();
        }
      };

      // Extract native media devices feed
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        });
        localStreamRef.current = stream;
        setLocalStream(stream);

        stream.getTracks().forEach((track) => {
          pcRef.current?.addTrack(track, stream!);
        });
      } catch (err) {
        console.warn("[WebRTC Receiver] Media capture failed, continuing audio only / empty stream:", err);
      }

      // Candidate handling
      pcRef.current.onicecandidate = async (event) => {
        if (event.candidate && supabase) {
          try {
            await supabase.from('call_candidates').insert({
              call_id: cid,
              user_id: authUser.id,
              candidate: event.candidate.toJSON(),
              type: 'answer'
            } as any);
          } catch (e) {
            console.error("Error creating candidate insertion:", e);
          }
        }
      };

      // Apply incoming offer definition
      const { data: dbCall } = await supabase.from('calls').select('*').eq('id', cid).single();
      if (!dbCall || !dbCall.offer) {
        console.error("[WebRTC Receiver] DB Offer description has not been fully propagated.");
        setActiveCall(prev => prev ? { ...prev, status: 'error' } : null);
        return;
      }

      await pcRef.current.setRemoteDescription(new RTCSessionDescription(dbCall.offer));

      // Generate local answer SDP
      const answerDescription = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answerDescription);

      // Save answer back to signaling table and set accepted
      await supabase.from('calls').update({
        answer: { type: answerDescription.type, sdp: answerDescription.sdp },
        status: 'accepted'
      } as any).eq('id', cid);

      await addLoggingMessage('started', cid, otherUserId, callType);
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);

      // Fetch pre-existing candidates (offer candidates generated by caller) to avoid race conditions
      try {
        const { data: existingCandidates } = await supabase
          .from('call_candidates')
          .select('*')
          .eq('call_id', cid)
          .neq('user_id', authUser.id);

        if (existingCandidates && existingCandidates.length > 0) {
          console.log("[WebRTC Receiver] Fetching pre-existing offer candidates:", existingCandidates.length);
          for (const cand of existingCandidates) {
            const candidateObj = cand.candidate as RTCIceCandidateInit;
            try {
              if (pcRef.current) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateObj));
              }
            } catch (iceErr) {
              console.warn("[WebRTC Receiver] Failed to add pre-existing candidate:", iceErr);
            }
          }
        }
      } catch (err) {
        console.warn("[WebRTC Receiver] Error fetching pre-existing candidates:", err);
      }

      // Establish listening channels
      const callChannel = supabase
        .channel(`call-active-${cid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${cid}` }, (payload) => {
          const data = payload.new as any;
          if (!data) return;

          if (data.status === 'ended' || data.status === 'denied' || data.status === 'rejected') {
            setActiveCall(prev => prev ? { ...prev, status: data.status as any } : null);
            handleEndCallLocally();
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_candidates', filter: `call_id=eq.${cid}` }, (payload) => {
          const data = payload.new as any;
          if (data.user_id === authUser.id) return;

          const candidate = data.candidate as RTCIceCandidateInit;
          if (pcRef.current && pcRef.current.currentRemoteDescription) {
            pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding remote candidate:", e));
          } else {
            pendingCandidatesRef.current.push(candidate);
          }
        })
        .subscribe();

      activeCallChannelRef.current = callChannel;

    } catch (e) {
      console.error("[WebRTC Receiver] Setup error:", e);
      setActiveCall(prev => prev ? { ...prev, status: 'error' } : null);
    }
  };

  // RECEIVER rejecting call
  const rejectCall = async () => {
    if (incomingCall && supabase) {
      PhoneRingtones.stop();
      const cid = incomingCall.id;
      const otherUserId = incomingCall.caller_id;
      const callType = (incomingCall.type === 'audio' ? 'voice' : incomingCall.type) as CallType;

      try {
        await supabase
          .from('calls')
          .update({ status: 'rejected', is_missed: true } as any)
          .eq('id', cid);

        await addLoggingMessage('missed', cid, otherUserId, callType);
      } catch (e) {
        console.warn('Error rejecting call in database:', e);
      }

      setIncomingCall(null);
      setCaller(null);
    }
  };

  // CALLER initiating call
  const initiateCall = async (otherUserId: string, callType: 'voice' | 'video') => {
    if (!authUser || !supabase) return;
    if (initiatingCallRef.current) {
      console.log("[Call Hook] Call already initiating, skipping duplicate invocation.");
      return;
    }
    
    initiatingCallRef.current = true;
    try {
      // Reset all states
      handleEndCallLocally();
      playOutgoingBeep();

      let receiverProfile: any = null;
      try {
        const { data } = await supabase.from('users').select('*').eq('id', otherUserId).single();
        receiverProfile = data;
      } catch (e) {
        console.warn("Grixchat user profile retrieval failure:", e);
      }

      const placeholderId = `temp-${Date.now()}`;
      const initialCall: ActiveCallState = {
        id: placeholderId,
        otherUserId,
        type: callType,
        role: 'caller',
        status: 'connecting',
        receiver: receiverProfile,
      };
      setActiveCall(initialCall);
      setIsVideoOff(callType === 'voice');

      // Setup WebRTC core peer pipeline
      try {
        pcRef.current = new RTCPeerConnection(servers);

        remoteStreamRef.current = new MediaStream();
        setRemoteStream(remoteStreamRef.current);

        pcRef.current.ontrack = (event) => {
          console.log("[WebRTC Caller] Remote track received:", event.track.kind);
          
          let incomingStream = event.streams[0];
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          
          if (incomingStream) {
            incomingStream.getTracks().forEach(track => {
              if (remoteStreamRef.current && !remoteStreamRef.current.getTracks().some(t => t.id === track.id)) {
                remoteStreamRef.current.addTrack(track);
              }
            });
          } else {
            if (!remoteStreamRef.current.getTracks().some(t => t.id === event.track.id)) {
              remoteStreamRef.current.addTrack(event.track);
            }
          }
          
          setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
          setActiveCall(prev => {
            if (prev && prev.status !== 'connected') {
              return { ...prev, status: 'connected' };
            }
            return prev;
          });
        };

        pcRef.current.oniceconnectionstatechange = () => {
          if (!pcRef.current) return;
          const state = pcRef.current.iceConnectionState;
          if (state === 'disconnected' || state === 'failed') {
            handleEndCallLocally();
          }
        };

        // Obtain user media
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: callType === 'video',
            audio: true,
          });
          localStreamRef.current = stream;
          setLocalStream(stream);

          stream.getTracks().forEach((track) => {
            pcRef.current?.addTrack(track, stream!);
          });
        } catch (err) {
          console.warn("[WebRTC Caller] Capturing camera/microphone failed:", err);
        }

        // Generate local offer description
        const offerDescription = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offerDescription);

        setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);

        // Create database ringing document
        const dbType = callType === 'voice' ? 'audio' : callType;
        const { data: callData, error: callError } = await supabase.from('calls').insert({
          caller_id: authUser.id,
          receiver_id: otherUserId,
          type: dbType,
          status: 'ringing',
          offer: { sdp: offerDescription.sdp, type: offerDescription.type }
        } as any).select().single();

        if (callError || !callData) {
          console.error("[WebRTC Caller] database registration failed:", callError);
          setActiveCall(prev => prev ? { ...prev, status: 'error' } : null);
          PhoneRingtones.stop();
          return;
        }

        const realCallId = callData.id;
        setActiveCall(prev => prev ? { ...prev, id: realCallId } : null);

        pcRef.current.onicecandidate = async (event) => {
          if (event.candidate && supabase) {
            try {
              await supabase.from('call_candidates').insert({
                call_id: realCallId,
                user_id: authUser.id,
                candidate: event.candidate.toJSON(),
                type: 'offer'
              } as any);
            } catch (e) {
              console.error("Error inserting offer candidate:", e);
            }
          }
        };

        // Subscribe to remote side updates on this specific call (accept, deny, end) and remote candidates
        const callChannel = supabase
          .channel(`call-active-${realCallId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'calls', filter: `id=eq.${realCallId}` }, (payload) => {
            const data = payload.new as any;
            if (!data) return;

            if (data.status === 'ended' || data.status === 'denied' || data.status === 'rejected') {
              setActiveCall(prev => prev ? { ...prev, status: data.status as any } : null);
              handleEndCallLocally();
            }

            if (data.status === 'accepted') {
              setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
              PhoneRingtones.stop();
              if (data.answer && pcRef.current && !pcRef.current.currentRemoteDescription) {
                const answerDescription = new RTCSessionDescription(data.answer);
                pcRef.current.setRemoteDescription(answerDescription).then(async () => {
                  pendingCandidatesRef.current.forEach(candidate => {
                    pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding queued remote candidate:", e));
                  });
                  pendingCandidatesRef.current = [];

                  // Fetch already uploaded candidates directly from table in database (as fallback/completeness)
                  try {
                    const { data: existingCandidates } = await supabase
                      .from('call_candidates')
                      .select('*')
                      .eq('call_id', realCallId)
                      .neq('user_id', authUser.id);
                    if (existingCandidates && existingCandidates.length > 0) {
                      console.log("[WebRTC Caller] Fetched pre-existing answer candidates:", existingCandidates.length);
                      for (const cand of existingCandidates) {
                        const candidateObj = cand.candidate as RTCIceCandidateInit;
                        try {
                          await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidateObj));
                        } catch (err) {}
                      }
                    }
                  } catch (candErr) {
                    console.warn("[WebRTC Caller] Error fetching receiver candidates:", candErr);
                  }
                });
              }
            }
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_candidates', filter: `call_id=eq.${realCallId}` }, (payload) => {
            const data = payload.new as any;
            if (data.user_id === authUser.id) return;

            const candidate = data.candidate as RTCIceCandidateInit;
            if (pcRef.current && pcRef.current.currentRemoteDescription) {
              pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding remote candidate:", e));
            } else {
              pendingCandidatesRef.current.push(candidate);
            }
          })
          .subscribe();

        activeCallChannelRef.current = callChannel;

        // STAGE 45-second Calling timeout (exact specifications from user!)
        setTimeout(async () => {
          if (!supabase) return;
          const { data: snap } = await supabase.from('calls').select('status').eq('id', realCallId).single();
          if (snap && snap.status === 'ringing') {
            console.log("[Call Timeout] No answer after 45 seconds, marking as ended/missed...");
            await supabase.from('calls').update({ status: 'ended', is_missed: true } as any).eq('id', realCallId);
            await addLoggingMessage('missed', realCallId, otherUserId, callType);
            setActiveCall(prev => prev ? { ...prev, status: 'ended' } : null);
            handleEndCallLocally();
          }
        }, 45000);

      } catch (e) {
        console.error("[WebRTC Caller] Setup exception:", e);
        setActiveCall(prev => prev ? { ...prev, status: 'error' } : null);
      }
    } finally {
      initiatingCallRef.current = false;
    }
  };

  // Termination handler (either caller or receiver can end active call)
  const endCall = async () => {
    if (!activeCall || !supabase) {
      handleEndCallLocally();
      return;
    }

    const cid = activeCall.id;
    const otherUserId = activeCall.otherUserId;
    const callType = activeCall.type;

    try {
      const endStatus = (activeCall.status === 'ringing' && activeCall.role === 'receiver') ? 'rejected' : 'ended';
      await supabase.from('calls').update({ status: endStatus } as any).eq('id', cid);
      await addLoggingMessage(activeCall.status === 'ringing' ? 'missed' : 'ended', cid, otherUserId, callType);
    } catch (e) {
      console.warn("Error updating active call status to ended in DB:", e);
    }

    handleEndCallLocally();
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const nextMuted = !prev;
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = !nextMuted;
      }
      return nextMuted;
    });
  };

  const toggleVideo = () => {
    setIsVideoOff(prev => {
      const nextVideoOff = !prev;
      if (localStreamRef.current) {
        let videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (!videoTrack && !nextVideoOff) {
          navigator.mediaDevices.getUserMedia({ video: true })
            .then(videoStream => {
              const newTrack = videoStream.getVideoTracks()[0];
              if (newTrack && localStreamRef.current) {
                localStreamRef.current.addTrack(newTrack);
                newTrack.enabled = true;
                setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
              }
            })
            .catch(e => console.warn("Could not activate camera track dynamically:", e));
        } else if (videoTrack) {
          videoTrack.enabled = !nextVideoOff;
        }
      }
      return nextVideoOff;
    });
  };

  const toggleSpeaker = () => {
    setSpeakerState(prev => (prev + 1) % 3);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (localStreamRef.current) {
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);
        setLocalStream(stream);

        // Listen for browser cancellation
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          if (localStreamRef.current) {
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        };
      } catch (e) {
        console.warn("Screen sharing failed or cancelled by user:", e);
      }
    }
  };

  const flipCamera = async () => {
    if (!localStreamRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    try {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);
      }

      const freshStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });

      const newTrack = freshStream.getVideoTracks()[0];
      if (newTrack) {
        localStreamRef.current.addTrack(newTrack);
        
        if (pcRef.current) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newTrack);
          }
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (e) {
      console.warn("Failed to flip camera device:", e);
    }
  };

  const playOutgoingBeep = () => {
    PhoneRingtones.playOutgoingBeep();
  };

  const stopSounds = () => {
    PhoneRingtones.stop();
  };

  return (
    <CallContext.Provider value={{ 
      incomingCall, 
      caller, 
      activeCall, 
      localStream, 
      remoteStream, 
      timer, 
      isMuted, 
      isVideoOff, 
      speakerState, 
      isScreenSharing, 
      setIsVideoOff,
      acceptCall, 
      rejectCall, 
      initiateCall, 
      endCall, 
      toggleMute, 
      toggleVideo, 
      toggleSpeaker, 
      toggleScreenShare, 
      flipCamera, 
      playOutgoingBeep, 
      stopSounds 
    }}>
      {children}
      
      {/* Premium overlay incoming call card */}
      <AnimatePresence>
        {incomingCall && caller && (
          <div className="fixed inset-x-0 top-0 z-[9999] px-4 py-4 pointer-events-none flex justify-center">
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -100, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-5 shadow-2xl flex flex-col gap-4 pointer-events-auto"
            >
              {/* Header Info */}
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={caller.photoURL || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}
                    alt={caller.fullName || 'User'}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#0494f4] p-1.5 rounded-full border-2 border-zinc-900 text-white animate-pulse">
                    {incomingCall.type === 'video' ? <Video size={10} /> : <Phone size={10} />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black tracking-widest text-[#0494f4] uppercase bg-[#0494f4]/10 px-2 py-0.5 rounded-full">
                      INCOMING CALL
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-white truncate mt-0.5">
                    {caller.fullName || 'Grixvibe User'}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    @{caller.userName || 'username'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-1">
                {/* Decline Button */}
                <button
                  onClick={rejectCall}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <PhoneOff size={14} />
                  <span>Decline</span>
                </button>

                {/* Answer Button */}
                <button
                  onClick={acceptCall}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Phone size={14} className="animate-bounce" />
                  <span>Answer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
