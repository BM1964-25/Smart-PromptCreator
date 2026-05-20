import { useEffect } from 'react';
import type { ThemeMode } from '../types/domain';

export function useTheme(theme?: ThemeMode) {
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', dark);
  }, [theme]);
}
