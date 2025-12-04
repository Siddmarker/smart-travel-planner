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
                    <DayPlanner key={day.dayNumber} day={day} />
                ))}
                </div>
            </div>
            );
}
