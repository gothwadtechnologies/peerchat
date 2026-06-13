import React, { useState } from 'react';
import { ChevronLeft, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SettingHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  onBack?: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  showSearch?: boolean;
}

export default function SettingHeader({ 
  title, 
  showBack = true, 
  rightElement, 
  onBack,
  searchTerm = '',
  setSearchTerm,
  showSearch = false
}: SettingHeaderProps) {
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);

  if (isSearchActive && setSearchTerm) {
    return (
      <div className="w-full bg-[var(--header-bg)] px-4 min-h-[56px] pt-safe pb-1.5 flex items-center z-50 shrink-0 relative border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
        <div className="flex-1 flex items-center bg-[var(--bg-main)] rounded-xl px-4 h-[44px] border border-[var(--border-color)]">
          <Search size={18} className="text-[var(--text-secondary)] mr-3 opacity-50" />
          <input 
            autoFocus
            type="text" 
            placeholder="Search settings..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[15px] font-bold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-black/5 rounded-full transition-colors"
            >
              <X size={16} className="text-[var(--text-secondary)]" />
            </button>
          )}
        </div>
        <button 
          onClick={() => {
            setIsSearchActive(false);
            setSearchTerm('');
          }}
          className="ml-3 text-[var(--primary)] text-[13px] font-black uppercase tracking-widest px-1 py-2 active:scale-95 transition-transform"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--header-bg)] px-4 min-h-[56px] pt-safe pb-1.5 flex justify-between items-center z-50 shrink-0 relative border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
      <div className="flex items-center gap-3">
        {showBack && (
          <button 
            onClick={onBack || (() => navigate(-1))}
            className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft size={24} className="text-[var(--header-text)]" />
          </button>
        )}
        <h1 className="text-xl font-black text-[var(--header-text)] tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1 text-[var(--header-text)]">
        {showSearch && setSearchTerm && (
          <button 
            onClick={() => setIsSearchActive(true)}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <Search size={22} className="group-active:scale-110 transition-transform" />
          </button>
        )}
        {rightElement}
      </div>
    </div>
  );
}
