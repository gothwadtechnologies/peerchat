import React, { useState, useEffect } from 'react';
import { Phone, Video, X, PhoneForwarded } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function IncomingCallNotification() {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [caller, setCaller] = useState<any>(null);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authUser || !supabase) return;

    const fetchCallerInfo = async (callerId: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', callerId)
        .single();
      
      if (!error && data) {
        setCaller({
          ...data,
          photoURL: data.photo_url,
          fullName: data.full_name
        });
      }
    };

    const handleCall = (callData: any) => {
      const callTime = new Date(callData.created_at).getTime();
      const now = Date.now();
      
      if (now - callTime < 45000 && callData.status === 'ringing') {
        setIncomingCall(callData);
        fetchCallerInfo(callData.caller_id);
        
        // Play ringtone
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        audio.loop = true;
        audio.play().catch(e => console.warn("Audio play blocked:", e));
        
        return () => {
          audio.pause();
          audio.currentTime = 0;
        };
      }
    };

    const fetchActiveCall = async () => {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('receiver_id', authUser.id)
        .eq('status', 'ringing')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        handleCall(data);
      }
    };

    fetchActiveCall();

    const channel = supabase
      .channel(`incoming-calls:${authUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${authUser.id}`
      }, (payload) => {
        handleCall(payload.new);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'calls',
        filter: `receiver_id=eq.${authUser.id}`
      }, (payload) => {
        if (payload.new.status !== 'ringing') {
          setIncomingCall(null);
          setCaller(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser?.id]);

  const handleAccept = async () => {
    if (!incomingCall) return;
    navigate(`/call/${incomingCall.caller_id}?role=receiver&type=${incomingCall.type}&callId=${incomingCall.id}`);
    setIncomingCall(null);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    try {
      await supabase
        .from('calls')
        .update({ status: 'denied' } as any)
        .eq('id', incomingCall.id);
    } catch (e) {
      console.error("Error declining call:", e);
    }
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && caller && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 20, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] px-4 flex justify-center"
        >
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-3xl p-4 w-full max-w-sm flex items-center gap-4 backdrop-blur-xl">
            <div className="relative">
              <img 
                src={caller.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-lg"
                alt="Caller"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-[var(--bg-card)]">
                {incomingCall.type === 'video' ? <Video size={10} /> : <Phone size={10} />}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-black text-[var(--text-primary)] truncate uppercase tracking-tight">
                {caller.fullName || 'Incoming Call'}
              </h3>
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                Incoming {incomingCall.type} Call...
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleDecline}
                className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors active:scale-90"
              >
                <X size={20} />
              </button>
              <button 
                onClick={handleAccept}
                className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 animate-bounce transition-colors active:scale-90"
              >
                <Phone size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
