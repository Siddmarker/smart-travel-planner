'use client';

import React from 'react';
import { Place } from '@/types';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useTrip } from '@/contexts/TripContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VotingSystemProps {
    place: Place;
    dayNumber: number;
    slot: 'morning' | 'afternoon' | 'evening';
}

export function VotingSystem({ place, dayNumber, slot }: VotingSystemProps) {
    const { currentTrip, updateTripState } = useTrip();
    const { user } = useAuth();

    // Helper to safely access votes
    const votes = (place as any).votes || { up: [], down: [] };
    const upvotes = votes.up?.length || 0;
    const downvotes = votes.down?.length || 0;

    const userVote = user ? (votes.up?.includes(user.id) ? 'up' : votes.down?.includes(user.id) ? 'down' : null) : null;

    const handleVote = async (type: 'up' | 'down') => {
        if (!user || !currentTrip) return;

        // Optimistic update
        // This is complex to do deeply nested, so we might skip optimistic for now or do a shallow clone
        // For simplicity/safety, we'll wait for server response or just trigger fetch

        try {
            const response = await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    dayNumber,
                    slot,
                    placeId: place.id || place.googlePlaceId,
                    voteType: userVote === type ? null : type // Toggle off if same
                })
            });

            const result = await response.json();
            if (result.success) {
                updateTripState(result.trip);
            }
        } catch (error) {
            console.error('Voting failed:', error);
        }
    };

    return (
        <div className="flex items-center gap-2 mt-2">
            <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 gap-1", userVote === 'up' && "text-green-600 bg-green-50")}
                onClick={() => handleVote('up')}
            >
                <ThumbsUp className="w-4 h-4" />
                <span>{upvotes}</span>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 px-2 gap-1", userVote === 'down' && "text-red-600 bg-red-50")}
                onClick={() => handleVote('down')}
            >
                <ThumbsDown className="w-4 h-4" />
                <span>{downvotes}</span>
            </Button>
        </div>
    );
}
