export interface HydrationEntry {
    timestamp: string;
    amount: number;
    type?: string;
}

export interface HydrationDay {
    date: string;
    amount: number;
    goal: number;
    entries: HydrationEntry[];
}
