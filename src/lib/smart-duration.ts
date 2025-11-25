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
    destination: string
): DurationAdjustment {
    const totalQualityPlaces = discoveredPlaces.length;

    // CALCULATE OPTIMAL DURATION BASED ON PLACE DENSITY
    // We assume a relaxed pace of ~4 major places per day (Morning, Afternoon, Evening + Food)
    // But since 'discoveredPlaces' might include food, let's say 4 items total per day is a good metric for "quality" days.
    const placesPerDay = 4;
    const maxSustainableDays = Math.floor(totalQualityPlaces / placesPerDay);

    let adjustedDuration = requestedDuration;
    let adjustmentReason = '';

    if (maxSustainableDays < requestedDuration) {
        // If we don't have enough places for the requested duration
        // e.g. requested 3 days (needs 12 places), found 8 places -> max 2 days
        adjustedDuration = Math.max(1, maxSustainableDays); // Minimum 1 day

        if (adjustedDuration < requestedDuration) {
            adjustmentReason = `As there are limited quality places in ${destination} for a ${requestedDuration}-day trip, we recommend a ${adjustedDuration}-day itinerary to keep it engaging.`;
        } else {
            // Should not happen given the if condition, but fallback
            adjustmentReason = `Optimized for ${adjustedDuration} days.`;
        }
    } else if (maxSustainableDays > requestedDuration) {
        // Can suggest longer trip if plenty of places
        // We won't force extension, but we can suggest it or just note it.
        // The requirement says "Extended to X days", so let's be proactive if it's significantly more.

        // Only extend if we have A LOT more places (e.g. double what's needed)
        if (maxSustainableDays >= requestedDuration + 2) {
            adjustedDuration = Math.min(requestedDuration + 1, maxSustainableDays);
            adjustmentReason = `We found many great places! Extended to ${adjustedDuration} days to cover more of ${destination}.`;
        } else {
            adjustmentReason = `Perfect! ${requestedDuration} day itinerary for ${destination}.`;
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
