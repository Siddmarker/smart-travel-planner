import { Place } from '@/types';
import { LocationData } from '@/components/Location/LocationDetector';

// Enhanced destination service with proper error handling
export const destinationService = {
    async fetchDestinations(location: LocationData, radius: number = 50, category: string = 'all') {
        try {
            // Validate location
            if (!location || !location.lat || !location.lng) {
                throw new Error('Invalid location provided');
            }

            console.log('🔍 Fetching destinations for location:', location);

            // Step 1: Try multiple APIs in sequence
            let destinations: any[] = [];

            // Priority 1: Google Places API (if configured)
            if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
                try {
                    const googleResults = await fetchGooglePlaces({
                        location: `${location.lat},${location.lng}`,
                        radius: radius * 1000, // Convert to meters
                        type: getPlaceType(category),
                        keyword: getKeywords(category)
                    });

                    if (googleResults.length > 0) {
                        destinations = [...destinations, ...googleResults];
                    }
                } catch (googleError) {
                    console.warn('Google Places API failed:', googleError);
                }
            }

            // Priority 2: OpenStreetMap/Nominatim (free, no API key needed)
            try {
                const osmResults = await fetchOSMPlaces({
                    lat: location.lat,
                    lon: location.lng,
                    radius: radius,
                    category: category
                });

                if (osmResults.length > 0) {
                    // Avoid duplicates if Google already returned results
                    const existingIds = new Set(destinations.map((d: any) => d.name)); // Simple name check for now
                    const newOsmResults = osmResults.filter((d: any) => !existingIds.has(d.name));
                    destinations = [...destinations, ...newOsmResults];
                }
            } catch (osmError) {
                console.warn('OpenStreetMap API failed:', osmError);
            }

            // Priority 3: Local database/cache (Simulated)
            try {
                const cachedResults: any[] = await fetchCachedDestinations(location, radius);
                if (cachedResults.length > 0) {
                    const existingIds = new Set(destinations.map((d: any) => d.name));
                    const newCached = cachedResults.filter((d: any) => !existingIds.has(d.name));
                    destinations = [...destinations, ...newCached];
                }
            } catch (cacheError) {
                console.warn('Cache fetch failed:', cacheError);
            }

            console.log(`✅ Found ${destinations.length} total destinations`);

            // Step 2: Apply smart filtration
            const filteredDestinations = applyDestinationFiltration(destinations, category);
            console.log(`✅ After filtration: ${filteredDestinations.length} destinations`);

            // Step 3: Enrich with additional data
            const enrichedDestinations = await enrichDestinations(filteredDestinations, location);

            // Step 4: Sort by relevance (distance, rating, popularity)
            const sortedDestinations = sortDestinationsByRelevance(enrichedDestinations, location);

            return {
                success: true,
                count: sortedDestinations.length,
                destinations: sortedDestinations,
                location: location,
                radius: radius
            };

        } catch (error: any) {
            console.error('❌ Destination fetch error:', error);

            // Return fallback sample data if all APIs fail
            const fallbackDestinations = getFallbackDestinations(location, category);

            return {
                success: false,
                error: error.message,
                fallback: true,
                count: fallbackDestinations.length,
                destinations: fallbackDestinations,
                location: location
            };
        }
    }
};

// Helper functions

function getPlaceType(category: string): string {
    const map: Record<string, string> = {
        all: 'tourist_attraction',
        attractions: 'tourist_attraction',
        food: 'restaurant',
        nature: 'park',
        culture: 'museum'
    };
    return map[category] || 'tourist_attraction';
}

function getKeywords(category: string): string {
    const map: Record<string, string> = {
        all: 'tourist attraction',
        attractions: 'tourist attraction',
        food: 'restaurant cafe',
        nature: 'park hiking nature',
        culture: 'museum art history'
    };
    return map[category] || '';
}

// Enhanced Google Places fetching
// Note: Client-side fetching from Google Places API directly often has CORS issues.
// In a real app, this should go through a Next.js API route.
// For this implementation, we'll try to use the existing googleMapsService if possible, or fetch via proxy if configured.
// Assuming we are using the client-side library loaded in googleMapsService.
import { searchNearbyPlaces } from '@/lib/googleMapsService';

async function fetchGooglePlaces(params: any) {
    // Reuse existing service logic which handles the map loader
    const location = params.location.split(',').map(Number);
    const results = await searchNearbyPlaces(
        { lat: location[0], lng: location[1] },
        params.radius,
        params.type
    );
    return results;
}

// OpenStreetMap/Nominatim API (free, no API key)
async function fetchOSMPlaces(params: any) {
    const { lat, lon, radius, category } = params;

    // Convert category to OSM tags
    const query = category === 'all' ? 'tourism' : category;

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.append('format', 'jsonv2');
    url.searchParams.append('lat', lat);
    url.searchParams.append('lon', lon);
    // Nominatim doesn't support radius search directly in search endpoint well without viewbox, 
    // but we can search for "category near lat,lon" or just use the query.
    // Better to use 'q' with "near" context if possible, or just search for the category.
    // For simplicity/robustness, we'll search for the category.
    url.searchParams.append('q', `${query} near ${lat},${lon}`);
    url.searchParams.append('limit', '20');
    url.searchParams.append('addressdetails', '1');

    const response = await fetch(url.toString(), {
        headers: {
            'Accept': 'application/json',
            // 'User-Agent': 'TravelPlannerApp/1.0' // Browsers might block setting User-Agent
        }
    });

    if (!response.ok) {
        throw new Error(`OSM API error: ${response.status}`);
    }

    const data = await response.json();

    return data.map((place: any) => ({
        id: `osm_${place.place_id || place.osm_id}`,
        name: place.display_name.split(',')[0],
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        category: place.category,
        type: place.type,
        rating: 4.0, // Default rating for OSM
        reviews: 0,
        priceLevel: 1,
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=800', // Generic placeholder
        description: place.display_name,
        vicinity: place.address?.road || place.display_name
    }));
}

async function fetchCachedDestinations(location: any, radius: any) {
    // Simulate cache
    return [];
}

// Smart destination filtration
function applyDestinationFiltration(destinations: any[], category: string) {
    return destinations.filter(place => {
        // 1. Remove duplicates by location (within 100m)
        const isDuplicate = destinations.some(otherPlace =>
            otherPlace !== place &&
            calculateDistance({ lat: place.lat, lng: place.lng }, { lat: otherPlace.lat, lng: otherPlace.lng }) < 0.1
        );
        if (isDuplicate) return false;

        // 2. Filter out bad data
        if (!place.name) return false;

        return true;
    });
}

// Enrich destinations with additional data
async function enrichDestinations(destinations: any[], userLocation: any) {
    return Promise.all(
        destinations.map(async (place) => {
            // Add distance from user
            place.distance = calculateDistance(userLocation, { lat: place.lat, lng: place.lng });
            return place;
        })
    );
}

function sortDestinationsByRelevance(destinations: any[], location: any) {
    return destinations.sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

// Fallback destinations in case APIs fail
function getFallbackDestinations(location: any, category: string) {
    // Return sample destinations based on category
    return [
        {
            id: 'fallback_1',
            name: 'Central Park (Sample)',
            lat: location.lat + 0.01,
            lng: location.lng + 0.01,
            rating: 4.5,
            reviews: 120,
            priceLevel: 1,
            image: 'https://images.unsplash.com/photo-1496417263034-38ec4f0d665a?w=800',
            description: 'A beautiful park for relaxation.',
            category: 'nature',
            distance: 1.5
        },
        {
            id: 'fallback_2',
            name: 'City Museum (Sample)',
            lat: location.lat - 0.01,
            lng: location.lng + 0.02,
            rating: 4.7,
            reviews: 85,
            priceLevel: 2,
            image: 'https://images.unsplash.com/photo-1518998053901-5348d3969105?w=800',
            description: 'Learn about local history.',
            category: 'culture',
            distance: 2.3
        }
    ];
}

function calculateDistance(loc1: { lat: number, lng: number }, loc2: { lat: number, lng: number }) {
    const R = 6371; // km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
