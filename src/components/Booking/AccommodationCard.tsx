'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Wifi, Coffee } from 'lucide-react';
import { Accommodation } from '@/types';

interface AccommodationCardProps {
    accommodation: Accommodation;
    onSelect?: (accommodation: Accommodation) => void;
    viewMode?: 'grid' | 'list';
}

export function AccommodationCard({ accommodation, onSelect, viewMode = 'grid' }: AccommodationCardProps) {
    const isListView = viewMode === 'list';

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            hotel: '🏨',
            hostel: '🏠',
            apartment: '🏢',
            resort: '🏖️',
            bnb: '🏡',
        };
        return icons[type] || '🏨';
    };

    return (
        <Card className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${isListView ? 'flex' : ''}`}
            onClick={() => onSelect?.(accommodation)}
        >
            {/* Image */}
            <div className={`relative ${isListView ? 'w-64 h-48' : 'h-48'} bg-gray-200`}>
                <img
                    src={accommodation.images[0]}
                    alt={accommodation.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                    <Badge className="bg-white text-black">
                        {getTypeIcon(accommodation.type)} {accommodation.type}
                    </Badge>
                </div>
                {accommodation.rating >= 4.5 && (
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500 text-white">
                            ⭐ Top Rated
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className={`p-4 ${isListView ? 'flex-1' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">{accommodation.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {accommodation.location.neighborhood}
                        </div>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{accommodation.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                        ({accommodation.reviewCount} reviews)
                    </span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {accommodation.amenities.slice(0, 3).map((amenity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                            {amenity}
                        </Badge>
                    ))}
                    {accommodation.amenities.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                            +{accommodation.amenities.length - 3} more
                        </Badge>
                    )}
                </div>

                {/* Description */}
                {isListView && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {accommodation.description}
                    </p>
                )}

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <div>
                        <div className="text-2xl font-bold">
                            {accommodation.pricing.currency === 'EUR' ? '€' : '$'}
                            {accommodation.pricing.totalPrice}
                        </div>
                        <div className="text-xs text-muted-foreground">per night</div>
                    </div>
                    <Button onClick={(e) => {
                        e.stopPropagation();
                        onSelect?.(accommodation);
                    }}>
                        View Details
                    </Button>
                </div>

                {/* Cancellation Policy */}
                <div className="mt-2 text-xs text-green-600">
                    ✓ {accommodation.cancellationPolicy}
                </div>
            </CardContent>
        </Card>
    );
}
