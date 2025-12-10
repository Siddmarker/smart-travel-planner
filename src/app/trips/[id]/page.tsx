'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Sparkles, AlertTriangle } from 'lucide-react';
import { DayPlanner } from '@/components/Planner/DayPlanner';
import { ExpenseManager } from '@/components/Planner/ExpenseManager';
import { ChatWindow } from '@/components/Planner/ChatWindow';

export default function TripDashboard() {
    const params = useParams();
    const id = params?.id as string;

    // State management
    const [trip, setTrip] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) fetchTrip();
    }, [id]);

    const fetchTrip = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/trips/${id}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to fetch trip');
            if (data.success) {
                setTrip(data.trip || data); // Handle structure variation
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateItinerary = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/trips/${id}/itinerary`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                // Refresh trip to see new itinerary
                fetchTrip();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !trip) {
        return (
            <div className="flex has-screen items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium">{error}</p>
                <Button onClick={fetchTrip}>Retry</Button>
            </div>
        );
    }

    if (!trip) return null;

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold">{trip.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {trip.destination?.mainLocation?.address || trip.location} • {trip.participants?.length || 1} Travelers
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigator.clipboard.writeText(window.location.href)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                    </Button>
                    <Button onClick={handleGenerateItinerary} disabled={loading || trip.itinerary?.days?.length > 0}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {trip.itinerary?.days?.length > 0 ? 'Regenerate AI Plan' : 'Generate AI Plan'}
                    </Button>
                </div>
            </div>

            {/* Tabs Interface */}
            <Tabs defaultValue="itinerary" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                    <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
                    <TabsTrigger value="expenses">Budget</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                    <TabsTrigger value="voting">Voting</TabsTrigger>
                </TabsList>

                <TabsContent value="itinerary" className="mt-6 space-y-6">
                    {/* Itinerary View */}
                    <div className="grid gap-8">
                        {trip.itinerary?.days?.map((day: any) => (
                            <DayPlanner key={day.dayNumber} day={day} />
                        ))}
                        {(!trip.itinerary?.days || trip.itinerary.days.length === 0) && (
                            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                                <p className="mb-4">No itinerary generated yet.</p>
                                <Button onClick={handleGenerateItinerary}>Generate with AI</Button>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="expenses" className="mt-6">
                    <ExpenseManager tripId={id} />
                </TabsContent>

                <TabsContent value="chat" className="mt-6">
                    <ChatWindow tripId={id} />
                </TabsContent>

                <TabsContent value="voting" className="mt-6">
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Voting System (Integration Pending)</p>
                        {/* Can integrate VotingInterface here later */}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
