
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TripSummary {
    id: string;
    name: string;
    destination: { name: string };
    dates: { start: string; end: string };
    tripState: string;
}

export default function TripsPage() {
    const [trips, setTrips] = useState<TripSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const res = await fetch('/api/trips');
                if (res.ok) {
                    const data = await res.json();
                    setTrips(data.trips);
                }
            } catch (error) {
                console.error('Failed to fetch trips:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTrips();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading trips...</div>;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">My Trips</h1>
                <Link href="/trips/new">
                    <Button>Plan New Trip</Button>
                </Link>
            </div>

            {trips.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <h2 className="text-xl font-semibold mb-2">No trips yet</h2>
                    <p className="text-gray-500 mb-6">Start planning your next adventure!</p>
                    <Link href="/trips/new">
                        <Button size="lg">Create Trip</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                            onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg truncate pr-2">{trip.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${trip.tripState === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        trip.tripState === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {trip.tripState}
                                </span>
                            </div>
                            <p className="text-gray-600 mb-1">📍 {trip.destination.name}</p>
                            <p className="text-sm text-gray-500">
                                📅 {new Date(trip.dates.start).toLocaleDateString()} - {new Date(trip.dates.end).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
