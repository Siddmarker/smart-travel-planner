'use client';

import { useState, useEffect, useMemo } from 'react';
import { Trip, DayPlan, Place, ItineraryItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Sun, Sunset, Moon, Coffee } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { useStore } from '@/store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RouteMap } from '../Map/RouteMap';
import { SmartItineraryBuilder, SmartDay, TimeSlotName, DayStatus } from '@/lib/smart-itinerary';
import { AddActivityModal } from './AddActivityModal';
import { UnifiedTravelPlanner } from '@/lib/unified-planner';
import { UserPreferences } from '@/types';
import { Sparkles } from 'lucide-react';
import { TripPlanner } from '../SmartPlanner/TripPlanner';

interface ItineraryViewProps {
    trip: Trip;
}

export function ItineraryView({ trip }: ItineraryViewProps) {
    const { updateTrip, places } = useStore();
    const [selectedDayId, setSelectedDayId] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Add Activity Modal State
    const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
    const [activeDayId, setActiveDayId] = useState<string>('');
    const [activeTimeSlot, setActiveTimeSlot] = useState<TimeSlotName>('Morning');

    // Initialize Smart Itinerary
    const smartItinerary = useMemo(() => {
        const builder = new SmartItineraryBuilder(trip);
        return builder.forceShowAllDays();
    }, [trip]);

    // Set initial selected day
    useEffect(() => {
        if (smartItinerary.length > 0 && !selectedDayId) {
            setSelectedDayId(smartItinerary[0].id);
        }
    }, [smartItinerary, selectedDayId]);

    const handleAddActivityClick = (dayId: string, slotName: TimeSlotName) => {
        setActiveDayId(dayId);
        setActiveTimeSlot(slotName);
        setIsAddActivityOpen(true);
    };

    const handlePlaceSelected = (place: Place) => {
        const day = smartItinerary.find(d => d.id === activeDayId);
        if (!day) return;

        // Calculate start time based on slot
        let startTime = '09:00';
        if (activeTimeSlot === 'Afternoon') startTime = '13:00';
        if (activeTimeSlot === 'Evening') startTime = '18:00';
        if (activeTimeSlot === 'Night') startTime = '21:00';

        const newItem: ItineraryItem = {
            id: crypto.randomUUID(),
            placeId: place.id,
            startTime: startTime,
            endTime: startTime, // Placeholder
            type: 'activity',
            notes: `Added to ${activeTimeSlot}`
        };

        // Update Trip
        const currentDays = trip.itinerary?.days || [];
        const updatedDays = currentDays.map(d => {
            if (d.id === activeDayId) {
                return { ...d, items: [...d.items, newItem] };
            }
            return d;
        });

        // If day didn't exist in trip.itinerary.days (was auto-generated), we need to add it
        if (!currentDays.find(d => d.id === activeDayId)) {
            const newDay: DayPlan = {
                id: activeDayId,
                dayNumber: day.dayNumber,
                date: day.date,
                planningMode: 'manual',
                status: 'partial',
                morning: [],
                afternoon: [],
                evening: [],
                items: [newItem]
            };
            // Insert in correct order (simplified)
            const allDays = smartItinerary.map(sd => {
                if (sd.id === activeDayId) {
                    return { ...sd, items: [...sd.items, newItem], planningMode: 'manual' as const, status: 'partial' as const };
                }
                const existing = currentDays.find(td => td.id === sd.id);
                return existing || { ...sd, planningMode: 'manual' as const, status: 'empty' as const, items: [] };
            });
            updateTrip(trip.id, { itinerary: { ...trip.itinerary, days: allDays } } as Partial<Trip>);
        } else {
            updateTrip(trip.id, { itinerary: { ...trip.itinerary, days: updatedDays } } as Partial<Trip>);
        }

        setIsAddActivityOpen(false);
    };

    const handleAutoPlan = async (dayId: string) => {
        const day = smartItinerary.find(d => d.id === dayId);
        if (!day) return;

        setIsGenerating(true);
        try {
            const planner = new UnifiedTravelPlanner();

            // Calculate index for context
            const dayIndex = smartItinerary.findIndex(d => d.id === dayId);

            // Construct preferences from trip data
            // Note: In a real app, we'd have more detailed preferences stored
            const preferences: UserPreferences = {
                trip_duration: 1, // Plan one day at a time for now
                budget: 'medium',
                categories: ['attraction', 'food', 'culture'],
                dietary: [],
                start_location: trip.destination,
                destination: trip.destination,
                trip_dates: {
                    start: day.date,
                    end: day.date
                },
                day_start_time: new Date(new Date(day.date).setHours(9, 0, 0, 0)),
                return_to_start: false,
                // Pass context for smart suggestions
                isFirstDay: dayIndex === 0,
                isLastDay: dayIndex === smartItinerary.length - 1
            } as any; // Cast to any to bypass strict type check for now, or update type definition

            // Run the workflow
            // We pass empty availablePlaces to force discovery
            const result = await planner.unified_planning_workflow(preferences, []);

            // The result is keyed by day number (1-based relative to duration)
            // Since we asked for 1 day, we take day 1
            const dayItinerary = result[1];

            if (dayItinerary && dayItinerary.length > 0) {
                const currentDays = trip.itinerary?.days || [];
                // Update the trip with new items
                const updatedDays = currentDays.map(d => {
                    if (d.id === dayId) {
                        return { ...d, items: [...d.items, ...dayItinerary] };
                    }
                    return d;
                });

                // If day didn't exist in trip.itinerary.days (was auto-generated), we need to add it
                if (!currentDays.find(d => d.id === dayId)) {
                    const allDays = smartItinerary.map(sd => {
                        if (sd.id === dayId) {
                            return { ...sd, planningMode: 'ai' as const, status: 'partial' as const, items: [...sd.items, ...dayItinerary] };
                        }
                        const existing = currentDays.find(td => td.id === sd.id);
                        return existing || { ...sd, planningMode: 'manual' as const, status: 'empty' as const, items: [] };
                    });
                    updateTrip(trip.id, { itinerary: { ...trip.itinerary, days: allDays } } as Partial<Trip>);
                } else {
                    updateTrip(trip.id, { itinerary: { ...trip.itinerary, days: updatedDays } } as Partial<Trip>);
                }
            }
        } catch (error) {
            console.error("Auto-planning failed:", error);
            // Ideally show a toast here
        } finally {
            setIsGenerating(false);
        }
    };

    // Helper to construct route segments for the map
    const getDaySegments = (dayItems: ItineraryItem[]): any[] => {
        if (!dayItems || dayItems.length === 0) return [];

        const segments: any[] = [];
        let currentLocation = trip.destination;

        dayItems.forEach((item) => {
            const place = places.find((p) => p.id === item.placeId);
            if (place) {
                segments.push({
                    from: currentLocation,
                    to: place,
                    distance: 0,
                    duration: 0,
                    mode: 'driving'
                });
                currentLocation = place;
            }
        });

        return segments;
    };

    const getSlotIcon = (name: string) => {
        switch (name) {
            case 'Morning': return <Coffee className="h-4 w-4 text-orange-500" />;
            case 'Afternoon': return <Sun className="h-4 w-4 text-yellow-500" />;
            case 'Evening': return <Sunset className="h-4 w-4 text-purple-500" />;
            case 'Night': return <Moon className="h-4 w-4 text-indigo-500" />;
            default: return <CalendarIcon className="h-4 w-4" />;
        }
    };

    const [viewMode, setViewMode] = useState<'standard' | 'smart'>('standard');

    // ... existing code ...

    if (viewMode === 'smart') {
        const userPreferences: UserPreferences = {
            trip_duration: trip.days.length,
            budget: 'medium',
            categories: ['attraction', 'food', 'culture'],
            dietary: [],
            start_location: trip.destination,
            destination: trip.destination,
            trip_dates: {
                start: trip.startDate,
                end: trip.endDate
            },
            day_start_time: new Date(),
            return_to_start: false
        } as any;

        return (
            <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 px-4 pt-4">
                    <h2 className="text-2xl font-bold">Smart Planner</h2>
                    <Button variant="outline" onClick={() => setViewMode('standard')}>
                        Back to Standard View
                    </Button>
                </div>
                <div className="flex-1 overflow-auto">
                    <TripPlanner
                        tripData={{
                            destination: trip.destination.name || 'Destination',
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                            totalDays: trip.days.length
                        }}
                        userPreferences={userPreferences}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h2 className="text-2xl font-bold">Itinerary</h2>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => setViewMode('smart')}
                    >
                        <Sparkles className="h-4 w-4" />
                        Smart Planner Mode
                    </Button>
                    {/* Add Day button could go here */}
                </div>
            </div>

            <Tabs value={selectedDayId} onValueChange={setSelectedDayId} className="flex-1 flex flex-col overflow-hidden">
                {/* ... existing Tabs content ... */}
                <div className="px-4">
                    <ScrollArea className="w-full whitespace-nowrap pb-2">
                        <TabsList className="w-full justify-start bg-transparent p-0 gap-2">
                            {smartItinerary.map((day, index) => (
                                <TabsTrigger
                                    key={day.id}
                                    value={day.id}
                                    className="min-w-[120px] data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20"
                                >
                                    <div className="flex flex-col items-start w-full">
                                        <div className="flex justify-between w-full items-center">
                                            <span className="font-semibold">Day {index + 1}</span>
                                            {day.status === 'COMPLETED' && <span className="text-green-500 text-xs">✓</span>}
                                            {day.status === 'IN_PROGRESS' && <span className="text-blue-500 text-xs">●</span>}
                                            {day.status === 'NOT_STARTED' && <span className="text-gray-300 text-xs">○</span>}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>
                </div>

                {smartItinerary.map((day) => (
                    <TabsContent key={day.id} value={day.id} className="flex-1 mt-0 overflow-hidden">
                        <div className="grid grid-cols-1 gap-4 h-full p-4 pt-0">
                            {/* Time Slots */}
                            <ScrollArea className="h-full pr-4">
                                {day.isEmpty ? (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 border-2 border-dashed rounded-xl m-4">
                                        <div className="p-4 bg-primary/10 rounded-full">
                                            <CalendarIcon className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Day {day.dayNumber} is empty</h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto">
                                                Start planning your activities for this day.
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={() => handleAddActivityClick(day.id, 'Morning')} variant="outline">
                                                Manually Add
                                            </Button>
                                            <Button onClick={() => handleAutoPlan(day.id)} disabled={isGenerating}>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                {isGenerating ? 'Planning...' : 'Auto-Plan with AI'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 pb-10">
                                        {day.timeSlots.map((slot) => (
                                            <div key={slot.name} className="space-y-3">
                                                <div className="flex items-center gap-2 pb-2 border-b">
                                                    {getSlotIcon(slot.name)}
                                                    <h3 className="font-medium text-lg">{slot.name}</h3>
                                                    <span className="text-xs text-muted-foreground ml-auto">
                                                        {slot.activities.length} activities
                                                    </span>
                                                </div>

                                                {slot.activities.length === 0 ? (
                                                    <div
                                                        className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground hover:bg-accent/50 cursor-pointer transition-colors"
                                                        onClick={() => handleAddActivityClick(day.id, slot.name)}
                                                    >
                                                        <p className="text-sm mb-2">No activities planned</p>
                                                        <Button variant="ghost" size="sm" className="h-8">
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add to {slot.name}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {slot.activities.map((item) => {
                                                            const place = places.find((p) => p.id === item.placeId);
                                                            return (
                                                                <ActivityCard
                                                                    key={item.id}
                                                                    item={item}
                                                                    place={place}
                                                                    onDelete={() => {
                                                                        // Implement delete
                                                                        const currentDays = trip.itinerary?.days || [];
                                                                        const newDays = currentDays.map(d => {
                                                                            if (d.id === day.id) {
                                                                                return { ...d, items: d.items.filter(i => i.id !== item.id) };
                                                                            }
                                                                            return d;
                                                                        });
                                                                        updateTrip(trip.id, { itinerary: { ...trip.itinerary, days: newDays } } as Partial<Trip>);
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-muted-foreground hover:text-primary"
                                                            onClick={() => handleAddActivityClick(day.id, slot.name)}
                                                        >
                                                            <Plus className="h-3 w-3 mr-1" />
                                                            Add another activity
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            <AddActivityModal
                isOpen={isAddActivityOpen}
                onClose={() => setIsAddActivityOpen(false)}
                onSelectPlace={handlePlaceSelected}
                dayId={activeDayId}
                timeSlot={activeTimeSlot}
            />
        </div>
    );
}

