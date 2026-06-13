import React from 'react';
import { Search, X } from 'lucide-react';

interface CommonSearchBarProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
}

export const CommonSearchBar: React.FC<CommonSearchBarProps> = ({
  placeholder,
  value,
  onChange,
  onClear,
}) => {
  return (
    <div className="px-4 pt-2 pb-1.5 w-full select-none shrink-0">
      <div 
        className="flex items-center bg-[var(--bg-main)] hover:bg-[var(--bg-main)]/90 focus-within:bg-[var(--bg-main)] rounded-xl px-3.5 h-10 border border-[var(--border-color)]/45 focus-within:border-[#0494f4]/85 focus-within:ring-2 focus-within:ring-[#0494f4]/15 shadow-sm transition-all duration-200"
      >
        <Search size={15} className="text-[var(--text-secondary)] mr-2.5 opacity-75 shrink-0 transition-opacity focus-within:text-[#0494f4]" />
        <input 
          type="text" 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-[13px] font-extrabold text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/55 shrink-0"
        />
        {value && (
          <button 
            type="button"
            onClick={onClear}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer border-none bg-transparent shrink-0 flex items-center justify-center animate-fade-in"
          >
            <X size={13} className="text-[var(--text-secondary)]" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CommonSearchBar;
