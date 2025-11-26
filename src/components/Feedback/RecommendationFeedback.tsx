'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RecommendationFeedbackProps {
    recommendationId: string;
    placeName: string;
    onFeedback?: (type: string, reason?: string) => void;
}

export function RecommendationFeedback({ recommendationId, placeName, onFeedback }: RecommendationFeedbackProps) {
    const [feedback, setFeedback] = useState<{ reaction: string; reason?: string } | null>(null);

    const handleReaction = (reaction: string) => {
        const newFeedback = { reaction };
        setFeedback(newFeedback);
        if (onFeedback) onFeedback(reaction);

        // Mock API call
        console.log('Recommendation feedback:', { recommendationId, reaction });
    };

    const handleReason = (reason: string) => {
        if (!feedback) return;
        const updatedFeedback = { ...feedback, reason };
        setFeedback(updatedFeedback);
        if (onFeedback) onFeedback(feedback.reaction, reason);

        console.log('Recommendation feedback reason:', { recommendationId, reason });
    };

    if (feedback?.reaction && ['love', 'like'].includes(feedback.reaction)) {
        return (
            <div className="text-sm text-green-600 font-medium flex items-center gap-2 animate-in fade-in">
                <span>Thanks for the feedback! We'll show more like this.</span>
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Was this recommendation helpful?</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleReaction('love')}
                        className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${feedback?.reaction === 'love' ? 'bg-white shadow-md scale-110' : ''}`}
                        title="Love it"
                    >
                        😍
                    </button>
                    <button
                        onClick={() => handleReaction('like')}
                        className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${feedback?.reaction === 'like' ? 'bg-white shadow-md scale-110' : ''}`}
                        title="Like it"
                    >
                        👍
                    </button>
                    <button
                        onClick={() => handleReaction('dislike')}
                        className={`p-2 rounded-full hover:bg-white hover:shadow-sm transition-all ${feedback?.reaction === 'dislike' ? 'bg-white shadow-md scale-110' : ''}`}
                        title="Dislike"
                    >
                        👎
                    </button>
                </div>
            </div>

            {feedback?.reaction === 'dislike' && !feedback.reason && (
                <div className="animate-in slide-in-from-top-2">
                    <p className="text-xs text-gray-500 mb-2">What could be better?</p>
                    <div className="flex flex-wrap gap-2">
                        {['Not my style', 'Too expensive', 'Too far', 'Bad reviews'].map(reason => (
                            <button
                                key={reason}
                                onClick={() => handleReason(reason)}
                                className="text-xs px-2 py-1 bg-white border rounded-full hover:bg-gray-100 transition-colors"
                            >
                                {reason}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
