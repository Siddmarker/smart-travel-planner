'use client';

import { useStore } from '@/store/useStore';
import { TripCard } from '@/components/TripCard';
import { Button } from '@/components/ui/button';
import { PlusCircle, Map } from 'lucide-react';
import Link from 'next/link';

export default function TripsPage() {
    const { trips } = useStore();

    if (!trips || trips.length === 0) {
        return (
            <div className="container mx-auto p-6 max-w-7xl min-h-[80vh] flex flex-col items-center justify-center text-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6">
                    <Map className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">No Trips Yet</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mb-8">
                    You haven't planned any trips yet. Start your adventure by creating your first trip!
                </p>
                <Link href="/trips/new">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Plan a New Trip
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Trips</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your upcoming adventures and past journeys.
                    </p>
                </div>
                <Link href="/trips/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Trip
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                ))}
            </div>
        </div>
    );
}
