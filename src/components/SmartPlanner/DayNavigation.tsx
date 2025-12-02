import React from 'react';

interface DayNavigationProps {
    totalDays: number;
    currentDay: number;
    onDayChange: (day: number) => void;
    dayStatuses?: ('pending' | 'planned' | 'completed')[];
}

export const DayNavigation: React.FC<DayNavigationProps> = ({ totalDays, currentDay, onDayChange, dayStatuses = [] }) => {
    const getDayStatus = (dayNumber: number) => {
        if (dayStatuses[dayNumber - 1]) return dayStatuses[dayNumber - 1];
        if (dayNumber < currentDay) return 'completed';
        if (dayNumber === currentDay) return 'planned'; // Current is active
        return 'pending';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-800">Trip Timeline</h3>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {currentDay} of {totalDays} days planned
                </span>
            </div>

            <div className="relative">
                {/* Timeline Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full z-0"></div>

                {/* Progress Line */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-blue-500 -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${((currentDay - 1) / (totalDays - 1)) * 100}%` }}
                ></div>

                <div className="relative z-10 flex justify-between">
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map(dayNumber => {
                        const status = getDayStatus(dayNumber);
                        const isActive = currentDay === dayNumber;

                        let statusColor = 'bg-gray-200 text-gray-500 border-gray-200'; // Pending
                        if (status === 'completed') statusColor = 'bg-green-500 text-white border-green-500';
                        if (isActive) statusColor = 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100';

                        return (
                            <button
                                key={dayNumber}
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                                    ${statusColor} hover:scale-110
                                `}
                                onClick={() => onDayChange(dayNumber)}
                                title={`Day ${dayNumber}`}
                            >
                                {status === 'completed' ? '✓' : dayNumber}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
                <span>Start</span>
                <span>Finish</span>
            </div>
        </div>
    );
};
