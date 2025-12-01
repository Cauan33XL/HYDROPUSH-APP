import React from 'react';

// Wrapper que ativa globalmente o efeito liquid glass no HTML root
export function RootLiquidGlassWrapper({ children }: { children: React.ReactNode }) {
    React.useEffect(() => {
        try {
            document.documentElement.classList.add('liquid-glass-enabled');
            // aplicar variante dark se já estiver setada
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.add('liquid-glass--dark');
            } else {
                document.documentElement.classList.add('liquid-glass--light');
            }
        } catch {
            // ignore em ambientes sem DOM
        }

        return () => {
            try {
                document.documentElement.classList.remove('liquid-glass-enabled', 'liquid-glass--dark', 'liquid-glass--light');
            } catch {
                // ignore
            }
        };
    }, []);

    return <div className="min-h-screen bg-background">{children}</div>;
}
