import React from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  MessageSquare, 
  Users, 
  UserPlus, 
  CircleDashed, 
  Clapperboard, 
  Video, 
  Grid, 
  Heart, 
  Search, 
  Compass, 
  Bell, 
  TrendingUp,
  Wrench, 
  LayoutGrid, 
  Gamepad2, 
  MoreHorizontal, 
  Upload,
  Camera,
  HelpCircle,
  Globe
} from 'lucide-react';

import { useLayout } from '../../contexts/LayoutContext.tsx';

export type TabType = 'post' | 'chats' | 'reels' | 'profile';

interface ResourcesNavProps {
  tab: TabType;
}

const tabFilters: Record<TabType, { id: string; label: string; icon: any }[]> = {
  post: [
    { id: 'For You', label: 'For You', icon: Heart },
    { id: 'Search', label: 'Search', icon: Search },
    { id: 'Stories', label: 'Stories', icon: Compass },
    { id: 'Updates', label: 'Updates', icon: Bell }
  ],
  chats: [
    { id: 'Chats', label: 'Chats', icon: MessageSquare },
    { id: 'Groups', label: 'Groups', icon: Users },
    { id: 'Requests', label: 'Requests', icon: UserPlus }
  ],
  reels: [
    { id: 'Trending', label: 'Trending', icon: TrendingUp },
    { id: 'Following', label: 'Following', icon: Users }
  ],
  profile: [
    { id: 'Post', label: 'Post', icon: Grid },
    { id: 'Videos', label: 'Videos', icon: Clapperboard },
    { id: 'Video', label: 'Video', icon: Video },
    { id: 'Upload', label: 'Upload', icon: Upload }
  ]
};

export default function ResourcesNav({ tab }: ResourcesNavProps) {
  const { activeFilters, setActiveFilter } = useLayout();
  const activeFilter = activeFilters[tab] || '';
  const filters = tabFilters[tab] || [];

  if (tab === 'chats') {
    return (
      <div className="w-full bg-[var(--header-bg)] border-b border-[var(--border-color)] shrink-0 z-40">
        <div className="flex items-center gap-2 px-4 h-[35px] overflow-x-auto no-scrollbar">
          {filters.map((filter) => {
            const isActive = activeFilter.toLowerCase() === filter.id.toLowerCase();
            
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(tab, filter.id)}
                className={`px-3.5 py-1 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-sm shadow-blue-500/20' 
                    : 'bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--header-bg)] border-b border-[var(--border-color)] shrink-0 z-40">
      <div className="flex px-2">
        {filters.map((filter) => {
          const isActive = activeFilter.toLowerCase() === filter.id.toLowerCase();
          const Icon = filter.icon;

          return (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(tab, filter.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 transition-all relative min-w-0 ${
                isActive ? 'text-blue-500' : 'text-[var(--header-text)]/60 hover:text-[var(--header-text)]'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {filter.label}
              </span>
              
              {isActive && (
                <motion.div 
                  layoutId={`nav-indicator-${tab}`}
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
