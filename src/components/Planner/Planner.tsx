'use client';

import { useState } from 'react';
import { ItineraryView } from './ItineraryView';
import { BudgetView } from '../Budget/BudgetView';
import { Polls } from '../Collaboration/Polls';
import { Chat } from '../Collaboration/Chat';
import { RouteMap } from '../Map/RouteMap';
import { RouteControls } from '../Map/RouteControls';
import { Trip } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { optimizeRoute, routeToItinerary, RoutePreferences, OptimizedRoute } from '@/lib/route-optimizer/optimizer';
import { v4 as uuidv4 } from 'uuid';

interface PlannerProps {
    trip: Trip;
}

export function Planner({ trip }: PlannerProps) {
    const { updateTrip, places } = useStore();
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
    const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
        transportMode: 'driving',
        priority: 'balanced',
        returnToStart: trip.preferences?.returnToStart || false,
        startTime: trip.preferences?.startTime || '09:00',
        endTime: trip.preferences?.endTime || '20:00',
        visitDuration: 90, // 1.5 hours per place
    });

    const handleOptimizeRoute = () => {
        setIsOptimizing(true);

        // Simulate async optimization
        setTimeout(() => {
            const startLocation = trip.destination;
            const route = optimizeRoute(startLocation, places.slice(0, 8), routePreferences);
            setOptimizedRoute(route);
            setIsOptimizing(false);
        }, 1000);
    };

    const handleApplyRoute = () => {
        if (!optimizedRoute) return;

        // Generate days if not present
        let days = [...trip.days];
        if (days.length === 0) {
            const start = new Date(trip.startDate);
            const end = new Date(trip.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            for (let i = 0; i <= diffDays; i++) {
                const date = new Date(start);
                date.setDate(date.getDate() + i);
                days.push({
                    id: uuidv4(),
                    date: date.toISOString(),
                    items: []
                });
            }
        }

        // Apply optimized route to first day
        if (days.length > 0) {
            const itineraryItems = routeToItinerary(optimizedRoute, days[0].date, routePreferences);
            days[0] = {
                ...days[0],
                items: itineraryItems
            };

            updateTrip(trip.id, { days });
        }
    };

    return (
        <Tabs defaultValue="itinerary" className="h-full flex flex-col">
            <div className="px-1 mb-2 flex justify-between items-center">
                <TabsList className="grid w-[400px] grid-cols-4">
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="route">Route</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="itinerary" className="flex-1 mt-0 overflow-hidden">
                <ItineraryView trip={trip} />
            </TabsContent>

            <TabsContent value="route" className="flex-1 mt-0 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full p-4">
                    {/* Controls */}
                    <div className="space-y-4">
                        <RouteControls
                            preferences={routePreferences}
                            onPreferencesChange={setRoutePreferences}
                            onOptimize={handleOptimizeRoute}
                            isOptimizing={isOptimizing}
                        />

                        {optimizedRoute && (
                            <div className="bg-white rounded-lg border p-4 space-y-3">
                                <h3 className="font-semibold">Route Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Distance:</span>
                                        <span className="font-medium">{optimizedRoute.totalDistance.toFixed(1)} km</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Travel Time:</span>
                                        <span className="font-medium">{optimizedRoute.totalDuration} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Optimization Score:</span>
                                        <span className="font-medium">{optimizedRoute.optimizationScore}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Stops:</span>
                                        <span className="font-medium">{optimizedRoute.segments.length}</span>
                                    </div>
                                </div>
                                <Button onClick={handleApplyRoute} className="w-full" variant="outline">
                                    Apply to Itinerary
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2 h-[600px] lg:h-full rounded-lg overflow-hidden border">
                        {optimizedRoute ? (
                            <RouteMap
                                startLocation={trip.destination}
                                segments={optimizedRoute.segments}
                                animate={true}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center bg-muted text-muted-foreground">
                                Click "Optimize Route" to see the optimized path
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="budget" className="flex-1 mt-0 overflow-hidden">
                <BudgetView trip={trip} />
            </TabsContent>

            <TabsContent value="collaboration" className="flex-1 mt-0 overflow-hidden overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    <div className="border-r pr-4">
                        <Polls trip={trip} />
                    </div>
                    <div className="pl-4">
                        <h2 className="text-xl font-semibold p-4 pb-0">Group Chat</h2>
                        <Chat trip={trip} />
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}

