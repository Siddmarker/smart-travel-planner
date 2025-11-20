'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Plus, Heart, Share2 } from 'lucide-react';
import { Place } from '@/types';

interface PlaceListProps {
    places: Place[];
    onAddToTrip?: (place: Place) => void;
    onSavePlace?: (place: Place) => void;
    viewMode?: 'grid' | 'list';
}

export function PlaceList({ places, onAddToTrip, onSavePlace, viewMode = 'grid' }: PlaceListProps) {
    const getPriceLevelSymbol = (level: number) => {
        return '$'.repeat(level);
    };

    return (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {places.map((place) => (
                <Card key={place.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Image */}
                    <div className="relative h-48 bg-gray-200">
                        <img
                            src={place.image}
                            alt={place.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button
                                size="icon"
                                variant="secondary"
                                className="h-8 w-8 rounded-full"
                                onClick={() => onSavePlace?.(place)}
                            >
                                <Heart className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="absolute bottom-2 left-2">
                            <Badge className="bg-white text-black">
                                {place.category}
                            </Badge>
                        </div>
                    </div>

                    <CardContent className="p-4">
                        {/* Title & Rating */}
                        <div className="mb-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{place.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-medium">{place.rating}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    ({place.reviews.toLocaleString()} reviews)
                                </span>
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {getPriceLevelSymbol(place.priceLevel)}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {place.description}
                        </p>

                        {/* Distance (mock) */}
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3 w-3 mr-1" />
                            2.3 km away
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={() => onAddToTrip?.(place)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to Trip
                            </Button>
                            <Button variant="outline" size="icon">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
