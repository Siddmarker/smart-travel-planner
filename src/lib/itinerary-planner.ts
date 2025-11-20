import { Place, ItineraryItem, Trip } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Mock travel time calculation (in minutes)
function getTravelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
    // Simple distance-based heuristic: 1 unit distance ~ 60 mins
    const dist = Math.sqrt(Math.pow(from.lat - to.lat, 2) + Math.pow(from.lng - to.lng, 2));
    return Math.ceil(dist * 1000) + 15; // Base 15 mins + distance factor
}

function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60000);
}

interface OptimizationParams {
    startLocation: { lat: number; lng: number };
    places: Place[];
    startTime: string; // "09:00"
    endTime: string; // "20:00"
    returnToStart: boolean;
    date: string; // ISO date string for the day
}

export function optimizeDailyRoute(params: OptimizationParams): ItineraryItem[] {
    const { startLocation, places, startTime, endTime, returnToStart, date } = params;

    // Parse start and end times for the specific date
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const dayEndTime = new Date(date);
    dayEndTime.setHours(endHour, endMinute, 0, 0);

    let currentLocation = startLocation;
    const finalItinerary: ItineraryItem[] = [];
    const remainingPlaces = [...places];

    // Phase 1: Visit all places
    while (currentTime < dayEndTime && remainingPlaces.length > 0) {
        const nextPlaceData = findNextOptimalPlace(currentLocation, remainingPlaces, currentTime, dayEndTime);

        if (!nextPlaceData) break;

        const { place, travelTime, arrivalTime, departureTime } = nextPlaceData;

        finalItinerary.push({
            id: uuidv4(),
            placeId: place.id,
            startTime: arrivalTime.toISOString(),
            endTime: departureTime.toISOString(),
            notes: `Travel time: ${travelTime} mins`,
            type: 'activity'
        });

        currentLocation = { lat: place.lat, lng: place.lng };
        currentTime = departureTime;

        // Remove visited place
        const index = remainingPlaces.findIndex(p => p.id === place.id);
        if (index !== -1) remainingPlaces.splice(index, 1);
    }

    // Phase 2: Handle return trip
    if (returnToStart && finalItinerary.length > 0) {
        const returnTrip = calculateReturnTrip(currentLocation, startLocation, currentTime, dayEndTime);
        if (returnTrip.feasible) {
            finalItinerary.push({
                id: uuidv4(),
                placeId: 'return-trip', // Special ID
                startTime: returnTrip.arrivalTime.toISOString(), // Arrival at start is the "start" of being back? 
                // Actually, let's mark start as departure from last place, end as arrival at start
                endTime: returnTrip.arrivalTime.toISOString(),
                notes: `Return trip: ${returnTrip.travelTime} mins`,
                type: 'return_trip'
            });
        }
    }

    return finalItinerary;
}

function findNextOptimalPlace(
    currentLocation: { lat: number; lng: number },
    places: Place[],
    currentTime: Date,
    dayEndTime: Date
) {
    // Simple greedy approach: find closest feasible place
    let bestPlace = null;
    let minTravelTime = Infinity;

    for (const place of places) {
        const travelTime = getTravelTime(currentLocation, { lat: place.lat, lng: place.lng });
        const arrivalTime = addMinutes(currentTime, travelTime);
        const visitDuration = 90; // Assume 1.5 hours per place
        const departureTime = addMinutes(arrivalTime, visitDuration);

        if (departureTime <= dayEndTime) {
            if (travelTime < minTravelTime) {
                minTravelTime = travelTime;
                bestPlace = {
                    place,
                    travelTime,
                    arrivalTime,
                    departureTime
                };
            }
        }
    }

    return bestPlace;
}

function calculateReturnTrip(
    currentLocation: { lat: number; lng: number },
    startLocation: { lat: number; lng: number },
    currentTime: Date,
    dayEndTime: Date
) {
    const travelTime = getTravelTime(currentLocation, startLocation);
    const arrivalTime = addMinutes(currentTime, travelTime);

    return {
        travelTime,
        arrivalTime,
        feasible: arrivalTime <= dayEndTime
    };
}
