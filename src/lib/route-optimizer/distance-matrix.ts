import { Place } from '@/types';

/**
 * Calculate distance between two geographic points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(point2.lat - point1.lat);
    const dLng = toRadians(point2.lng - point1.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(point1.lat)) *
        Math.cos(toRadians(point2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Estimate travel time based on distance and transport mode
 * @param distance Distance in kilometers
 * @param mode Transport mode
 * @returns Time in minutes
 */
export function estimateTravelTime(
    distance: number,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
): number {
    const speeds = {
        driving: 50, // km/h average in city
        walking: 5, // km/h
        transit: 30, // km/h average with stops
    };

    const speed = speeds[mode];
    const timeInHours = distance / speed;
    return Math.ceil(timeInHours * 60); // Convert to minutes
}

/**
 * Create a distance matrix for all places
 * @param places Array of places
 * @returns 2D array where matrix[i][j] is distance from place i to place j
 */
export function createDistanceMatrix(places: Place[]): number[][] {
    const n = places.length;
    const matrix: number[][] = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 0;
            } else {
                matrix[i][j] = calculateDistance(
                    { lat: places[i].lat, lng: places[i].lng },
                    { lat: places[j].lat, lng: places[j].lng }
                );
            }
        }
    }

    return matrix;
}

/**
 * Create a time matrix for all places
 * @param places Array of places
 * @param mode Transport mode
 * @returns 2D array where matrix[i][j] is travel time from place i to place j in minutes
 */
export function createTimeMatrix(
    places: Place[],
    mode: 'driving' | 'walking' | 'transit' = 'driving'
): number[][] {
    const distanceMatrix = createDistanceMatrix(places);
    return distanceMatrix.map(row =>
        row.map(distance => estimateTravelTime(distance, mode))
    );
}

/**
 * Calculate total route distance
 * @param route Array of place indices in visit order
 * @param distanceMatrix Pre-calculated distance matrix
 * @returns Total distance in kilometers
 */
export function calculateRouteDistance(
    route: number[],
    distanceMatrix: number[][]
): number {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalDistance += distanceMatrix[route[i]][route[i + 1]];
    }
    return totalDistance;
}

/**
 * Calculate total route time
 * @param route Array of place indices in visit order
 * @param timeMatrix Pre-calculated time matrix
 * @returns Total time in minutes
 */
export function calculateRouteTime(
    route: number[],
    timeMatrix: number[][]
): number {
    let totalTime = 0;
    for (let i = 0; i < route.length - 1; i++) {
        totalTime += timeMatrix[route[i]][route[i + 1]];
    }
    return totalTime;
}
