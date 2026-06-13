import React, { useState } from 'react';
import { Check, MessageSquare, Type } from 'lucide-react';
import { storage } from '../../../services/StorageService.ts';

interface BubbleCustomizerProps {
  onStyleChange?: (style: string) => void;
  onSizeChange?: (size: string) => void;
}

export default function BubbleCustomizer({ onStyleChange, onSizeChange }: BubbleCustomizerProps) {
  const [bubbleStyle, setBubbleStyle] = useState(() => {
    return storage.getItem('app-chat-bubble-style') || 'whatsapp';
  });

  const [fontSize, setFontSize] = useState(() => {
    return storage.getItem('app-chat-font-size') || 'medium';
  });

  const bubbleStyles = [
    { id: 'whatsapp', label: 'Classic WA', desc: 'Rounded edges' },
    { id: 'modern', label: 'Sleek Pill', desc: 'Flowing capsule' },
    { id: 'ios', label: 'iOS Smooth', desc: 'Thick custom margins' },
    { id: 'retro', label: 'Brutalist Flat', desc: 'Sharp active borders' }
  ];

  const fontSizes = [
    { id: 'small', label: 'Small', px: '12px', scale: 'text-xs' },
    { id: 'medium', label: 'Medium', px: '14px', scale: 'text-sm' },
    { id: 'large', label: 'Large', px: '16px', scale: 'text-base' },
    { id: 'extra-large', label: 'XL Extra', px: '18px', scale: 'text-lg' }
  ];

  const handleStyleSelect = (id: string) => {
    setBubbleStyle(id);
    storage.setItem('app-chat-bubble-style', id);
    if (onStyleChange) onStyleChange(id);
  };

  const handleSizeSelect = (id: string) => {
    setFontSize(id);
    storage.setItem('app-chat-font-size', id);
    if (onSizeChange) onSizeChange(id);
  };

  const getBubbleClasses = (isMe: boolean) => {
    let classes = 'px-4 py-2.5 shadow-sm text-xs ';
    if (bubbleStyle === 'whatsapp') {
      classes += isMe 
        ? 'bg-[#005c4b] text-white rounded-xl rounded-tr-none' 
        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-xl rounded-tl-none';
    } else if (bubbleStyle === 'modern') {
      classes += isMe 
        ? 'bg-blue-600 text-white rounded-[20px] rounded-br-sm font-medium' 
        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-[20px] rounded-bl-sm font-medium';
    } else if (bubbleStyle === 'ios') {
      classes += isMe 
        ? 'bg-[#248bf5] text-white rounded-[24px]' 
        : 'bg-[#e5e5ea] dark:bg-[#262629] text-black dark:text-white rounded-[24px]';
    } else {
      classes += isMe 
        ? 'bg-white dark:bg-black text-[var(--text-primary)] border-2 border-black dark:border-white rounded-none font-mono font-bold' 
        : 'bg-zinc-100 dark:bg-zinc-900 text-[var(--text-primary)] border-2 border-dashed border-zinc-400 rounded-none font-mono';
    }
    return classes;
  };

  const getPreviewFontSizeStyle = () => {
    if (fontSize === 'small') return 'text-[11px]';
    if (fontSize === 'large') return 'text-[15px]';
    if (fontSize === 'extra-large') return 'text-[17px]';
    return 'text-[13.5px]';
  };

  return (
    <div className="w-full bg-[var(--bg-card)] p-0 mb-6 font-sans">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-[10.5px] font-black text-[#0494f4] uppercase tracking-wider select-none">
          Bubble Shape & Sizing
        </h4>
      </div>

      <div className="bg-[#0494f4]/5 border border-[#0494f4]/15 rounded-2xl p-4 space-y-5">
        {/* Bubble styles grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {bubbleStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleStyleSelect(style.id)}
              className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer outline-none ${
                bubbleStyle === style.id
                  ? 'border-[#0494f4] bg-[#0494f4]/10'
                  : 'border-[var(--border-color)]/20 bg-zinc-900/30 hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-[var(--text-primary)]">{style.label}</span>
                {bubbleStyle === style.id && (
                  <div className="bg-[#0494f4] p-0.5 rounded-full select-none shrink-0">
                    <Check size={10} className="text-white shrink-0" />
                  </div>
                )}
              </div>
              <span className="text-[10.5px] text-[var(--text-secondary)] mt-1 font-medium leading-none opacity-80">{style.desc}</span>
            </button>
          ))}
        </div>

        {/* Font sizing slider replacement */}
        <div>
          <div className="flex items-center gap-2 mb-2 select-none">
            <Type size={14} className="text-[#0494f4] stroke-[2.2]" />
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">Message text sizing</span>
          </div>
          <div className="flex bg-zinc-900/40 rounded-xl p-1 border border-[var(--border-color)]/10">
            {fontSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSizeSelect(size.id)}
                className={`flex-grow py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none outline-none ${
                  fontSize === size.id
                    ? 'bg-[#0494f4] text-white shadow'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-75 hover:opacity-100'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Preview layout */}
        <div className="bg-zinc-950/40 border border-[var(--border-color)]/15 rounded-xl p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[var(--border-color)]/10 pb-1.5 text-[9px] font-black uppercase tracking-widest text-[#0494f4] opacity-80">
            <span>Live Appearance Preview</span>
          </div>
          
          <div className="flex items-start max-w-[85%] self-start relative">
            <div className={getBubbleClasses(false)}>
              <p className={`${getPreviewFontSizeStyle()}`}>Hey, what do you think of this theme update? 🎨</p>
              <span className="text-[8px] opacity-60 text-right block mt-1 font-mono">11:42 AM</span>
            </div>
          </div>

          <div className="flex items-start max-w-[85%] self-end relative">
            <div className={getBubbleClasses(true)}>
              <p className={`${getPreviewFontSizeStyle()}`}>Looks extremely responsive and fluid on my display screen! 🚀</p>
              <span className="text-[8px] opacity-60 text-right block mt-1 font-mono">11:43 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
