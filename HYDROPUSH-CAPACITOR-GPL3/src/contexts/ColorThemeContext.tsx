/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';

// Stubbed ColorThemeContext to keep compatibility while feature is removed.
// Avoids breaking imports; consumer code should migrate to useTheme/useTheming.

type ColorThemeContextShape = {
  currentTheme: null | Record<string, unknown>;
  setColorTheme: (theme?: unknown) => void;
  availableThemes: unknown[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
};

const noop = () => undefined;

const defaultValue: ColorThemeContextShape = {
  currentTheme: null,
  setColorTheme: noop,
  availableThemes: [],
  isLoading: false,
  error: null,
  clearError: noop
};

const ColorThemeContext = createContext<ColorThemeContextShape | null>(defaultValue);

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  return <ColorThemeContext.Provider value={defaultValue}>{children}</ColorThemeContext.Provider>;
}

export const useColorTheme = (): ColorThemeContextShape => {
  const ctx = useContext(ColorThemeContext);
  if (!ctx) return defaultValue;
  return ctx;
};