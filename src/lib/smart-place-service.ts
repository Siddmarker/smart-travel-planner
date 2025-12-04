import { Place } from '@/types';
import { searchPlaces, calculateRealDistances } from './googleMapsService';

interface DaySlotOptions {
    morning: Place[];
    afternoon: Place[];
    evening: Place[];
}

export class SmartPlaceService {
    private static MIN_RATING = 4.0;
    private static MIN_REVIEWS = 5;

    static async getSuggestionsForDay(
        location: { lat: number; lng: number },
        dayNumber: number,
        previousPlace?: Place,
        preferences: string[] = []
    ): Promise<DaySlotOptions> {

        // Define time-based keywords
        const timeKeywords = {
            morning: ['breakfast', 'park', 'museum', 'hike', 'cafe'],
            afternoon: ['lunch', 'shopping', 'tour', 'gallery', 'landmark'],
            evening: ['dinner', 'bar', 'nightlife', 'show', 'viewpoint']
        };

        const slots: DaySlotOptions = {
            morning: [],
            afternoon: [],
            evening: []
        };

        // Helper to fetch and filter
        const fetchForSlot = async (slot: 'morning' | 'afternoon' | 'evening') => {
            const keywords = timeKeywords[slot];
            // Use preferences to adjust keywords if needed

            // Search for places
            // We search for a general "tourist attraction" plus specific keywords if needed
            // Or just search broad and filter
            let places = await searchPlaces('tourist attraction', location, 5000, 'tourist_attraction');

            // Filter by time appropriateness (simple keyword match or category)
            // This is a simplified logic. In reality, we might search specifically for "breakfast" for morning.

            if (slot === 'morning') {
                const morningSpecific = await searchPlaces('breakfast OR park OR museum', location, 5000);
                places = [...places, ...morningSpecific];
            } else if (slot === 'evening') {
                const eveningSpecific = await searchPlaces('dinner OR bar OR night club', location, 5000);
                places = [...places, ...eveningSpecific];
            }

            // Deduplicate
            places = Array.from(new Map(places.map(p => [p.id, p])).values());

            // Filter logic
            return places.filter(p => {
                if (p.rating < this.MIN_RATING) return false;
                if ((p.reviewCount || 0) < this.MIN_REVIEWS) return false;

                // Exclude agencies
                if (p.rawTypes?.some((t: string) => t.includes('agency'))) return false;

                return true;
            }).slice(0, 5); // Return top 5
        };

        // Parallel fetch
        const [morning, afternoon, evening] = await Promise.all([
            fetchForSlot('morning'),
            fetchForSlot('afternoon'),
            fetchForSlot('evening')
        ]);

        slots.morning = morning;
        slots.afternoon = afternoon;
        slots.evening = evening;

        return slots;
    }

    static async validateDayPlan(dayPlan: any): Promise<{ valid: boolean; issues: string[] }> {
        const issues: string[] = [];
        if (!dayPlan.morning || dayPlan.morning.length < 3) issues.push('Insufficient morning options');
        if (!dayPlan.afternoon || dayPlan.afternoon.length < 3) issues.push('Insufficient afternoon options');
        if (!dayPlan.evening || dayPlan.evening.length < 3) issues.push('Insufficient evening options');

        return {
            valid: issues.length === 0,
            issues
        };
    }
}
