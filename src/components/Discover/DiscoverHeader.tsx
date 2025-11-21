'use client';

import { autocompletePlace, getPlaceDetails } from '@/lib/googleMapsService';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, SlidersHorizontal, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DiscoverHeaderProps {
    onSearch?: (query: string) => void;
    onLocationChange?: (location: string, coords?: { lat: number; lng: number }) => void;
    onRadiusChange?: (radius: number) => void;
}

export function DiscoverHeader({ onSearch, onLocationChange, onRadiusChange }: DiscoverHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Paris, France');
    const [radius, setRadius] = useState(10);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);

    const handleSearch = () => {
        onSearch?.(searchQuery);
    };

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
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Reverse geocode to get location name
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await response.json();
                    const locationName = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

                    setLocation(locationName);
                    onLocationChange?.(locationName, { lat: latitude, lng: longitude });
                } catch (error) {
                    console.error('Error getting location name:', error);
                    setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    onLocationChange?.(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, { lat: latitude, lng: longitude });
                } finally {
                    setIsGettingLocation(false);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please check your browser permissions.');
                setIsGettingLocation(false);
            }
        );
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search places, activities, restaurants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                    />
                </div>
                <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                </Button>
            </div>

            {/* Location & Radius */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2 flex-1 relative">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 relative">
                        <Input
                            placeholder="Enter location (e.g., Paris, France)"
                            value={location}
                            onChange={(e) => handleLocationInput(e.target.value)}
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
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        title="Use my current location"
                    >
                        <Navigation className={`h-4 w-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
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
