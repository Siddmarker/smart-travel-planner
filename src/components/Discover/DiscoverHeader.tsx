'use client';

import { autocompletePlace, getPlaceDetails } from '@/lib/googleMapsService';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DiscoverHeaderProps {
    onSearch?: (query: string) => void;
    onLocationChange?: (location: string, coords?: { lat: number; lng: number }) => void;
    onRadiusChange?: (radius: number) => void;
}

export function DiscoverHeader({ onSearch, onLocationChange, onRadiusChange }: DiscoverHeaderProps) {
    const [location, setLocation] = useState('Paris, France');
    const [radius, setRadius] = useState(10);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);

    const handleLocationInput = async (value: string) => {
        setLocation(value);
        if (value.length > 2) {
            try {
                const results = await autocompletePlace(value);
                setPredictions(results);
                setShowPredictions(true);
            } catch (error) {
                console.error('Error fetching predictions:', error);
            }
        } else {
            setPredictions([]);
            setShowPredictions(false);
        }
    };

    const handlePredictionSelect = async (placeId: string, description: string) => {
        setLocation(description);
        setShowPredictions(false);

        try {
            const placeDetails = await getPlaceDetails(placeId);
            if (placeDetails) {
                onLocationChange?.(description, { lat: placeDetails.lat, lng: placeDetails.lng });
            }
        } catch (error) {
            console.error('Error getting place details:', error);
            // Fallback to just passing the description if details fail
            onLocationChange?.(description, undefined);
        }
    };

    const handleLocationSubmit = () => {
        // 1. GET THE LIVE VALUE FROM THE INPUT
        if (!location) {
            alert('Please enter a city name.');
            return;
        }

        console.log('Handling location submit for:', location);

        // 2. PASS THAT VALUE TO THE PARENT (which will use Text Search)
        // We do NOT resolve coordinates here anymore, to ensure we use the text query.
        // We pass undefined for coords to indicate we want a text-based search.
        onLocationChange?.(location, undefined);
    };

    return (
        <div className="space-y-4">
            {/* Location & Radius */}
            <div className="flex flex-wrap gap-3 items-center w-full">
                <div className="flex items-center gap-2 flex-1 relative min-w-[300px]">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 relative">
                        <Input
                            id="location-input" // Adding ID for clarity
                            placeholder="Enter location (e.g., Paris, France)"
                            value={location} // 1. Live value from state
                            onChange={(e) => handleLocationInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
                            className="w-full"
                            onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                            onFocus={() => location.length > 2 && setShowPredictions(true)}
                        />
                        {showPredictions && predictions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
                                {predictions.map((prediction) => (
                                    <div
                                        key={prediction.place_id}
                                        className="p-2 hover:bg-accent cursor-pointer text-sm"
                                        onClick={() => handlePredictionSelect(prediction.place_id, prediction.description)}
                                    >
                                        {prediction.description}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Removed Geolocation Button as requested by user */}
                    <Button onClick={handleLocationSubmit}>
                        Search
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Within:</span>
                    <div className="flex items-center gap-1">
                        <Input
                            type="number"
                            min="1"
                            max="500"
                            value={radius}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (val >= 1 && val <= 500) {
                                    setRadius(val);
                                    onRadiusChange?.(val);
                                }
                            }}
                            className="w-[90px] h-9 text-sm"
                        />
                        <span className="text-sm text-muted-foreground">km</span>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 ml-auto">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        🔥 Trending
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        ⭐ Top Rated
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                        💎 Hidden Gems
                    </Badge>
                </div>
            </div>
        </div>
    );
}
