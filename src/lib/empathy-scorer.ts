
import { Place } from '@/types';

export interface TripContext {
    tripType: 'Solo' | 'Friends' | 'Family' | 'Corporate' | string;
    // Add other context fields if needed later
}

export function calculateEmpathyScore(place: Place, context: TripContext): number {
    let score = (place.rating || 3.0) * 20; // Base score (0-100)

    const tripType = context.tripType;
    const rawTypes = place.rawTypes || [];
    const categoryTags = place.categoryTags || [];
    const placeTypes = [...rawTypes, ...categoryTags].map(t => t.toLowerCase());

    // Also check main category
    if (place.category) placeTypes.push(place.category.toLowerCase());

    // A. Archetype Weights
    if (tripType === 'Family') {
        if (placeTypes.some(t => ['night_club', 'bar', 'casino', 'adult'].includes(t))) return 0; // Hard Block
        if (placeTypes.some(t => ['park', 'amusement_park', 'zoo', 'aquarium', 'museum'].includes(t))) score *= 1.5;
    }
    if (tripType === 'Solo') {
        if (placeTypes.some(t => ['hostel', 'cafe', 'book_store', 'library'].includes(t))) score *= 1.3;
        // Solo Safety check could be here too
    }
    if (tripType === 'Corporate') {
        if (placeTypes.some(t => ['conference', 'convention', 'coworking', 'hotel_bar'].includes(t))) score *= 1.2;
    }

    // B. The "Trade-Off" Logic (Distance vs. Quality)
    // Estimate travel time if not explicitly provided
    let travelTimeInMinutes = 0;

    if (place.distance?.duration) {
        // Parse "15 mins", "1 hour 5 mins"
        const dur = place.distance.duration.toLowerCase();
        let minutes = 0;

        const hourMatch = dur.match(/(\d+)\s*hour/);
        const minMatch = dur.match(/(\d+)\s*min/);

        if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
        if (minMatch) minutes += parseInt(minMatch[1]);

        if (minutes > 0) travelTimeInMinutes = minutes;
    }

    // Fallback if duration parsing failed but we have distance value (meters)
    if (travelTimeInMinutes === 0 && place.distance?.value) {
        // Assume 30km/h city driving average -> 500 meters/min
        travelTimeInMinutes = place.distance.value / 500;
    }

    const travelPenalty = travelTimeInMinutes * 1.5;

    // "Super Match" (>90) forgiveness
    if (score > 90) {
        score -= (travelPenalty * 0.5);
    } else {
        score -= travelPenalty;
    }

    return Math.max(0, score);
}
