import React from 'react';

interface ThemeColorPickerProps {
  onBack: () => void;
}

// Placeholder component kept to avoid breaking imports.
// The full color-theme feature was removed—this screen now shows a short message.
export function ThemeColorPicker({ onBack }: ThemeColorPickerProps) {
  React.useEffect(() => {
    console.info('ThemeColorPicker is a placeholder: color themes were removed.');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h2 className="text-xl font-semibold text-foreground mb-2">Personalização de cor removida</h2>
        <p className="text-sm text-muted-foreground mb-4">O Hydropush agora oferece apenas Tema Claro e Tema Escuro para simplificar a experiência.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-primary text-white"
        >Voltar</button>
      </div>
    </div>
  );
}