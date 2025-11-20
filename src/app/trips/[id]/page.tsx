'use client';

import { useParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Planner } from '@/components/Planner/Planner';
import Map from '@/components/Map/Map';
import { PlaceSearch } from '@/components/Map/PlaceSearch';
import { Button } from '@/components/ui/button';
import { Settings, Star, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Trip, Place } from '@/types';
import { ReviewModal } from '@/components/ReviewModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteLink } from '@/components/InviteLink';

export default function TripPage() {
    const params = useParams();
    const { trips } = useStore();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [places, setPlaces] = useState<Place[]>([]);

    useEffect(() => {
        if (params.id) {
            const foundTrip = trips.find((t) => t.id === params.id);
            setTrip(foundTrip || null);
        }
    }, [params.id, trips]);

    if (!trip) {
        return <div>Trip not found</div>;
    }

    const isTripEnded = new Date(trip.endDate) < new Date();
    const hasReview = !!trip.review;

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                            {hasReview && (
                                <div className="flex items-center gap-1 ml-4 px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full border border-yellow-200">
                                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                    <span className="font-medium">{trip.review?.rating}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isTripEnded && !hasReview && (
                            <ReviewModal tripId={trip.id}>
                                <Button variant="outline" className="gap-2">
                                    <Star className="h-4 w-4" />
                                    Leave a Review
                                </Button>
                            </ReviewModal>
                        )}
                        <div className="flex -space-x-2">
                            {trip.participants.map((user) => (
                                <Avatar key={user.id} className="border-2 border-white w-8 h-8">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        <InviteLink trip={trip} />
                        <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </header>

                {hasReview && (
                    <div className="px-6 py-4 bg-white border-b">
                        <div className="bg-gray-50 rounded-lg p-4 border">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < (trip.review?.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    Reviewed on {new Date(trip.review!.date).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-gray-700">{trip.review?.comment}</p>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
                        {/* Left Panel: Planner/Budget */}
                        <div className="lg:col-span-2 border-r bg-white overflow-y-auto">
                            <Planner trip={trip} />
                        </div>

                        {/* Right Panel: Map & Discovery */}
                        <div className="hidden lg:flex flex-col h-full bg-gray-100">
                            <div className="h-1/2 border-b relative">
                                <Map
                                    center={trip.destination}
                                    zoom={13}
                                    places={places}
                                />
                            </div>
                            <div className="h-1/2 overflow-hidden">
                                <PlaceSearch onAddPlace={(place) => {
                                    setPlaces((prevPlaces) => [...prevPlaces, place]);
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
