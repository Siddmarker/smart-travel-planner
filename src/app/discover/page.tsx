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
import { applyDiscoveryFiltrationPipeline, enhanceDiscoveryPlaces, scoreAndSortPlaces } from '@/lib/discovery-filtration';
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


    const fetchPlaces = async (coords: { lat: number; lng: number } | null, radius: number, locationName: string, filters: Record<string, any> = {}) => {
        setIsLoading(true);
        setFiltrationMetadata(null); // Reset metadata
        try {
            console.log(`Fetching places for ${locationName} with Smart Query...`);

            // Fetch Community Places
            const community = SubmissionService.getCommunityPlaces();
            setCommunityPlaces(community);

            // 1. Fetch nearby places ONLY if we have coords (and no strict filters that require text search)
            // If filters dictate specific query (e.g. "Famous Local"), we might rely less on generic 'nearby'
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
                filters: filters, // Pass dynamic filters
                time: new Date()
            });

            console.log(`[Discover] Executing Search Strategy: ${searchLogic.strategy} | Query: ${searchLogic.finalQuery}`);

            // Use radius from logic if expanded (e.g., 4 AM Protocol)
            const effectiveRadius = Math.max(radius, searchLogic.radius);

            let trending = await searchPlaces(searchLogic.finalQuery, coords || undefined, effectiveRadius, undefined); // Remove strict 'tourist_attraction' type to allow broader results

            // FALLBACK MECHANISM
            if (trending.length === 0 && searchLogic.fallbackQuery) {
                console.warn(`[Discover] No results for "${searchLogic.finalQuery}". Retrying with fallback: "${searchLogic.fallbackQuery}"`);
                // UI Feedback (Toast placeholder)
                // toast.info("Specific match not found. Showing similar top-rated spots.");
                trending = await searchPlaces(searchLogic.fallbackQuery, coords || undefined, effectiveRadius);
            }

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

            // SCORE & SORT (instead of strict filtering)
            // Even if basic filtration passes, we rank them
            filteredTrending = scoreAndSortPlaces(filteredTrending, filters);

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

            // Initialize filtered places with trending (Top 20 scored)
            setFilteredPlaces(enhancedTrending.slice(0, 20));

        } catch (error) {
            console.error('Error fetching places:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const executeCategorySearch = async (categoryId: string, filters: Record<string, any> = {}) => {
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
                // Standard search for other categories WITH SMART QUERY INJECTION
                // 1. Construct Smart Query
                const searchLogic = constructMapsQuery({
                    query: categoryId, // Base category intent
                    locationName: currentLocationName,
                    filters: filters, // Inject filters
                    category: categoryId,
                    time: new Date()
                });

                console.log(`[Category Search] Strategy: ${searchLogic.strategy} | Query: ${searchLogic.finalQuery}`);

                // 2. Execute Search (Text Search is better for "Famous Local" than Nearby Search)
                // If we have filters, prefer Text Search. If vanilla category + coords, Nearby might be ok but Text Search is robust.
                // We'll use Text Search primarily for consistency with Smart Query logic.
                const effectiveRadius = Math.max(currentRadius, searchLogic.radius);

                // Use searchPlaces (Text Search)
                let textResults = await searchPlaces(searchLogic.finalQuery, locationCoords || undefined, effectiveRadius);

                // 3. Fallback Mechanism
                if (textResults.length === 0 && searchLogic.fallbackQuery) {
                    console.warn(`[Category] No results for "${searchLogic.finalQuery}". Retrying fallback: "${searchLogic.fallbackQuery}"`);
                    textResults = await searchPlaces(searchLogic.fallbackQuery, locationCoords || undefined, effectiveRadius);
                }

                results = textResults;

                // Note: We used to call smartCategoryFilter(textResults, categoryId) here.
                // But if we injected "Famous Local" into the query, strict category filtering might hide "Military Hotels" if their google type is 'restaurant' not 'local'?
                // Actually 'smartCategoryFilter' checks types. Military Hotel IS a restaurant.
                // But better to trust the Search Query results + Score Sorting.
            }

            // Apply enhancements (Credibility, Dietary Options, etc.)
            const enhancedResults = await enhanceDiscoveryPlaces(results, locationCoords);

            // SCORE & SORT (Soft Filtering)
            // This replaces strict filtering
            const scoredResults = scoreAndSortPlaces(enhancedResults, filters);

            setCategoryResults(scoredResults); // Store base results
            setFilteredPlaces(scoredResults.slice(0, 20)); // Update Trending tab with top 20

            // Update Nearby tab
            setNearbyPlacesList([...scoredResults]);

            // Update Hidden Gems tab
            const hidden = scoredResults.filter(p => (p.rating || 0) >= 4.0 && (p.reviews || 0) < 100);
            setHiddenGemsList(hidden);

            // Update Metadata for Analytics
            setFiltrationMetadata({
                originalCount: results.length,
                filteredCount: scoredResults.length,
                filtrationRate: 0, // We are sorting, not hiding, unless size differs?
                fakeEntities: [],
                layerResults: { basicValidation: 0, fakeEntityDetection: 0, credibilityScoring: 0, categoryValidation: 0, destinationRelevance: 0 }
            });

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

    const handleCategorySelect = async (categoryId: string) => {
        setSelectedCategory(categoryId);
        setActiveFilters({}); // Reset filters on NEW category select
        setVisibleCount(12);
        setFiltrationMetadata(null);

        if (!categoryId) {
            // No category selected, show all original trending
            setFilteredPlaces(trendingPlacesList);
            setNearbyPlacesList(originalNearby);
            setHiddenGemsList(originalHidden);
            setCategoryResults([]);
            return;
        }

        // Execute Search with empty filters initially
        executeCategorySearch(categoryId, {});
    };


    const handleFilterChange = (filters: Record<string, any>) => {
        setActiveFilters(filters);
        setVisibleCount(12);

        // TRIGGER SMART SEARCH ON FILTER CHANGE
        // This is the key fix for "No Results" -> We need to re-fetch with new query
        if (selectedCategory) {
            executeCategorySearch(selectedCategory, filters);
        } else {
            // If in Discovery Mode (no category), re-fetch main places logic
            // We need to pass filters to fetchPlaces
            fetchPlaces(locationCoords, currentRadius, currentLocationName, filters);
        }
    };

    const handleSortChange = (value: string) => {
        setSortOption(value);
    };

    // Effect to handle CLIENT-SIDE Sorting only (when sortOption changes)
    // We do NOT re-fetch here, just re-order current filteredPlaces
    useEffect(() => {
        if (filteredPlaces.length === 0) return;

        let results = [...filteredPlaces];

        // Sorting
        if (sortOption === 'popularity') {
            results.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
        } else if (sortOption === 'rating') {
            results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortOption === 'price_low') {
            results.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0));
        } else if (sortOption === 'price_high') {
            results.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0));
        } else if (sortOption === 'relevance') {
            // Default scoring sort
            results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }

        setFilteredPlaces(results);

    }, [sortOption]); // removed activeFilters dependencies

    const handleLocationChange = (location: string, coords?: { lat: number; lng: number }) => {
        console.log('Location changed to:', location);
        setCurrentLocationName(location);
        if (coords) {
            setLocationCoords(coords);
        }
        // Always fetch places, even if we don't have coords (we'll use text search)
        // Pass current active filters if any?
        // Usually location change might reset filters, but keeping them is fine.
        if (selectedCategory) {
            executeCategorySearch(selectedCategory, activeFilters);
        } else {
            fetchPlaces(coords || null, currentRadius, location, activeFilters);
        }
    };

    const handleRadiusChange = (radius: number) => {
        const radiusInMeters = radius * 1000;
        setCurrentRadius(radiusInMeters);
        // Pass current location coords (or null) and name
        if (selectedCategory) {
            executeCategorySearch(selectedCategory, activeFilters);
        } else {
            fetchPlaces(locationCoords, radiusInMeters, currentLocationName, activeFilters);
        }
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
            if (searchLogic.strategy === 'JAIN_STRICT') {
                filtrationCategory = 'restaurants'; // Keep strict validation but maybe not blocklist chains if they are pure veg?
                // Actually chains like 'A2B' are pure veg and good for Jain. We shouldn't block them for Jain.
            } else if (searchLogic.strategy === 'LOCAL_NON_VEG' || searchLogic.strategy === 'LOCAL_GEM') {
                filtrationCategory = 'Local'; // Trigger Review Ceiling & Franchise Killer
            } else if (searchLogic.strategy === 'EARLY_MORNING') {
                filtrationCategory = 'Local'; // Early morning spots are usually local gems
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
