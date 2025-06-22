
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Theme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    accent: string;
    background: string;
    cardBackground: string;
    groupBackground: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    fresh: string;
    expiring: string;
    expired: string;
    shadow: string;
  };
}

const themes: Theme[] = [
  {
    id: 'sunlit-kitchen',
    name: 'Sunlit Kitchen',
    emoji: '☀️',
    colors: {
      primary: 'bg-yellow-500',
      primaryHover: 'hover:bg-yellow-600',
      secondary: 'bg-orange-100',
      accent: 'bg-amber-200',
      background: 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50',
      cardBackground: 'bg-white/80',
      groupBackground: 'bg-yellow-50/50',
      text: 'text-yellow-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-yellow-100',
      fresh: 'text-green-600 bg-green-100',
      expiring: 'text-orange-600 bg-orange-100',
      expired: 'text-red-600 bg-red-100',
      shadow: 'shadow-sm hover:shadow-md',
    }
  },
  {
    id: 'cozy-cottage',
    name: 'Cozy Cottage',
    emoji: '🏡',
    colors: {
      primary: 'bg-rose-500',
      primaryHover: 'hover:bg-rose-600',
      secondary: 'bg-pink-100',
      accent: 'bg-rose-200',
      background: 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50',
      cardBackground: 'bg-white/80',
      groupBackground: 'bg-rose-50/50',
      text: 'text-rose-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-rose-100',
      fresh: 'text-emerald-600 bg-emerald-100',
      expiring: 'text-amber-600 bg-amber-100',
      expired: 'text-red-600 bg-red-100',
      shadow: 'shadow-sm hover:shadow-md',
    }
  },
  {
    id: 'minimalist-white',
    name: 'Minimalist White',
    emoji: '🤍',
    colors: {
      primary: 'bg-gray-600',
      primaryHover: 'hover:bg-gray-700',
      secondary: 'bg-gray-100',
      accent: 'bg-blue-100',
      background: 'bg-gradient-to-br from-gray-50 to-slate-100',
      cardBackground: 'bg-white/90',
      groupBackground: 'bg-gray-50/80',
      text: 'text-gray-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-gray-200',
      fresh: 'text-green-700 bg-green-100',
      expiring: 'text-yellow-700 bg-yellow-100',
      expired: 'text-red-700 bg-red-100',
      shadow: 'shadow-sm hover:shadow-md',
    }
  },
  {
    id: 'forest-green',
    name: 'Fresh Garden',
    emoji: '🌿',
    colors: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      secondary: 'bg-green-100',
      accent: 'bg-amber-200',
      background: 'bg-gradient-to-br from-green-50 to-emerald-50',
      cardBackground: 'bg-white/80',
      groupBackground: 'bg-green-50/50',
      text: 'text-green-800',
      textSecondary: 'text-gray-600',
      textMuted: 'text-gray-500',
      border: 'border-green-100',
      fresh: 'text-green-600 bg-green-100',
      expiring: 'text-yellow-600 bg-yellow-100',
      expired: 'text-red-600 bg-red-100',
      shadow: 'shadow-sm hover:shadow-md',
    }
  }
];

interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[3]); // Default to Fresh Garden

  useEffect(() => {
    const savedTheme = localStorage.getItem('shelflife-theme');
    if (savedTheme) {
      const theme = themes.find(t => t.id === savedTheme);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      localStorage.setItem('shelflife-theme', themeId);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
