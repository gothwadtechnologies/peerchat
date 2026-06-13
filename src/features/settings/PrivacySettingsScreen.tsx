import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Globe, 
  LockKeyhole, 
  UserCheck, 
  Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider.tsx';

export default function PrivacySettingsScreen() {
  const navigate = useNavigate();
  const { userData, user, refreshUserData } = useAuth();

  const updatePrivacySetting = async (field: string, value: any) => {
    if (!user || !supabase) return;
    try {
      const dbField = field === 'profileType' ? 'profile_type' : field;
      const { error } = await supabase
        .from('users')
        .update({ [dbField]: value } as any)
        .eq('id', user.id);
      
      if (error) throw error;
      await refreshUserData();
    } catch (error) {
      console.error("Error updating privacy setting:", error);
    }
  };

  const isPrivate = userData?.profileType === 'private';

  if (!userData) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-card)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Premium consistent header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Privacy Settings</span>
      </div>

      <div className="flex-grow overflow-y-auto no-scrollbar py-4 space-y-6">
        {/* Profile Privacy Selection Group */}
        <div className="px-4">
          <h3 className="mb-2 text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
            Account Privacy
          </h3>
          <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4 flex flex-col gap-3.5">
            <div className="flex p-1 bg-[var(--bg-card)] border border-[var(--border-color)]/20 rounded-xl gap-1">
              <button 
                onClick={() => updatePrivacySetting('profileType', 'public')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  !isPrivate 
                  ? 'bg-[#0494f4] text-white shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Globe size={14} className="stroke-[2.2]" />
                Public
              </button>
              <button 
                onClick={() => updatePrivacySetting('profileType', 'private')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                  isPrivate 
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <LockKeyhole size={14} className="stroke-[2.2]" />
                Private
              </button>
            </div>
            <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed font-normal text-center px-2 opacity-85">
              {isPrivate 
                ? "Private accounts only show your detailed status coordinates, active list, and profile entries to contacts you approve."
                : "Public accounts allow everyone to see your profile, search catalog, and sync to active stories."
              }
            </p>
          </div>
        </div>

        {/* Security / PIN Advanced Controls list */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Privacy & Security Controls
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
            <button 
              onClick={() => navigate('/app-lock')}
              className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0">
                <Lock size={20} className="stroke-[2.2]" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <h4 className="text-[14px] font-semibold text-[var(--text-primary)] group-hover:text-[#0494f4] transition-colors leading-tight">
                  App Encryption Lock
                </h4>
                <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                  Secure local database access keys behind a customizable PIN
                </p>
              </div>
              <ChevronRight size={16} className="text-[var(--text-secondary)] opacity-15 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all duration-200 mr-1 shrink-0" />
            </button>
          </div>
        </div>

        {/* Beautiful Safety Tip Banner */}
        <div className="px-4 mt-2">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex gap-3.5 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-500 shrink-0 border border-emerald-500/10">
              <UserCheck size={18} className="stroke-[2.2]" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-emerald-500 block mb-0.5 tracking-wider font-sans">
                Active Verification Integrity
              </span>
              <p className="text-[12px] text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed opacity-90">
                GrixChat operates using full zero-knowledge local verification indices. None of your local lock passcodes or security encryption credentials leave your localized client storage container.
              </p>
            </div>
          </div>
        </div>

        {/* Footer verification tag */}
        <div className="py-8 flex flex-col items-center gap-1.5 opacity-30">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-[var(--text-primary)]" />
            <span className="text-[var(--text-primary)] text-[9px] font-black tracking-[0.22em] uppercase font-mono">
              SECURE INTEGRITY VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
