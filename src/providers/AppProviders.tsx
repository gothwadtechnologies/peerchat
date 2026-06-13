import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { SearchProvider } from '../contexts/SearchContext';
import { AuthProvider } from './AuthProvider';
import { CallProvider } from './CallProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider>
      <SearchProvider>
        <AuthProvider>
          <CallProvider>
            {children}
          </CallProvider>
        </AuthProvider>
      </SearchProvider>
    </ThemeProvider>
  );
};
