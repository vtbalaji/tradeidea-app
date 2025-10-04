'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  // Update actual theme based on preference
  const updateActualTheme = (themePreference: Theme) => {
    const systemTheme = getSystemTheme();
    const newActualTheme = themePreference === 'system' ? systemTheme : themePreference;
    console.log('updateActualTheme called:', { themePreference, systemTheme, newActualTheme });
    setActualTheme(newActualTheme);

    // Apply to document
    if (typeof document !== 'undefined') {
      if (newActualTheme === 'dark') {
        console.log('Adding dark class');
        document.documentElement.classList.add('dark');
      } else {
        console.log('Removing dark class');
        document.documentElement.classList.remove('dark');
      }
      console.log('HTML classes:', document.documentElement.className);
    }
  };

  // Initialize theme from localStorage or system
  useEffect(() => {
    setMounted(true);

    if (typeof window !== 'undefined') {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      const initialTheme = storedTheme || 'system';
      setThemeState(initialTheme);
      updateActualTheme(initialTheme);

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (theme === 'system') {
          updateActualTheme('system');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Update theme
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    updateActualTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
