export interface UserSettings {
    notifications: boolean;
    reminderInterval: number;
    quietHours: { start: string; end: string };
    weekendReminders: boolean;
    smartReminders: boolean;

    soundEnabled: boolean;
    hapticFeedback: boolean;
    notificationPermission: 'granted' | 'denied' | 'default';
    lastNotificationCheck: string;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'auto';
    colorTheme: string;
    completedOnboarding: boolean;
    completedInitialSetup: boolean;
    notificationOnboardingComplete?: boolean;
    firstTimeUser: boolean;
    language: string;
    fontSize: 'small' | 'medium' | 'large';
    reducedMotion: boolean;
    lastBackupDate?: string;
    backupFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
    lastRatingPrompt?: string | null;
    lastActiveView?: string | null; // ✅ Persiste qual tela/view o usuário estava
}

