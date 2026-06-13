import React from 'react';
import { APP_CONFIG } from '../../config/appConfig';
import { ArrowLeft, Info, ShieldCheck, Globe, Code, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import TermuxConsoleButton from '../../components/TermuxConsoleButton';

export default function AppInfoScreen() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader 
        title="App Info" 
        rightElement={
          <div className="flex items-center gap-1.5 md:gap-2">
            <TermuxConsoleButton />
            <button 
              onClick={() => navigate('/github')} 
              className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer group flex items-center justify-center"
              title="GitHub Integration"
            >
              <Github size={21} className="text-[var(--header-text)] group-active:scale-110 transition-transform" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto no-scrollbar py-10">
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="w-28 h-28 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mb-6 border border-zinc-100 p-4">
            <img 
              src={APP_CONFIG.LOGO_URL} 
              alt={`${APP_CONFIG.NAME} Logo`} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight italic">{APP_CONFIG.NAME}</h2>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">Version 1.0.0 (Beta)</p>
        </div>

        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]">
          <div className="px-6 py-5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                <ShieldCheck size={20} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">End-to-end encrypted</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed ml-12">
              Your messages and calls are secured with end-to-end encryption. No one outside of this chat, not even {APP_CONFIG.NAME}, can read or listen to them.
            </p>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500">
                <Code size={20} />
              </div>
              <h4 className="text-sm font-bold text-[var(--text-primary)]">Licenses</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed ml-12">
              View open source licenses and third-party software credits.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-1">
          <span className="text-[var(--text-secondary)] text-[10px] font-medium uppercase tracking-widest">© 2026 GrixChat</span>
          <span className="text-[var(--text-primary)] font-black tracking-[0.3em] uppercase text-[9px] mt-1">All Rights Reserved</span>
        </div>
      </div>
    </div>
  );
}
