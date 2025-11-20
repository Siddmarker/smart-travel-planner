'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { CategoryGrid } from '@/components/Discover/CategoryGrid';
import { PlaceList } from '@/components/Discover/PlaceList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trendingPlaces, nearbyPlaces, hiddenGems } from '@/data/mockDiscovery';
import { Place } from '@/types';
import { TrendingUp, MapPin, Sparkles } from 'lucide-react';

export default function DiscoverPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>(trendingPlaces);

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        // Filter places by category
        const allPlaces = [...trendingPlaces, ...nearbyPlaces, ...hiddenGems];
        if (categoryId) {
            setFilteredPlaces(allPlaces.filter(p => p.category === categoryId));
        } else {
            setFilteredPlaces(trendingPlaces);
        }
    };

    const handleAddToTrip = (place: Place) => {
        // TODO: Implement add to trip functionality
        console.log('Add to trip:', place.name);
        alert(`Added "${place.name}" to your trip!`);
    };

    const handleSavePlace = (place: Place) => {
        // TODO: Implement save place functionality
        console.log('Save place:', place.name);
        alert(`Saved "${place.name}" for later!`);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Discover Places</h1>
                <p className="text-muted-foreground">Explore amazing destinations and activities around you</p>
            </div>

            {/* Search & Filters */}
            <div className="mb-6">
                <DiscoverHeader />
            </div>

            {/* Categories */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
                <CategoryGrid
                    onSelectCategory={handleCategorySelect}
                    selectedCategory={selectedCategory}
                />
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="trending" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="trending">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Trending
                    </TabsTrigger>
                    <TabsTrigger value="nearby">
                        <MapPin className="h-4 w-4 mr-2" />
                        Nearby
                    </TabsTrigger>
                    <TabsTrigger value="hidden">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Hidden Gems
                    </TabsTrigger>
                </TabsList>

                {/* Trending Places */}
                <TabsContent value="trending" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>🔥 Trending in Paris</CardTitle>
                            <CardDescription>Most popular places right now</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlaceList
                                places={selectedCategory ? filteredPlaces : trendingPlaces}
                                onAddToTrip={handleAddToTrip}
                                onSavePlace={handleSavePlace}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Nearby Places */}
                <TabsContent value="nearby" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📍 Nearby Places</CardTitle>
                            <CardDescription>Discover what's around you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlaceList
                                places={nearbyPlaces}
                                onAddToTrip={handleAddToTrip}
                                onSavePlace={handleSavePlace}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hidden Gems */}
                <TabsContent value="hidden" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>💎 Hidden Gems</CardTitle>
                            <CardDescription>Local favorites and secret spots</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <PlaceList
                                places={hiddenGems}
                                onAddToTrip={handleAddToTrip}
                                onSavePlace={handleSavePlace}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
