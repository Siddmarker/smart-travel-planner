import { Place } from '@/types';

// Advanced filtration to remove agencies and commercial entities
export function applyOffRoadFiltration(places: Place[]): Place[] {
    return places.filter(place => {
        // FILTER 1: Remove commercial entities and agencies
        if (isCommercialOffRoadEntity(place)) return false;

        // FILTER 2: Remove places that are not genuine trails
        if (!isGenuineOffRoadTrail(place)) return false;

        // FILTER 3: Quality and safety thresholds
        if (!meetsOffRoadQualityStandards(place)) return false;

        return true;
    });
}

// Detect commercial off-road entities
function isCommercialOffRoadEntity(place: Place): boolean {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || []; // Using rawTypes from Place interface

    const commercialIndicators = [
        // Rental companies
        'rental', 'rent', 'hire', 'bike rental', 'atv rental',
        'scooter rental', 'motorcycle rental',

        // Tour agencies
        'tour', 'tours', 'adventure tour', 'bike tour', 'offroad tour',
        'guided tour', 'expedition', 'adventure company',

        // Training schools
        'training', 'school', 'academy', 'lessons', 'instruction',

        // Repair and shops
        'repair', 'service', 'workshop', 'dealership', 'showroom',
        'accessories', 'gear', 'equipment',

        // Commercial keywords
        'company', 'corp', 'inc', 'ltd', 'enterprise', 'adventures'
    ];

    // Check name for commercial indicators
    if (commercialIndicators.some(indicator => name.includes(indicator))) {
        return true;
    }

    // Check Google Places types
    const commercialTypes = [
        'car_rental', 'travel_agency', 'store', 'point_of_interest',
        'establishment', 'school'
    ];

    if (types.some(type => commercialTypes.includes(type))) {
        return true;
    }

    return false;
}

// Verify genuine off-road trails
function isGenuineOffRoadTrail(place: Place): boolean {
    const name = place.name.toLowerCase();
    const types = place.rawTypes || [];

    const trailIndicators = [
        // Natural features
        'trail', 'track', 'path', 'route', 'road',
        'mountain', 'hill', 'forest', 'valley', 'canyon',
        'ridge', 'peak', 'pass', 'gap',

        // Recreational areas
        'park', 'reserve', 'preserve', 'wilderness',
        'natural area', 'recreation area',

        // Off-road specific
        'offroad', 'off-road', 'dirt bike', 'atv', '4x4',
        'adventure track', 'motocross', 'enduro'
    ];

    // Must have trail-related indicators
    const hasTrailIndicators = trailIndicators.some(indicator =>
        name.includes(indicator)
    );

    // Preferred Google Places types for trails
    const preferredTypes = [
        'park', 'natural_feature', 'point_of_interest', 'tourist_attraction'
    ];

    const hasPreferredTypes = types.some(type =>
        preferredTypes.includes(type)
    );

    return hasTrailIndicators || hasPreferredTypes;
}

// Quality and safety standards
function meetsOffRoadQualityStandards(place: Place): boolean {
    // Minimum rating threshold for off-road trails
    if (place.rating && place.rating < 3.5) return false;

    // Minimum number of reviews for credibility
    if (place.reviews && place.reviews < 5) return false;

    // Must have valid geometry data (lat/lng check implied by Place type, but good to be safe)
    if (!place.lat || !place.lng) return false;

    return true;
}
