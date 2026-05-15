export interface User {
    id: string;
    email?: string;
    name: string;
    dailyGoalMl: number;
    createdAt?: string;
    lastLogin: string;
    weightKg: number;
    heightCm: number;
    sex: 'Masculino' | 'Feminino' | 'Prefiro não responder';
    themePref: 'light' | 'dark';
    level?: number;
    xp?: number;
    wakeTime?: string;
    sleepTime?: string;
    isAnonymous?: boolean;
}

export interface AuthData {
    user: User | null;
    isAuthenticated: boolean;
    sessionToken?: string;
}
