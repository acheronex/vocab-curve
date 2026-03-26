import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem('er-theme') as Theme | null;
      return stored || 'system';
    } catch {
      return 'system';
    }
  });

  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    const root = window.document.documentElement;
    const resolved: ResolvedTheme = t === 'system' ? getSystemTheme() : t;
    
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
  }, [getSystemTheme]);

  useEffect(() => {
    applyTheme(theme);
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme, applyTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('er-theme', newTheme);
    } catch {
      // localStorage unavailable
    }
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  return { theme, setTheme, resolvedTheme };
}