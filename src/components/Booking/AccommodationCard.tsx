'use client';

import { CardContent } from '@/components/ui/card';
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
        <div className={`place-card cursor-pointer ${isListView ? 'flex' : ''}`}
            onClick={() => onSelect?.(accommodation)}
        >
            {/* Image */}
            <div className={`card-image ${isListView ? 'w-64 h-full' : ''}`}>
                <img
                    src={accommodation.images[0]}
                    alt={accommodation.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                    <div className="card-badge">
                        {getTypeIcon(accommodation.type)} {accommodation.type}
                    </div>
                </div>
                {accommodation.rating >= 4.5 && (
                    <div className="absolute top-2 left-2">
                        <Badge className="bg-yellow-500 text-white border-none shadow-md">
                            ⭐ Top Rated
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className={`p-5 ${isListView ? 'flex-1' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white line-clamp-1">{accommodation.name}</h3>
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {accommodation.location.neighborhood}
                        </div>
                    </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-slate-700">{accommodation.rating}</span>
                    </div>
                    <span className="text-sm text-slate-400">
                        ({accommodation.reviewCount} reviews)
                    </span>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {accommodation.amenities.slice(0, 3).map((amenity, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 border-none px-2 py-1">
                            {amenity}
                        </Badge>
                    ))}
                    {accommodation.amenities.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-50 text-slate-500 border-none">
                            +{accommodation.amenities.length - 3} more
                        </Badge>
                    )}
                </div>

                {/* Description */}
                {isListView && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                        {accommodation.description}
                    </p>
                )}

                {/* Price and CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {accommodation.pricing.currency === 'EUR' ? '€' : '$'}
                            {accommodation.pricing.totalPrice}
                        </div>
                        <div className="text-xs text-slate-400">per night</div>
                    </div>
                    <Button
                        className="bg-slate-900 hover:bg-blue-600 text-white rounded-xl shadow-md transition-all hover:scale-105"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect?.(accommodation);
                        }}>
                        View Details
                    </Button>
                </div>

                {/* Cancellation Policy */}
                <div className="mt-3 text-xs text-green-600 font-medium flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
                    {accommodation.cancellationPolicy}
                </div>
            </CardContent>
        </div>
    );
}
