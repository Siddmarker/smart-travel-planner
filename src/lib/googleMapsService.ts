import { Place } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

let isGoogleMapsLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function initGoogleMaps(): Promise<void> {
    if (!API_KEY) {
        console.warn('Google Maps API key not found');
        return;
    }

    // If already loaded and available, return immediately
    if (isGoogleMapsLoaded && typeof window !== 'undefined' && window.google?.maps) {
        return;
    }

    // If currently loading, return the existing promise
    if (loadPromise) {
        return loadPromise;
    }

    loadPromise = new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('Cannot load Google Maps in non-browser environment'));
            return;
        }

        // Check if already loaded
        if (window.google?.maps) {
            isGoogleMapsLoaded = true;
            resolve();
            return;
        }

        // Check if script tag already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
            // Wait for it to load
            const checkInterval = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    resolve();
                }
            }, 100);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!window.google?.maps) {
                    reject(new Error('Google Maps script timeout'));
                }
            }, 10000);
            return;
        }

        // Create and load the script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
            // Wait for window.google.maps to be available
            const checkInterval = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    resolve();
                }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!window.google?.maps) {
                    loadPromise = null;
                    reject(new Error('Google Maps API not available after script load'));
                }
            }, 5000);
        };

        script.onerror = () => {
            loadPromise = null;
            reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
    });

    return loadPromise;
}

export async function searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000
): Promise<Place[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return [];
        }

        return new Promise((resolve) => {
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request: google.maps.places.TextSearchRequest = {
                query,
                location: location ? new window.google.maps.LatLng(location.lat, location.lng) : undefined,
                radius,
            };

            service.textSearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    const places = results.slice(0, 20).map(convertGooglePlaceToPlace);
                    resolve(places);
                } else {
                    console.warn('Places search failed:', status);
                    resolve([]);
                }
            });
        });
    } catch (error) {
        console.error('Error searching places:', error);
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

        return new Promise((resolve) => {
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request: google.maps.places.PlaceSearchRequest = {
                location: new window.google.maps.LatLng(location.lat, location.lng),
                radius,
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
    } catch (error) {
        console.error('Error searching nearby places:', error);
        return [];
    }
}

export async function getPlaceDetails(placeId: string): Promise<Place | null> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return null;
        }

        return new Promise((resolve) => {
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
                placeId,
                fields: ['name', 'rating', 'formatted_address', 'geometry', 'photos', 'types', 'price_level', 'user_ratings_total', 'formatted_phone_number', 'website', 'opening_hours'],
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

        return new Promise((resolve) => {
            const map = new window.google.maps.Map(document.createElement('div'));
            const service = new window.google.maps.places.PlacesService(map);

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
    } catch (error) {
        console.error('Error searching hidden gems:', error);
        return [];
    }
}

export async function autocompletePlace(input: string, types?: string[]): Promise<google.maps.places.AutocompletePrediction[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google?.maps) {
            console.warn('Google Maps not available');
            return [];
        }

        return new Promise((resolve) => {
            const service = new window.google.maps.places.AutocompleteService();

            const request: google.maps.places.AutocompletionRequest = {
                input,
                types: types || ['(regions)', '(cities)'], // Default to geographic locations
            };

            service.getPlacePredictions(request, (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    resolve(predictions);
                } else {
                    console.warn('Autocomplete failed:', status);
                    resolve([]);
                }
            });
        });
    } catch (error) {
        console.error('Error with autocomplete:', error);
        return [];
    }
}
