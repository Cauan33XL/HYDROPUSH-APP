export interface Tip {
    id: string;
    title: string;
    content: string;
    type: 'performance' | 'general' | 'motivational';
    conditions?: {
        minCompletion?: number;
        maxCompletion?: number;
        minStreak?: number;
        maxStreak?: number;
        timeOfDay?: 'morning' | 'afternoon' | 'evening';
    };
}
