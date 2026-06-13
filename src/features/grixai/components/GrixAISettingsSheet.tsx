import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Cpu, Sparkles, Trash2 } from 'lucide-react';
import { AIModelType } from '../../../services/AIService';

interface GrixAISettingsSheetProps {
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  currentModel: AIModelType;
  toggleModel: (model: AIModelType) => void;
  messagesCount: number;
  clearChat: () => void;
}

export const GrixAISettingsSheet: React.FC<GrixAISettingsSheetProps> = ({
  showOptions,
  setShowOptions,
  currentModel,
  toggleModel,
  messagesCount,
  clearChat
}) => {
  if (!showOptions) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.25 }}
      className="absolute inset-0 bg-[var(--bg-main)] z-[100] flex flex-col h-full w-full"
    >
      <div className="shrink-0 flex items-center justify-between px-4 h-14 bg-[var(--header-bg)] border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowOptions(false)} 
            className="p-1.5 hover:bg-white/10 rounded-full cursor-pointer text-[var(--header-text)]"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-sm font-black text-[var(--header-text)] uppercase tracking-wider">
            Grix AI Settings
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex flex-col items-center text-center p-6 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm">
          <img 
            src="/assets/favicon.png" 
            alt="Grix AI" 
            className="w-20 h-20 rounded-full object-cover mb-3 border border-[var(--border-color)]" 
          />
          <h2 className="text-lg font-black text-[var(--text-primary)]">Grix Assistant</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium">@grixai • Core Engine Model Settings</p>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">
            Select AI Model
          </p>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <button 
              onClick={() => toggleModel('grix-ai')} 
              className={`w-full flex items-center justify-between px-4 py-4 text-left border-b border-[var(--border-color)]/30 ${currentModel === 'grix-ai' ? 'bg-[var(--primary)]/[0.03]' : 'hover:bg-[var(--bg-main)]/50'} cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentModel === 'grix-ai' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'bg-[var(--bg-main)] text-[var(--text-secondary)]'}`}>
                  <Zap size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-[var(--text-primary)]">Grix AI Standard</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5 leading-relaxed">
                    Gemini 3.5 Flash • Lightning-fast responses & smart reasoning.
                  </div>
                </div>
              </div>
              {currentModel === 'grix-ai' && <div className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 ml-2" />}
            </button>

            <button 
              onClick={() => toggleModel('grix-ai-pro')} 
              className={`w-full flex items-center justify-between px-4 py-4 text-left ${currentModel === 'grix-ai-pro' ? 'bg-indigo-500/[0.03]' : 'hover:bg-[var(--bg-main)]/50'} cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${currentModel === 'grix-ai-pro' ? 'bg-indigo-505/10 text-indigo-500' : 'bg-[var(--bg-main)] text-[var(--text-secondary)]'}`}>
                  <Cpu size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-[var(--text-primary)]">Grix AI Pro</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5 leading-relaxed">
                    Gemini 3.5 Flash Pro • Creative writing & analytical deep research.
                  </div>
                </div>
              </div>
              {currentModel === 'grix-ai-pro' && <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 ml-2" />}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">
            Scalability Details
          </p>
          <div className="p-4 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles size={18} className="text-[var(--primary)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                To keep GrixChat highly efficient & scale effortlessly for over 50,000+ support users, our Cloud Database (Supabase) matches standard mobile layouts limit automatically.
              </p>
            </div>
            <div className="h-px bg-[var(--border-color)]/30" />
            <div className="text-[11px] text-[var(--text-secondary)] font-medium">
              <span className="text-[var(--text-primary)] font-bold">Local Cache:</span> {messagesCount} messages are stored locally on this device.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest pl-1">Actions</p>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <button 
              onClick={clearChat} 
              className="w-full flex items-center gap-3 px-4 py-4 text-left font-bold text-rose-500 hover:bg-rose-500/[0.02] cursor-pointer transition-colors"
            >
              <Trash2 size={18} className="shrink-0" />
              <span className="text-xs font-black">Clear All Assistant History</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
