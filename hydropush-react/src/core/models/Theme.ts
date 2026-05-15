export interface ColorTheme {
    id: string;
    name: string;
    description: string;
    primary: string;
    secondary: string;
    accent: string;
    preview: string;
    darkInfluence?: {
        background: string;
        card: string;
        muted: string;
        border: string;
    };
}

export interface ThemingSettings {
    currentTheme: 'light' | 'dark' | 'auto';
    systemTheme: 'light' | 'dark';
    useSystemTheme: boolean;
    accentColor: string;
    contrast: 'normal' | 'high';
}
