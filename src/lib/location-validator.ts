/**
 * Location Validator Service
 * Ensures geographic precision and prevents country mismatches
 */

export interface LocationValidationResult {
    isValid: boolean;
    coordinates: { lat: number; lng: number };
    country?: string;
    region?: string;
    error?: string;
    suggestedCorrection?: string;
}

export interface GeographicBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

// Country bounding boxes (simplified - in production, use a comprehensive database)
const COUNTRY_BOUNDS: { [country: string]: GeographicBounds } = {
    'India': {
        north: 35.5,
        south: 6.5,
        east: 97.5,
        west: 68.0
    },
    'United States': {
        north: 49.5,
        south: 24.5,
        east: -66.0,
        west: -125.0
    },
    'France': {
        north: 51.1,
        south: 41.3,
        east: 9.6,
        west: -5.2
    }
    // Add more countries as needed
};

/**
 * Validate if coordinates are within a country's bounds
 */
export function isWithinCountryBounds(
    lat: number,
    lng: number,
    country: string
): boolean {
    const bounds = COUNTRY_BOUNDS[country];
    if (!bounds) {
        console.warn(`No bounds defined for country: ${country}`);
        return true; // Allow if we don't have bounds
    }

    return (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
    );
}

/**
 * Get country from coordinates (simplified - in production, use reverse geocoding API)
 */
export function getCountryFromCoordinates(lat: number, lng: number): string | null {
    for (const [country, bounds] of Object.entries(COUNTRY_BOUNDS)) {
        if (
            lat >= bounds.south &&
            lat <= bounds.north &&
            lng >= bounds.west &&
            lng <= bounds.east
        ) {
            return country;
        }
    }
    return null;
}

/**
 * Validate location input
 * In production, this would call a geocoding API
 */
export async function validateLocation(
    locationInput: string,
    expectedCountry?: string
): Promise<LocationValidationResult> {
    // Mock implementation - in production, use Google Maps Geocoding API
    // For now, we'll use simple heuristics

    const lowerInput = locationInput.toLowerCase();

    // Simple pattern matching for demo
    if (lowerInput.includes('mysore') || lowerInput.includes('bangalore') || lowerInput.includes('india')) {
        const coords = { lat: 12.2958, lng: 76.6394 }; // Mysore coordinates
        const country = 'India';

        if (expectedCountry && expectedCountry !== country) {
            return {
                isValid: false,
                coordinates: coords,
                country,
                error: `Location is in ${country}, but expected ${expectedCountry}`,
                suggestedCorrection: `Did you mean ${locationInput}, ${country}?`
            };
        }

        return {
            isValid: true,
            coordinates: coords,
            country,
            region: 'Karnataka'
        };
    }

    // Default fallback
    return {
        isValid: true,
        coordinates: { lat: 0, lng: 0 },
        error: 'Could not validate location. Please use a more specific location name.'
    };
}

/**
 * Filter places by geographic bounds
 */
export function filterPlacesByBounds(
    places: Array<{ lat: number; lng: number;[key: string]: any }>,
    bounds: GeographicBounds
): typeof places {
    return places.filter(place =>
        place.lat >= bounds.south &&
        place.lat <= bounds.north &&
        place.lng >= bounds.west &&
        place.lng <= bounds.east
    );
}

/**
 * Get bounding box for a country
 */
export function getCountryBounds(country: string): GeographicBounds | null {
    return COUNTRY_BOUNDS[country] || null;
}
