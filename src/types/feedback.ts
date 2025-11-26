export type FeedbackType = 'bug' | 'feature' | 'general' | 'content';

export interface FeedbackSubmission {
    type: FeedbackType;
    rating: number;
    message: string;
    category: string;
    urgency?: 'low' | 'medium' | 'high';
    allowContact: boolean;
    screenshot?: string | null;
    pageContext: string;
    userActions?: any[];
    userId?: string;
    userEmail?: string;
    timestamp: string;
    userAgent: string;
}

export interface FeedbackTypeConfig {
    icon: string;
    title: string;
    description: string;
    categories: string[];
}
