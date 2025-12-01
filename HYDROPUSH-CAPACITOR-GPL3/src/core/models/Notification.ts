export interface NotificationSettings {
    enabled: boolean;
    permission: 'granted' | 'denied' | 'default';
    lastRequested: string;
    scheduledReminders: boolean;
    reminderTimes: string[];
}
