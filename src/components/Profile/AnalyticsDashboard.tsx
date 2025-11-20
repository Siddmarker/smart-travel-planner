'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, MapPin, DollarSign, Calendar, TrendingUp, Award } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function AnalyticsDashboard() {
    const { trips } = useStore();

    // Calculate statistics
    const totalTrips = trips.length;
    const completedTrips = trips.filter(t => new Date(t.endDate) < new Date()).length;
    const upcomingTrips = totalTrips - completedTrips;

    const totalSpent = trips.reduce((sum, trip) => sum + trip.budget.spent, 0);
    const averageSpent = totalTrips > 0 ? totalSpent / totalTrips : 0;

    // Get unique destinations
    const uniqueDestinations = new Set(trips.map(t => t.destination.name)).size;

    // Calculate total travel days
    const totalDays = trips.reduce((sum, trip) => {
        const start = new Date(trip.startDate);
        const end = new Date(trip.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
    }, 0);

    const stats = [
        {
            title: 'Total Trips',
            value: totalTrips,
            icon: Plane,
            description: `${completedTrips} completed, ${upcomingTrips} upcoming`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Destinations Visited',
            value: uniqueDestinations,
            icon: MapPin,
            description: 'Unique locations explored',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Total Spent',
            value: `$${totalSpent.toLocaleString()}`,
            icon: DollarSign,
            description: `Avg: $${averageSpent.toFixed(0)} per trip`,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Travel Days',
            value: totalDays,
            icon: Calendar,
            description: `${(totalDays / 365).toFixed(1)} years of travel`,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    // Top destinations
    const destinationCounts = trips.reduce((acc, trip) => {
        const dest = trip.destination.name;
        acc[dest] = (acc[dest] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topDestinations = Object.entries(destinationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Top Destinations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Top Destinations
                    </CardTitle>
                    <CardDescription>Your most visited places</CardDescription>
                </CardHeader>
                <CardContent>
                    {topDestinations.length > 0 ? (
                        <div className="space-y-3">
                            {topDestinations.map(([destination, count], index) => (
                                <div key={destination} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{destination}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {count} {count === 1 ? 'trip' : 'trips'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: `${(count / topDestinations[0][1]) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No trips yet. Start planning your first adventure!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Travel Achievements
                    </CardTitle>
                    <CardDescription>Milestones you've unlocked</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className={`p-4 rounded-lg border-2 ${totalTrips >= 5 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">🌟</div>
                            <h4 className="font-semibold">Explorer</h4>
                            <p className="text-sm text-muted-foreground">Complete 5 trips</p>
                            <p className="text-xs mt-1">{totalTrips}/5 trips</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${uniqueDestinations >= 10 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">🌍</div>
                            <h4 className="font-semibold">Globe Trotter</h4>
                            <p className="text-sm text-muted-foreground">Visit 10 destinations</p>
                            <p className="text-xs mt-1">{uniqueDestinations}/10 destinations</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${totalDays >= 100 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">✈️</div>
                            <h4 className="font-semibold">Frequent Traveler</h4>
                            <p className="text-sm text-muted-foreground">100 days of travel</p>
                            <p className="text-xs mt-1">{totalDays}/100 days</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${completedTrips >= 10 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">🏆</div>
                            <h4 className="font-semibold">Veteran Traveler</h4>
                            <p className="text-sm text-muted-foreground">Complete 10 trips</p>
                            <p className="text-xs mt-1">{completedTrips}/10 trips</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
