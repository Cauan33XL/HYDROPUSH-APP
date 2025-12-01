import { useTheme } from './ThemeContext';
import { storageService } from '../core/services/StorageService';

/**
 * Simplified theming hook: only manages light/dark theme now.
 * The color-theme feature was removed to reduce complexity.
 */
export function useTheming() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const applyCompleteTheme = (lightOrDark: 'light' | 'dark') => {
    try {
      setTheme(lightOrDark);
      storageService.saveAppSettings({ theme: lightOrDark });
    } catch (err) {
      console.error('Erro ao aplicar tema:', err);
    }
  };

  const getThemeClasses = () => {
    const isDark = theme === 'dark';
    const baseClasses = `${isDark ? 'dark' : 'light'}`;
    return {
      base: baseClasses,
      text: isDark ? 'text-foreground' : 'text-foreground',
      background: isDark ? 'bg-background' : 'bg-background',
      card: isDark ? 'bg-card' : 'bg-card',
      border: isDark ? 'border-border' : 'border-border'
    };
  };

  return {
    theme,
    setTheme,
    toggleTheme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    applyCompleteTheme,
    getThemeClasses
  };
}

export default useTheming;