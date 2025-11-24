import React, { useState } from 'react';
import { Place } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star, Clock, ThumbsUp, Check } from 'lucide-react';

export interface VotingOption {
    place: Place;
    category: string;
    quality_score: number;
    why_recommended: string;
    travel_time?: string; // e.g., "15 mins"
    distance_text?: string; // e.g., "5.2 km"
}

interface VotingInterfaceProps {
    votingData: {
        [day: number]: {
            [timeSlot: string]: VotingOption[];
        };
    };
    onVoteComplete: (votes: { [day: number]: { [timeSlot: string]: VotingOption } }) => void;
    totalDays: number;
}

export function VotingInterface({ votingData, onVoteComplete, totalDays }: VotingInterfaceProps) {
    const [currentDay, setCurrentDay] = useState(1);
    const [votes, setVotes] = useState<{ [day: number]: { [timeSlot: string]: VotingOption } }>({});

    const handleVote = (day: number, timeSlot: string, option: VotingOption) => {
        setVotes(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [timeSlot]: option
            }
        }));
    };

    const handleNextDay = () => {
        if (currentDay < totalDays) {
            setCurrentDay(prev => prev + 1);
        } else {
            // Finish voting
            onVoteComplete(votes);
        }
    };

    const isDayComplete = (day: number) => {
        const dayVotes = votes[day] || {};
        // Check if user voted for at least one slot (or all? let's say at least one for now to be flexible)
        return Object.keys(dayVotes).length > 0;
    };

    const timeSlots = ['morning', 'afternoon', 'evening'];
    const timeSlotLabels: Record<string, string> = {
        morning: '🌅 Morning (9AM - 12PM)',
        afternoon: '☀️ Afternoon (1PM - 5PM)',
        evening: '🌙 Evening (6PM - 9PM)'
    };

    return (
        <div className="h-full flex flex-col space-y-4 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Plan Day {currentDay} of {totalDays}</h2>
                    <p className="text-muted-foreground">Vote for your favorite activities</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                        Day {currentDay} Progress:
                    </span>
                    <div className="flex space-x-1">
                        {Array.from({ length: totalDays }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 w-8 rounded-full ${i + 1 === currentDay ? 'bg-primary' :
                                        i + 1 < currentDay ? 'bg-primary/50' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-8">
                    {timeSlots.map(slot => {
                        const options = votingData[currentDay]?.[slot] || [];
                        if (options.length === 0) return null;

                        const selectedOption = votes[currentDay]?.[slot];

                        return (
                            <div key={slot} className="space-y-4">
                                <h3 className="text-xl font-semibold flex items-center">
                                    {timeSlotLabels[slot]}
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {options.map((option) => {
                                        const isSelected = selectedOption?.place.id === option.place.id;

                                        return (
                                            <Card
                                                key={option.place.id}
                                                className={`relative overflow-hidden transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary border-primary' : ''
                                                    }`}
                                            >
                                                {/* Image Header */}
                                                <div className="h-32 w-full bg-muted relative">
                                                    {option.place.image ? (
                                                        <img
                                                            src={option.place.image}
                                                            alt={option.place.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-4xl">
                                                            🏞️
                                                        </div>
                                                    )}
                                                    {option.place.rating && (
                                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-sm">
                                                            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-yellow-500" />
                                                            {option.place.rating}
                                                        </div>
                                                    )}
                                                </div>

                                                <CardContent className="p-4">
                                                    <div className="mb-2">
                                                        <h4 className="font-bold line-clamp-1" title={option.place.name}>
                                                            {option.place.name}
                                                        </h4>
                                                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                                                            <MapPin className="w-3 h-3 mr-1" />
                                                            {option.distance_text ? (
                                                                <span>{option.distance_text} • {option.travel_time}</span>
                                                            ) : (
                                                                <span>Calculating distance...</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-muted-foreground mb-3 line-clamp-2 bg-muted/50 p-2 rounded">
                                                        💡 {option.why_recommended}
                                                    </div>

                                                    <div className="flex justify-between items-center mt-4">
                                                        {option.place.priceLevel !== undefined && (
                                                            <div className="text-xs font-medium text-muted-foreground">
                                                                {'💰'.repeat(option.place.priceLevel)}
                                                            </div>
                                                        )}
                                                        <Button
                                                            size="sm"
                                                            variant={isSelected ? "default" : "outline"}
                                                            className="w-full ml-2"
                                                            onClick={() => handleVote(currentDay, slot, option)}
                                                        >
                                                            {isSelected ? (
                                                                <>
                                                                    <Check className="w-4 h-4 mr-1" /> Voted
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ThumbsUp className="w-4 h-4 mr-1" /> Vote
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="pt-4 border-t flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {Object.keys(votes[currentDay] || {}).length} / 3 slots voted
                </div>
                <Button
                    onClick={handleNextDay}
                    disabled={!isDayComplete(currentDay)}
                    size="lg"
                >
                    {currentDay === totalDays ? 'Finish Planning 🎉' : 'Next Day ➡️'}
                </Button>
            </div>
        </div>
    );
}
