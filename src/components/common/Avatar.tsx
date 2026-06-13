import React from 'react';
import { User, Users } from 'lucide-react';

interface AvatarProps {
  url?: string;
  type?: 'direct' | 'group';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  customSizeClass?: string;
  name?: string;
  isOnline?: boolean;
  className?: string;
}

export default function Avatar({
  url,
  type = 'direct',
  size = 'md',
  customSizeClass = '',
  name = '',
  isOnline = false,
  className = ''
}: AvatarProps) {
  // Determine width & height classes based on size preset
  let sizeClass = 'w-12 h-12';
  let iconSize = 22;

  switch (size) {
    case 'sm':
      sizeClass = 'w-9 h-9';
      iconSize = 18;
      break;
    case 'md':
      sizeClass = 'w-12 h-12';
      iconSize = 22;
      break;
    case 'lg':
      sizeClass = 'w-16 h-16';
      iconSize = 28;
      break;
    case 'xl':
      sizeClass = 'w-20 h-20';
      iconSize = 34;
      break;
    case 'custom':
      sizeClass = customSizeClass;
      iconSize = 22; // default fallback for icon
      break;
  }

  const isPlaceholder = !url || url.includes('149071.png') || url.includes('166258.png') || url.includes('166258') || url.trim() === '';

  return (
    <div className={`relative shrink-0 select-none ${sizeClass} ${className}`}>
      {isPlaceholder ? (
        type === 'group' ? (
          <div 
            className="w-full h-full rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--border-color)]/20 shadow-sm group-hover:scale-[1.02] transition-transform"
            style={{ contentVisibility: 'auto' }}
          >
            <Users size={iconSize - 2} className="stroke-[2.2]" />
          </div>
        ) : (
          <div 
            className="w-full h-full rounded-full flex items-center justify-center bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--border-color)]/20 shadow-sm group-hover:scale-[1.02] transition-transform"
            style={{ contentVisibility: 'auto' }}
          >
            <User size={iconSize} className="stroke-[1.8]" />
          </div>
        )
      ) : (
        <div 
          className="w-full h-full rounded-full overflow-hidden border border-[var(--border-color)]/20 shadow-sm transition-transform group-hover:scale-[1.02] flex items-center justify-center bg-[var(--border-color)]/5"
          style={{ contentVisibility: 'auto' }}
        >
          <img 
            src={url} 
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            alt={name}
          />
        </div>
      )}
      {isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-card)] rounded-full shadow-sm animate-pulse"></div>
      )}
    </div>
  );
}
