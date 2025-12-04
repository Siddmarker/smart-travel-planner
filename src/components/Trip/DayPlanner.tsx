'use client';

import React, { useState } from 'react';
import { DayPlan, Place } from '@/types';
import { useTrip } from '@/contexts/TripContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, MapPin, Clock, Star } from 'lucide-react';
import Image from 'next/image';
import { PlaceSearch } from './PlaceSearch';
import { VotingSystem } from './VotingSystem';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface DayPlannerProps {
    day: DayPlan;
}

export function DayPlanner({ day }: DayPlannerProps) {
    const { addPlaceToSlot } = useTrip();
    const [activeSlot, setActiveSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleAddPlace = async (place: Place) => {
        await addPlaceToSlot(day.dayNumber, activeSlot, place);
        setIsSearchOpen(false);
    };

    const renderPlaceCard = (place: Place) => (
        <div key={place.id || place.googlePlaceId} className="flex gap-4 p-4 border rounded-lg mb-4 bg-card hover:bg-accent/50 transition-colors">
            <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                {place.image || place.photoUrl ? (
                    <Image
                        src={place.image || place.photoUrl || ''}
                        alt={place.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <MapPin className="w-8 h-8" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-lg truncate">{place.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{place.description || place.address}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{place.rating}</span>
                        <span className="text-xs">({place.reviews || place.reviewCount})</span>
                    </div>
                    {place.priceLevel && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">{'$'.repeat(place.priceLevel)}</span>
                        </div>
                    )}
                </div>
                <VotingSystem place={place} dayNumber={day.dayNumber} slot={activeSlot} />
            </div>
        </div>
    );

    return (
        <Card className="w-full mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Day {day.dayNumber}</CardTitle>
                <div className="text-sm text-muted-foreground">
                    {day.status === 'complete' ? (
                        <span className="text-green-500 font-medium">Complete</span>
                    ) : (
                        <span className="text-amber-500 font-medium">Planning...</span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={activeSlot} onValueChange={(v) => setActiveSlot(v as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="morning">Morning</TabsTrigger>
                        <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                        <TabsTrigger value="evening">Evening</TabsTrigger>
                    </TabsList>

                    {['morning', 'afternoon', 'evening'].map((slot) => (
                        <TabsContent key={slot} value={slot} className="space-y-4">
                            <div className="min-h-[200px]">
                                {day[slot as keyof DayPlan] && (day[slot as keyof DayPlan] as Place[]).length > 0 ? (
                                    (day[slot as keyof DayPlan] as Place[]).map(renderPlaceCard)
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                                        <Clock className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No activities planned for {slot}</p>
                                    </div>
                                )}

                                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full mt-4 border-dashed">
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add Activity
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                                        <PlaceSearch onSelect={handleAddPlace} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}
