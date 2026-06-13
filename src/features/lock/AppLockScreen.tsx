import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  ShieldCheck, 
  ChevronRight, 
  Hash, 
  Type, 
  ShieldAlert,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LockService } from '../../services/LockService.ts';
import { motion } from 'motion/react';
import SettingHeader from '../../components/layout/SettingHeader.tsx';
import { useAuth } from '../../providers/AuthProvider';

export default function AppLockScreen() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const lockData = LockService.getLockDataFromProfile(userData);

  const handleToggleLock = () => {
    if (lockData.isEnabled) {
      navigate('/verify-lock');
    }
  };

  const lockOptions = [
    {
      id: 'pin4',
      label: '4-Digit PIN',
      icon: Hash,
      sub: 'Simple numeric code',
      color: 'text-primary'
    },
    {
      id: 'pin6',
      label: '6-Digit PIN',
      icon: Hash,
      sub: 'Secure numeric code',
      color: 'text-indigo-500'
    },
    {
      id: 'alpha',
      label: 'Alphabetical',
      icon: Type,
      sub: 'Custom password',
      color: 'text-emerald-500'
    }
  ];

  const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className={`w-11 h-6 rounded-full transition-all relative cursor-pointer outline-none ${
        active ? 'bg-[var(--primary)]' : 'bg-[#e2e8f0] dark:bg-zinc-700'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 shadow-sm ${
        active ? 'left-[22px]' : 'left-1'
      }`} />
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--bg-main)] overflow-hidden">
      <SettingHeader title="App Lock" />

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* Status Section */}
        <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/50 mb-6">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]/20 ${lockData.isEnabled ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}`}>
                <Lock size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black text-[var(--text-primary)]">App Lock</h4>
                <p className="text-[11px] text-[var(--text-secondary)] font-semibold">
                  {lockData.isEnabled ? 'Protection is active' : 'Secure your chats with a lock'}
                </p>
              </div>
            </div>
            <Toggle active={lockData.isEnabled} onClick={handleToggleLock} />
          </div>
        </div>

        {/* Options Section */}
        {!lockData.isEnabled && (
          <>
            <h3 className="px-6 mb-2 text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">LOCK OPTIONS</h3>
            <div className="bg-[var(--bg-card)] border-y border-[var(--border-color)]/50 mb-6">
              {lockOptions.map((option, index) => (
                <button 
                  key={option.id}
                  onClick={() => navigate(`/setup-lock/${option.id}`)}
                  className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                    index !== lockOptions.length - 1 ? 'border-b border-[var(--border-color)]/50' : ''
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl bg-[var(--bg-main)] border border-[var(--border-color)]/20 ${option.color}`}>
                    <option.icon size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-black text-[var(--text-primary)]">{option.label}</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">{option.sub}</p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-secondary)] opacity-60" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="px-6 mt-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-4">
            <ShieldAlert size={20} className="text-amber-500 shrink-0" />
            <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
              App lock is stored locally. If you forget your credentials, you'll need to reinstall the app.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="py-12 flex flex-col items-center gap-1 opacity-40">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} className="text-[var(--text-primary)]" />
            <span className="text-[var(--text-primary)] text-[9px] font-black tracking-[0.2em] uppercase">Local Security</span>
          </div>
          <span className="text-[var(--text-secondary)] text-[8px] uppercase tracking-tighter">GrixChat Inbuilt Protection</span>
        </div>
      </div>
    </div>
  );
}
