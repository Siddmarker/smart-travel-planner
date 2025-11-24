'use client';

import { useState } from 'react';
import { Trip, DayPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { useStore } from '@/store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RouteMap } from '../Map/RouteMap';

interface ItineraryViewProps {
    trip: Trip;
}

export function ItineraryView({ trip }: ItineraryViewProps) {
    const { updateTrip, places } = useStore();
    const [selectedDayId, setSelectedDayId] = useState<string>(trip.days[0]?.id || 'no-days');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAddDay = () => {
        alert('Add Day functionality to be implemented');
    };

    const handleAddActivity = (dayId: string) => {
        alert(`Add activity to day ${dayId}`);
    };

    const handleGenerateItinerary = async () => {
        setIsGenerating(true);
        try {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            // Import enhanced planner
            const { UnifiedTravelPlanner } = await import('@/lib/unified-planner');
            const planner = new UnifiedTravelPlanner();

            const userPreferences = {
                destination: trip.destination,
                categories: trip.categoryPreferences?.categories || ['attraction', 'food', 'culture'],
                trip_duration: dayCount,
                trip_dates: { start: trip.startDate, end: trip.endDate },
                start_location: trip.destination,
                day_start_time: new Date(),
                return_to_start: trip.preferences?.returnToStart || false
            };

            // Execute unified workflow
            const optimizedItinerary = await planner.unified_planning_workflow(
                userPreferences,
                places,
                trip.categoryPreferences
            );

            console.log('Generated optimized itinerary:', optimizedItinerary);

            // Convert to DayPlan format
            const newDays: DayPlan[] = [];
            for (let day = 1; day <= dayCount; day++) {
                const currentDate = new Date(start);
                currentDate.setDate(start.getDate() + (day - 1));

                const dayItems = optimizedItinerary[day] || [];

                newDays.push({
                    id: crypto.randomUUID(),
                    date: currentDate.toISOString(),
                    items: dayItems
                });
            }

            if (newDays.length > 0) {
                updateTrip(trip.id, { days: newDays });
                setSelectedDayId(newDays[0].id);
                alert("Unified itinerary generated with voting-first logic!");
            } else {
                alert("No places available. Try adding more places.");
            }

        } catch (error) {
            console.error("Failed to generate itinerary", error);
            alert("Failed to generate itinerary. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!trip.days || trip.days.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No days planned yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding days to your itinerary.</p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={handleAddDay} variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Day 1
                    </Button>
                    <Button onClick={handleGenerateItinerary} disabled={isGenerating}>
                        {isGenerating ? 'Generating...' : 'Generate AI Itinerary'}
                    </Button>
                </div>
            </div>
        );
    }

    // Helper to construct route segments for the map
    const getDaySegments = (dayItems: any[]): any[] => {
        if (!dayItems || dayItems.length === 0) return [];

        const segments: any[] = [];
        let currentLocation = trip.destination; // Start from trip destination (or hotel if we had one)

        dayItems.forEach((item) => {
            const place = places.find((p) => p.id === item.placeId);
            if (place) {
                // Try to parse distance/duration from notes if available, otherwise mock
                // Notes format: "Travel: 5.2 km. Recommended..."
                let distance = 0;
                let duration = 0;

                if (item.notes) {
                    const distMatch = item.notes.match(/Travel: ([\d.]+) km/);
                    if (distMatch) distance = parseFloat(distMatch[1]);
                }

                segments.push({
                    from: currentLocation,
                    to: place,
                    distance: distance,
                    duration: duration,
                    mode: 'driving'
                });
                currentLocation = place;
            }
        });

        return segments;
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                <h2 className="text-2xl font-bold">Itinerary</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleGenerateItinerary} disabled={isGenerating}>
                        {isGenerating ? 'Regenerating...' : 'Regenerate AI Itinerary'}
                    </Button>
                    <Button size="sm" onClick={() => handleAddActivity(selectedDayId)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Activity
                    </Button>
                </div>
            </div>

            <Tabs value={selectedDayId} onValueChange={setSelectedDayId} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4">
                    <ScrollArea className="w-full whitespace-nowrap pb-2">
                        <TabsList className="w-full justify-start">
                            {trip.days.map((day, index) => (
                                <TabsTrigger key={day.id} value={day.id} className="min-w-[100px]">
                                    Day {index + 1}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </ScrollArea>
                </div>

                {trip.days.map((day) => (
                    <TabsContent key={day.id} value={day.id} className="flex-1 mt-0 overflow-hidden">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full p-4 pt-0">
                            {/* Left: Activity List */}
                            <ScrollArea className="h-full pr-4">
                                {day.items.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No activities for this day.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {day.items.map((item) => {
                                            const place = places.find((p) => p.id === item.placeId);
                                            return (
                                                <ActivityCard
                                                    key={item.id}
                                                    item={item}
                                                    place={place}
                                                    onDelete={() => {
                                                        console.log('Delete item', item.id);
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Right: Map */}
                            <div className="hidden lg:block h-full rounded-lg overflow-hidden border bg-muted relative">
                                {day.items.length > 0 ? (
                                    <RouteMap
                                        startLocation={trip.destination}
                                        segments={getDaySegments(day.items)}
                                        animate={false}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                        Add activities to see the route map
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
