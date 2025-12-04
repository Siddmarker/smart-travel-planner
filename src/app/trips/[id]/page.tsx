'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTrip } from '@/contexts/TripContext';
import { DayPlanner } from '@/components/Trip/DayPlanner';
import { Button } from '@/components/ui/button';
import { Loader2, Share2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TripDashboard() {
    const params = useParams();
    const { currentTrip, fetchTrip, loading, error, generateAIItinerary } = useTrip();
    const { toast } = useToast();
    const id = params?.id as string;

    useEffect(() => {
        if (id) {
            fetchTrip(id);
        }
    }, [id, fetchTrip]);

    const handleCopyInvite = () => {
        if (!currentTrip?.joinCode) return;
        const url = `${window.location.origin}/join/${currentTrip.joinCode}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Invite Link Copied!",
            description: "Share this link with friends to let them join the trip.",
        });
    };

    if (loading && !currentTrip) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center flex-col gap-4">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => fetchTrip(id)}>Retry</Button>
            </div>
        );
    }

    if (!currentTrip) return null;

    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">{currentTrip.name}</h1>
                    <p className="text-muted-foreground">
                        {new Date(currentTrip.startDate).toLocaleDateString()} - {new Date(currentTrip.endDate).toLocaleDateString()} • {currentTrip.destination.name}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCopyInvite}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Invite
                    </Button>
                    {currentTrip.planningMode !== 'ai' && (
                        <Button onClick={generateAIItinerary} disabled={loading}>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate AI Itinerary
                        </Button>
                    )}
                    {/* Admin Controls - Mocking admin check for now */}
                    {currentTrip.votingStatus === 'not_started' && (
                        <Button onClick={async () => {
                            await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/start-voting`, {
                                method: 'POST',
                                body: JSON.stringify({ userId: currentTrip.adminId }) // Mocking current user as admin
                            });
                            fetchTrip(id);
                        }}>
                            Start Voting
                        </Button>
                    )}
                    {currentTrip.votingStatus === 'open' && (
                        <Button onClick={async () => {
                            await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/finalize`, {
                                method: 'POST',
                                body: JSON.stringify({ userId: currentTrip.adminId })
                            });
                            fetchTrip(id);
                        }} variant="destructive">
                            Finalize Trip
                        </Button>
                    )}
                </div>
            </div>

            {/* Days Grid */}
            <div className="grid gap-8">
                {currentTrip.days.map((day) => (
                    <DayPlanner key={day.dayNumber} day={day} />
                ))}
            </div>
        </div>
    );
}
