import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, ExternalLink, ThumbsUp, Check } from 'lucide-react';
import { VotingOption } from './VotingInterface'; // Import interface from sibling

// Simple mock for Place until strict types are aligned
interface Place {
    googlePlaceId?: string;
    name: string;
    address: string;
    rating?: number;
    photoUrl?: string;
    [key: string]: any;
}

interface DayPlannerProps {
    day: any;
    onVote?: (placeId: string, slot: string) => void;
}

export function DayPlanner({ day, onVote }: DayPlannerProps) {
    const timeSlots = [
        { key: 'morning', label: 'Morning', icon: '🌅' },
        { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
        { key: 'evening', label: 'Evening', icon: '🌙' }
    ];

    const getActivities = (slotKey: string) => {
        // Handle robust schema where activities might be arrays of places
        // The new schema uses 'places' array within time slot objects or direct arrays
        // Adapting to both for safety
        const slotData = day[slotKey];
        if (Array.isArray(slotData)) return slotData;
        if (slotData && Array.isArray(slotData.places)) return slotData.places;
        return [];
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Day {day.dayNumber}</span>
                    <Badge variant="outline">{day.date ? new Date(day.date).toLocaleDateString() : 'Date TBD'}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {timeSlots.map((slot) => (
                    <div key={slot.key} className="space-y-3">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <span>{slot.icon}</span> {slot.label}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getActivities(slot.key).map((activity: any, idx: number) => (
                                <Card key={idx} className="overflow-hidden">
                                    <div className="h-32 bg-slate-100 relative">
                                        {/* Image placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center text-4xl">🏞️</div>
                                        {activity.photoUrl && (
                                            <img src={activity.photoUrl} alt={activity.name} className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div className="p-3 space-y-2">
                                        <h4 className="font-medium line-clamp-1">{activity.name}</h4>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {activity.address || 'Unknown location'}
                                        </div>
                                        {/* Voting Button - integrated directly */}
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-full mt-2"
                                            onClick={() => onVote?.(activity._id, slot.key)}
                                        >
                                            <ThumbsUp className="w-3 h-3 mr-2" /> Vote
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                            {getActivities(slot.key).length === 0 && (
                                <div className="col-span-full text-center text-muted-foreground py-4 bg-slate-50 rounded-lg border border-dashed">
                                    No activities planned for {slot.key}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
