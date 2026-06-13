import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Server } from 'lucide-react';

interface GrixAIThinkingProps {
  onTap?: () => void;
}

export const GrixAIThinking: React.FC<GrixAIThinkingProps> = ({ onTap }) => {
  const steps = [
    { text: 'ChatGPT Working...', color: 'text-emerald-500 bg-emerald-500/10' },
    { text: 'Gemini Core Working...', color: 'text-blue-500 bg-blue-500/10' },
    { text: 'Groq Llama Working...', color: 'text-amber-500 bg-amber-500/10' },
    { text: 'Running 10 models in parallel...', color: 'text-indigo-500 bg-indigo-500/10' },
    { text: 'Comparing results from 13 answers...', color: 'text-purple-500 bg-purple-500/10' },
    { text: 'Compiling results from 7 AI engines...', color: 'text-pink-500 bg-pink-500/10' },
    { text: 'Finalizing best response...', color: 'text-teal-500 bg-teal-500/10' }
  ];

  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1000);

    return () => clearInterval(timer);
  }, [steps.length]);

  const step = steps[currentStep];

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
      className="flex flex-col bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3.5 my-1 max-w-full shadow-sm hover:border-indigo-500/40 cursor-pointer active:scale-[0.98] transition-all select-none"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-main)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
              >
                <Cpu size={14} className="text-[var(--primary)]" />
              </motion.div>
            </div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-card)] rounded-full animate-pulse" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-black text-[var(--text-primary)] truncate">
                {step.text}
              </span>
              <span className="flex gap-0.5 shrink-0">
                <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-[bounce_1s_infinite_100ms]" />
                <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-[bounce_1s_infinite_200ms]" />
                <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-[bounce_1s_infinite_300ms]" />
              </span>
            </div>
            
            <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <Server size={9} />
              Tap to view Parallel Grid Logs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
