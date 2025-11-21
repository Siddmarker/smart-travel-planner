'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Compass, MapPin, Star, TrendingUp, Sparkles } from 'lucide-react';
import { Place } from '@/types';
import { searchNearbyPlaces } from '@/lib/googleMapsService';
import { getDestinationSuggestions } from '@/lib/geminiService';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

export function DiscoveryWidget() {
    const { currentUser } = useStore();
    const [location, setLocation] = useState('Paris, France');
    const [radius, setRadius] = useState(10);
    const [trendingPlaces, setTrendingPlaces] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);

    useEffect(() => {
        loadTrendingPlaces();
    }, []);

    const loadTrendingPlaces = async () => {
        setLoading(true);
        try {
            // Paris coordinates
            const places = await searchNearbyPlaces({ lat: 48.8566, lng: 2.3522 }, radius * 1000);
            setTrendingPlaces(places.slice(0, 3));
        } catch (error) {
            console.error('Error loading places:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAiSuggest = async () => {
        if (!currentUser || !('travelPreferences' in currentUser)) return;
        setAiLoading(true);
        try {
            const suggestions = await getDestinationSuggestions(currentUser.travelPreferences);
            if (suggestions.length > 0) {
                setTrendingPlaces(suggestions.slice(0, 3));
            }
        } catch (error) {
            console.error('Error getting AI suggestions:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const calculateDistance = (lat: number, lng: number) => {
        // Mock distance calculation
        return (Math.random() * 5 + 0.5).toFixed(1);
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Compass className="h-5 w-5" />
                    Discover New Places
                </CardTitle>
                <CardDescription>Explore amazing destinations around you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Location & Radius */}
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Input
                            placeholder="Enter location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="flex-1"
                        />
                    </div>

                    <Select value={radius.toString()} onValueChange={(val) => setRadius(parseInt(val))}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5 km</SelectItem>
                            <SelectItem value="10">10 km</SelectItem>
                            <SelectItem value="25">25 km</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Trending Places */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-orange-500" />
                            <h4 className="font-medium">Trending near you</h4>
                        </div>
                        {currentUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={handleAiSuggest}
                                disabled={aiLoading}
                            >
                                <Sparkles className="h-3 w-3 mr-1" />
                                {aiLoading ? 'Thinking...' : 'Ask AI'}
                            </Button>
                        )}
                    </div>

                    {loading || aiLoading ? (
                        <div className="text-center py-4 text-muted-foreground">
                            <p>{aiLoading ? 'AI is finding the best spots for you...' : 'Loading places...'}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {trendingPlaces.map((place) => (
                                <div
                                    key={place.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{place.name}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                <span>{place.rating}</span>
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                <span>{calculateDistance(place.lat, place.lng)} km</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {place.category}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <Link href="/discover">
                    <Button className="w-full" variant="default">
                        <Compass className="h-4 w-4 mr-2" />
                        Explore All Nearby Places
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
