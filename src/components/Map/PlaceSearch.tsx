import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Plus, Hotel, Home, Tent, Building } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import { Place } from '@/types';
import { Badge } from '@/components/ui/badge';
import { mockAccommodations } from '@/data/mockAccommodations';

interface PlaceSearchProps {
    onAddPlace?: (place: Place) => void;
}

export function PlaceSearch({ onAddPlace }: PlaceSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Place[]>([]);
    const [activeFilter, setActiveFilter] = useState('All');
    const [stayType, setStayType] = useState<string | null>(null); // 'homestay', 'lodge', 'resort'

    const { places, addPlace } = useStore();

    const filters = [
        { id: 'All', label: 'All', icon: null },
        { id: 'Attractions', label: 'Attractions', icon: null },
        { id: 'Food', label: 'Food', icon: null },
        { id: 'Stays', label: 'Stays', icon: <Hotel className="h-3 w-3" /> },
    ];

    const stayTypes = [
        { id: 'all_stays', label: 'All Stays' },
        { id: 'homestay', label: 'Homestay', icon: <Home className="h-3 w-3" /> },
        { id: 'lodge', label: 'Lodge', icon: <Building className="h-3 w-3" /> },
        { id: 'resort', label: 'Resorts', icon: <Tent className="h-3 w-3" /> },
    ];

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (activeFilter === 'Stays') {
            // Use mock accommodations
            let stays = mockAccommodations.map(acc => ({
                id: acc.id,
                name: acc.name,
                category: 'hotel', // Standardize to match Place type
                description: acc.description,
                image: acc.images[0],
                rating: acc.rating,
                reviews: acc.reviewCount,
                lat: acc.location.lat,
                lng: acc.location.lng,
                priceLevel: acc.pricing.basePrice > 300 ? 4 : acc.pricing.basePrice > 150 ? 3 : 2,
                distance: { text: '2.5 km', value: 2500 },
                rawTypes: [acc.type, 'lodging'],
                tags: [acc.type, ...acc.amenities.slice(0, 3)],
            } as Place));

            // Apply Stay Type Filter
            if (stayType && stayType !== 'all_stays') {
                stays = stays.filter(s => {
                    if (stayType === 'resort') return s.rawTypes?.includes('resort');
                    if (stayType === 'homestay') return s.rawTypes?.includes('bnb') || s.rawTypes?.includes('apartment');
                    if (stayType === 'lodge') return s.rawTypes?.includes('hotel') || s.rawTypes?.includes('hostel'); // Loose mapping
                    return true;
                });
            }

            // Apply Text Query
            if (query) {
                stays = stays.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
            }

            setResults(stays);
            return;
        }

        // Default Search Logic for other categories
        const searchResults = places.filter(p =>
            (activeFilter === 'All' || p.category.toLowerCase().includes(activeFilter.toLowerCase())) &&
            (p.name.toLowerCase().includes(query.toLowerCase()) ||
                p.category.toLowerCase().includes(query.toLowerCase()))
        );

        setResults(searchResults);
    };

    const handleFilterClick = (filterId: string) => {
        setActiveFilter(filterId);
        if (filterId === 'Stays') {
            setStayType('all_stays');
            // Trigger search specifically for stays
            setTimeout(() => handleSearch(), 0);
        } else {
            setStayType(null);
            setTimeout(() => handleSearch(), 0);
        }
    };

    const handleStayTypeClick = (typeId: string) => {
        setStayType(typeId);
        setTimeout(() => handleSearch(), 0);
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

            {/* Main Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {filters.map(filter => (
                    <Badge
                        key={filter.id}
                        variant={activeFilter === filter.id ? 'default' : 'outline'}
                        className="cursor-pointer gap-1 whitespace-nowrap px-3 py-1.5"
                        onClick={() => handleFilterClick(filter.id)}
                    >
                        {filter.icon}
                        {filter.label}
                    </Badge>
                ))}
            </div>

            {/* Sub Filters for Stays */}
            {activeFilter === 'Stays' && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">
                    {stayTypes.map(type => (
                        <Badge
                            key={type.id}
                            variant={stayType === type.id ? 'secondary' : 'outline'}
                            className={`cursor-pointer gap-1 whitespace-nowrap border-slate-300 dark:border-slate-700 ${stayType === type.id ? 'bg-slate-200 dark:bg-slate-700' : 'bg-white dark:bg-slate-800'}`}
                            onClick={() => handleStayTypeClick(type.id)}
                        >
                            {type.icon}
                            {type.label}
                        </Badge>
                    ))}
                </div>
            )}

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input
                    placeholder={activeFilter === 'Stays' ? "Search hotels, resorts..." : "Search restaurants, attractions..."}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {results.length > 0 ? (
                    results.map((place) => (
                        <Card key={place.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                            {place.image && (
                                <div className="h-32 w-full relative">
                                    <img src={place.image} alt={place.name} className="absolute inset-0 w-full h-full object-cover" />
                                    {place.rawTypes?.includes('resort') && (
                                        <Badge className="absolute top-2 right-2 bg-purple-500">Resort</Badge>
                                    )}
                                </div>
                            )}
                            <CardContent className="p-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-semibold">{place.name}</h4>
                                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                                            <span className="flex items-center">
                                                <MapPin className="h-3 w-3 mr-0.5" />
                                                {place.category}
                                            </span>
                                            {place.rating && <span>⭐ {place.rating}</span>}
                                        </div>
                                    </div>
                                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => handleAddPlace(place)}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{place.description}</p>

                                {/* Accomodation Specifics */}
                                {(place.category === 'hotel' || place.rawTypes?.includes('lodging')) && (
                                    <div className="mt-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded border">
                                        <div className="flex justify-between font-medium">
                                            <span>Price</span>
                                            <span>${'priceLevel' in place && place.priceLevel ? place.priceLevel * 60 + 50 : 150} <span className="text-[10px] font-normal text-muted-foreground">/ night</span></span>
                                        </div>
                                    </div>
                                )}

                                {(place.phoneNumber || place.website) && (
                                    <div className="text-xs space-y-1 pt-2 border-t mt-2">
                                        {place.phoneNumber && <div>📞 {place.phoneNumber}</div>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center">
                        <Search className="h-8 w-8 mb-2 opacity-20" />
                        <p>Search via filters or enter keywords.</p>
                        {activeFilter === 'Stays' && <p className="text-xs opacity-70 mt-1">(Try selecting 'Homestay' or 'Resort')</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
