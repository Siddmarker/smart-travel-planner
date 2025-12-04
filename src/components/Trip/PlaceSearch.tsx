'use client';

import React, { useState, useEffect } from 'react';
import { Place } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, MapPin, Star } from 'lucide-react';
import { useTrip } from '@/contexts/TripContext';
import Image from 'next/image';

interface PlaceSearchProps {
    onSelect: (place: Place) => void;
}

export function PlaceSearch({ onSelect }: PlaceSearchProps) {
    const { currentTrip } = useTrip();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim() || !currentTrip) return;

        setLoading(true);
        try {
            const params = new URLSearchParams({
                query,
                lat: currentTrip.destination.lat.toString(),
                lng: currentTrip.destination.lng.toString(),
                type: 'tourist_attraction'
            });

            const response = await fetch(`/api/maps/search?${params}`);
            const data = await response.json();

            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4">
                <Input
                    placeholder="Search for places, restaurants, etc..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {results.map((place) => (
                    <div
                        key={place.id}
                        className="flex gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => onSelect(place)}
                    >
                        <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                            {place.image ? (
                                <Image src={place.image} alt={place.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <MapPin className="w-6 h-6 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{place.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">{place.description || place.address}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{place.rating}</span>
                                </div>
                                <span>•</span>
                                <span>{place.reviews} reviews</span>
                            </div>
                        </div>
                        <Button size="sm" variant="ghost" className="self-center">Add</Button>
                    </div>
                ))}

                {results.length === 0 && !loading && query && (
                    <div className="text-center text-muted-foreground py-8">
                        No results found
                    </div>
                )}
            </div>
        </div>
    );
}
