import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LayoutContextType {
  activeFilters: Record<string, string>;
  setActiveFilter: (tab: string, filterId: string) => void;
  chatListFilter: 'all' | 'direct' | 'groups' | 'channels';
  setChatListFilter: (filter: 'all' | 'direct' | 'groups' | 'channels') => void;
  isChatSelectMode: boolean;
  setChatSelectMode: (enabled: boolean) => void;
  selectedChatIds: string[];
  setSelectedChatIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [chatListFilter, setChatListFilter] = useState<'all' | 'direct' | 'groups' | 'channels'>('all');
  const [isChatSelectMode, setChatSelectMode] = useState<boolean>(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    home: 'For You',
    post: 'For You',
    chats: 'Chats',
    reels: 'Trending',
    profile: 'Post',
  });

  const setActiveFilter = (tab: string, filterId: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [tab]: filterId,
    }));
  };

  return (
    <LayoutContext.Provider value={{ 
      activeFilters, 
      setActiveFilter, 
      chatListFilter, 
      setChatListFilter,
      isChatSelectMode,
      setChatSelectMode,
      selectedChatIds,
      setSelectedChatIds
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
