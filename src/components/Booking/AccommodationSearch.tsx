'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, SlidersHorizontal, MapIcon, List } from 'lucide-react';
import { Accommodation } from '@/types';
import { AccommodationCard } from './AccommodationCard';
import { mockAccommodations } from '@/data/mockAccommodations';

interface AccommodationSearchProps {
    tripStartDate?: string;
    tripEndDate?: string;
    onSelectAccommodation?: (accommodation: Accommodation) => void;
}

export function AccommodationSearch({
    tripStartDate,
    tripEndDate,
    onSelectAccommodation,
}: AccommodationSearchProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [priceRange, setPriceRange] = useState([0, 500]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showFilters, setShowFilters] = useState(true);

    const accommodationTypes = ['hotel', 'hostel', 'apartment', 'resort', 'bnb'];
    const commonAmenities = ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Kitchen', 'Parking'];

    const filteredAccommodations = useMemo(() => {
        return mockAccommodations.filter(acc => {
            // Search query
            if (searchQuery && !acc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !acc.location.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }

            // Price range
            if (acc.pricing.totalPrice < priceRange[0] || acc.pricing.totalPrice > priceRange[1]) {
                return false;
            }

            // Type filter
            if (selectedTypes.length > 0 && !selectedTypes.includes(acc.type)) {
                return false;
            }

            // Rating filter
            if (acc.rating < minRating) {
                return false;
            }

            // Amenities filter
            if (selectedAmenities.length > 0) {
                const hasAllAmenities = selectedAmenities.every(amenity =>
                    acc.amenities.includes(amenity)
                );
                if (!hasAllAmenities) return false;
            }

            return true;
        });
    }, [searchQuery, priceRange, selectedTypes, minRating, selectedAmenities]);

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleAmenity = (amenity: string) => {
        setSelectedAmenities(prev =>
            prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Search Bar */}
            <div className="p-4 border-b bg-white">
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or neighborhood..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                    <div className="flex border rounded-md">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('grid')}
                            className="rounded-r-none"
                        >
                            <MapIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="icon"
                            onClick={() => setViewMode('list')}
                            className="rounded-l-none"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Filters Panel */}
                {showFilters && (
                    <div className="w-64 border-r bg-white p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Filters</h3>

                        {/* Price Range */}
                        <div className="mb-6">
                            <Label className="mb-2 block">Price per night</Label>
                            <Slider
                                value={priceRange}
                                onValueChange={setPriceRange}
                                min={0}
                                max={500}
                                step={10}
                                className="mb-2"
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>€{priceRange[0]}</span>
                                <span>€{priceRange[1]}</span>
                            </div>
                        </div>

                        {/* Property Type */}
                        <div className="mb-6">
                            <Label className="mb-2 block">Property Type</Label>
                            <div className="space-y-2">
                                {accommodationTypes.map(type => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={type}
                                            checked={selectedTypes.includes(type)}
                                            onCheckedChange={() => toggleType(type)}
                                        />
                                        <label
                                            htmlFor={type}
                                            className="text-sm capitalize cursor-pointer"
                                        >
                                            {type}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rating */}
                        <div className="mb-6">
                            <Label className="mb-2 block">Minimum Rating</Label>
                            <Slider
                                value={[minRating]}
                                onValueChange={(val) => setMinRating(val[0])}
                                min={0}
                                max={5}
                                step={0.5}
                                className="mb-2"
                            />
                            <div className="text-sm text-muted-foreground">
                                {minRating}+ stars
                            </div>
                        </div>

                        {/* Amenities */}
                        <div className="mb-6">
                            <Label className="mb-2 block">Amenities</Label>
                            <div className="space-y-2">
                                {commonAmenities.map(amenity => (
                                    <div key={amenity} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={amenity}
                                            checked={selectedAmenities.includes(amenity)}
                                            onCheckedChange={() => toggleAmenity(amenity)}
                                        />
                                        <label
                                            htmlFor={amenity}
                                            className="text-sm cursor-pointer"
                                        >
                                            {amenity}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                setSearchQuery('');
                                setPriceRange([0, 500]);
                                setSelectedTypes([]);
                                setMinRating(0);
                                setSelectedAmenities([]);
                            }}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                )}

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                        {filteredAccommodations.length} properties found
                    </div>

                    {filteredAccommodations.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No accommodations match your filters.</p>
                            <p className="text-sm mt-2">Try adjusting your search criteria.</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-4'}>
                            {filteredAccommodations.map(accommodation => (
                                <AccommodationCard
                                    key={accommodation.id}
                                    accommodation={accommodation}
                                    onSelect={onSelectAccommodation}
                                    viewMode={viewMode}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
