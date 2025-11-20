import { Loader } from '@googlemaps/js-api-loader';
import { Place } from '@/types';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

let googleMapsLoader: Loader | null = null;
let isGoogleMapsLoaded = false;

export async function initGoogleMaps(): Promise<void> {
    if (!API_KEY) {
        console.warn('Google Maps API key not found');
        return;
    }

    if (isGoogleMapsLoaded) {
        return;
    }

    if (!googleMapsLoader) {
        googleMapsLoader = new Loader({
            apiKey: API_KEY,
            version: 'weekly',
            libraries: ['places', 'geometry'],
        });
    }

    try {
        await googleMapsLoader.importLibrary('places');
        await googleMapsLoader.importLibrary('maps');
        isGoogleMapsLoaded = true;
    } catch (error) {
        console.error('Failed to load Google Maps:', error);
        throw error;
    }
}

export async function searchPlaces(
    query: string,
    location?: { lat: number; lng: number },
    radius: number = 5000
): Promise<Place[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google) {
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

        if (typeof window === 'undefined' || !window.google) {
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

        if (typeof window === 'undefined' || !window.google) {
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

function mapGoogleTypeToCategory(type: string): 'food' | 'attraction' | 'hotel' | 'activity' {
    const typeMap: Record<string, 'food' | 'attraction' | 'hotel' | 'activity'> = {
        restaurant: 'food',
        cafe: 'food',
        bar: 'food',
        food: 'food',
        lodging: 'hotel',
        hotel: 'hotel',
        tourist_attraction: 'attraction',
        museum: 'attraction',
        park: 'attraction',
        point_of_interest: 'attraction',
        amusement_park: 'activity',
        bowling_alley: 'activity',
        gym: 'activity',
    };

    return typeMap[type] || 'attraction';
}

export async function autocompletePlace(input: string): Promise<google.maps.places.AutocompletePrediction[]> {
    try {
        await initGoogleMaps();

        if (typeof window === 'undefined' || !window.google) {
            console.warn('Google Maps not available');
            return [];
        }

        return new Promise((resolve) => {
            const service = new window.google.maps.places.AutocompleteService();

            service.getPlacePredictions({ input }, (predictions, status) => {
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
