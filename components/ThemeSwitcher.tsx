'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { AppThemeId, APP_THEMES } from '@/types/theme';

interface ThemeSwitcherProps {
  currentTheme: AppThemeId;
  onThemeChange: (themeId: AppThemeId) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  currentTheme,
  onThemeChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeThemeObj = APP_THEMES.find((t) => t.id === currentTheme) || APP_THEMES[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition shadow-sm"
        title="Switch Interface Theme"
        aria-expanded={isOpen}
      >
        <Palette className="w-3.5 h-3.5 text-zinc-400" />
        <span className="flex items-center space-x-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20 inline-block"
            style={{ backgroundColor: activeThemeObj.primaryHex }}
          />
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 hidden sm:inline">
            {activeThemeObj.name.split(' ')[0]}
          </span>
        </span>
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 p-2 space-y-1">
          <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Select Visual Theme
          </div>
          {APP_THEMES.map((theme) => {
            const isSelected = theme.id === currentTheme;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => {
                  onThemeChange(theme.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg transition flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-zinc-100 dark:bg-zinc-800/80 ring-1 ring-zinc-300 dark:ring-zinc-700'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                {/* Visual Swatch Pill */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner border border-zinc-300 dark:border-zinc-700"
                  style={{ backgroundColor: theme.bgHex }}
                >
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: theme.primaryHex }}
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      {theme.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2 mt-0.5">
                    {theme.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
