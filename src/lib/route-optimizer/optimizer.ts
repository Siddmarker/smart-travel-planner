import { Place, ItineraryItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import {
    createDistanceMatrix,
    createTimeMatrix,
    calculateRouteDistance,
    calculateRouteTime,
    calculateDistance,
    estimateTravelTime,
} from './distance-matrix';

export interface RouteSegment {
    from: Place;
    to: Place;
    distance: number; // km
    duration: number; // minutes
    mode: 'driving' | 'walking' | 'transit';
}

export interface OptimizedRoute {
    segments: RouteSegment[];
    totalDistance: number;
    totalDuration: number;
    optimizationScore: number; // 0-100
    originalOrder: string[]; // place IDs
    optimizedOrder: string[]; // place IDs
}

export interface RoutePreferences {
    transportMode: 'driving' | 'walking' | 'transit';
    priority: 'fastest' | 'shortest' | 'balanced';
    returnToStart: boolean;
    startTime: string; // "09:00"
    endTime: string; // "20:00"
    visitDuration: number; // minutes per place
}

/**
 * Optimize route using Nearest Neighbor algorithm with 2-opt improvements
 */
export function optimizeRoute(
    startLocation: { lat: number; lng: number },
    places: Place[],
    preferences: RoutePreferences
): OptimizedRoute {
    if (places.length === 0) {
        return {
            segments: [],
            totalDistance: 0,
            totalDuration: 0,
            optimizationScore: 100,
            originalOrder: [],
            optimizedOrder: [],
        };
    }

    const originalOrder = places.map(p => p.id);

    // Phase 1: Nearest Neighbor
    const nnRoute = nearestNeighborRoute(startLocation, places, preferences.transportMode);

    // Phase 2: 2-opt improvement
    const improvedRoute = twoOptImprovement(nnRoute, places, preferences.transportMode);

    // Phase 3: Add return trip if needed
    const finalRoute = preferences.returnToStart
        ? [...improvedRoute, 0] // 0 represents start location
        : improvedRoute;

    // Calculate segments
    const segments = createRouteSegments(
        startLocation,
        places,
        finalRoute,
        preferences.transportMode
    );

    const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

    // Calculate optimization score (compare to naive sequential route)
    const naiveDistance = calculateNaiveRouteDistance(startLocation, places, preferences.transportMode);
    const optimizationScore = Math.min(100, Math.round((naiveDistance / totalDistance) * 100));

    return {
        segments,
        totalDistance,
        totalDuration,
        optimizationScore,
        originalOrder,
        optimizedOrder: finalRoute.map(idx => places[idx - 1]?.id).filter(Boolean),
    };
}

/**
 * Nearest Neighbor algorithm: Start from beginning, always visit closest unvisited place
 */
function nearestNeighborRoute(
    startLocation: { lat: number; lng: number },
    places: Place[],
    mode: 'driving' | 'walking' | 'transit'
): number[] {
    const n = places.length;
    const visited = new Array(n).fill(false);
    const route: number[] = [];
    let currentLocation = startLocation;

    for (let i = 0; i < n; i++) {
        let nearestIdx = -1;
        let minDistance = Infinity;

        for (let j = 0; j < n; j++) {
            if (!visited[j]) {
                const distance = calculateDistance(
                    currentLocation,
                    { lat: places[j].lat, lng: places[j].lng }
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIdx = j;
                }
            }
        }

        if (nearestIdx !== -1) {
            visited[nearestIdx] = true;
            route.push(nearestIdx + 1); // 1-indexed (0 is start location)
            currentLocation = { lat: places[nearestIdx].lat, lng: places[nearestIdx].lng };
        }
    }

    return route;
}

/**
 * 2-opt improvement: Try swapping edges to reduce total distance
 */
function twoOptImprovement(
    route: number[],
    places: Place[],
    mode: 'driving' | 'walking' | 'transit'
): number[] {
    const distanceMatrix = createDistanceMatrix(places);
    let improved = true;
    let bestRoute = [...route];

    while (improved) {
        improved = false;
        const currentDistance = calculateRouteDistance(bestRoute, distanceMatrix);

        for (let i = 0; i < bestRoute.length - 1; i++) {
            for (let j = i + 2; j < bestRoute.length; j++) {
                // Try reversing segment between i and j
                const newRoute = twoOptSwap(bestRoute, i, j);
                const newDistance = calculateRouteDistance(newRoute, distanceMatrix);

                if (newDistance < currentDistance) {
                    bestRoute = newRoute;
                    improved = true;
                    break;
                }
            }
            if (improved) break;
        }
    }

    return bestRoute;
}

/**
 * Perform 2-opt swap: reverse segment between i and j
 */
function twoOptSwap(route: number[], i: number, j: number): number[] {
    const newRoute = [...route];
    const segment = newRoute.slice(i, j + 1).reverse();
    newRoute.splice(i, j - i + 1, ...segment);
    return newRoute;
}

/**
 * Create route segments with detailed information
 */
function createRouteSegments(
    startLocation: { lat: number; lng: number },
    places: Place[],
    route: number[],
    mode: 'driving' | 'walking' | 'transit'
): RouteSegment[] {
    const segments: RouteSegment[] = [];
    let currentLocation = startLocation;

    for (const placeIdx of route) {
        if (placeIdx === 0) {
            // Return to start
            const distance = calculateDistance(currentLocation, startLocation);
            const duration = estimateTravelTime(distance, mode);
            segments.push({
                from: places[places.length - 1], // Last place
                to: { ...places[0], name: 'Start Location' } as Place, // Fake place for start
                distance,
                duration,
                mode,
            });
        } else {
            const place = places[placeIdx - 1];
            const distance = calculateDistance(currentLocation, { lat: place.lat, lng: place.lng });
            const duration = estimateTravelTime(distance, mode);

            segments.push({
                from: segments.length === 0
                    ? ({ name: 'Start Location', lat: startLocation.lat, lng: startLocation.lng } as Place)
                    : segments[segments.length - 1].to,
                to: place,
                distance,
                duration,
                mode,
            });

            currentLocation = { lat: place.lat, lng: place.lng };
        }
    }

    return segments;
}

/**
 * Calculate naive route distance (sequential order)
 */
function calculateNaiveRouteDistance(
    startLocation: { lat: number; lng: number },
    places: Place[],
    mode: 'driving' | 'walking' | 'transit'
): number {
    let totalDistance = 0;
    let currentLocation = startLocation;

    for (const place of places) {
        const distance = calculateDistance(currentLocation, { lat: place.lat, lng: place.lng });
        totalDistance += distance;
        currentLocation = { lat: place.lat, lng: place.lng };
    }

    return totalDistance;
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
    const [startHour, startMinute] = preferences.startTime.split(':').map(Number);
    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    for (const segment of route.segments) {
        // Add travel time
        currentTime = new Date(currentTime.getTime() + segment.duration * 60000);

        const arrivalTime = new Date(currentTime);
        const departureTime = new Date(currentTime.getTime() + preferences.visitDuration * 60000);

        items.push({
            id: uuidv4(),
            placeId: segment.to.id,
            startTime: arrivalTime.toISOString(),
            endTime: departureTime.toISOString(),
            notes: `${segment.distance.toFixed(1)}km, ${segment.duration}min by ${segment.mode}`,
            type: segment.to.name === 'Start Location' ? 'return_trip' : 'activity',
        });

        currentTime = departureTime;
    }

    return items;
}
