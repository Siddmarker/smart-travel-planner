import { Place } from '@/types';

export interface DurationAdjustment {
    adjustedDuration: number;
    adjustmentReason: string;
    originalDuration: number;
    totalPlacesFound: number;
    canExtend: boolean;
}

// SMART TRIP DURATION ADJUSTMENT BASED ON PLACE AVAILABILITY
export function adjustTripDurationBasedOnPlaces(
    discoveredPlaces: Place[],
    requestedDuration: number,
    destination: string,
    filtrationMetadata?: { originalCount: number, filteredCount: number, fakeEntities: any[] }
): DurationAdjustment {
    const totalQualityPlaces = discoveredPlaces.length;

    // Calculate fake entity stats if available
    const fakeEntityCount = filtrationMetadata ? filtrationMetadata.fakeEntities.length : 0;
    const filtrationRate = filtrationMetadata ? ((fakeEntityCount / filtrationMetadata.originalCount) * 100).toFixed(0) : '0';

    // CALCULATE OPTIMAL DURATION BASED ON PLACE DENSITY
    // We assume a relaxed pace of ~4 major places per day (Morning, Afternoon, Evening + Food)
    const placesPerDay = 4;
    const maxSustainableDays = Math.floor(totalQualityPlaces / placesPerDay);

    let adjustedDuration = requestedDuration;
    let adjustmentReason = '';

    if (maxSustainableDays < requestedDuration) {
        // If we don't have enough places, we still respect the USER'S requested duration.
        // We will just spread them out or leave some free time.
        adjustedDuration = requestedDuration;

        adjustmentReason = `Found ${totalQualityPlaces} verified places. Some days might be lighter to keep a relaxed pace for your ${requestedDuration}-day trip.`;
    } else if (maxSustainableDays > requestedDuration) {
        // Can suggest longer trip if plenty of places
        if (maxSustainableDays >= requestedDuration + 2) {
            adjustedDuration = Math.min(requestedDuration + 1, maxSustainableDays);
            adjustmentReason = `Found ${totalQualityPlaces} high-quality verified places! Extended to ${adjustedDuration} days to cover more.`;
        } else {
            adjustmentReason = `Perfect! ${requestedDuration} day itinerary with ${totalQualityPlaces} verified places in ${destination}.`;
        }
    } else {
        adjustmentReason = `Perfect! ${requestedDuration} day itinerary for ${destination}.`;
    }

    return {
        adjustedDuration,
        adjustmentReason,
        originalDuration: requestedDuration,
        totalPlacesFound: totalQualityPlaces,
        canExtend: maxSustainableDays > requestedDuration
    };
}
