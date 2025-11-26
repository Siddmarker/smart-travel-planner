import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function useFeedbackTriggers() {
    const { user } = useAuth();

    // Track user behavior for smart feedback prompts
    const trackInteraction = (action: string, metadata: any = {}) => {
        if (typeof window === 'undefined') return;

        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
        interactions.push({
            action,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            ...metadata
        });

        // Keep only last 50 interactions
        if (interactions.length > 50) {
            interactions.shift();
        }

        localStorage.setItem('userInteractions', JSON.stringify(interactions));
    };

    // Show feedback after completing key flows
    const triggerFlowCompletionFeedback = (flowName: string, success: boolean = true) => {
        if (typeof window === 'undefined') return;

        const flowsCompleted = JSON.parse(localStorage.getItem('completedFlows') || '{}');
        flowsCompleted[flowName] = {
            count: (flowsCompleted[flowName]?.count || 0) + 1,
            lastCompleted: new Date().toISOString(),
            success
        };
        localStorage.setItem('completedFlows', JSON.stringify(flowsCompleted));

        // Show feedback modal for first completion or after significant usage
        if (flowsCompleted[flowName]?.count === 1 || flowsCompleted[flowName]?.count % 5 === 0) {
            setTimeout(() => {
                // Dispatch custom event to open feedback modal
                // Note: You'll need to listen for this in FeedbackWidget
                window.dispatchEvent(new CustomEvent('openFeedback', {
                    detail: { type: 'general', context: flowName }
                }));
            }, 2000);
        }
    };

    // Detect frustration signals (e.g., rage clicks)
    const detectFrustration = () => {
        if (typeof window === 'undefined') return;

        const interactions = JSON.parse(localStorage.getItem('userInteractions') || '[]');
        const recentErrors = interactions.filter((i: any) =>
            i.action === 'error' &&
            new Date(i.timestamp).getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
        );

        const rapidClicks = interactions.filter((i: any) =>
            i.action === 'click' &&
            new Date(i.timestamp).getTime() > Date.now() - 30 * 1000 // Last 30 seconds
        ).length;

        if (recentErrors.length >= 3 || rapidClicks > 10) {
            window.dispatchEvent(new CustomEvent('openFeedback', {
                detail: { type: 'bug', context: 'frustration_detected' }
            }));
        }
    };

    return {
        trackInteraction,
        triggerFlowCompletionFeedback,
        detectFrustration
    };
}
