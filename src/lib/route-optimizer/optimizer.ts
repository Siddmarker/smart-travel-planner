import { Place, ItineraryItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
    calculateDistance,
    estimateTravelTime,
} from './distance-matrix';

export interface RouteSegment {
    from: Place;
    to: Place;
    distance: number; // km
    duration: number; // minutes
    mode: 'driving' | 'walking' | 'transit';
    arrival?: string; // HH:MM
    departure?: string; // HH:MM
    type?: 'attraction' | 'return_trip';
    note?: string;
}

export interface OptimizedRoute {
    segments: RouteSegment[];
    totalDistance: number;
    totalDuration: number;
    optimizationScore: number; // 0-100
    originalOrder: string[]; // place IDs
    optimizedOrder: string[]; // place IDs
    returnTripIncluded: boolean;
}

export interface RoutePreferences {
    transportMode: 'driving' | 'walking' | 'transit';
    priority: 'fastest' | 'shortest' | 'balanced';
    returnToStart: boolean;
    startTime: string; // "09:00"
    endTime: string; // "20:00"
    visitDuration: number; // minutes per place (default fallback)
}

// Helper to convert "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Helper to convert minutes from midnight to "HH:MM"
function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Main Optimization Function
 */
export function optimizeRoute(
    startLocation: { lat: number; lng: number },
    places: Place[],
    preferences: RoutePreferences
): OptimizedRoute {
    const startMinutes = timeToMinutes(preferences.startTime);
    const endMinutes = timeToMinutes(preferences.endTime);

    // Create a pseudo-place for start location
    const startPlace: Place = {
        id: 'start-location',
        name: 'Start Location',
        lat: startLocation.lat,
        lng: startLocation.lng,
        category: 'activity', // dummy
        rating: 0,
        reviews: 0,
        priceLevel: 1,
        openingHours: [],
        opensAt: '00:00',
        closesAt: '23:59',
        visitDuration: 0
    };

    let currentTime = startMinutes;
    let currentLocation = startPlace;
    const finalSegments: RouteSegment[] = [];
    const visitedPlaceIds: string[] = [];

    // Clone places to modify list
    const remainingPlaces = [...places];
    const originalOrder = places.map(p => p.id);

    // Phase 1: Visit all places
    while (currentTime < endMinutes && remainingPlaces.length > 0) {
        const nextStep = findNextOptimalPlace(
            currentLocation,
            remainingPlaces,
            currentTime,
            endMinutes,
            preferences
        );

        if (!nextStep) {
            break;
        }

        const { place, travelTime, arrivalTime, departureTime } = nextStep;

        finalSegments.push({
            from: currentLocation,
            to: place,
            distance: calculateDistance(currentLocation, place),
            duration: travelTime,
            mode: preferences.transportMode,
            arrival: minutesToTime(arrivalTime),
            departure: minutesToTime(departureTime),
            type: 'attraction'
        });

        visitedPlaceIds.push(place.id);
        currentLocation = place;
        currentTime = departureTime;

        // Remove visited place
        const idx = remainingPlaces.findIndex(p => p.id === place.id);
        if (idx !== -1) {
            remainingPlaces.splice(idx, 1);
        }
    }

    // Phase 2: Handle return trip if requested
    let returnTripIncluded = false;
    if (preferences.returnToStart && finalSegments.length > 0) {
        const returnTrip = calculateReturnTrip(
            currentLocation,
            startPlace,
            currentTime,
            endMinutes,
            preferences
        );

        if (returnTrip.feasible) {
            finalSegments.push({
                from: currentLocation,
                to: startPlace,
                distance: calculateDistance(currentLocation, startPlace),
                duration: returnTrip.travelTime,
                mode: preferences.transportMode,
                arrival: minutesToTime(returnTrip.arrivalTime),
                departure: minutesToTime(returnTrip.arrivalTime), // No stay
                type: 'return_trip',
                note: 'Back to your starting location'
            });
            returnTripIncluded = true;
        }
    }

    // Calculate totals
    const totalDistance = finalSegments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = finalSegments.reduce((sum, seg) => sum + seg.duration, 0); // This is just travel time? Or travel + visit?
    // The user's output "total_travel_time" usually implies just travel, but for a daily plan, maybe total duration?
    // Let's stick to travel duration for now, or maybe sum of (arrival - departure of prev) + travel?
    // Actually, let's just sum the travel durations recorded in segments.

    // Calculate efficiency score (simple heuristic: % of places visited)
    const efficiencyScore = places.length > 0
        ? Math.round((visitedPlaceIds.length / places.length) * 100)
        : 100;

    return {
        segments: finalSegments,
        totalDistance,
        totalDuration,
        optimizationScore: efficiencyScore,
        originalOrder,
        optimizedOrder: visitedPlaceIds,
        returnTripIncluded
    };
}

/**
 * Enhanced Place Selection (Considers Return Time)
 */
function findNextOptimalPlace(
    currentLocation: Place,
    places: Place[],
    currentTime: number,
    endTime: number,
    preferences: RoutePreferences
): { place: Place; travelTime: number; arrivalTime: number; departureTime: number } | null {
    const candidates = [];

    for (const place of places) {
        // Calculate travel and visit times
        const dist = calculateDistance(currentLocation, place);
        const travelTime = estimateTravelTime(dist, preferences.transportMode);
        const arrivalTime = currentTime + travelTime;

        // Use place's visit duration or fallback
        const visitDuration = place.visitDuration || preferences.visitDuration || 60;
        const departureTime = arrivalTime + visitDuration;

        // Parse opening hours
        const placeOpensAt = place.opensAt ? timeToMinutes(place.opensAt) : 0; // Default 00:00
        const placeClosesAt = place.closesAt ? timeToMinutes(place.closesAt) : 1440; // Default 24:00

        // Check feasibility
        // 1. Must arrive after opening (or wait, but let's assume we don't want to wait too long? 
        //    Actually, if we arrive early, we just wait. So arrivalTime could be effectively max(arrivalTime, placeOpensAt))
        //    Let's stick to strict "arrival >= opens" for simplicity or allow waiting.
        //    User logic: if (arrival_time >= place.opens_at ...

        const effectiveArrivalTime = Math.max(arrivalTime, placeOpensAt);
        const effectiveDepartureTime = effectiveArrivalTime + visitDuration;

        if (
            effectiveDepartureTime <= placeClosesAt &&
            effectiveDepartureTime <= endTime
        ) {
            candidates.push({
                place,
                travelTime, // Note: this is pure travel time. Waiting time is effectiveArrivalTime - arrivalTime
                arrivalTime: effectiveArrivalTime,
                departureTime: effectiveDepartureTime,
                score: calculateScore(dist, place) // We can add scoring logic here
            });
        }
    }

    if (candidates.length === 0) {
        return null;
    }

    // Select best next place (currently just closest/lowest travel time)
    // We could add more complex scoring based on rating, etc.
    candidates.sort((a, b) => a.travelTime - b.travelTime);

    return candidates[0];
}

function calculateScore(distance: number, place: Place): number {
    // Simple score: lower distance is better, higher rating is better
    // This is a heuristic.
    let score = 1000 - distance; // Prefer closer
    if (place.rating) score += place.rating * 10;
    return score;
}

/**
 * Return Trip Calculation
 */
function calculateReturnTrip(
    currentLocation: Place,
    startLocation: Place,
    currentTime: number,
    endTime: number,
    preferences: RoutePreferences
): { feasible: boolean; travelTime: number; arrivalTime: number } {
    const dist = calculateDistance(currentLocation, startLocation);
    const travelTime = estimateTravelTime(dist, preferences.transportMode);
    const arrivalTime = currentTime + travelTime;

    return {
        feasible: arrivalTime <= endTime,
        travelTime,
        arrivalTime
    };
}

/**
 * Convert optimized route to itinerary items
 */
export function routeToItinerary(
    route: OptimizedRoute,
    date: string,
    preferences: RoutePreferences
): ItineraryItem[] {
    const items: ItineraryItem[] = [];
    // We already calculated times in the optimization phase, so we can just use them.
    // However, the segments store "arrival" and "departure" strings.
    // We need to construct ISO strings for the ItineraryItem.

    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

    for (const segment of route.segments) {
        if (!segment.arrival || !segment.departure) continue;

        const startTime = `${dateStr}T${segment.arrival}:00`;
        const endTime = `${dateStr}T${segment.departure}:00`;

        items.push({
            id: uuidv4(),
            placeId: segment.to.id,
            startTime: startTime, // This might need timezone handling but let's assume local/ISO
            endTime: endTime,
            notes: segment.note || `${segment.distance.toFixed(1)}km, ${segment.duration}min by ${segment.mode}`,
            type: segment.type || 'activity',
        });
    }

    return items;
}
