import React from 'react';
import { ChevronLeft, Palette, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import PreferencesSubscreen from './components/PreferencesSubscreen.tsx';

export default function AppPreferencesScreen() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const themes: { id: Theme; label: string; sub: string }[] = [
    { id: 'system', label: 'System Default', sub: 'Matches your localized device appearance' },
    { id: 'light', label: 'Light Theme', sub: 'Bright slate appearance preset' },
    { id: 'dark', label: 'Dark Cosmic', sub: 'Deep, eye-strain saving low contrast mode' }
  ];

  return (
    <div className="fixed inset-0 bg-[var(--bg-card)] flex flex-col z-[100] animate-fade-in font-sans">
      {/* Consistent premium header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-card)] border-b border-[var(--border-color)]/20 text-[var(--text-primary)] shrink-0 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 hover:bg-[var(--border-color)]/5 rounded-full active:scale-95 transition-transform cursor-pointer text-[var(--text-primary)]"
        >
          <ChevronLeft size={22} className="stroke-[2.2]" />
        </button>
        <span className="text-base font-bold tracking-tight text-[var(--text-primary)]">System Preferences</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-6 pb-28">
        {/* Theme select category */}
        <div>
          <div className="px-4 mb-2">
            <h3 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
              Visual Appearance
            </h3>
          </div>
          <div className="flex flex-col divide-y divide-[var(--border-color)]/5 bg-[var(--bg-card)]">
            {themes.map((t) => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="w-full flex items-center gap-3.5 px-4 py-3 h-16 hover:bg-[var(--border-color)]/5 active:bg-[var(--border-color)]/10 transition-colors group text-left cursor-pointer border-none outline-none select-none"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-[var(--primary)] border border-[var(--primary)]/10 shadow-sm group-hover:scale-[1.02] group-active:scale-95 transition-all duration-150 shrink-0 ${
                  theme === t.id ? 'text-[#0494f4]' : 'text-[var(--text-secondary)] opacity-85'
                }`}>
                  <Palette size={20} className="stroke-[2.2]" />
                </div>
                <div className="flex-grow min-w-0 pr-1">
                  <h4 className={`text-[14px] font-semibold group-hover:text-[#0494f4] transition-colors leading-tight ${
                    theme === t.id ? 'text-[#0494f4]' : 'text-[var(--text-primary)]'
                  }`}>
                    {t.label}
                  </h4>
                  <p className="text-[12.5px] text-[var(--text-secondary)] font-normal mt-0.5 truncate leading-tight opacity-75">
                    {t.sub}
                  </p>
                </div>
                {theme === t.id && (
                  <div className="bg-[#0494f4] p-1 rounded-full shadow-sm mr-2 select-none shrink-0">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Other advanced subscreen preferences */}
        <PreferencesSubscreen />

        {/* Footer */}
        <div className="py-8 flex flex-col items-center gap-1 opacity-25">
          <span className="text-[var(--text-primary)] font-black tracking-[0.22em] uppercase font-mono text-[9px]">
            GRIXVIBE LOCAL LEDGER ENGINE
          </span>
        </div>
      </div>
    </div>
  );
}
