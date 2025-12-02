'use client';

import { Place } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Plus, Heart, Share2, TrendingUp, Clock, Phone, Utensils } from 'lucide-react';

interface EnhancedPlaceCardProps {
    place: Place;
    onAddToTrip?: (place: Place) => void;
    onSavePlace?: (place: Place) => void;
}

export function EnhancedPlaceCard({ place, onAddToTrip, onSavePlace }: EnhancedPlaceCardProps) {
    const getPriceLevelSymbol = (level: number) => '$'.repeat(level);

    const handleGetDirections = () => {
        const destLat = place.lat;
        const destLng = place.lng;
        window.open(`https://www.google.com/maps/dir//${destLat},${destLng}`, '_blank');
    };

    return (
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-slate-900 group">
            <div className="flex flex-col md:flex-row h-full">
                {/* Image Section */}
                <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 overflow-hidden">
                    <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-2 right-2">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white"
                            onClick={() => onSavePlace?.(place)}
                        >
                            <Heart className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                    {place.socialStats?.trending && (
                        <div className="absolute bottom-2 left-2">
                            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-none shadow-lg flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Trending
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{place.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold text-slate-700 dark:text-slate-200">{place.rating}</span>
                                    </span>
                                    <span>•</span>
                                    <span>{place.reviews} reviews</span>
                                    <span>•</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{getPriceLevelSymbol(place.priceLevel)}</span>
                                </div>
                            </div>
                            {place.distance && (
                                <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                                    <MapPin className="h-3 w-3" />
                                    {place.distance.text}
                                </Badge>
                            )}
                        </div>

                        {/* Tags & Dietary */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {place.tags?.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                    {tag}
                                </Badge>
                            ))}
                            {place.dietaryOptions?.includes('Vegetarian') && (
                                <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                                    🥬 Veg Friendly
                                </Badge>
                            )}
                            {place.dietaryOptions?.includes('Non-Vegetarian') && (
                                <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 hover:bg-red-200">
                                    🍗 Non-Veg
                                </Badge>
                            )}
                        </div>

                        {/* Popular Dish */}
                        {place.popularDish && (
                            <div className="mb-3 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
                                    <Utensils className="h-3 w-3" />
                                    <span className="font-semibold">Must Try:</span>
                                    <span>{place.popularDish.name}</span>
                                    <span className="opacity-70">(₹{place.popularDish.price})</span>
                                </div>
                            </div>
                        )}

                        {/* Social Proof */}
                        {place.socialStats && (
                            <div className="text-xs text-slate-500 flex items-center gap-3 mb-3">
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3 text-pink-500" />
                                    {place.socialStats.views} views on {place.socialStats.platform}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white h-9 text-sm"
                            onClick={() => onAddToTrip?.(place)}
                        >
                            <Plus className="h-3 w-3 mr-1.5" />
                            Add to Plan
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 h-9 text-sm border-slate-200 hover:bg-slate-50"
                            onClick={handleGetDirections}
                        >
                            <MapPin className="h-3 w-3 mr-1.5" />
                            Directions
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
