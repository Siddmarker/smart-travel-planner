'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { Plus, Plane, MapPin, DollarSign, Calendar } from 'lucide-react';
import { TripCard } from '@/components/TripCard';
import { DestinationDisplay } from '@/components/Dashboard/DestinationDisplay';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencySettings } from '@/components/CurrencySettings';

function DashboardContent() {
    const { trips, currentUser } = useStore();
    const { user } = useAuth(); // Use auth context user as fallback or primary
    const { formatAmount } = useCurrency();

    // Use currentUser from store if available, otherwise fallback to AuthContext user
    const displayUser = currentUser || (user ? { name: user.name, email: user.email } : null);

    // Calculate stats
    const totalTrips = trips.length;
    const upcomingTrips = trips.filter(t => new Date(t.startDate) > new Date()).length;
    const uniqueDestinations = new Set(trips.map(t => t.destination.name)).size;
    const totalSpent = trips.reduce((sum, trip) => sum + trip.budget.spent, 0);

    const stats = [
        { label: 'Total Trips', value: totalTrips, icon: Plane, color: 'text-blue-600' },
        { label: 'Upcoming', value: upcomingTrips, icon: Calendar, color: 'text-green-600' },
        { label: 'Destinations', value: uniqueDestinations, icon: MapPin, color: 'text-purple-600' },
        { label: 'Total Spent', value: formatAmount(totalSpent), icon: DollarSign, color: 'text-orange-600' },
    ];

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayUser?.name || 'Traveler'}!</h1>
                    <p className="text-muted-foreground mt-1">Plan your next adventure or discover new places</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/trips/new">
                        <Button size="lg">
                            <Plus className="mr-2 h-5 w-5" />
                            Plan New Trip
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <Icon className={`h-8 w-8 ${stat.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trips Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Your Trips</h2>
                        {trips.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">No trips planned yet</h3>
                                <p className="text-muted-foreground mb-4">Start planning your next adventure today!</p>
                                <Link href="/trips/new">
                                    <Button variant="outline">Create First Trip</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trips.map((trip) => (
                                    <TripCard key={trip.id} trip={trip} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Section */}
                <div className="space-y-6">
                    {/* Currency Settings */}
                    <CurrencySettings />

                    {/* Destination Display */}
                    <div>
                        <DestinationDisplay />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
