'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscoverHeader } from '@/components/Discover/DiscoverHeader';
import { CategoryGrid } from '@/components/Discover/CategoryGrid';
import { PlaceList } from '@/components/Discover/PlaceList';
import { AdvancedFilters } from '@/components/Discover/AdvancedFilters';
import { FiltrationAnalytics } from '@/components/Discover/FiltrationAnalytics';
import { CommunityPlaceCard } from '@/components/Discover/CommunityPlaceCard';
import { PlaceSubmissionModal } from '@/components/Submission/PlaceSubmissionModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Place, DiscoveryFiltrationMetadata, CommunityPlace } from '@/types';
import { TrendingUp, MapPin, Sparkles, PlusCircle } from 'lucide-react';
import { applyDiscoveryFiltrationPipeline, enhanceDiscoveryPlaces } from '@/lib/discovery-filtration';
import { smartCategoryFilter } from '@/lib/categoryUtils';
import { SubmissionService } from '@/lib/submission-service';
import { analyzeOffRoadTerrain } from '@/services/offRoadAI';
import { searchPlaces, searchNearbyPlaces, mapCategoryToGoogleType, searchHiddenGems, searchHikingPlaces, searchOffRoadPlaces, enhancePlacesWithPhotosAndDistance } from '@/lib/googleMapsService';
import { constructMapsQuery } from '@/lib/search-logic';
import { auditJainFriendliness } from '@/lib/geminiService';
import { Button } from '@/components/ui/button';
import { SocialTrends } from '@/components/Discover/SocialTrends';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';


export default function DiscoverPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
    const [nearbyPlacesList, setNearbyPlacesList] = useState<Place[]>([]);
    const [trendingPlacesList, setTrendingPlacesList] = useState<Place[]>([]);
    const [hiddenGemsList, setHiddenGemsList] = useState<Place[]>([]);

    // Community Places State
    const [communityPlaces, setCommunityPlaces] = useState<CommunityPlace[]>([]);

    // Store original generic lists to restore when category is cleared
    const [originalNearby, setOriginalNearby] = useState<Place[]>([]);
    const [originalHidden, setOriginalHidden] = useState<Place[]>([]);
    const [originalTrending, setOriginalTrending] = useState<Place[]>([]);

    const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [currentRadius, setCurrentRadius] = useState(10000); // Default 10km in meters
    const [isLoading, setIsLoading] = useState(false);
    const [currentLocationName, setCurrentLocationName] = useState<string>('Paris');

    // New state for filters
    const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
    const [categoryResults, setCategoryResults] = useState<Place[]>([]);
    const [visibleCount, setVisibleCount] = useState(12);
    const [sortOption, setSortOption] = useState('popularity');

    // Filtration Metadata State
    const [filtrationMetadata, setFiltrationMetadata] = useState<DiscoveryFiltrationMetadata | null>(null);

    // Submission Modal State
    const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);

    // Initial load - get user location or default to Paris
    useEffect(() => {
        if (!locationCoords) {
            // Default to Paris if no location
            const defaultLocation = { lat: 48.8566, lng: 2.3522 };
            setLocationCoords(defaultLocation);
            fetchPlaces(defaultLocation, currentRadius, 'Paris');
        }
    }, []);

    // Helper to construct smart query and determine type - DEPRECATED in favor of search-logic.ts
    // Keeping for reference or fallback if needed, but primary logic moved.


    const fetchPlaces = async (coords: { lat: number; lng: number } | null, radius: number, locationName: string) => {
        setIsLoading(true);
        setFiltrationMetadata(null); // Reset metadata
        try {
            console.log(`Fetching places for ${locationName}`);

            // Fetch Community Places
            const community = SubmissionService.getCommunityPlaces();
            setCommunityPlaces(community);

            // 1. Fetch nearby places ONLY if we have coords
            if (coords) {
                let nearby = await searchNearbyPlaces(coords, radius);
                // Apply filtration to nearby places too
                const { filteredPlaces, metadata } = applyDiscoveryFiltrationPipeline(nearby, locationName, '');
                const enhancedNearby = await enhanceDiscoveryPlaces(filteredPlaces, coords);

                setNearbyPlacesList(enhancedNearby);
                setOriginalNearby(enhancedNearby);
            } else {
                setNearbyPlacesList([]);
                setOriginalNearby([]);
            }

            // 2. Fetch trending using TEXT SEARCH with Smart Query (PROTOCOL ENABLED)
            const searchLogic = constructMapsQuery({
                query: locationName ? `popular tourist attractions in ${locationName}` : 'popular tourist attractions',
                locationName: locationName,
                filters: activeFilters,
                time: new Date()
            });

            console.log(`[Discover] Executing Search Strategy: ${searchLogic.strategy} | Query: ${searchLogic.finalQuery}`);

            // Use radius from logic if expanded (e.g., 4 AM Protocol)
            const effectiveRadius = Math.max(radius, searchLogic.radius);

            let trending = await searchPlaces(searchLogic.finalQuery, coords || undefined, effectiveRadius, 'tourist_attraction');

            // Determine correct category for filtration based on strategy
            let filtrationCategory = 'attractions'; // default for trending
            if (searchLogic.strategy === 'JAIN_STRICT' || searchLogic.strategy === 'LOCAL_NON_VEG' || searchLogic.strategy === 'EARLY_MORNING') {
                filtrationCategory = 'restaurants';
            }

            // Apply Advanced Filtration Pipeline
            let { filteredPlaces: filteredTrending, metadata } = applyDiscoveryFiltrationPipeline(trending, locationName, filtrationCategory);

            // Jain Audit Protocol
            if (searchLogic.strategy === 'JAIN_STRICT') {
                console.log('[Discover] Applying Strict Jain Audit via Gemini...');
                filteredTrending = await auditJainFriendliness(filteredTrending);
            }

            // FALLBACK: If filtration removed everything, show original results (but warn)
            if (trending.length > 0 && filteredTrending.length === 0) {
                console.warn('[Discovery] Filtration removed all results. Showing raw results as fallback.');
                filteredTrending = trending;
                metadata.filteredCount = trending.length;
                metadata.filtrationRate = 0;
            }

            setFiltrationMetadata(metadata);

            let enhancedTrending = filteredTrending;
            if (coords) {
                enhancedTrending = await enhanceDiscoveryPlaces(filteredTrending, coords);
            }

            setTrendingPlacesList(enhancedTrending);
            setOriginalTrending(enhancedTrending);

            // Fetch hidden gems
            if (coords) {
                let hidden = await searchHiddenGems(coords, radius);
                // Apply filtration to hidden gems
                const { filteredPlaces: filteredHidden } = applyDiscoveryFiltrationPipeline(hidden, locationName, '');
                const enhancedHidden = await enhanceDiscoveryPlaces(filteredHidden, coords);

                setHiddenGemsList(enhancedHidden);
                setOriginalHidden(enhancedHidden);
            } else {
                setHiddenGemsList([]);
                setOriginalHidden([]);
            }

            // Initialize filtered places with trending
            setFilteredPlaces(enhancedTrending);
        } catch (error) {
            console.error('Error fetching places:', error);
            // TODO: Show error toast or UI state
        } finally {
            setIsLoading(false);
        }
    };

    const handleCategorySelect = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        setActiveFilters({}); // Reset filters on category change
        setVisibleCount(12); // Reset pagination
        setFiltrationMetadata(null);

        if (!categoryId) {
            // No category selected, show all original trending
            setFilteredPlaces(trendingPlacesList);
            setNearbyPlacesList(originalNearby);
            setHiddenGemsList(originalHidden);
            setCategoryResults([]);
            return;
        }

        setIsLoading(true);
        try {
            let results: Place[] = [];

            if (categoryId === 'hiking') {
                // Use strict hiking search
                results = await searchHikingPlaces(currentLocationName, locationCoords || undefined, currentRadius);
            } else if (categoryId === 'off-roading') {
                // Specialized Off-Roading Logic
                console.log('Fetching Off-Roading places...');
                results = await searchOffRoadPlaces(currentLocationName, locationCoords || undefined, currentRadius);

                // Enhance top 10 results with AI Analysis
                const placesToAnalyze = results.slice(0, 10);
                const analyzedPlaces = await Promise.all(placesToAnalyze.map(async (place) => {
                    const analysis = await analyzeOffRoadTerrain(place.name, place.description, []);
                    return {
                        ...place,
                        difficultyLevel: analysis?.difficultyLevel || 'Intermediate',
                        bikeSuitability: analysis?.bikeSuitability || [],
                        terrainDescription: analysis?.terrainDescription,
                        hazards: analysis?.hazards || []
                    };
                }));

                // Merge analyzed places back into results
                results = [...analyzedPlaces, ...results.slice(10)];

            } else {
                // Standard search for other categories
                if (locationCoords) {
                    const googleType = mapCategoryToGoogleType(categoryId);
                    const categoryPlaces = await searchNearbyPlaces(locationCoords, currentRadius, googleType);
                    results = smartCategoryFilter(categoryPlaces, categoryId);
                } else {
                    // Fallback to text search if no coords
                    // Use new logic here too
                    const searchLogic = constructMapsQuery({
                        query: categoryId,
                        locationName: currentLocationName,
                        filters: activeFilters,
                        category: categoryId,
                        time: new Date()
                    });

                    const textResults = await searchPlaces(searchLogic.finalQuery, undefined, currentRadius);
                    results = smartCategoryFilter(textResults, categoryId);
                }
            }

            // Apply enhancements (Credibility, Dietary Options, etc.)
            // Metadata: We could also apply the full pipeline here if we wanted fake detection etc.
            // For now, ensuring dietary options are present is key.

            // Jain Audit Protocol (if coming from category select + filters)
            // Note: activeFilters might not be set yet if just clicking category, but if they refine it later...
            // Actually handleFilterChange triggers re-filter not re-fetch usually? 
            // The handleCategorySelect fetches FRESH data. 
            // If we want Jain audit here, we need to know if Jain filter is active. 
            // But activeFilters is CLEARED on category select (line 174).
            // So initially this won't trigger Jain strategy unless we pass initial filters.

            const enhancedResults = await enhanceDiscoveryPlaces(results, locationCoords);

            setCategoryResults(enhancedResults); // Store base results for re-filtering
            setFilteredPlaces(enhancedResults); // Update Trending tab

            // Update Nearby tab (sort by distance if possible, or just use results)
            setNearbyPlacesList([...enhancedResults]);

            // Update Hidden Gems tab (filter by rating/reviews)
            const hidden = enhancedResults.filter(p => (p.rating || 0) >= 4.0 && (p.reviews || 0) < 100);
            setHiddenGemsList(hidden);

        } catch (error) {
            console.error('Error searching category:', error);
            setFilteredPlaces([]);
            setCategoryResults([]);
            setNearbyPlacesList([]);
            setHiddenGemsList([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        setVisibleCount(12); // Reset pagination on filter change
    };

    const handleSortChange = (value: string) => {
        setSortOption(value);
    };

    // Helper for strict filtering
    const checkFilterMatch = (place: Place, filterKey: string, filterValues: any[]): boolean => {
        if (!filterValues || filterValues.length === 0) return true;

        // 1. Dietary Preferences (AND logic - place must have ALL selected options)
        // Actually, usually for dietary "Vegetarian" means "Is Vegetarian Friendly".
        // If I select "Vegetarian" and "Vegan", I want a place that is BOTH? Or EITHER?
        // User request: "Multiple filters (Veg + Jain + Café) → show places matching ALL criteria"
        // This implies AND across categories.
        // Within Dietary: "Vegetarian" + "Jain". A place can be both.
        // If I select "Vegetarian" and "Non-Vegetarian", I likely want a place that serves BOTH.
        // So 'every' (AND) is safer for "Must support X and Y".
        if (filterKey === 'dietary') {
            const placeOptions = place.dietaryOptions || [];
            return filterValues.every(val => placeOptions.includes(val));
        }

        // 3. Cuisine (OR logic - User likely wants "Italian OR Chinese")
        if (filterKey === 'cuisine') {
            const placeTags = place.tags || []; // Tags often hold cuisine info like 'South Indian', 'Chinese'
            return filterValues.some(val => placeTags.includes(val));
        }

        // 4. Features (OR logic - "Rooftop OR Live Music" to see broad options)
        if (filterKey === 'features') {
            const placeTags = place.tags || [];
            return filterValues.some(val => placeTags.includes(val));
        }

        // 2. Establishment Type
        if (filterKey === 'establishmentType') {
            const placeTypes = [...(place.rawTypes || []), ...(place.tags || [])].map(t => t.toLowerCase());
            const placeName = place.name.toLowerCase();

            // Map filter values to lowercase for comparison
            return filterValues.some(val => {
                const v = val.toLowerCase();
                // Special handling for 'Cafe' vs 'Cafes'
                if (v === 'cafe') return placeTypes.some(t => t.includes('cafe') || t.includes('coffee'));

                // Enhanced matching for Stays
                if (v === 'resort') return placeTypes.some(t => t.includes('resort')) || placeName.includes('resort');
                if (v === 'homestay') return placeTypes.some(t => t.includes('homestay') || t.includes('guest house') || t.includes('bnb')) || placeName.includes('homestay') || placeName.includes('villa') || placeName.includes('cottage');
                if (v === 'lodge') return placeTypes.some(t => t.includes('lodge') || t.includes('lodging')) || placeName.includes('lodge');
                if (v === 'hotel') return placeTypes.some(t => t.includes('hotel')) || placeName.includes('hotel');
                if (v === 'villa') return placeTypes.some(t => t.includes('villa')) || placeName.includes('villa');

                return placeTypes.some(t => t.includes(v));
            });
        }

        // 3. Cuisine (OR logic)
        if (filterKey === 'cuisine') {
            const placeTags = [...(place.tags || []), ...(place.rawTypes || [])].map(t => t.toLowerCase());
            return filterValues.some(val => {
                const v = val.toLowerCase();
                return placeTags.some(t => t.includes(v));
            });
        }

        // 4. Trending (OR logic)
        if (filterKey === 'trending') {
            // Check social stats or tags
            if (filterValues.includes('Trending') && place.socialStats?.trending) return true;
            // For others, check tags
            return false;
        }

        // 5. Features (AND logic)
        if (filterKey === 'features') {
            const placeTags = [...(place.tags || []), ...(place.rawTypes || [])].map(t => t.toLowerCase());
            return filterValues.every(val => {
                const v = val.toLowerCase();
                return placeTags.some(t => t.includes(v));
            });
        }

        return true;
    };

    // Effect to apply dynamic filters when activeFilters changes
    useEffect(() => {
        if (!selectedCategory || categoryResults.length === 0) return;

        let results = [...categoryResults];

        // Apply dynamic filters
        if (activeFilters.price && activeFilters.price !== 'any') {
            results = results.filter(p => p.priceLevel === Number(activeFilters.price));
        }
        if (activeFilters.rating && activeFilters.rating !== 'any') {
            const minRating = Number(activeFilters.rating);
            if (!isNaN(minRating)) {
                results = results.filter(p => (p.rating || 0) >= minRating);
            }
        }

        // Strict Field Filtering
        if (activeFilters.dietary && activeFilters.dietary.length > 0) {
            results = results.filter(p => checkFilterMatch(p, 'dietary', activeFilters.dietary));
        }

        if (activeFilters.establishmentType && activeFilters.establishmentType.length > 0) {
            results = results.filter(p => checkFilterMatch(p, 'establishmentType', activeFilters.establishmentType));
        }

        if (activeFilters.cuisine && activeFilters.cuisine.length > 0) {
            results = results.filter(p => checkFilterMatch(p, 'cuisine', activeFilters.cuisine));
        }

        if (activeFilters.features && activeFilters.features.length > 0) {
            results = results.filter(p => checkFilterMatch(p, 'features', activeFilters.features));
        }

        // Sorting
        if (sortOption === 'popularity') {
            results.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        } else if (sortOption === 'rating') {
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortOption === 'price_low') {
            results.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0));
        } else if (sortOption === 'price_high') {
            results.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0));
        }

        setFilteredPlaces(results);

        // Update analytics metadata to reflect visible results
        if (filtrationMetadata) {
            setFiltrationMetadata({
                ...filtrationMetadata,
                filteredCount: results.length,
                filtrationRate: filtrationMetadata.originalCount > 0
                    ? Math.round(((filtrationMetadata.originalCount - results.length) / filtrationMetadata.originalCount) * 100)
                    : 0
            });
        }

        // Also apply filters to Nearby and Hidden Gems tabs
        setNearbyPlacesList(results);

        // For Hidden Gems, maintain the rating/review criteria
        const hidden = results.filter(p => (p.rating || 0) >= 4.0 && (p.reviews || 0) < 100);
        setHiddenGemsList(hidden);

    }, [activeFilters, categoryResults, selectedCategory, sortOption]);

    const handleLocationChange = (location: string, coords?: { lat: number; lng: number }) => {
        console.log('Location changed to:', location);
        setCurrentLocationName(location);
        if (coords) {
            setLocationCoords(coords);
        }
        // Always fetch places, even if we don't have coords (we'll use text search)
        fetchPlaces(coords || null, currentRadius, location);
    };

    const handleRadiusChange = (radius: number) => {
        const radiusInMeters = radius * 1000;
        setCurrentRadius(radiusInMeters);
        // Pass current location coords (or null) and name
        fetchPlaces(locationCoords, radiusInMeters, currentLocationName);
    };

    const handleSearch = async (query: string) => {
        if (!query) return;

        setIsLoading(true);
        setFiltrationMetadata(null);
        try {
            // Construct smart query using new logic
            const searchLogic = constructMapsQuery({
                query: query,
                locationName: currentLocationName,
                filters: activeFilters,
                time: new Date() // Will trigger 4AM logic if applicable
            });

            console.log(`[Discover] Search Strategy: ${searchLogic.strategy} | Query: ${searchLogic.finalQuery} | Radius: ${searchLogic.radius}`);

            // Use radius from logic (e.g. 35km for Early Morning)
            const effectiveRadius = Math.max(currentRadius, searchLogic.radius);

            const results = await searchPlaces(searchLogic.finalQuery, locationCoords || undefined, effectiveRadius, searchLogic.searchType);

            // Determine correct category for filtration
            let filtrationCategory = '';
            if (searchLogic.strategy === 'JAIN_STRICT' || searchLogic.strategy === 'LOCAL_NON_VEG' || searchLogic.strategy === 'EARLY_MORNING') {
                filtrationCategory = 'restaurants';
            }

            // Apply Advanced Filtration
            let { filteredPlaces, metadata } = applyDiscoveryFiltrationPipeline(results, currentLocationName, filtrationCategory);

            // Jain Audit Protocol
            if (searchLogic.strategy === 'JAIN_STRICT') {
                console.log('[Discover] Applying Strict Jain Audit via Gemini...');
                filteredPlaces = await auditJainFriendliness(filteredPlaces);
            }

            setFiltrationMetadata(metadata);

            let enhancedResults = filteredPlaces;
            if (locationCoords) {
                enhancedResults = await enhanceDiscoveryPlaces(filteredPlaces, locationCoords);
            }

            setFilteredPlaces(enhancedResults);
            setSelectedCategory(''); // Clear category selection on search
            setVisibleCount(12); // Reset pagination
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleSavePlace = (place: Place) => {
        // TODO: Implement save place functionality
        console.log('Save place:', place.name);
        alert(`Saved "${place.name}" for later!`);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Discover Places</h1>
                    <p className="text-muted-foreground">Explore amazing destinations and activities around you</p>
                </div>
                <Button onClick={() => setIsSubmissionModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Place
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="mb-6">
                <DiscoverHeader
                    onSearch={handleSearch}
                    onLocationChange={handleLocationChange}
                    onRadiusChange={handleRadiusChange}
                />
            </div>

            {/* Categories */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
                <CategoryGrid
                    onSelectCategory={handleCategorySelect}
                    selectedCategory={selectedCategory}
                />
            </div>

            {/* Dynamic Advanced Filters */}
            {selectedCategory && (
                <AdvancedFilters
                    category={selectedCategory}
                    onFilterChange={handleFilterChange}
                />
            )}

            {/* Filtration Analytics */}
            {filtrationMetadata && (
                <FiltrationAnalytics
                    originalCount={filtrationMetadata.originalCount}
                    filteredCount={filtrationMetadata.filteredCount}
                    filtrationRate={filtrationMetadata.filtrationRate}
                    isVisible={true}
                />
            )}

            {/* Sort & Count */}
            {selectedCategory && (
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {Math.min(visibleCount, filteredPlaces.length)} of {filteredPlaces.length} places
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Sort by:</span>
                        <Select value={sortOption} onValueChange={handleSortChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="popularity">Popularity</SelectItem>
                                <SelectItem value="rating">Rating (High to Low)</SelectItem>
                                <SelectItem value="price_low">Price (Low to High)</SelectItem>
                                <SelectItem value="price_high">Price (High to Low)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Tabbed Content */}
            <Tabs defaultValue="trending" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="trending">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Trending
                    </TabsTrigger>
                    <TabsTrigger value="nearby">
                        <MapPin className="h-4 w-4 mr-2" />
                        Nearby
                    </TabsTrigger>
                    <TabsTrigger value="hidden">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Hidden Gems
                    </TabsTrigger>
                </TabsList>

                {/* Trending Places */}
                <TabsContent value="trending" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>🔥 Trending</CardTitle>
                            <CardDescription>Most popular places right now</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Social Trends Section for Food */}
                                    {(selectedCategory === 'food' || selectedCategory === 'restaurants') && (
                                        <SocialTrends />
                                    )}

                                    {/* Community Places First */}
                                    {communityPlaces.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Community Picks</h3>
                                            <div className="grid gap-4">
                                                {communityPlaces.map(place => (
                                                    <CommunityPlaceCard key={place.id} place={place} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <PlaceList
                                        places={selectedCategory ? filteredPlaces.slice(0, visibleCount) : trendingPlacesList}

                                        onSavePlace={handleSavePlace}
                                        useEnhancedCard={selectedCategory === 'food' || selectedCategory === 'restaurants'}
                                    />

                                    {/* Load More Button */}
                                    {selectedCategory && filteredPlaces.length > visibleCount && (
                                        <div className="flex justify-center mt-6">
                                            <Button
                                                variant="outline"
                                                onClick={() => setVisibleCount(prev => prev + 12)}
                                                className="w-full max-w-xs"
                                            >
                                                Load More Results ({filteredPlaces.length - visibleCount} remaining)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Nearby Places */}
                <TabsContent value="nearby" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📍 Nearby Places</CardTitle>
                            <CardDescription>Discover what's around you</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">Loading...</div>
                            ) : (
                                <PlaceList
                                    places={nearbyPlacesList}

                                    onSavePlace={handleSavePlace}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hidden Gems */}
                <TabsContent value="hidden" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>💎 Hidden Gems</CardTitle>
                            <CardDescription>Local favorites and secret spots</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex justify-center p-8">Loading...</div>
                            ) : (
                                <PlaceList
                                    places={hiddenGemsList}

                                    onSavePlace={handleSavePlace}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submission Modal */}
            <PlaceSubmissionModal
                isOpen={isSubmissionModalOpen}
                onClose={() => setIsSubmissionModalOpen(false)}
            />
        </div>
    );
}
