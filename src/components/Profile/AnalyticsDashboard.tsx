'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, MapPin, DollarSign, Calendar, TrendingUp, Award, Compass as HelperIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function AnalyticsDashboard() {
    const { savedPlaces } = useStore();

    // Calculate statistics
    const totalSaved = savedPlaces.length;
    const uniqueCategories = new Set(savedPlaces.map(p => p.category)).size;
    const uniqueCities = new Set(savedPlaces.map(p => {
        // Simple heuristic: check vicinity or fallback
        return p.vicinity?.split(',').pop()?.trim() || 'Unknown';
    })).size;

    const stats = [
        {
            title: 'Saved Places',
            value: totalSaved,
            icon: MapPin,
            description: `${uniqueCategories} categories`,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Categories',
            value: uniqueCategories,
            icon: HelperIcon, // Replaced Plane with something else or keep generic
            description: 'Different types of places',
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-full ${stat.bgColor}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Achievements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Explorer Achievements
                    </CardTitle>
                    <CardDescription>Milestones based on your saved places</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className={`p-4 rounded-lg border-2 ${totalSaved >= 5 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">🌟</div>
                            <h4 className="font-semibold">Collector</h4>
                            <p className="text-sm text-muted-foreground">Save 5 places</p>
                            <p className="text-xs mt-1">{totalSaved}/5 places</p>
                        </div>

                        <div className={`p-4 rounded-lg border-2 ${uniqueCategories >= 5 ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-50'}`}>
                            <div className="text-2xl mb-2">🎨</div>
                            <h4 className="font-semibold">Diverse Taste</h4>
                            <p className="text-sm text-muted-foreground">Save places from 5 categories</p>
                            <p className="text-xs mt-1">{uniqueCategories}/5 categories</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
