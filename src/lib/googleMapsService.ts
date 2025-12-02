// @ts-nocheck
import { Place } from '@/types';
import { smartCategoryFilter, fallbackHikingSpots } from './categoryUtils';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

let isGoogleMapsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function initGoogleMaps(): Promise<void> {
    if (!API_KEY) {
        console.error('[GoogleMaps] API key not found in environment variables');
        return;
    }

    // 1. Check if already loaded and available on window
    if (typeof window !== 'undefined' && window.google?.maps) {
        if (!isGoogleMapsLoaded) {
            console.log('[GoogleMaps] Already loaded on window');
            isGoogleMapsLoaded = true;
        }
        return;
    }

    // 2. If a loading promise exists, return it
    if (loadPromise) {
        return loadPromise;
    }

    // 3. Create a new loading promise
    loadPromise = new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Cannot load Google Maps in non-browser environment'));
            return;
        }

        // Double check inside promise
        if (window.google?.maps) {
            isGoogleMapsLoaded = true;
            resolve();
            return;
        }

        // Check for existing script
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');

        if (existingScript) {
            console.log('[GoogleMaps] Found existing script, waiting for initialization...');
            // Script exists, wait for it to initialize
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.google?.maps) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    console.log('[GoogleMaps] Initialized from existing script');
                    resolve();
                } else if (attempts > 50) { // 5 seconds
                    clearInterval(checkInterval);
                    console.warn('[GoogleMaps] Waiting for existing script timed out');
                    reject(new Error('Google Maps script loaded but API not available'));
                }
            }, 100);
            return;
        }

        console.log('[GoogleMaps] Loading new script...');
        // Create and load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.id = 'google-maps-script';

        script.onload = () => {
            // Script loaded, wait for API to be ready
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (window.google?.maps) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    console.log('[GoogleMaps] Script loaded and API ready');
                    resolve();
                } else if (attempts > 50) { // 5 seconds
                    clearInterval(checkInterval);
                    reject(new Error('Google Maps API not available after script load'));
                }
            }, 100);
        };

        script.onerror = (e) => {
            console.error('[GoogleMaps] Script load error:', e);
            reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
    });

    // 4. Wrap in a global timeout to ensure we never hang indefinitely
    return Promise.race([
        loadPromise,
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Google Maps initialization timed out')), 10000))
    ]).catch(err => {
        console.error('[GoogleMaps] Initialization failed:', err);
        loadPromise = null; // Reset promise on error to allow retry
        throw err;
    });
}

export async function searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000,
    type?: string // Add type parameter
): Promise<Place[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.error('[GoogleMaps] API not available for searchPlaces');
            return [];
        }

        const searchPromise = new Promise<Place[]>((resolve) => {
            // Use a div instead of a Map for lighter resource usage
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));

            const request: google.maps.places.TextSearchRequest = {
                query,
                location: location ? new window.google.maps.LatLng(location.lat, location.lng) : undefined,
                radius: Math.min(radius, 50000), // Text search also prefers radius <= 50km for strict bias
                type: type as any, // Pass type to request
            };

            console.log(`[GoogleMaps] Executing Text Search: "${query}"`, request);

            service.textSearch(request, (results, status) => {
                console.log(`[GoogleMaps] Search query: "${query}", Status: ${status}, Results: ${results?.length}`);
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    const places = results.slice(0, 20).map(convertGooglePlaceToPlace);
                    resolve(places);
                } else {
                    console.warn('[GoogleMaps] Places search failed or empty:', status);
                    resolve([]);
                }
            });
        });

        // Add a timeout to prevent hanging forever
        return Promise.race([
            searchPromise,
            new Promise<Place[]>((resolve) => setTimeout(() => {
                console.warn('[GoogleMaps] Search timed out');
                resolve([]);
            }, 5000))
        ]);

    } catch (error) {
        console.error('[GoogleMaps] Error searching places:', error);
        return [];
    }
}

export async function searchNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 5000,
    type?: string
): Promise<Place[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return [];
        }

        const searchPromise = new Promise<Place[]>((resolve) => {
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));

            const request: google.maps.places.PlaceSearchRequest = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius: Math.min(radius, 50000), // Clamp to 50km max for nearbySearch
                type: type as any,
            };

            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    const places = results.slice(0, 20).map(convertGooglePlaceToPlace);
                    resolve(places);
                } else {
                    console.warn('Nearby search failed:', status);
                    resolve([]);
                }
            });
        });

        return Promise.race([
            searchPromise,
            new Promise<Place[]>((resolve) => setTimeout(() => resolve([]), 5000))
        ]);

    } catch (error) {
        console.error('Error searching nearby places:', error);
        return [];
    }
}

// ... (getPlaceDetails remains mostly same, but could benefit from timeout too)
export async function getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return null;
        }

        const detailsPromise = new Promise<Place | null>((resolve) => {
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
                placeId,
                fields: ['name', 'rating', 'formatted_address', 'geometry', 'photos', 'types', 'price_level', 'user_ratings_total', 'formatted_phone_number', 'website', 'opening_hours', 'vicinity'],
            };

            service.getDetails(request, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                    resolve(convertGooglePlaceToPlace(place));
                } else {
                    console.warn('Place details failed:', status);
                    resolve(null);
                }
            });
        });

        return Promise.race([
            detailsPromise,
            new Promise<Place | null>((resolve) => setTimeout(() => resolve(null), 5000))
        ]);

    } catch (error) {
        console.error('Error getting place details:', error);
        return null;
    }
}

function convertGooglePlaceToPlace(googlePlace: google.maps.places.PlaceResult): Place {
    const category = mapGoogleTypeToCategory(googlePlace.types?.[0] || '');

    return {
        id: googlePlace.place_id || `place-${Date.now()}`,
        name: googlePlace.name || 'Unknown Place',
        category,
        lat: googlePlace.geometry?.location?.lat() || 0,
        lng: googlePlace.geometry?.location?.lng() || 0,
        rating: googlePlace.rating || 0,
        reviews: googlePlace.user_ratings_total || 0,
        priceLevel: (googlePlace.price_level || 1) as 1 | 2 | 3 | 4,
        image: googlePlace.photos?.[0]?.getUrl({ maxWidth: 800 }) || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        description: googlePlace.formatted_address || '',
        phoneNumber: googlePlace.formatted_phone_number,
        website: googlePlace.website,
        openingHours: googlePlace.opening_hours?.weekday_text,
        rawTypes: googlePlace.types || [],
        vicinity: googlePlace.vicinity || googlePlace.formatted_address || '',
    };
}

function mapGoogleTypeToCategory(type: string): 'food' | 'attraction' | 'hotel' | 'activity' | 'hiking' | 'nature' | 'shopping' | 'nightlife' | 'culture' {
    const typeMap: Record<string, 'food' | 'attraction' | 'hotel' | 'activity' | 'hiking' | 'nature' | 'shopping' | 'nightlife' | 'culture'> = {
        restaurant: 'food',
        cafe: 'food',
        bar: 'food',
        food: 'food',
        meal_takeaway: 'food',
        meal_delivery: 'food',
        lodging: 'hotel',
        hotel: 'hotel',
        tourist_attraction: 'attraction',
        museum: 'culture',
        art_gallery: 'culture',
        park: 'nature',
        natural_feature: 'nature',
        campground: 'nature',
        point_of_interest: 'attraction',
        amusement_park: 'activity',
        bowling_alley: 'activity',
        gym: 'activity',
        spa: 'activity',
        shopping_mall: 'shopping',
        store: 'shopping',
        clothing_store: 'shopping',
        night_club: 'nightlife',
        casino: 'nightlife',
        stadium: 'activity',
        movie_theater: 'activity',
    };

    return typeMap[type] || 'attraction';
}

// Map our category IDs to Google Places types
export function mapCategoryToGoogleType(category: string): string {
    const categoryMap: Record<string, string> = {
        food: 'restaurant',
        attraction: 'tourist_attraction',
        hotel: 'lodging',
        activity: 'amusement_park',
        hiking: 'park',
        nature: 'park',
        shopping: 'shopping_mall',
        nightlife: 'night_club',
        culture: 'museum',
    };

    return categoryMap[category] || 'tourist_attraction';
}

// Search for hidden gems - lesser-known places with good ratings
export async function searchHiddenGems(
    location: { lat: number; lng: number },
    radius: number = 5000
): Promise<Place[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return [];
        }

        const searchPromise = new Promise<Place[]>((resolve) => {
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));

            const request: google.maps.places.PlaceSearchRequest = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius,
                // Search for highly rated but less reviewed places
            };

            service.nearbySearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    // Filter for hidden gems: good rating (4.0+) but fewer reviews (< 500)
                    const hiddenGems = results
                        .filter(place =>
                            (place.rating || 0) >= 4.0 &&
                            (place.user_ratings_total || 0) < 500 &&
                            (place.user_ratings_total || 0) > 10 // At least some reviews
                        )
                        .slice(0, 20)
                        .map(convertGooglePlaceToPlace);

                    resolve(hiddenGems);
                } else {
                    console.warn('Hidden gems search failed:', status);
                    resolve([]);
                }
            });
        });

        return Promise.race([
            searchPromise,
            new Promise<Place[]>((resolve) => setTimeout(() => resolve([]), 5000))
        ]);

    } catch (error) {
        console.error('Error searching hidden gems:', error);
        return [];
    }
}

export async function autocompletePlace(input: string, types?: string[]): Promise<google.maps.places.AutocompletePrediction[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.error('[GoogleMaps] API not available for autocomplete');
            return [];
        }

        const autocompletePromise = new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
            const service = new window.google.maps.places.AutocompleteService();

            const request: google.maps.places.AutocompletionRequest = {
                input,
                types: types || ['(cities)'], // Default to cities to avoid "(regions) cannot be mixed" error
            };

            service.getPlacePredictions(request, (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    resolve(predictions);
                } else {
                    console.warn('[GoogleMaps] Autocomplete failed:', status);
                    resolve([]);
                }
            });
        });

        return Promise.race([
            autocompletePromise,
            new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => setTimeout(() => resolve([]), 3000)) // Shorter timeout for autocomplete
        ]);

    } catch (error) {
        console.error('[GoogleMaps] Error with autocomplete:', error);
        return [];
    }
}

export async function searchHikingPlaces(
    locationName: string,
    coords?: { lat: number; lng: number },
    radius: number = 5000
): Promise<Place[]> {
    try {
        const queries = [
            `hiking trails near ${locationName}`,
            `nature walks near ${locationName}`,
            `trekking places near ${locationName}`,
            `forest trails near ${locationName}`,
            `mountain hiking near ${locationName}`
        ];

        // Run queries in parallel
        const promises = queries.map(query =>
            searchPlaces(query, coords, radius, 'park')
        );

        const results = await Promise.all(promises);

        let allPlaces: Place[] = [];
        results.forEach(places => {
            allPlaces = [...allPlaces, ...places];
        });

        // Remove duplicates based on ID or Name
        const uniquePlaces = Array.from(new Map(allPlaces.map(item => [item.name + item.lat, item])).values());

        // Apply strict filtering using the smart filter we updated
        const filtered = smartCategoryFilter(uniquePlaces, 'hiking');

        if (filtered.length === 0) {
            console.log('No hiking places found via API, trying fallback...');
            const cityKey = locationName.toLowerCase();
            // Check if any key in fallbackHikingSpots is contained in locationName
            const fallbackKey = Object.keys(fallbackHikingSpots).find(key => cityKey.includes(key));

            if (fallbackKey) {
                const fallbackNames = fallbackHikingSpots[fallbackKey];
                console.log(`Found fallback spots for ${fallbackKey}:`, fallbackNames);

                const fallbackPromises = fallbackNames.map(name => searchPlaces(name, coords, radius));
                const fallbackResults = await Promise.all(fallbackPromises);

                let fallbackPlaces: Place[] = [];
                fallbackResults.forEach(places => {
                    if (places.length > 0) {
                        fallbackPlaces.push(places[0]); // Take the best match
                    }
                });

                return fallbackPlaces;
            }
        }

        return filtered;
    } catch (error) {
        console.error('Error searching hiking places:', error);
        return [];
    }
}

// Haversine formula for straight-line distance
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// FALLBACK: Straight-line distance calculation
function calculateStraightLineDistance(userLocation: { lat: number; lng: number }, places: Place[]): Place[] {
    return places.map(place => {
        const distanceKm = calculateHaversineDistance(
            userLocation.lat, userLocation.lng, place.lat, place.lng
        );

        return {
            ...place,
            distance: {
                text: `${distanceKm.toFixed(1)} km`,
                value: distanceKm * 1000, // meters
                duration: undefined
            }
        };
    });
}

// REAL-TIME DISTANCE CALCULATION
export async function calculateRealDistances(userLocation: { lat: number; lng: number }, places: Place[]): Promise<Place[]> {
    if (!userLocation || !places.length) return places;

    // OPTIMIZATION: Use straight-line distance for list views to prevent slow loading
    // The Distance Matrix API is too slow for 20+ items on every search.
    // We will use Haversine formula for immediate feedback.
    return calculateStraightLineDistance(userLocation, places);

    /* 
    // Original Distance Matrix Logic (Disabled for performance)
    try {
        await initGoogleMaps();
        if (typeof window === 'undefined' || !window.google?.maps) return calculateStraightLineDistance(userLocation, places);

        const distanceService = new window.google.maps.DistanceMatrixService();
        // ... (rest of the slow logic)
    } catch (error) {
        console.error('Distance calculation failed:', error);
        return calculateStraightLineDistance(userLocation, places);
    }
    */
}

export async function enhancePlacesWithPhotosAndDistance(
    userLocation: { lat: number; lng: number },
    places: Place[]
): Promise<Place[]> {
    // 1. Calculate distances
    const placesWithDistance = await calculateRealDistances(userLocation, places);

    // 2. Photos are already handled in convertGooglePlaceToPlace.
    // If we needed to fetch them explicitly, we would need the PlaceResult object which we don't have here.
    // We rely on the initial search to populate the image URL.

    return placesWithDistance;
}
