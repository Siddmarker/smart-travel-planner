'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Plus, Heart, Share2 } from 'lucide-react';
import { Place } from '@/types';
import { EnhancedPlaceCard } from './EnhancedPlaceCard';

export interface PlaceListProps {
    places: Place[];
    onSavePlace?: (place: Place) => void;
    viewMode?: 'grid' | 'list';
    useEnhancedCard?: boolean;
}

export function PlaceList({ places, onSavePlace, viewMode = 'grid', useEnhancedCard = false }: PlaceListProps) {
    const getPriceLevelSymbol = (level: number) => {
        return '$'.repeat(level);
    };

    const handleGetDirections = (place: Place) => {
        const destLat = place.lat;
        const destLng = place.lng;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    window.open(`https://www.google.com/maps/dir/${userLat},${userLng}/${destLat},${destLng}`, '_blank');
                },
                () => {
                    // Fallback if geolocation fails or is denied
                    window.open(`https://www.google.com/maps/dir//${destLat},${destLng}`, '_blank');
                }
            );
        } else {
            // Fallback if geolocation is not supported
            window.open(`https://www.google.com/maps/dir//${destLat},${destLng}`, '_blank');
        }
    };

    if (!places || places.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                <div className="mx-auto h-12 w-12 text-muted-foreground mb-3">
                    <MapPin className="h-full w-full opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">No places found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                    Try adjusting your filters or increasing the search radius.
                </p>
            </div>
        );
    }

    if (useEnhancedCard) {
        return (
            <div className="grid grid-cols-1 gap-4">
                {places.map((place) => (
                    <EnhancedPlaceCard
                        key={place.id}
                        place={place}

                        onSavePlace={onSavePlace}
                    />
                ))}
            </div>
        );
    }

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

                        {/* Distance */}
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3 w-3 mr-1" />
                            {place.distance ? (
                                <>
                                    {place.distance.text} away
                                    {place.distance.duration && ` • ${place.distance.duration}`}
                                </>
                            ) : (
                                'Distance unavailable'
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">

                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleGetDirections(place)}
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">Directions</span>
                                <span className="sm:hidden">Map</span>
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
