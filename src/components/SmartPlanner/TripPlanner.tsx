import React, { useState, useEffect, useCallback } from 'react';
import { SmartItineraryPlanner } from '@/lib/smart-planner';
import { DayCard } from './DayCard';
import { DayNavigation } from './DayNavigation';
import { LoadingSpinner } from './Common';
import { SkeletonLoader } from './Common/SkeletonLoader';
import { UserPreferences } from '@/types';

interface TripPlannerProps {
    tripData: {
        destination: string;
        startDate: string;
        endDate: string;
        totalDays: number;
    };
    userPreferences: UserPreferences;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({ tripData, userPreferences }) => {
    const [planner, setPlanner] = useState<SmartItineraryPlanner | null>(null);
    const [currentDay, setCurrentDay] = useState(1);
    const [suggestions, setSuggestions] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);
    const [currentDayData, setCurrentDayData] = useState<any>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(userPreferences.interests || []);

    // Initialize planner
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
        const newPlanner = new SmartItineraryPlanner(apiKey, {
            ...userPreferences,
            interests: selectedCategories
        }, tripData);
        setPlanner(newPlanner);
    }, [tripData, userPreferences, selectedCategories]);

    // Load day data
    const loadDay = useCallback(async (dayNumber: number) => {
        if (!planner) return;

        setIsLoading(true);
        try {
            // Check if day is already planned or needs planning
            let dayData = planner.trip.days[dayNumber - 1];

            // If not planned or re-planning needed, call API
            if (dayData.status === 'pending') {
                dayData = await planner.planDay(dayNumber);
            }

            setCurrentDayData({ ...dayData }); // Clone to trigger re-render
            setSuggestions({
                morning: (dayData.slots as any).morning.places,
                afternoon: (dayData.slots as any).afternoon.places,
                evening: (dayData.slots as any).evening.places
            });
            setCurrentDay(dayNumber);

            // Pre-fetch next day in background
            if (dayNumber < tripData.totalDays) {
                setTimeout(() => {
                    console.log(`[TripPlanner] Pre-fetching day ${dayNumber + 1}`);
                    planner.suggestPlacesForDay(dayNumber + 1).catch(e => console.error('Pre-fetch failed', e));
                }, 1000);
            }

        } catch (err) {
            console.error('Error loading day:', err);
        } finally {
            setIsLoading(false);
        }
    }, [planner, tripData.totalDays]);

    // Load initial day when planner is ready
    useEffect(() => {
        if (planner && !currentDayData) {
            loadDay(1);
        }
    }, [planner, loadDay, currentDayData]);

    const handleSelectPlace = (slot: string, placeIndex: number | null) => {
        if (!planner) return;

        if (placeIndex === null) {
            const day = planner.trip.days[currentDay - 1];
            (day.slots as any)[slot].selected = null;
        } else {
            planner.selectPlace(currentDay, slot, placeIndex);
        }

        // Refresh UI
        setCurrentDayData({ ...planner.trip.days[currentDay - 1] });
    };

    const handleNextDay = () => {
        if (currentDay < tripData.totalDays) {
            loadDay(currentDay + 1);
        }
    };

    if (!planner) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <SkeletonLoader type="day" />
                <p className="text-gray-600 font-medium">Initializing planner...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tripData.destination}</h1>
                <p className="text-gray-600">
                    {new Date(tripData.startDate).toLocaleDateString()} - {new Date(tripData.endDate).toLocaleDateString()} • {tripData.totalDays} Days
                </p>
            </div>

            {/* Day Navigation */}
            <DayNavigation
                totalDays={tripData.totalDays}
                currentDay={currentDay}
                onDayChange={loadDay}
                dayStatuses={planner.trip.days.map(d => d.status)}
            />

            {/* Main Content */}
            {isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <SkeletonLoader type="day" />
                    <p className="text-center text-gray-500 mt-4">Planning Day {currentDay}...</p>
                </div>
            ) : (
                currentDayData && (
                    <DayCard
                        day={currentDayData}
                        suggestions={suggestions}
                        onSelectPlace={handleSelectPlace}
                        onNextDay={handleNextDay}
                        isLastDay={currentDay === tripData.totalDays}
                    />
                )
            )}

            {/* Category Filter */}
            <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Customize Your Interests</h3>
                <div className="flex flex-wrap gap-2">
                    {['Museum', 'History', 'Food', 'Nature', 'Shopping', 'Art', 'Adventure', 'Relaxation'].map(category => (
                        <button
                            key={category}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategories.includes(category)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            onClick={() => {
                                if (selectedCategories.includes(category)) {
                                    setSelectedCategories(prev => prev.filter(c => c !== category));
                                } else {
                                    setSelectedCategories(prev => [...prev, category]);
                                }
                            }}
                        >
                            {category} {selectedCategories.includes(category) ? '✓' : '+'}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
