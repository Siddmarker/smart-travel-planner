'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export function FeedbackIncentives() {
    const { user } = useAuth();
    const [feedbackCount, setFeedbackCount] = useState(0);

    useEffect(() => {
        // Mock fetching user stats
        // In real app: await getUserFeedbackStats(user.id)
        setFeedbackCount(Math.floor(Math.random() * 15)); // Random for demo
    }, [user]);

    const incentives = [
        { threshold: 1, reward: '🎖️ Feedback Novice', desc: 'Give your first feedback' },
        { threshold: 5, reward: '💎 Early Access', desc: 'Access new features early' },
        { threshold: 10, reward: '🚀 Priority Support', desc: 'Faster response times' },
        { threshold: 25, reward: '🤖 Beta AI Features', desc: 'Test cutting-edge AI' },
        { threshold: 50, reward: '👑 Champion', desc: 'Exclusive community status' }
    ];

    const nextMilestone = incentives.find(inc => inc.threshold > feedbackCount);

    return (
        <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h3 className="text-xl font-bold mb-6">🎯 Your Feedback Impact</h3>

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600">{feedbackCount}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Given</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                    <div className="text-2xl font-bold text-green-600">{Math.floor(feedbackCount / 3)}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Implemented</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600">{feedbackCount * 10}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Impact Pts</div>
                </div>
            </div>

            {nextMilestone && (
                <div className="mb-8 p-4 border rounded-xl bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">Next: {nextMilestone.reward}</span>
                        <span className="text-xs text-gray-500">{feedbackCount}/{nextMilestone.threshold}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${(feedbackCount / nextMilestone.threshold) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{nextMilestone.desc}</p>
                </div>
            )}

            <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-900">Rewards</h4>
                {incentives.map(inc => (
                    <div
                        key={inc.threshold}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${feedbackCount >= inc.threshold ? 'bg-green-50 border-green-200' : 'opacity-50'
                            }`}
                    >
                        <span className="text-xl">{feedbackCount >= inc.threshold ? '✅' : '🔒'}</span>
                        <div>
                            <div className="font-medium text-sm">{inc.reward}</div>
                            <div className="text-xs text-gray-500">{inc.threshold} feedbacks required</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
