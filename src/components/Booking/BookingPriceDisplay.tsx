'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink, Building2 } from 'lucide-react';
import { Place } from '@/types';

interface BookingPriceDisplayProps {
    place: Place;
}

export function BookingPriceDisplay({ place }: BookingPriceDisplayProps) {
    // Mock data generation based on place name (consistent random)
    const seed = place.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const basePrice = 50 + (seed % 200);

    const platforms = [
        {
            name: 'Booking.com',
            price: basePrice,
            rating: 8.5 + (seed % 15) / 10, // Scale 1-10
            reviews: 120 + (seed % 500),
            color: 'text-blue-600'
        },
        {
            name: 'Agoda',
            price: basePrice - 5 + (seed % 20),
            rating: 8.3 + (seed % 15) / 10, // Scale 1-10
            reviews: 90 + (seed % 300),
            color: 'text-purple-600'
        },
        {
            name: 'Airbnb',
            price: basePrice + 10 + (seed % 30),
            rating: 4.6 + (seed % 4) / 10, // Scale 1-5 usually, but let's normalize or keep distinct
            reviews: 45 + (seed % 100),
            isFiveStar: true, // Marker for 5-star scale
            color: 'text-red-500'
        }
    ];

    return (
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Available Deals
            </h4>
            <div className="space-y-2">
                {platforms.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between p-2 rounded-lg border bg-background hover:border-primary/50 transition-all cursor-pointer group">
                        <div className="flex flex-col">
                            <span className={`font-semibold text-sm ${platform.color}`}>{platform.name}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-foreground">
                                    {platform.isFiveStar ? platform.rating.toFixed(2) : platform.rating.toFixed(1)}
                                </span>
                                <span>({platform.reviews} reviews)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="font-bold text-lg text-green-600 dark:text-green-400">
                                    ${Math.round(platform.price)}
                                </div>
                                <div className="text-[10px] text-muted-foreground">per night</div>
                            </div>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[10px] text-center text-muted-foreground">
                * Prices are estimates. Real-time API keys required for live data.
            </div>
        </div>
    );
}
