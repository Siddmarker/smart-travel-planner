'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Compass, MapPin, Star, TrendingUp, Sparkles } from 'lucide-react';
import { Place } from '@/types';
import { searchNearbyPlaces, reverseGeocode, geocodeAddress } from '@/lib/googleMapsService';
import { getDestinationSuggestions } from '@/lib/geminiService';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Locate } from 'lucide-react';

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

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            console.error('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // 1. Get address name
                const address = await reverseGeocode(latitude, longitude);
                if (address) setLocation(address);

                // 2. Search nearby
                const places = await searchNearbyPlaces({ lat: latitude, lng: longitude }, radius * 1000);
                setTrendingPlaces(places.slice(0, 3));
            } catch (error) {
                console.error('Error getting location/places:', error);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error('Error getting location:', error);
            setLoading(false);
        });
    };

    const handleSearch = async () => {
        if (!location.trim()) return;
        setLoading(true);
        try {
            // 1. Geocode the input location
            const coords = await geocodeAddress(location);

            if (coords) {
                // 2. Search nearby the new coords
                const places = await searchNearbyPlaces(coords, radius * 1000);
                setTrendingPlaces(places.slice(0, 3));
            } else {
                console.warn('Location not found');
            }
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDistance = (lat: number, lng: number) => {
        // Mock distance calculation
        return (Math.random() * 5 + 0.5).toFixed(1);
    };

    return (
        <Card className="w-full border-none shadow-none bg-transparent">
            <div className="search-hero mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                <div className="relative z-10">
                    <div className="mb-6 text-white">
                        <h2 className="text-3xl font-bold mb-2">Discover Your Next Adventure</h2>
                        <p className="text-blue-50 text-lg">Explore amazing destinations around you</p>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                                placeholder="Where do you want to go?"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-12 pr-12 py-4 bg-white rounded-xl border-none focus:ring-2 focus:ring-blue-400 text-slate-900 placeholder:text-slate-400 text-lg shadow-sm transition-all"
                            />
                            <Button
                                size="icon"
                                variant="ghost"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                onClick={handleCurrentLocation}
                                title="Use current location"
                            >
                                <Locate className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 min-w-[140px]">
                            <span className="text-sm text-slate-500 whitespace-nowrap">Radius:</span>
                            <input
                                type="number"
                                value={radius}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val)) setRadius(val);
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 font-medium"
                            />
                            <span className="text-sm text-slate-500">km</span>
                        </div>
                        <Button
                            size="lg"
                            className="h-auto py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? '...' : 'Search'}
                        </Button>
                    </div>
                </div>
            </div>

            <CardContent className="space-y-6 p-0">
                {/* Trending Places */}
                <div>
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-xl text-slate-800 dark:text-white">Trending near you</h4>
                        </div>
                        {currentUser && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                                onClick={handleAiSuggest}
                                disabled={aiLoading}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {aiLoading ? 'Thinking...' : 'Ask AI'}
                            </Button>
                        )}
                    </div>

                    {loading || aiLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <Sparkles className="h-8 w-8 mb-3 animate-pulse text-blue-400" />
                            <p>{aiLoading ? 'AI is finding the best spots for you...' : 'Loading places...'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {trendingPlaces.map((place) => (
                                <div
                                    key={place.id}
                                    className="group bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-700 mb-3 overflow-hidden relative">
                                        {place.image ? (
                                            <img src={place.image} alt={place.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <MapPin className="h-8 w-8" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
                                            {place.rating} ★
                                        </div>
                                    </div>
                                    <div className="px-1">
                                        <h5 className="font-bold text-slate-900 dark:text-white truncate mb-1">{place.name}</h5>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-3 w-3" />
                                                <span>{calculateDistance(place.lat, place.lng)} km</span>
                                            </div>
                                            <Badge variant="secondary" className="text-[10px] px-2 h-5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-none">
                                                {place.category}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA */}
                <Link href="/discover" className="block">
                    <Button className="w-full py-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-lg transition-all hover:translate-y-[-2px]">
                        <Compass className="h-5 w-5 mr-2" />
                        Explore All Nearby Places
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
