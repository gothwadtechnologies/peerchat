import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/StorageService';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'hi-in' | 'en-us';

const translations = {
  'hi-in': {
    settings: 'Settings',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    chats: 'Chats',
    status: 'Status',
    calls: 'Calls',
  },
  'en-us': {
    settings: 'Settings',
    preferences: 'Preferences',
    language: 'Language',
    theme: 'Theme',
    chats: 'Chats',
    status: 'Status',
    calls: 'Calls',
  }
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['en-us']) => string;
  chatBackground: string;
  setChatBackground: (bg: string) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = storage.getItem('app-theme');
    return (saved as Theme) || 'system';
  });

  const [language, setLanguage] = useState<Language>(() => {
    const saved = storage.getItem('app-lang');
    return (saved as Language) || 'en-us';
  });

  const [chatBackground, setChatBackground] = useState<string>(() => {
    return storage.getItem('app-chat-bg') || '';
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  );

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  const t = (key: keyof typeof translations['en-us']) => {
    return translations[language][key] || translations['en-us'][key];
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    storage.setItem('app-theme', theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // Update theme-color meta tag for PWA status bar
    let themeColor = resolvedTheme === 'light' ? '#ffffff' : '#202124';
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', themeColor);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    storage.setItem('app-lang', language);
  }, [language]);

  useEffect(() => {
    storage.setItem('app-chat-bg', chatBackground);
  }, [chatBackground]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      language, 
      setLanguage, 
      t, 
      chatBackground, 
      setChatBackground, 
      resolvedTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
