'use client';

import { useState } from 'react';
import { Trip, DayPlan } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { useStore } from '@/store/useStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ItineraryViewProps {
    trip: Trip;
}

export function ItineraryView({ trip }: ItineraryViewProps) {
    const { updateTrip, places } = useStore();
    const [selectedDayId, setSelectedDayId] = useState<string>(trip.days[0]?.id || 'no-days');

    const handleAddDay = () => {
        // Logic to add a new day would go here
        // For now, we'll assume days are pre-generated based on dates
        alert('Add Day functionality to be implemented');
    };

    const handleAddActivity = (dayId: string) => {
        alert(`Add activity to day ${dayId}`);
    };

    if (!trip.days || trip.days.length === 0) {
        return (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No days planned yet</h3>
                <p className="text-muted-foreground mb-4">Start by adding days to your itinerary.</p>
                <Button onClick={handleAddDay}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Day 1
                </Button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Itinerary</h2>
                <Button size="sm" onClick={() => handleAddActivity(selectedDayId)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                </Button>
            </div>

            <Tabs value={selectedDayId} onValueChange={setSelectedDayId} className="flex-1 flex flex-col">
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

                {trip.days.map((day) => (
                    <TabsContent key={day.id} value={day.id} className="flex-1 mt-4">
                        <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                            {day.items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No activities for this day.
                                </div>
                            ) : (
                                day.items.map((item) => {
                                    const place = places.find((p) => p.id === item.placeId);
                                    return (
                                        <ActivityCard
                                            key={item.id}
                                            item={item}
                                            place={place}
                                            onDelete={() => {
                                                // Handle delete
                                                console.log('Delete item', item.id);
                                            }}
                                        />
                                    );
                                })
                            )}
                        </ScrollArea>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
