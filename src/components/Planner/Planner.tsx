'use client';

import { useState } from 'react';
import { ItineraryView } from './ItineraryView';
import { BudgetView } from '../Budget/BudgetView';
import { Polls } from '../Collaboration/Polls';
import { Chat } from '../Collaboration/Chat';
import { RouteMap } from '../Map/RouteMap';
import { RouteControls } from '../Map/RouteControls';
import { Trip, UserPreferences, Place, ItineraryItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, Map as MapIcon, Calendar, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { optimizeRoute, routeToItinerary, RoutePreferences, OptimizedRoute } from '@/lib/route-optimizer/optimizer';
import { UnifiedTravelPlanner } from '@/lib/unified-planner';
import { PreferencesModal, TripPreferences } from './PreferencesModal';
import { VotingInterface, VotingOption } from './VotingInterface';
import { v4 as uuidv4 } from 'uuid';

interface PlannerProps {
    trip: Trip;
}

type PlanningPhase = 'initial' | 'preferences' | 'voting' | 'result';

export function Planner({ trip }: PlannerProps) {
    const { updateTrip, places } = useStore();
    const [planningPhase, setPlanningPhase] = useState<PlanningPhase>(trip.days.length > 0 ? 'result' : 'initial');
    const [showPreferences, setShowPreferences] = useState(false);
    const [votingData, setVotingData] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Legacy route optimization state (kept for manual overrides)
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
    const [routePreferences, setRoutePreferences] = useState<RoutePreferences>({
        transportMode: 'driving',
        priority: 'balanced',
        returnToStart: trip.preferences?.returnToStart || false,
        startTime: trip.preferences?.startTime || '09:00',
        endTime: trip.preferences?.endTime || '20:00',
        visitDuration: 90,
    });

    const unifiedPlanner = new UnifiedTravelPlanner();

    const handleStartPlanning = () => {
        setShowPreferences(true);
    };

    const handlePreferencesSubmit = async (prefs: TripPreferences) => {
        setIsGenerating(true);
        try {
            // Construct UserPreferences
            const userPrefs: UserPreferences = {
                destination: trip.destination,
                categories: prefs.categories,
                trip_duration: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                trip_dates: { start: trip.startDate, end: trip.endDate },
                start_location: trip.destination, // Default to destination center
                day_start_time: new Date(`${trip.startDate}T09:00:00`),
                return_to_start: trip.preferences?.returnToStart || false,
                budget: prefs.budget,
                minRating: prefs.minRating,
                dietary: prefs.dietary,
                difficulty: prefs.difficulty
            };

            // Phase 1: Discover & Prepare Voting
            const result = await unifiedPlanner.discover_and_prepare_voting(userPrefs, []);
            setVotingData(result);
            setPlanningPhase('voting');
        } catch (error) {
            console.error("Error preparing voting:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVotingComplete = async (votes: { [day: number]: { [timeSlot: string]: VotingOption } }) => {
        setIsGenerating(true);
        try {
            // Construct UserPreferences (need to reconstruct or store in state, reconstructing for simplicity)
            const userPrefs: UserPreferences = {
                destination: trip.destination,
                categories: [], // Not needed for this step
                trip_duration: Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1,
                trip_dates: { start: trip.startDate, end: trip.endDate },
                start_location: trip.destination,
                day_start_time: new Date(`${trip.startDate}T09:00:00`),
                return_to_start: trip.preferences?.returnToStart || false,
            };

            // Convert UI votes to format expected by planner
            const votedPlan: any = {};
            Object.entries(votes).forEach(([day, slots]) => {
                votedPlan[day] = {};
                Object.entries(slots).forEach(([slot, option]) => {
                    votedPlan[day][slot] = { place: option.place };
                });
            });

            // Phase 3: Optimize
            const optimizedItinerary = await unifiedPlanner.optimize_post_voting_routing(votedPlan, userPrefs);

            // Update Trip
            const newDays = Object.entries(optimizedItinerary).map(([dayNum, items]) => {
                const date = new Date(trip.startDate);
                date.setDate(date.getDate() + (parseInt(dayNum) - 1));
                return {
                    id: uuidv4(),
                    dayNumber: parseInt(dayNum),
                    date: date.toISOString(),
                    planningMode: 'ai' as const,
                    status: 'complete' as const,
                    morning: [],
                    afternoon: [],
                    evening: [],
                    items: items
                };
            });

            updateTrip(trip.id, { days: newDays });
            setPlanningPhase('result');
        } catch (error) {
            console.error("Error optimizing itinerary:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOptimizeRoute = () => {
        setIsOptimizing(true);
        setTimeout(() => {
            const startLocation = trip.destination;
            const route = optimizeRoute(startLocation, places.slice(0, 8), routePreferences);
            setOptimizedRoute(route);
            setIsOptimizing(false);
        }, 1000);
    };

    const handleApplyRoute = () => {
        if (!optimizedRoute) return;
        // ... (Legacy apply logic if needed, but we rely on the new workflow mostly)
    };

    if (planningPhase === 'voting' && votingData) {
        return (
            <div className="h-full flex flex-col bg-background">
                {isGenerating ? (
                    <div className="flex-1 flex items-center justify-center flex-col space-y-4">
                        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                        <p className="text-lg font-medium">Optimizing your perfect trip...</p>
                    </div>
                ) : (
                    <VotingInterface
                        votingData={votingData.voting_interface}
                        totalDays={Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                        onVoteComplete={handleVotingComplete}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <PreferencesModal
                isOpen={showPreferences}
                onOpenChange={setShowPreferences}
                onSubmit={handlePreferencesSubmit}
            />

            <Tabs defaultValue="itinerary" className="h-full flex flex-col">
                <div className="px-4 py-2 border-b flex justify-between items-center bg-background">
                    <TabsList>
                        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                        <TabsTrigger value="route">Route Map</TabsTrigger>
                        <TabsTrigger value="budget">Budget</TabsTrigger>
                        <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                    </TabsList>

                    {planningPhase === 'initial' || planningPhase === 'result' ? (
                        <Button onClick={handleStartPlanning} size="sm" className="gap-2">
                            <Sparkles className="w-4 h-4" />
                            {planningPhase === 'result' ? 'Replan Trip' : 'Start Planning'}
                        </Button>
                    ) : null}
                </div>

                <TabsContent value="itinerary" className="flex-1 mt-0 overflow-hidden">
                    {planningPhase === 'initial' && trip.days.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4 text-center p-8">
                            <div className="bg-primary/10 p-6 rounded-full">
                                <MapIcon className="w-12 h-12 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Let's Plan Your Trip to {trip.destination.name}</h2>
                            <p className="text-muted-foreground max-w-md">
                                We'll help you discover amazing places, vote on activities, and create the perfect itinerary.
                            </p>
                            <Button onClick={handleStartPlanning} size="lg" className="gap-2">
                                <Sparkles className="w-5 h-5" />
                                Start AI Planner
                            </Button>
                        </div>
                    ) : (
                        <ItineraryView trip={trip} />
                    )}
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
                                    </div>
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
        </div>
    );
}
