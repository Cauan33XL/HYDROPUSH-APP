import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../core/services/StorageService';
import type { AppSettings } from '../core/services/StorageService';

/* eslint-disable react-refresh/only-export-components */
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para limpar erros
  const clearError = () => setError(null);

  // Aplicar tema no DOM
  const applyTheme = useCallback((newTheme: Theme) => {
    try {
      const root = document.documentElement;
      const body = document.body;
      
      // Remover todas as classes de tema primeiro
      root.classList.remove('dark', 'light');
      body.classList.remove('dark', 'light');
      
      // Aplicar o novo tema de forma forçada
      if (newTheme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
        root.style.colorScheme = 'dark';
        body.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        body.classList.add('light');
        root.style.colorScheme = 'light';
        body.style.colorScheme = 'light';
      }
      
      // Forçar múltiplos repaints para garantir aplicação
      void root.offsetHeight;
      void body.offsetHeight;
      
      // Forçar atualização das variáveis CSS
      setTimeout(() => {
        void root.offsetHeight;
        void body.offsetHeight;
      }, 0);
      
      // Atualizar meta theme-color para mobile
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        if (newTheme === 'dark') {
          themeColorMeta.setAttribute('content', '#0A0E13');
        } else {
          themeColorMeta.setAttribute('content', '#ffffff');
        }
      }
      
      // Disparar evento para notificar outros contextos
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: newTheme } 
      }));

    } catch (err) {
      console.error('Erro ao aplicar tema:', err);
      setError('Erro ao aplicar tema visual.');
    }
  }, []);

  // Carregar tema salvo do storageService
  const loadSavedTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const appSettings = storageService.loadAppSettings();
      const savedTheme = appSettings.theme === 'dark' ? 'dark' : 'light';
      
      setThemeState(savedTheme);
      applyTheme(savedTheme);

    } catch (err) {
      console.error('Erro ao carregar tema:', err);
      setError('Erro ao carregar configurações do tema.');
      
      // Fallback para tema claro
      setThemeState('light');
      applyTheme('light');
    } finally {
      setIsLoading(false);
    }
  }, [applyTheme]);

  // Carregar tema ao iniciar
  useEffect(() => {
    loadSavedTheme();
  }, [loadSavedTheme]);

  // Escutar mudanças no ColorTheme para atualizar meta theme-color
  useEffect(() => {
    const handleColorThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');

      if (isDark && customEvent.detail.theme.darkInfluence) {
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          themeColorMeta.setAttribute('content', customEvent.detail.theme.darkInfluence.background);
        }
      }
    };

    window.addEventListener('colorThemeChanged', handleColorThemeChange);

    return () => {
      window.removeEventListener('colorThemeChanged', handleColorThemeChange);
    };
  }, []);

  // Escutar mudanças no storage (sync entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'hydropush_app_settings' && e.newValue) {
        try {
          const newSettings: AppSettings = JSON.parse(e.newValue);
          const newTheme = newSettings.theme === 'dark' ? 'dark' : 'light';
          if (newTheme !== theme) {
            // Recarregar tema se mudou em outra aba
            loadSavedTheme();
          }
        } catch (err) {
          console.error('Erro ao processar mudança de storage:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [theme, loadSavedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      setError(null);
      
      setThemeState(newTheme);
      
      // Salvar no storageService
      storageService.saveAppSettings({ theme: newTheme });
      
      applyTheme(newTheme);

      // Disparar evento global para notificar outras partes do app
      window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: newTheme }
      }));

    } catch (err) {
      console.error('Erro ao definir tema:', err);
      setError('Erro ao salvar configurações do tema.');
      
      // Reverter para tema anterior em caso de erro
      loadSavedTheme();
    }
  }, [applyTheme, loadSavedTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
    isLoading,
    error,
    clearError
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};