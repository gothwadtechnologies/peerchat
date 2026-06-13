import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, MessageSquare, Laptop, Smartphone } from 'lucide-react';
import { APP_CONFIG } from '../../config/appConfig';

export default function DesktopWelcome() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-main)] px-8 text-center relative select-none">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[var(--primary)]/10 rounded-full filter blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-md flex flex-col items-center relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
          className="relative mb-8"
        >
          {/* Logo Frame */}
          <div className="w-24 h-24 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]/50 shadow-2xl flex items-center justify-center p-5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <img 
              src={APP_CONFIG?.LOGO_URL || "/assets/icon-512.png"} 
              alt="GrixChat" 
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>
          
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-[var(--bg-main)] items-center justify-center text-[10px] text-white">✓</span>
          </span>
        </motion.div>

        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-black text-[var(--text-primary)] tracking-tight mb-2 font-sans"
        >
          GrixChat Web Desktop
        </motion.h2>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm text-[var(--text-secondary)] leading-relaxed mb-8 font-medium"
        >
          India's next-generation secure communication platform. Connect seamlessly with your friends, host HD private video calls, and interact with Grix AI.
        </motion.p>

        {/* Feature Grid */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 w-full mb-12"
        >
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/40 flex items-center gap-3 text-left">
            <div className="p-2 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]">
              <Laptop size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Sync Device</p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-none mt-0.5">Real-time sync</p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/40 flex items-center gap-3 text-left">
            <div className="p-2 bg-[var(--primary)]/10 rounded-xl text-[var(--primary)]">
              <MessageSquare size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Rich Chatting</p>
              <p className="text-[10px] text-[var(--text-secondary)] leading-none mt-0.5">HD media & documents</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] select-none mt-4 justify-center"
        >
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Supabase Protected & End-to-End Encrypted</span>
        </motion.div>
      </div>
    </div>
  );
}
