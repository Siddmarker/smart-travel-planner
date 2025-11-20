import { Place, TimeslotOption, DailyTimeslots, UserPreferences, TripCategory } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { scoreAndRankPlaces, getDiversePlaces } from './category-scorer';
import { calculateTrendingScore } from './trending-service';
import { filterPlacesByBounds, getCountryBounds } from './location-validator';

/**
 * Enhanced Unified Travel Planner V2
 * Generates 3-option timeslot itineraries with category weighting and trending integration
 */

export class UnifiedTravelPlannerV2 {
    /**
     * Generate complete itinerary with 3 options per timeslot
     */
    public generateEnhancedItinerary(
        userPreferences: UserPreferences,
        availablePlaces: Place[],
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): { [day: number]: DailyTimeslots } {
        // Step 1: Filter places by location bounds if possible
        const filteredPlaces = this.filterByLocation(availablePlaces, userPreferences);

        // Step 2: Score places by categories and trending
        const scoredPlaces = this.scoreAllPlaces(
            filteredPlaces,
            categoryPreferences?.categories || [],
            categoryPreferences?.priorities
        );

        // Step 3: Generate daily timeslots
        const dailyItinerary: { [day: number]: DailyTimeslots } = {};

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            dailyItinerary[day] = this.generateDayTimeslots(
                scoredPlaces,
                day,
                userPreferences,
                categoryPreferences
            );
        }

        return dailyItinerary;
    }

    /**
     * Filter places by geographic location
     */
    private filterByLocation(places: Place[], userPreferences: UserPreferences): Place[] {
        // Try to determine country from destination
        // For now, just return all places
        // In production, would use location validator to get country bounds
        return places;
    }

    /**
     * Score all places by category match and trending
     */
    private scoreAllPlaces(
        places: Place[],
        userCategories: TripCategory[],
        priorities?: { [key in TripCategory]?: number }
    ): Array<{ place: Place; categoryScore: number; trendingScore: number; totalScore: number }> {
        const categoryScored = scoreAndRankPlaces(places, userCategories, priorities);

        return categoryScored.map(cs => {
            const trending = calculateTrendingScore(cs.place);
            const totalScore = (cs.score * 0.7) + (trending.score * 0.3); // 70% category, 30% trending

            return {
                place: cs.place,
                categoryScore: cs.score,
                trendingScore: trending.score,
                totalScore
            };
        }).sort((a, b) => b.totalScore - a.totalScore);
    }

    /**
     * Generate timeslots for a single day
     */
    private generateDayTimeslots(
        scoredPlaces: Array<{ place: Place; categoryScore: number; trendingScore: number; totalScore: number }>,
        dayNumber: number,
        userPreferences: UserPreferences,
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): DailyTimeslots {
        // Get different places for each timeslot to ensure variety
        const placesPerSlot = Math.min(3, Math.floor(scoredPlaces.length / 3));

        const morningOptions = this.generateTimeslotOptions(
            scoredPlaces.slice(0, placesPerSlot * 3),
            'morning',
            dayNumber,
            userPreferences
        );

        const afternoonOptions = this.generateTimeslotOptions(
            scoredPlaces.slice(placesPerSlot, placesPerSlot * 4),
            'afternoon',
            dayNumber,
            userPreferences
        );

        const eveningOptions = this.generateTimeslotOptions(
            scoredPlaces.slice(placesPerSlot * 2, placesPerSlot * 5),
            'evening',
            dayNumber,
            userPreferences
        );

        return {
            morning: morningOptions.slice(0, 3),
            afternoon: afternoonOptions.slice(0, 3),
            evening: eveningOptions.slice(0, 3)
        };
    }

    /**
     * Generate options for a specific timeslot
     */
    private generateTimeslotOptions(
        scoredPlaces: Array<{ place: Place; categoryScore: number; trendingScore: number; totalScore: number }>,
        timeslot: 'morning' | 'afternoon' | 'evening',
        dayNumber: number,
        userPreferences: UserPreferences
    ): TimeslotOption[] {
        const options: TimeslotOption[] = [];

        for (const scored of scoredPlaces) {
            if (options.length >= 3) break;

            const reasons = this.generateRecommendationReasons(
                scored.place,
                scored.categoryScore,
                scored.trendingScore,
                timeslot
            );

            options.push({
                place: scored.place,
                category: scored.place.category,
                quality_score: scored.totalScore,
                trending_score: scored.trendingScore,
                why_recommended: reasons,
                travel_time: null, // Will be calculated after user selects
                estimated_arrival: null
            });
        }

        return options;
    }

    /**
     * Generate recommendation reasons
     */
    private generateRecommendationReasons(
        place: Place,
        categoryScore: number,
        trendingScore: number,
        timeslot: string
    ): string {
        const reasons: string[] = [];

        // Category match
        if (categoryScore > 80) {
            reasons.push('Perfect match for your interests');
        } else if (categoryScore > 60) {
            reasons.push('Good match for your preferences');
        }

        // Trending
        if (trendingScore > 70) {
            reasons.push('Currently trending');
        } else if (trendingScore > 60) {
            reasons.push('Popular destination');
        }

        // Rating
        if (place.rating >= 4.7) {
            reasons.push(`Excellent reviews (${place.rating}★)`);
        } else if (place.rating >= 4.5) {
            reasons.push(`Highly rated (${place.rating}★)`);
        }

        // Timeslot appropriateness
        if (timeslot === 'morning' && place.category === 'nature') {
            reasons.push('Great for morning visits');
        } else if (timeslot === 'evening' && place.category === 'food') {
            reasons.push('Perfect for dinner time');
        } else if (timeslot === 'afternoon' && place.category === 'culture') {
            reasons.push('Ideal afternoon activity');
        }

        return reasons.join(' • ');
    }
}
