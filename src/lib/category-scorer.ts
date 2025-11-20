import { Place, TripCategory } from '@/types';

/**
 * Category Scorer Service
 * Calculates relevance scores based on category preferences
 */

export interface CategoryScore {
    place: Place;
    score: number;
    matchedCategories: string[];
    reasons: string[];
}

// Map place categories to trip categories
const CATEGORY_MAPPING: { [key: string]: TripCategory[] } = {
    'attraction': ['cultural', 'historical'],
    'nature': ['trekking', 'scenic_drives', 'wildlife'],
    'food': ['food', 'markets'],
    'culture': ['cultural', 'historical', 'religious'],
    'hiking': ['trekking', 'adventure'],
    'shopping': ['shopping', 'markets'],
    'nightlife': ['nightlife'],
    'activity': ['adventure'],
    'hotel': []
};

/**
 * Calculate category match score for a place
 */
export function calculateCategoryScore(
    place: Place,
    userCategories: TripCategory[],
    priorities?: { [key in TripCategory]?: number }
): CategoryScore {
    const matchedCategories: string[] = [];
    let baseScore = 0;
    const reasons: string[] = [];

    // Get trip categories that match this place
    const placeCategories = CATEGORY_MAPPING[place.category] || [];

    for (const tripCategory of userCategories) {
        if (placeCategories.includes(tripCategory)) {
            matchedCategories.push(tripCategory);

            // Base score for match
            const priority = priorities?.[tripCategory] || 3; // Default priority 3
            baseScore += priority * 20; // 20-100 points based on priority

            reasons.push(`Matches your ${tripCategory} preference (priority ${priority})`);
        }
    }

    // Add rating bonus
    const ratingBonus = place.rating * 10;
    baseScore += ratingBonus;

    if (place.rating >= 4.5) {
        reasons.push(`Highly rated (${place.rating}★)`);
    }

    // Add review count bonus (popularity)
    const reviewBonus = Math.min(place.reviews / 1000, 10); // Max 10 points
    baseScore += reviewBonus;

    if (place.reviews > 5000) {
        reasons.push(`Very popular (${place.reviews.toLocaleString()} reviews)`);
    }

    return {
        place,
        score: baseScore,
        matchedCategories,
        reasons
    };
}

/**
 * Score and rank places by category relevance
 */
export function scoreAndRankPlaces(
    places: Place[],
    userCategories: TripCategory[],
    priorities?: { [key in TripCategory]?: number }
): CategoryScore[] {
    const scored = places.map(place =>
        calculateCategoryScore(place, userCategories, priorities)
    );

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
}

/**
 * Get top N places for a specific category
 */
export function getTopPlacesForCategory(
    places: Place[],
    category: TripCategory,
    count: number = 3
): Place[] {
    const scored = scoreAndRankPlaces(places, [category]);
    return scored.slice(0, count).map(s => s.place);
}

/**
 * Get diverse set of places across categories
 */
export function getDiversePlaces(
    places: Place[],
    userCategories: TripCategory[],
    count: number = 9, // 3 per timeslot
    priorities?: { [key in TripCategory]?: number }
): Place[] {
    const scored = scoreAndRankPlaces(places, userCategories, priorities);

    // Ensure diversity by category
    const selected: Place[] = [];
    const usedCategories = new Set<string>();

    for (const item of scored) {
        if (selected.length >= count) break;

        // Try to get variety in place categories
        if (!usedCategories.has(item.place.category) || selected.length > count / 2) {
            selected.push(item.place);
            usedCategories.add(item.place.category);
        }
    }

    // Fill remaining slots if needed
    for (const item of scored) {
        if (selected.length >= count) break;
        if (!selected.includes(item.place)) {
            selected.push(item.place);
        }
    }

    return selected;
}
