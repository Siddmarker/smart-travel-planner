'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { Place } from '@/types';

interface PlaceSearchProps {
    onAddPlace?: (place: Place) => void;
}

export function PlaceSearch({ onAddPlace }: PlaceSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const { places, addPlace } = useStore();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, this would search an API. 
        // For now, we filter the mock places in the store or return a static list if store is empty.

        const searchResults = places.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())
        );

        setResults(searchResults);
    };

    const handleAddPlace = (place: Place) => {
        addPlace(place);
        if (onAddPlace) {
            onAddPlace(place);
        }
        setQuery('');
        setResults([]);
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <h3 className="font-semibold mb-4">Discover Places</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input
                    placeholder="Search restaurants, attractions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3">
                {results.length > 0 ? (
                    results.map((place) => (
                        <Card key={place.id} className="overflow-hidden">
                            {place.image && (
                                <div className="h-32 w-full relative">
                                    <img src={place.image} alt={place.name} className="absolute inset-0 w-full h-full object-cover" />
                                </div>
                            )}
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">{place.name}</h4>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3 mr-1" />
                                            {place.category}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={() => handleAddPlace(place)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{place.description}</p>
                                {(place.phoneNumber || place.website) && (
                                    <div className="text-xs space-y-1 pt-2 border-t">
                                        {place.phoneNumber && <div>📞 {place.phoneNumber}</div>}
                                        {place.website && (
                                            <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                🌐 Website
                                            </a>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground text-sm py-8">
                        Search for places to add to your trip.
                    </div>
                )}
            </div>
        </div>
    );
}
