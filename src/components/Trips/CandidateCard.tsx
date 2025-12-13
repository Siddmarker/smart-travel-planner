
'use client';

import { Place } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useState } from 'react';

// Using local type for now or import from backend types
interface CandidateCardProps {
    place: any; // Using any for agility, ideally ICandidatePlace
    period: 'morning' | 'afternoon' | 'evening';
    dayId: string;
    onVote: (dayId: string, period: string, candidateId: string) => Promise<void>;
    isVoted: boolean; // Computed by parent based on current user ID
}

export function CandidateCard({ place, period, dayId, onVote, isVoted }: CandidateCardProps) {
    const [loading, setLoading] = useState(false);

    const handleVote = async () => {
        setLoading(true);
        await onVote(dayId, period, place.id);
        setLoading(false);
    };

    return (
        <Card className={`overflow-hidden h-full flex flex-col ${isVoted ? 'ring-2 ring-primary' : ''}`}>
            <div className="relative h-48 w-full">
                <Image
                    src={place.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'}
                    alt={place.name}
                    fill
                    className="object-cover"
                />
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                    {place.aiVibeCheck?.summary && (
                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded max-w-[200px] text-right">
                            ✨ "{place.aiVibeCheck.summary}"
                        </div>
                    )}
                    {place.aiVibeCheck?.isTouristTrap && (
                        <div className="bg-red-600/90 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                            ⚠️ Tourist Trap
                        </div>
                    )}
                    <div className="flex gap-1 flex-wrap justify-end">
                        {place.aiVibeCheck?.tags?.map((tag: string) => (
                            <span key={tag} className="bg-white/90 text-black text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <CardContent className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg leading-tight">{place.name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{place.category}</p>
                    </div>
                    <div className="flex items-center">
                        <span className="text-amber-500 text-sm">★</span>
                        <span className="text-sm font-medium ml-1">{place.rating}</span>
                    </div>
                </div>

                <div className="mt-auto pt-4 flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                        {place.votes?.length || 0} votes
                    </div>
                    <Button
                        variant={isVoted ? "default" : "outline"}
                        size="sm"
                        onClick={handleVote}
                        disabled={loading}
                    >
                        {isVoted ? 'Voted' : 'Vote'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
