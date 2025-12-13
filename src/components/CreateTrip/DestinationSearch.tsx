'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Locate } from 'lucide-react';
import { searchPlaces, reverseGeocode } from '@/lib/googleMapsService'; // Import searchPlaces
import { Button } from '@/components/ui/button';

interface PlaceResult {
    placeId: string;
    name: string;
    location: { lat: number; lng: number };
    formatted_address?: string;
}

interface DestinationSearchProps {
    onSelect: (place: { name: string; location: { lat: number; lng: number }; placeId: string }) => void;
    defaultValue?: string;
}

export function DestinationSearch({ onSelect, defaultValue = '' }: DestinationSearchProps) {
    const [query, setQuery] = useState(defaultValue);
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Simple debounce effect
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2 && isOpen) {
                setLoading(true);
                try {
                    // Use client-side search directly to utilize browser Referer headers
                    const places = await searchPlaces(query);
                    console.log('Client-side Search Results:', places);

                    const mappedResults = places.map((p) => ({
                        placeId: p.id,
                        name: p.name,
                        location: { lat: p.lat, lng: p.lng },
                        formatted_address: p.description
                    }));
                    setResults(mappedResults);

                } catch (error) {
                    console.error('Search failed', error);
                } finally {
                    setLoading(false);
                }
            } else if (query.length <= 2) {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen]);

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (place: PlaceResult) => {
        setQuery(place.name);
        setIsOpen(false);
        onSelect({
            name: place.name,
            location: place.location,
            placeId: place.placeId
        });
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                // Try to get a nice address name
                const address = await reverseGeocode(latitude, longitude);
                const name = address || "Current Location";

                setQuery(name);
                onSelect({
                    name: name,
                    location: { lat: latitude, lng: longitude },
                    placeId: "current-location"
                });
                setIsOpen(false); // Close dropdown if open
            } catch (error) {
                console.error('Error getting location name:', error);
                // Fallback
                setQuery("Current Location");
                onSelect({
                    name: "Current Location",
                    location: { lat: latitude, lng: longitude },
                    placeId: "current-location"
                });
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error('Error getting location:', error);
            setLoading(false);
            alert('Unable to retrieve your location. Please check your permissions.');
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative flex gap-2">
                <div className="relative flex-1">
                    <Input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        placeholder="Search destination (e.g. Paris, Tokyo)"
                        className="pl-10"
                    />
                    <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    {loading && (
                        <Loader2 className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 animate-spin" />
                    )}
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCurrentLocation}
                    title="Use my current location"
                >
                    <Locate className="h-4 w-4" />
                </Button>
            </div>

            {isOpen && query.length > 2 && (
                <ul className="absolute z-[100] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto dark:bg-slate-950 dark:border-slate-800">
                    {results.length > 0 ? (
                        results.map((place) => (
                            <li
                                key={place.placeId}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 dark:hover:bg-slate-800"
                                onClick={() => handleSelect(place)}
                            >
                                <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900/30">
                                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{place.name}</p>
                                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                                        {place.formatted_address || "Destination"}
                                    </p>
                                </div>
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {loading ? "Searching..." : "No results found"}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
