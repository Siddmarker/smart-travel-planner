'use client';

import { autocompletePlace, getPlaceDetails, reverseGeocode } from '@/lib/googleMapsService';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Locate } from 'lucide-react';
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
                // Pass empty array to remove (cities) restriction, allowing area/neighborhood search
                const results = await autocompletePlace(value, []);
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

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            // Immediate update with coords
            onLocationChange?.("Current Location", { lat: latitude, lng: longitude });

            try {
                const address = await reverseGeocode(latitude, longitude);
                if (address) {
                    setLocation(address);
                    // Update again with proper address name
                    onLocationChange?.(address, { lat: latitude, lng: longitude });
                } else {
                    setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                }
            } catch (error) {
                console.error('Error getting location:', error);
                setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
        }, (error) => {
            console.error('Error getting location:', error);
            alert('Unable to retrieve your location. Please check your permissions.');
        });
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

    const handleLocationSubmit = async () => {
        // 1. GET THE LIVE VALUE FROM THE INPUT
        if (!location) {
            alert('Please enter a city name.');
            return;
        }

        console.log('Handling location submit for:', location);

        // 2. Try to get coordinates for the entered text to enable "Nearby" search
        try {
            const results = await autocompletePlace(location);
            if (results && results.length > 0) {
                const topMatch = results[0];
                const placeDetails = await getPlaceDetails(topMatch.place_id);
                if (placeDetails) {
                    onLocationChange?.(location, { lat: placeDetails.lat, lng: placeDetails.lng });
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching coords for submit:', error);
        }

        // Fallback: Pass text only if geocoding fails
        onLocationChange?.(location, undefined);
    };

    return (
        <div className="space-y-4">
            {/* Location & Radius */}
            {/* Location & Radius & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end w-full">
                {/* Location Input */}
                <div className="flex-1 w-full md:w-auto relative min-w-[250px]">
                    <label htmlFor="location-input" className="text-sm font-medium mb-1 block text-muted-foreground">
                        📍 Location
                    </label>
                    <div className="relative">
                        <Input
                            id="location-input"
                            placeholder="Enter location or area..."
                            value={location}
                            onChange={(e) => handleLocationInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLocationSubmit()}
                            className="w-full pr-10"
                            onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                            onFocus={() => location.length > 2 && setShowPredictions(true)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={handleCurrentLocation}
                            title="Use current location"
                        >
                            <Locate className="h-4 w-4" />
                        </Button>
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
                </div>

                {/* Distance Filter */}
                <div className="w-full md:w-auto">
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">
                        📏 Within
                    </label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="1"
                            max="500"
                            value={radius}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '') {
                                    setRadius(NaN);
                                    return;
                                }
                                const numVal = parseInt(val);
                                if (!isNaN(numVal)) {
                                    setRadius(numVal);
                                    if (numVal >= 1 && numVal <= 500) {
                                        onRadiusChange?.(numVal);
                                    }
                                }
                            }}
                            className="w-[100px]"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">km</span>
                    </div>
                </div>

                {/* Search Button - Moved to end */}
                <Button onClick={handleLocationSubmit} className="w-full md:w-auto min-w-[100px]">
                    Search
                </Button>

                {/* Quick Filters - Moved to separate row on mobile or pushed right */}
                <div className="flex gap-2 ml-auto mt-2 md:mt-0 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
                        🔥 Trending
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
                        ⭐ Top Rated
                    </Badge>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent whitespace-nowrap">
                        💎 Hidden Gems
                    </Badge>
                </div>
            </div>
        </div>
    );
}
