import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileSettingsContent from './components/ProfileSettingsContent';

export default function SettingsMainScreen() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Header bar styled exactly like premium layout */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">Settings</span>
      </div>

      {/* Settings list scroll area using shared unified layout */}
      <div className="flex-1 overflow-hidden">
        <ProfileSettingsContent />
      </div>
    </div>
  );
}
