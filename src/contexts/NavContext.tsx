import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavContextType {
  isResourcesNavOpen: boolean;
  setIsResourcesNavOpen: (isOpen: boolean) => void;
}

const NavContext = createContext<NavContextType | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [isResourcesNavOpen, setIsResourcesNavOpen] = useState(true);

  return (
    <NavContext.Provider value={{ isResourcesNavOpen, setIsResourcesNavOpen }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const context = useContext(NavContext);
  if (context === undefined) {
    throw new Error('useNav must be used within a NavProvider');
  }
  return context;
}
