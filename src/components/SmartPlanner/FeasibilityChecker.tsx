import React from 'react';
import { Place } from '@/types';

interface FeasibilityCheckerProps {
    day: any;
    selectedPlaces: Place[];
}

export const FeasibilityChecker: React.FC<FeasibilityCheckerProps> = ({ day, selectedPlaces }) => {
    const checks = [
        {
            id: 'time',
            label: '⏱️ Time Feasibility',
            check: () => selectedPlaces.length === 3,
            message: 'All time slots filled'
        },
        {
            id: 'travel',
            label: '🚗 Travel Distance',
            check: () => {
                let totalTravel = 0;
                for (let i = 1; i < selectedPlaces.length; i++) {
                    const travelTimeStr = (selectedPlaces[i] as any).travel_time_from_previous;
                    const travelTime = travelTimeStr ? parseInt(travelTimeStr) : 30;
                    totalTravel += travelTime;
                }
                return totalTravel <= 120; // Max 2 hours travel
            },
            message: 'Travel time is reasonable'
        },
        {
            id: 'hours',
            label: '🕒 Opening Hours',
            check: () => selectedPlaces.every(place => (place as any).is_open_now !== false),
            message: 'All places are open during planned times'
        },
        {
            id: 'category',
            label: '🎯 Category Balance',
            check: () => {
                const categories = selectedPlaces.map(p => p.category);
                const uniqueCategories = new Set(categories);
                return uniqueCategories.size >= 2;
            },
            message: 'Good variety of activities'
        },
        {
            id: 'cost',
            label: '💰 Budget Match',
            check: () => {
                const totalCost = selectedPlaces.reduce((sum, place) => {
                    const costMap: { [key: string]: number } = { '$': 10, '$$': 30, '$$$': 60, '$$$$': 100, '$$$$$': 200 };
                    return sum + (costMap[(place as any).cost_range] || 30);
                }, 0);
                return totalCost <= 200; // Example budget limit
            },
            message: 'Within daily budget'
        }
    ];

    const passedChecks = checks.filter(check => check.check()).length;
    const totalChecks = checks.length;
    const feasibilityScore = Math.round((passedChecks / totalChecks) * 100);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6 shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                ✅ Feasibility Check
            </h3>

            <div className="flex items-center gap-6 mb-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                        />
                        <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke={feasibilityScore >= 70 ? '#10b981' : feasibilityScore >= 40 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 36}`}
                            strokeDashoffset={`${2 * Math.PI * 36 * (1 - feasibilityScore / 100)}`}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-bold text-gray-800">{feasibilityScore}%</span>
                    </div>
                </div>

                <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2 font-medium">{passedChecks} of {totalChecks} checks passed</p>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${feasibilityScore >= 70 ? 'bg-green-500' : feasibilityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${feasibilityScore}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {checks.map(check => {
                    const passed = check.check();
                    return (
                        <div key={check.id} className={`flex items-start gap-3 p-3 rounded-lg border ${passed ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                            <div className="text-lg mt-0.5">{passed ? '✅' : '❌'}</div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-800 text-sm">{check.label}</div>
                                <div className={`text-xs mt-0.5 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                                    {passed ? check.message : 'Needs attention'}
                                </div>
                            </div>
                            {!passed && (
                                <button className="text-xs font-medium text-red-600 hover:text-red-800 bg-white px-2 py-1 rounded border border-red-200 shadow-sm hover:shadow transition-all">
                                    Fix
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {feasibilityScore < 70 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 flex gap-2">
                    <span>⚠️</span>
                    <div>
                        <strong>Warning:</strong> Your itinerary may be difficult to execute. Consider reducing travel distance or checking opening hours.
                    </div>
                </div>
            )}
        </div>
    );
};
