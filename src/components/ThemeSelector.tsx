import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEME_OPTIONS, ColorTheme } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';

interface ThemeSelectorProps {
  variant?: 'compact' | 'full';
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'compact' }) => {
  const { theme, setTheme, activeThemeOption } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 bg-white/90 hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 shadow-2xs group cursor-pointer"
        title="Customize workspace color theme"
        aria-label="Theme selector"
      >
        <span
          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: activeThemeOption.accentColor }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:inline" />
        <span className="hidden md:inline text-[11px] font-semibold text-slate-700">
          {activeThemeOption.name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Color Themes
            </span>
            <span className="text-[10px] text-slate-400">Instant Switch</span>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-950 font-semibold'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shadow-xs shrink-0 ring-2 ring-white"
                      style={{ backgroundColor: t.accentColor }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{t.description}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
