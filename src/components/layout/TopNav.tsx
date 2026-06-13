import React from 'react';
import { useSearch } from '../../contexts/SearchContext.tsx';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X } from 'lucide-react';
import TabHeader from './TabHeader.tsx';

export default function TopNav() {
  const { searchTerm, setSearchTerm, isSearchOpen, setIsSearchOpen } = useSearch();

  return (
    <div className="relative z-50 min-h-[56px] pt-safe bg-[var(--header-bg)] border-b border-[var(--border-color)]/35 shadow-sm rounded-b-2xl">
      {isSearchOpen ? (
        <div 
          className="flex items-center px-4 h-[56px] gap-3"
        >
          <div className="flex-1 flex items-center bg-[var(--bg-main)] rounded-xl px-4 h-[44px] border border-[var(--border-color)]">
            <Search size={18} className="text-[var(--text-secondary)] mr-3 opacity-50" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search chats, groups..." 
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
              setIsSearchOpen(false);
              setSearchTerm('');
            }}
            className="text-[var(--primary)] text-[13px] font-black uppercase tracking-widest px-1 py-2 active:scale-95 transition-transform"
          >
            Cancel
          </button>
        </div>
      ) : (
        <TabHeader />
      )}
    </div>
  );
}
