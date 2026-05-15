import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '../../../contexts/ThemeContext';

export function Toast() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        style: {
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
    />
  );
}