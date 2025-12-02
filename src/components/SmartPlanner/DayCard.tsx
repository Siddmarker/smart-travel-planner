import React from 'react';
import { TimeSlot } from './TimeSlot';
import { FeasibilityChecker } from './FeasibilityChecker';
import { ScoreBadge } from './Common';
import { Place } from '@/types';

interface DayCardProps {
    day: any;
    suggestions: any;
    onSelectPlace: (slot: string, placeIndex: number | null) => void;
    onNextDay: () => void;
    isLastDay: boolean;
}

export const DayCard: React.FC<DayCardProps> = ({ day, suggestions, onSelectPlace, onNextDay, isLastDay }) => {
    const timeSlots = [
        { key: 'morning', label: '🌅 Morning', time: '9:00 AM - 12:00 PM' },
        { key: 'afternoon', label: '☀️ Afternoon', time: '2:00 PM - 5:00 PM' },
        { key: 'evening', label: '🌙 Evening', time: '7:00 PM - 10:00 PM' }
    ];

    const selectedPlaces = Object.entries(day.slots || {})
        .filter(([_, slot]: [string, any]) => slot.selected)
        .map(([_, data]: [string, any]) => data.selected);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Day {day.dayNumber}: {new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
                    <div className="flex gap-3 mt-2">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                            <span>Score</span>
                            <span className="font-bold">{day.metrics?.avgScore || 0}</span>
                        </div>
                        {day.constraints && day.constraints.length === 0 && (
                            <span className="bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border border-green-400/30 text-green-50">
                                ✅ Feasible
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="text-sm font-medium opacity-90 mb-1">{selectedPlaces.length} of 3 slots planned</div>
                    <div className="w-32 bg-white/20 rounded-full h-2">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(selectedPlaces.length / 3) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {timeSlots.map(slot => (
                        <TimeSlot
                            key={slot.key}
                            slotKey={slot.key}
                            label={slot.label}
                            time={slot.time}
                            places={suggestions?.[slot.key] || []}
                            selectedPlace={day.slots?.[slot.key]?.selected}
                            onSelectPlace={(placeIndex) => onSelectPlace(slot.key, placeIndex)}
                        />
                    ))}
                </div>

                <FeasibilityChecker
                    day={day}
                    selectedPlaces={selectedPlaces}
                />

                {selectedPlaces.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <h3 className="font-bold text-lg text-gray-800 mb-4">🗺️ Today's Route</h3>
                        <div className="relative pl-8 border-l-2 border-blue-100 space-y-8">
                            {selectedPlaces.map((place: Place, index: number) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[41px] bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white">
                                        {index + 1}
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                        <div className="font-bold text-gray-800">{place.name}</div>
                                        <div className="text-sm text-gray-500 mt-1">{place.category}</div>
                                        {(place as any).travel_time_from_previous && index > 0 && (
                                            <div className="text-xs text-blue-600 mt-2 font-medium flex items-center gap-1">
                                                <span>🚶‍♂️</span> {(place as any).travel_time_from_previous} travel from previous
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                    ↻ Regenerate Suggestions
                </button>

                {!isLastDay ? (
                    <button
                        className={`px-6 py-3 rounded-lg font-bold text-white shadow-md transition-all transform hover:-translate-y-0.5 ${selectedPlaces.length >= 3 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        onClick={onNextDay}
                        disabled={selectedPlaces.length < 3}
                    >
                        {selectedPlaces.length >= 3 ? (
                            <span className="flex items-center gap-2">Plan Day {day.dayNumber + 1} →</span>
                        ) : (
                            <span>Complete {3 - selectedPlaces.length} more slots to continue</span>
                        )}
                    </button>
                ) : (
                    selectedPlaces.length >= 3 && (
                        <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                            🎉 Complete Itinerary!
                        </button>
                    )
                )}
            </div>
        </div>
    );
};
