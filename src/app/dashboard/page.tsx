'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { Compass, MapPin } from 'lucide-react';
import { DestinationDisplay } from '@/components/Dashboard/DestinationDisplay';
import Link from 'next/link';
import { useCurrency } from '@/contexts/CurrencyContext';
import { CurrencySettings } from '@/components/CurrencySettings';

function DashboardContent() {
    const { savedPlaces, currentUser } = useStore();
    const { user } = useAuth(); // Use auth context user as fallback or primary
    const { formatAmount } = useCurrency();

    // Use currentUser from store if available, otherwise fallback to AuthContext user
    const displayUser = currentUser || (user ? { name: user.name, email: user.email } : null);

    // Calculate stats
    const totalSaved = savedPlaces.length;
    const uniqueCategories = new Set(savedPlaces.map(p => p.category)).size;

    const stats = [
        { label: 'Saved Places', value: totalSaved, icon: MapPin, color: 'text-purple-600' },
        { label: 'Categories', value: uniqueCategories, icon: Compass, color: 'text-blue-600' },
    ];

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {displayUser?.name || 'Traveler'}!</h1>
                    <p className="text-muted-foreground mt-1">Discover new places for your next adventure</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/discover">
                        <Button size="lg">
                            <Compass className="mr-2 h-5 w-5" />
                            Start Discovering
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
                {/* Main Content Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Saved Places</h2>
                        {savedPlaces.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">No places saved yet</h3>
                                <p className="text-muted-foreground mb-4">Explore the world and save your favorite spots!</p>
                                <Link href="/discover">
                                    <Button variant="outline">Go to Discover</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Placeholder for Saved Places list - implementation can be added later if needed or reused PlaceCard */}
                                <p className="text-muted-foreground">You have {savedPlaces.length} saved places.</p>
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
