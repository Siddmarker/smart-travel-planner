import { Place } from '@/types';

/**
 * Trending Service
 * Calculates trending scores for places based on multiple factors
 */

export interface TrendingScore {
    place: Place;
    score: number;
    factors: {
        recentMentions: number;
        seasonalRelevance: number;
        reviewVelocity: number;
        localEvents: number;
    };
}

/**
 * Calculate seasonal relevance (0-100)
 * Based on current month and place category
 */
function calculateSeasonalRelevance(place: Place): number {
    const month = new Date().getMonth(); // 0-11

    // Simple seasonal scoring
    // Summer (May-Aug): beaches, nature
    // Winter (Nov-Feb): cultural, shopping, food
    // Monsoon (Jun-Sep): indoor activities

    if (month >= 4 && month <= 7) { // May-Aug (Summer)
        if (place.category === 'nature' || place.category === 'hiking') return 90;
        if (place.category === 'attraction') return 70;
        return 50;
    } else if (month >= 10 || month <= 1) { // Nov-Feb (Winter)
        if (place.category === 'culture' || place.category === 'shopping' || place.category === 'food') return 90;
        if (place.category === 'attraction') return 80;
        return 60;
    } else { // Monsoon
        if (place.category === 'culture' || place.category === 'food') return 85;
        if (place.category === 'nature') return 30; // Lower for outdoor
        return 65;
    }
}

/**
 * Calculate review velocity (0-100)
 * Based on review count (proxy for recent activity)
 */
function calculateReviewVelocity(place: Place): number {
    // Higher review count suggests more recent activity
    if (place.reviews > 10000) return 90;
    if (place.reviews > 5000) return 75;
    if (place.reviews > 2000) return 60;
    if (place.reviews > 500) return 45;
    return 30;
}

/**
 * Calculate recent mentions score (0-100)
 * Mock implementation - in production, would track social media mentions
 */
function calculateRecentMentions(place: Place): number {
    // Mock: Use rating as proxy for popularity
    return place.rating * 20;
}

/**
 * Calculate local events score (0-100)
 * Mock implementation - in production, would check event calendars
 */
function calculateLocalEvents(place: Place): number {
    // Mock: Random score for now
    // In production, would check if there are events near this place
    return Math.random() * 50;
}

/**
 * Calculate overall trending score
 * Formula: (RecentMentions × 0.3) + (SeasonalRelevance × 0.25) + 
 *          (ReviewVelocity × 0.25) + (LocalEvents × 0.2)
 */
export function calculateTrendingScore(place: Place): TrendingScore {
    const recentMentions = calculateRecentMentions(place);
    const seasonalRelevance = calculateSeasonalRelevance(place);
    const reviewVelocity = calculateReviewVelocity(place);
    const localEvents = calculateLocalEvents(place);

    const score =
        (recentMentions * 0.3) +
        (seasonalRelevance * 0.25) +
        (reviewVelocity * 0.25) +
        (localEvents * 0.2);

    return {
        place,
        score,
        factors: {
            recentMentions,
            seasonalRelevance,
            reviewVelocity,
            localEvents
        }
    };
}

/**
 * Get trending places from a list
 */
export function getTrendingPlaces(places: Place[], count: number = 10): TrendingScore[] {
    const scored = places.map(calculateTrendingScore);
    return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, count);
}

/**
 * Check if a place is currently trending
 */
export function isTrending(place: Place, threshold: number = 60): boolean {
    const trendingScore = calculateTrendingScore(place);
    return trendingScore.score >= threshold;
}
