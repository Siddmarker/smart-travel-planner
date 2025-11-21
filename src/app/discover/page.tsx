'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { CategoryGrid } from '@/components/Discover/CategoryGrid';
import { PlaceList } from '@/components/Discover/PlaceList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trendingPlaces, nearbyPlaces, hiddenGems } from '@/data/mockDiscovery';
import { Place } from '@/types';
import { TrendingUp, MapPin, Sparkles } from 'lucide-react';
import { searchPlaces, searchNearbyPlaces } from '@/lib/googleMapsService';

export default function DiscoverPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
    const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([]);
    const [trendingPlacesList, setTrendingPlacesList] = useState<Place[]>([]);
    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load - get user location or default to Paris
    useEffect(() => {
        if (!locationCoords) {
            // Default to Paris if no location
            const defaultLocation = { lat: 48.8566, lng: 2.3522 };
            setLocationCoords(defaultLocation);
            fetchPlaces(defaultLocation);
        }
    }, []);

    const fetchPlaces = async (coords: { lat: number; lng: number }) => {
        setIsLoading(true);
        try {
            // Fetch nearby places
            const nearby = await searchNearbyPlaces(coords, 5000); // 5km radius
            setNearbyPlacesList(nearby);

            // Fetch trending (simulated by searching for "popular tourist attractions")
            const trending = await searchPlaces('popular tourist attractions', coords);
            setTrendingPlacesList(trending);

            // Initialize filtered places with trending
            setFilteredPlaces(trending);
        } catch (error) {
            console.error('Error fetching places:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        setSelectedCategory(categoryId);
        const allPlaces = [...trendingPlacesList, ...nearbyPlacesList];

        if (categoryId) {
            // If we have real data, we might want to fetch specific category data
            // For now, filter the loaded places
            const filtered = allPlaces.filter(p => p.category === categoryId);
            setFilteredPlaces(filtered);
        } else {
            setFilteredPlaces(trendingPlacesList);
        }
    };

    const handleLocationChange = (location: string, coords?: { lat: number; lng: number }) => {
        if (coords) {
            setLocationCoords(coords);
            fetchPlaces(coords);
        }
    };

    const handleSearch = async (query: string) => {
        if (!query) return;

        setIsLoading(true);
        try {
            const results = await searchPlaces(query, locationCoords || undefined);
            setFilteredPlaces(results);
            setSelectedCategory(''); // Clear category selection on search
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setIsLoading(false);
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
                <DiscoverHeader
                    onSearch={handleSearch}
                    onLocationChange={handleLocationChange}
                />
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
                            <CardTitle>🔥 Trending</CardTitle>
                            <CardDescription>Most popular places right now</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">Loading...</div>
                            ) : (
                                <PlaceList
                                    places={selectedCategory ? filteredPlaces : trendingPlacesList}
                                    onAddToTrip={handleAddToTrip}
                                    onSavePlace={handleSavePlace}
                                />
                            )}
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
                            {isLoading ? (
                                <div className="flex justify-center p-8">Loading...</div>
                            ) : (
                                <PlaceList
                                    places={nearbyPlacesList}
                                    onAddToTrip={handleAddToTrip}
                                    onSavePlace={handleSavePlace}
                                />
                            )}
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
                                places={hiddenGems} // Keep mock data for hidden gems for now or implement specific logic
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
