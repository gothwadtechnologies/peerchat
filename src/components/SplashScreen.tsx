import React from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
}

export default function SplashScreen({ }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] flex flex-col items-center justify-center z-[9999] font-sans overflow-hidden">
      {/* Center Logo */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-24 h-24 bg-[var(--bg-card)] rounded-3xl shadow-sm flex items-center justify-center border border-[var(--border-color)] p-0 overflow-hidden"
        >
          <img 
            src="/assets/icon-512-maskable.png" 
            alt="Logo" 
            className="w-full h-full object-cover scale-110"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold tracking-tight text-[var(--text-primary)]"
        >
          GrixChat
        </motion.span>
      </div>
    </div>
  );
}
