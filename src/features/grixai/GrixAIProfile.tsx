import React from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Info,
  Calendar,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Globe,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function GrixAIProfile() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Users Helped', value: '10K+', icon: <Globe size={16} className="text-blue-500" /> },
    { label: 'Uptime', value: '99.9%', icon: <Zap size={16} className="text-amber-500" /> },
    { label: 'Response Time', value: '< 1s', icon: <Clock size={16} className="text-emerald-500" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--bg-main)] overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="sticky top-0 z-50 shrink-0 flex items-center justify-between px-4 min-h-[56px] pt-safe bg-[var(--header-bg)] border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0 cursor-pointer"
          >
            <ArrowLeft size={22} className="text-[var(--header-text)]" />
          </button>
          <h1 className="text-[14px] font-black text-[var(--header-text)] leading-tight uppercase tracking-tight truncate">
            AI Profile
          </h1>
        </div>
      </div>

      {/* Profile Header */}
      <div className="px-4 py-8 flex flex-col items-center text-center border-b border-[var(--border-color)] bg-[var(--bg-card)]">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-4"
        >
          <div className="w-28 h-28 rounded-full overflow-hidden border border-[var(--border-color)]/80 flex items-center justify-center bg-[var(--bg-main)]">
            <img 
              src="/assets/favicon.png" 
              alt="Grix AI" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-green-500 p-1.5 rounded-full border-4 border-[var(--bg-main)] shadow-lg">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </motion.div>

        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Grix AI</h2>
          <CheckCircle2 size={20} className="text-[var(--primary)] fill-[var(--primary)]/10" />
        </div>
        <p className="text-[var(--text-secondary)] font-medium mb-4">@grixai • Official Assistant</p>
        
        <div className="flex gap-3 w-full max-w-xs">
          <button 
            onClick={() => navigate('/chat/grix-ai')}
            className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-[var(--primary-shadow)] active:scale-95 transition-all"
          >
            <MessageSquare size={18} />
            Message
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 px-4 py-6 border-b border-[var(--border-color)]">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-3 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            {stat.icon}
            <span className="text-sm font-black text-[var(--text-main)]">{stat.value}</span>
            <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* About Section */}
      <div className="px-4 py-6 space-y-6">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-[var(--primary)]" />
            <h3 className="font-black text-[var(--text-main)] uppercase tracking-tight text-sm">About Grix AI</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-color)]">
            Hello! I am Grix AI, your personal intelligent assistant. I'm powered by advanced language models to help you with questions, coding, creative writing, and much more. I'm available 24/7 to make your GrixChat experience even better & scale to support millions of users worldwide with high-performance local configurations.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-[var(--primary)]" />
            <h3 className="font-black text-[var(--text-main)] uppercase tracking-tight text-sm">Capabilities</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              "Real-time assistance & Q&A",
              "Creative writing & Brainstorming",
              "Code generation & Debugging",
              "Language translation",
              "Friendly conversation"
            ].map((cap, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                <span className="text-xs text-[var(--text-main)] font-medium">{cap}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
