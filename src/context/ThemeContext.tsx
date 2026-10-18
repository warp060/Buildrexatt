import React, { createContext, useContext, useState, useEffect } from 'react';

export type ColorTheme = 'indigo' | 'violet' | 'emerald' | 'sunset' | 'ocean';

export interface ThemeOption {
  id: ColorTheme;
  name: string;
  primaryColor: string;
  accentColor: string;
  previewGradient: string;
  description: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'indigo',
    name: 'Midnight Indigo',
    primaryColor: '#0F172A',
    accentColor: '#6366F1',
    previewGradient: 'from-slate-900 via-indigo-950 to-indigo-600',
    description: 'Executive dark obsidian with electric royal indigo accents',
  },
  {
    id: 'violet',
    name: 'Cyber Violet',
    primaryColor: '#1E1035',
    accentColor: '#8B5CF6',
    previewGradient: 'from-slate-950 via-purple-950 to-violet-600',
    description: 'Futuristic ultraviolet with vivid neon purple glow',
  },
  {
    id: 'emerald',
    name: 'Emerald Aurora',
    primaryColor: '#062820',
    accentColor: '#10B981',
    previewGradient: 'from-slate-950 via-emerald-950 to-teal-500',
    description: 'High-tech biometric forest with radiant emerald mint',
  },
  {
    id: 'sunset',
    name: 'Sunset Crimson',
    primaryColor: '#280A15',
    accentColor: '#F43F5E',
    previewGradient: 'from-slate-950 via-rose-950 to-amber-500',
    description: 'Warm luxury crimson with sunrise amber highlights',
  },
  {
    id: 'ocean',
    name: 'Abyss Ocean',
    primaryColor: '#071A2C',
    accentColor: '#06B6D4',
    previewGradient: 'from-slate-950 via-cyan-950 to-sky-500',
    description: 'Deep marine abyss with electric cyber cyan accents',
  },
];

interface ThemeContextType {
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  themes: ThemeOption[];
  activeThemeOption: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ColorTheme>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('buildrex_theme') as ColorTheme : null;
    if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
      return saved;
    }
    return 'indigo';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('buildrex_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
  };

  const activeThemeOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEME_OPTIONS, activeThemeOption }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
