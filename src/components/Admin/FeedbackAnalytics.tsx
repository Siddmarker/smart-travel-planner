'use client';

import { useState } from 'react';

export function FeedbackAnalytics() {
    const [timeRange, setTimeRange] = useState('7d');

    // Mock data
    const analytics = {
        totalFeedback: 124,
        feedbackGrowth: 12,
        avgRating: 4.2,
        responseRate: 85,
        featureRequests: 45,
        types: [
            { name: 'Bug', count: 32, percentage: 25, icon: '🐛' },
            { name: 'Feature', count: 45, percentage: 36, icon: '💡' },
            { name: 'General', count: 28, percentage: 22, icon: '💬' },
            { name: 'Content', count: 19, percentage: 15, icon: '🏛️' }
        ],
        sentiment: { positive: 65, neutral: 25, negative: 10 },
        topFeatures: [
            { id: 1, title: 'Dark Mode Support', upvotes: 156, status: 'planned' },
            { id: 2, title: 'Offline Maps', upvotes: 142, status: 'in-progress' },
            { id: 3, title: 'Group Chat', upvotes: 98, status: 'review' }
        ]
    };

    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">📊 Feedback Analytics</h2>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="p-2 border rounded-lg bg-white"
                >
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-3xl font-bold">{analytics.totalFeedback}</div>
                    <div className="text-sm text-gray-500">Total Feedback</div>
                    <div className="text-xs text-green-600 mt-2 font-medium">
                        📈 +{analytics.feedbackGrowth}% vs last period
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-3xl font-bold">{analytics.avgRating}</div>
                    <div className="text-sm text-gray-500">Average Rating</div>
                    <div className="text-xs text-yellow-600 mt-2 font-medium">
                        ⭐⭐⭐⭐⭐
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-3xl font-bold">{analytics.responseRate}%</div>
                    <div className="text-sm text-gray-500">Response Rate</div>
                    <div className="text-xs text-blue-600 mt-2 font-medium">
                        👥 High Engagement
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="text-3xl font-bold">{analytics.featureRequests}</div>
                    <div className="text-sm text-gray-500">Feature Requests</div>
                    <div className="text-xs text-purple-600 mt-2 font-medium">
                        💡 New Ideas
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Feedback Types */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="font-bold mb-4">Feedback Distribution</h3>
                    <div className="space-y-4">
                        {analytics.types.map(type => (
                            <div key={type.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="flex items-center gap-2">
                                        {type.icon} {type.name}
                                    </span>
                                    <span className="text-gray-500">{type.count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${type.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sentiment */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <h3 className="font-bold mb-4">Sentiment Analysis</h3>
                    <div className="grid grid-cols-3 gap-4 text-center h-full items-center">
                        <div className="p-4 bg-green-50 rounded-xl">
                            <div className="text-3xl mb-2">😍</div>
                            <div className="font-bold text-green-700">{analytics.sentiment.positive}%</div>
                            <div className="text-xs text-green-600">Positive</div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <div className="text-3xl mb-2">😐</div>
                            <div className="font-bold text-gray-700">{analytics.sentiment.neutral}%</div>
                            <div className="text-xs text-gray-600">Neutral</div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-xl">
                            <div className="text-3xl mb-2">😞</div>
                            <div className="font-bold text-red-700">{analytics.sentiment.negative}%</div>
                            <div className="text-xs text-red-600">Negative</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Features */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <h3 className="font-bold mb-4">🚀 Top Feature Requests</h3>
                <div className="space-y-4">
                    {analytics.topFeatures.map((feature, index) => (
                        <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 flex items-center justify-center bg-white rounded-full font-bold text-gray-400 border">
                                    #{index + 1}
                                </div>
                                <div>
                                    <div className="font-bold">{feature.title}</div>
                                    <div className="text-xs text-gray-500">
                                        👍 {feature.upvotes} votes
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                ${feature.status === 'planned' ? 'bg-blue-100 text-blue-700' :
                                    feature.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-700'}`}>
                                {feature.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
