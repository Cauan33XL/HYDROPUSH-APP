export interface FeedbackData {
    rating: number;
    feedback: string;
    date: string;
    appVersion: string;
    userStats?: {
        totalDays: number;
        totalWater: number;
        currentStreak: number;
    };
}
