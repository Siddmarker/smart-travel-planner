'use client';

import { useState, useEffect, useCallback } from 'react';
import { destinationService } from '@/services/destinationService';
import { LocationDetector, LocationData } from '@/components/Location/LocationDetector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Star, Navigation, Plus } from 'lucide-react';
import Image from 'next/image';

export function DestinationDisplay() {
    const [destinations, setDestinations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [debugInfo, setDebugInfo] = useState<any>({});

    const loadDestinations = useCallback(async (loc: LocationData) => {
        setLoading(true);
        setError(null);

        try {
            console.log('📍 Loading destinations for:', loc);

            // Step 2: Fetch destinations
            const result = await destinationService.fetchDestinations(
                loc,
                50, // 50km radius
                'attractions' // or based on user preference
            );

            console.log('📊 API Result:', result);

            // Store debug info
            setDebugInfo({
                rawCount: result.destinations?.length || 0,
                locationUsed: loc,
                success: result.success,
                fallbackUsed: result.fallback || false
            });

            if (result.success || result.fallback) {
                setDestinations(result.destinations);

                if (result.fallback) {
                    console.warn('⚠️ Using fallback destinations');
                }
            } else {
                setError(result.error || 'Failed to load destinations');
            }

        } catch (err: any) {
            console.error('❌ Destination load error:', err);
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleLocationDetected = (loc: LocationData) => {
        setLocation(loc);
        loadDestinations(loc);
    };

    const refreshDestinations = () => {
        if (location) {
            loadDestinations(location);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Destinations Near You</h2>
                    <p className="text-muted-foreground">Discover amazing places around your current location</p>
                </div>
                {location && (
                    <Button variant="outline" size="sm" onClick={refreshDestinations} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                )}
            </div>

            <LocationDetector onLocationDetected={handleLocationDetected} />

            {/* Debug Panel - Only show in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-slate-100 p-4 rounded-md text-xs font-mono overflow-auto max-h-40 hidden">
                    <h4 className="font-bold mb-2">🔧 Debug Information</h4>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                </div>
            )}

            {loading && !destinations.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p>Finding amazing places near you...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-800">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Destinations</h3>
                    <p className="mb-4">{error}</p>
                    <Button onClick={() => location && loadDestinations(location)} variant="destructive">
                        Try Again
                    </Button>
                </div>
            ) : destinations.length === 0 && location ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <div className="text-4xl mb-4 opacity-50">🗺️</div>
                    <h3 className="text-lg font-semibold mb-2">No Destinations Found</h3>
                    <p className="text-muted-foreground mb-4">Try increasing the search radius or try a different location.</p>
                </div>
            ) : (
                <>
                    {location && (
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4" />
                            <span>
                                Showing {destinations.length} destinations within 50km
                                {location?.city ? ` of ${location.city}` : ''}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {destinations.map((destination) => (
                            <DestinationCard
                                key={destination.id}
                                destination={destination}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function DestinationCard({ destination }: { destination: any }) {
    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
            <div className="relative h-48 bg-gray-100">
                {destination.image ? (
                    <Image
                        src={destination.image}
                        alt={destination.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-4xl opacity-30">
                        🗺️
                    </div>
                )}
                <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    {destination.category || destination.type || 'Place'}
                </div>
            </div>

            <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{destination.name}</h3>
                    {destination.rating > 0 && (
                        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs font-bold">
                            <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                            {destination.rating}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    {destination.distance && (
                        <span className="flex items-center">
                            <Navigation className="h-3 w-3 mr-1" />
                            {typeof destination.distance === 'number'
                                ? `${destination.distance.toFixed(1)} km`
                                : destination.distance}
                        </span>
                    )}
                    {/* {destination.travelTime && (
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {destination.travelTime}
            </span>
          )} */}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {destination.vicinity || destination.description || 'No description available'}
                </p>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                        <Navigation className="h-3 w-3 mr-2" />
                        Directions
                    </Button>
                    <Button size="sm" className="w-full">
                        <Plus className="h-3 w-3 mr-2" />
                        Add to Trip
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
