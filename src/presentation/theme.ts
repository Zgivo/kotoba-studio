import { useEffect } from 'react';
import type { InterfaceTheme } from '../domain/types';
import { useAppStore } from '../store/app-store';

export function useTheme() {
  const theme = useAppStore((state) => state.settings.interfaceTheme ?? 'light');
  const updateSettings = useAppStore((state) => state.updateSettings);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return {
    theme,
    setTheme: (next: InterfaceTheme) => updateSettings({ interfaceTheme: next }),
    toggleTheme: () => updateSettings({ interfaceTheme: theme === 'dark' ? 'light' : 'dark' }),
  };
}
