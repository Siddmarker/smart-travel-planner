
import { Place, UserPreferences, TripCategory, ItineraryItem, VotingOption, VotingInterface, DailyVotingOptions, VotedPlan, VotedPlaceItem, TimeConstraints } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance, estimateTravelTime } from './route-optimizer/distance-matrix';
import { scoreAndRankPlaces } from './category-scorer';
import { calculateTrendingScore } from './trending-service';
import {
    searchPlaces,
    enhancePlacesWithPhotosAndDistance,
    mapCategoryToGoogleType,
    calculateRealDistances
} from './googleMapsService';
import { applyAdvancedFakeEntityFiltration, applyEnhancedFoodFiltration } from './place-filtration';
import { adjustTripDurationBasedOnPlaces } from './smart-duration';

/**
 * FINAL MERGED SYSTEM: Voting → Places → Maps in perfect harmony
 */
export class UnifiedTravelPlanner {

    /**
     * Complete workflow that respects the voting-first approach
     */
    public async unified_planning_workflow(
        userPreferences: UserPreferences,
        availablePlaces: Place[], // Can be empty if we fetch dynamically
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): Promise<{ [day: number]: ItineraryItem[] }> {
        // PHASE 1: PLACE DISCOVERY & VOTING
        const votingInterface = await this.discover_and_prepare_voting(
            userPreferences,
            availablePlaces,
            categoryPreferences
        );

        // PHASE 2: WAIT FOR USER VOTING (External Process)
        // For simulation, we'll auto-resolve votes
        const votedPlan = this.simulate_voting_resolution(votingInterface);

        // PHASE 3: POST-VOTING MAP OPTIMIZATION
        const optimizedItinerary = await this.optimize_post_voting_routing(votedPlan, userPreferences);

        return optimizedItinerary;
    }

    /**
     * STEP 1: Find places and prepare voting interface - NO ROUTING YET
     */
    public async discover_and_prepare_voting(
        userPreferences: UserPreferences,
        availablePlaces: Place[],
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): Promise<VotingInterface> {
        // Discover places with advanced filtering (Independent of routing)
        const { places: rawPlaces, filtrationMetadata } = await this.discoverPlacesWithFilters(
            userPreferences,
            availablePlaces
        );

        // SMART DURATION ADJUSTMENT
        const durationAdjustment = adjustTripDurationBasedOnPlaces(
            rawPlaces,
            userPreferences.trip_duration,
            userPreferences.destination.name || "the destination",
            filtrationMetadata
        );

        const adjustedPreferences = {
            ...userPreferences,
            trip_duration: durationAdjustment.adjustedDuration
        };

        const enhancedPlaces = await enhancePlacesWithPhotosAndDistance(
            userPreferences.start_location,
            rawPlaces
        );

        const dailyVotingOptions: { [day: number]: DailyVotingOptions } = {};
        const usedPlaceIds = new Set<string>();

        for (let day = 1; day <= adjustedPreferences.trip_duration; day++) {
            const dayOptions: DailyVotingOptions = {};

            for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                // Get 3 options per time slot, purely based on quality/relevance
                const slotOptions = this.getTimeAppropriatePlaces(
                    enhancedPlaces,
                    timeSlot,
                    3,
                    usedPlaceIds
                );

                slotOptions.forEach(p => usedPlaceIds.add(p.id));

                dayOptions[timeSlot] = slotOptions.map(place => ({
                    place: place,
                    category: place.category,
                    quality_score: this.calculateRelevanceScore(place, userPreferences.categories),
                    why_recommended: this.generate_voting_recommendation(place, timeSlot),
                    // CRITICAL: No routing info at voting stage
                    travel_time: null,
                    estimated_arrival: null
                }));
            }
            dailyVotingOptions[day] = dayOptions;
        }

        return {
            voting_interface: dailyVotingOptions,
            duration_adjustment: durationAdjustment,
            metadata: {
                total_options: (Object.values(dailyVotingOptions) as DailyVotingOptions[]).reduce((acc: number, day: DailyVotingOptions) =>
                    acc + Object.values(day).reduce((dAcc: number, slot: VotingOption[]) => dAcc + slot.length, 0), 0),
                categories_covered: userPreferences.categories,
                voting_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
        };
    }

    /**
     * ENHANCED DISCOVERY: Fetch places using Google Maps API with advanced filters
     */
    private async discoverPlacesWithFilters(
        userPreferences: UserPreferences,
        existingPlaces: Place[]
    ): Promise<{ places: Place[], filtrationMetadata: any }> {
        let allPlaces: Place[] = [...existingPlaces];

        // If we don't have enough places, fetch from API
        if (allPlaces.length < 20 && userPreferences.categories.length > 0) {
            // We can reverse geocode or just use the coords for search
            // For better results, we should ideally use the destination name if available
            // but we'll stick to category search around the start location/destination

            for (const category of userPreferences.categories) {
                const googleType = mapCategoryToGoogleType(category);
                const results = await searchPlaces(
                    category, // Query
                    userPreferences.start_location, // Use start location as center
                    5000, // Radius
                    googleType
                );
                allPlaces = [...allPlaces, ...results];
            }
        }

        // Remove duplicates
        allPlaces = Array.from(new Map(allPlaces.map(item => [item.id, item])).values());

        // APPLY ENHANCED FILTERS

        // 1. Strict Filtration (Local/Irrelevant removal)
        // Use actual destination name if available, otherwise fallback to "Destination"
        const destinationName = userPreferences.destination.name || "Destination";
        console.log(`[UnifiedPlanner] Filtering ${allPlaces.length} places for destination: "${destinationName}"`);

        const { filteredPlaces: strictFilteredPlaces, metadata } = applyAdvancedFakeEntityFiltration(allPlaces, destinationName);
        console.log(`[UnifiedPlanner] After strict filtration: ${strictFilteredPlaces.length} places`);
        console.log(`[UnifiedPlanner] Filtration stats:`, metadata);

        // 2. Food Filtration
        const foodPlaces = strictFilteredPlaces.filter(p => p.category === 'food');
        const nonFoodPlaces = strictFilteredPlaces.filter(p => p.category !== 'food');

        const { filteredPlaces: enhancedFoodPlaces } = applyEnhancedFoodFiltration(foodPlaces, userPreferences);

        let filteredPlaces = [...nonFoodPlaces, ...enhancedFoodPlaces];

        // 3. Basic User Preference Filters (Budget, Rating)
        filteredPlaces = filteredPlaces.filter(place => {
            // Budget Filter
            if (userPreferences.budget && place.priceLevel) {
                const budgetMap = { 'low': 1, 'medium': 2, 'high': 3 };
                if (place.priceLevel > budgetMap[userPreferences.budget]) return false;
            }

            // Rating Filter (Already partially handled by enhanced filters, but keep for custom user pref)
            if (userPreferences.minRating && place.rating < userPreferences.minRating) return false;

            return true;
        });

        // 4. Fallback: If we have too few places, generate "Smart Suggestions"
        if (filteredPlaces.length < 5) {
            console.log('[UnifiedPlanner] Insufficient places found. Generating smart suggestions.');
            const suggestions = this.generateContextualSuggestions(
                userPreferences,
                filteredPlaces.length
            );
            filteredPlaces = [...filteredPlaces, ...suggestions];
        }

        return { places: filteredPlaces, filtrationMetadata: metadata };
    }

    /**
     * SMART SUGGESTION ENGINE
     * Generates contextual placeholders based on trip phase (Arrival, Departure, etc.)
     */
    private generateContextualSuggestions(userPreferences: UserPreferences, currentCount: number): Place[] {
        const suggestions: Place[] = [];
        const needed = 5 - currentCount;
        const isFirstDay = (userPreferences as any).isFirstDay;
        const isLastDay = (userPreferences as any).isLastDay;

        // Helper to create a suggestion place
        const createSuggestion = (id: string, name: string, category: string, desc: string): Place => ({
            id: `suggestion-${id}-${Date.now()}`,
            name: name,
            category: category as any,
            lat: userPreferences.destination.lat || 0,
            lng: userPreferences.destination.lng || 0,
            rating: 4.5, // High rating to encourage consideration
            reviews: 100,
            priceLevel: 2,
            image: '',
            description: desc,
            rawTypes: ['suggestion'],
            vicinity: userPreferences.destination.name || "Destination",
            tags: ['Recommended']
        });

        // Context 1: Arrival / Check-in
        if (isFirstDay && currentCount === 0) {
            suggestions.push(createSuggestion('check-in', 'Check-in to Hotel', 'hotel', 'Relax and settle in after your journey.'));
        }

        // Context 2: Departure
        if (isLastDay) {
            suggestions.push(createSuggestion('departure', 'Prepare for Departure', 'activity', 'Pack up and head to the airport/station.'));
        }

        // Context 3: Meal times (Always good fillers)
        if (needed > suggestions.length) {
            suggestions.push(createSuggestion('local-dining', 'Explore Local Cuisine', 'food', 'Try famous local dishes at a nearby rated restaurant.'));
        }

        // Context 4: Relaxed Evening
        if (needed > suggestions.length) {
            suggestions.push(createSuggestion('evening-stroll', 'Evening City Walk', 'activity', 'Take a leisure walk to soak in the city vibe.'));
        }

        // Context 5: Shopping / Souvenirs
        if (needed > suggestions.length) {
            suggestions.push(createSuggestion('shopping', 'Souvenir Shopping', 'shopping', 'Pick up some memories from local markets.'));
        }

        // Context 6: Generic Exploration
        while (needed > suggestions.length) {
            suggestions.push(createSuggestion(`explore-${suggestions.length}`, 'Discover Hidden Gems', 'activity', 'Wander around and find unplanned spots.'));
        }

        return suggestions;
    }
    /**
     * STEP 2: Resolve voting (in real app, this comes from user votes)
     */
    public simulate_voting_resolution(votingInterface: VotingInterface): VotedPlan {
        const votedPlan: VotedPlan = {};

        for (const [day, timeSlots] of Object.entries(votingInterface.voting_interface)) {
            const dayPlan: { [timeSlot: string]: VotingOption } = {};
            const slots = timeSlots as DailyVotingOptions;
            for (const [timeSlot, options] of Object.entries(slots)) {
                if (!options || options.length === 0) continue;

                // Simulate voting with random factor
                const winner = this.select_voting_winner(options);
                if (winner) {
                    dayPlan[timeSlot] = winner;
                }
            }
            votedPlan[Number(day)] = dayPlan;
        }
        return votedPlan;
    }


    /**
     * STEP 3: AFTER VOTING - Apply map routing optimization to voted places
     */
    public async optimize_post_voting_routing(votedPlan: VotedPlan, userPreferences: UserPreferences): Promise<{ [day: number]: ItineraryItem[] }> {
        const optimizedItinerary: { [day: number]: ItineraryItem[] } = {};

        // Fix: Add missing properties to mock Place object
        let currentLocation = {
            ...userPreferences.start_location,
            id: 'start',
            name: 'Start',
            category: 'activity',
            rating: 5,
            reviews: 0,
            priceLevel: 1
        } as Place;

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            if (!votedPlan[day]) continue;

            const votedPlaces: VotedPlaceItem[] = [];
            for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                if (votedPlan[day][timeSlot]) {
                    votedPlaces.push({
                        place: votedPlan[day][timeSlot].place,
                        preferred_time_slot: timeSlot,
                        time_constraints: this.get_time_constraints(timeSlot)
                    });
                }
            }

            const dayItinerary = await this.optimize_day_routing_post_vote(
                currentLocation,
                votedPlaces,
                userPreferences,
                day
            );

            optimizedItinerary[day] = dayItinerary;

            if (dayItinerary.length > 0) {
                const lastItem = dayItinerary[dayItinerary.length - 1];
                const lastPlace = votedPlaces.find(vp => vp.place.id === lastItem.placeId)?.place;
                if (lastPlace) {
                    currentLocation = lastPlace;
                }
            }
        }

        // Handle return trip if requested
        if (userPreferences.return_to_start && Object.keys(optimizedItinerary).length > 0) {
            const lastDay = userPreferences.trip_duration;
            if (optimizedItinerary[lastDay] && optimizedItinerary[lastDay].length > 0) {
                const lastItem = optimizedItinerary[lastDay][optimizedItinerary[lastDay].length - 1];

                // Fix: Add missing properties to mock Place object
                const endLocation = {
                    ...userPreferences.start_location,
                    id: 'end',
                    name: 'End',
                    category: 'activity',
                    rating: 5,
                    reviews: 0,
                    priceLevel: 1
                } as Place;

                // Calculate return trip using REAL distance
                const returnDistInfo = (await calculateRealDistances(currentLocation, [endLocation]))[0];
                const returnDuration = returnDistInfo.distance?.duration ? parseInt(returnDistInfo.distance.duration) : 30;

                const lastEndTime = new Date(lastItem.endTime);
                const returnStartTime = lastEndTime;
                const returnEndTime = new Date(returnStartTime.getTime() + returnDuration * 60000);

                optimizedItinerary[lastDay].push({
                    id: uuidv4(),
                    placeId: 'return_trip',
                    startTime: returnStartTime.toISOString(),
                    endTime: returnEndTime.toISOString(),
                    notes: `Return to start: ${returnDistInfo.distance?.text || 'Calculating...'}`,
                    type: 'return_trip'
                });
            }
        }

        return optimizedItinerary;
    }

    /**
     * CRITICAL: Map optimization AFTER voting is complete
     * Respects time slots but optimizes order within constraints
     */
    private async optimize_day_routing_post_vote(
        startLocation: Place,
        votedPlaces: VotedPlaceItem[],
        userPreferences: UserPreferences,
        dayNumber: number
    ): Promise<ItineraryItem[]> {
        if (!votedPlaces || votedPlaces.length === 0) return [];

        const placesToRoute = votedPlaces.map(vp => vp.place);
        const timeConstraints: TimeConstraints = {};
        votedPlaces.forEach(vp => {
            timeConstraints[vp.place.id] = vp.time_constraints;
            timeConstraints[vp.place.id].preferred_slot = vp.preferred_time_slot;
        });

        // Smart routing that respects voted time preferences
        const optimizedOrder = this.time_aware_traveling_salesman(
            startLocation,
            placesToRoute,
            timeConstraints
        );

        // Build final itinerary with actual timing
        const date = new Date(userPreferences.trip_dates.start);
        date.setDate(date.getDate() + (dayNumber - 1));
        let currentTime = new Date(date);
        currentTime.setHours(9, 0, 0, 0);
        if (userPreferences.day_start_time) {
            const startH = new Date(userPreferences.day_start_time).getHours();
            const startM = new Date(userPreferences.day_start_time).getMinutes();
            currentTime.setHours(startH, startM, 0, 0);
        }

        let currentLocation = startLocation;
        const finalItinerary: ItineraryItem[] = [];

        for (const place of optimizedOrder) {
            // Calculate REAL travel time
            const placeWithDist = (await calculateRealDistances(currentLocation, [place]))[0];
            let travelTime = 15;
            if (placeWithDist.distance?.duration) {
                travelTime = parseInt(placeWithDist.distance.duration);
            }

            // Apply time slot constraints
            const timeSlotConstraint = timeConstraints[place.id];

            // Calculate constrained arrival
            let arrivalTime = new Date(currentTime.getTime() + travelTime * 60000);
            arrivalTime = this.calculate_constrained_arrival(arrivalTime, timeSlotConstraint);

            // Check feasibility
            const feasibility = this.check_visit_feasibility(place, arrivalTime);

            if (feasibility.feasible) {
                finalItinerary.push({
                    id: uuidv4(),
                    placeId: place.id,
                    startTime: arrivalTime.toISOString(),
                    endTime: feasibility.departureTime.toISOString(),
                    notes: `Travel: ${placeWithDist.distance?.text || '...'}. Recommended for ${timeSlotConstraint.preferred_slot}`,
                    type: 'activity'
                });

                currentTime = feasibility.departureTime;
                currentLocation = place;
            }
        }

        return finalItinerary;
    }

    private time_aware_traveling_salesman(startLocation: Place, places: Place[], timeConstraints: TimeConstraints): Place[] {
        if (places.length <= 2) {
            return places.sort((a, b) =>
                calculateDistance(startLocation, a) - calculateDistance(startLocation, b)
            );
        }

        if (places.length === 3) {
            return this.optimize_three_place_route(startLocation, places, timeConstraints);
        }

        // For more places, use constraint-aware routing (simplified for now)
        // Sort by preferred slot order: Morning -> Afternoon -> Evening
        const slotOrder = { 'morning': 1, 'afternoon': 2, 'evening': 3 };
        return places.sort((a, b) => {
            const slotA = timeConstraints[a.id]?.preferred_slot || 'morning';
            const slotB = timeConstraints[b.id]?.preferred_slot || 'morning';
            return (slotOrder[slotA as keyof typeof slotOrder] || 1) - (slotOrder[slotB as keyof typeof slotOrder] || 1);
        });
    }

    private optimize_three_place_route(startLocation: Place, places: Place[], timeConstraints: TimeConstraints): Place[] {
        const morningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'morning');
        const afternoonPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'afternoon');
        const eveningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'evening');

        // Generate possible sequences that respect time slots
        const sequences = this.generate_time_respecting_sequences(morningPlaces, afternoonPlaces, eveningPlaces);

        let bestRoute = places; // Fallback
        let bestScore = Infinity;

        for (const sequence of sequences) {
            // Calculate total distance score
            let score = calculateDistance(startLocation, sequence[0]);
            for (let i = 0; i < sequence.length - 1; i++) {
                score += calculateDistance(sequence[i], sequence[i + 1]);
            }

            if (score < bestScore) {
                bestScore = score;
                bestRoute = sequence;
            }
        }

        return bestRoute;
    }

    private generate_time_respecting_sequences(morning: Place[], afternoon: Place[], evening: Place[]): Place[][] {
        const sequences: Place[][] = [];
        // Basic flow: Morning -> Afternoon -> Evening
        // Handle cases where some slots might be empty or have multiple
        const m = morning.length > 0 ? morning : [null];
        const a = afternoon.length > 0 ? afternoon : [null];
        const e = evening.length > 0 ? evening : [null];

        for (const mp of m) {
            for (const ap of a) {
                for (const ep of e) {
                    const seq = [mp, ap, ep].filter(p => p !== null) as Place[];
                    if (seq.length > 0) sequences.push(seq);
                }
            }
        }
        return sequences;
    }

    private calculate_constrained_arrival(proposedArrival: Date, timeConstraints: { preferred_slot: string }): Date {
        if (!timeConstraints) return proposedArrival;

        const preferredSlot = timeConstraints.preferred_slot;
        const dateStr = proposedArrival.toISOString().split('T')[0];

        const morningStart = new Date(`${dateStr}T09:00:00`);
        const afternoonStart = new Date(`${dateStr}T12:00:00`);
        const eveningStart = new Date(`${dateStr}T17:00:00`);
        const eveningEnd = new Date(`${dateStr}T21:00:00`);

        if (preferredSlot === 'morning') {
            if (proposedArrival < morningStart) return morningStart;
        } else if (preferredSlot === 'afternoon') {
            if (proposedArrival < afternoonStart) return afternoonStart;
        } else if (preferredSlot === 'evening') {
            if (proposedArrival < eveningStart) return eveningStart;
        }

        return proposedArrival;
    }

    private check_visit_feasibility(place: Place, arrivalTime: Date): { feasible: boolean, departureTime: Date } {
        const visitDuration = place.visitDuration || 90;
        const departureTime = new Date(arrivalTime.getTime() + visitDuration * 60000);

        // Check closing time
        if (place.opensAt && place.closesAt) {
            const [closeH, closeM] = place.closesAt.split(':').map(Number);
            const closeTime = new Date(arrivalTime);
            closeTime.setHours(closeH, closeM, 0, 0);

            if (departureTime > closeTime) {
                return { feasible: false, departureTime };
            }
        }

        return { feasible: true, departureTime };
    }

    private getTimeAppropriatePlaces(places: Place[], timeSlot: string, count: number, usedPlaceIds: Set<string>): Place[] {
        const timeAppropriateness: Record<string, { categories: string[], keywords: string[], exclude: string[] }> = {
            'morning': {
                categories: ['park', 'hiking', 'museum', 'garden', 'religious', 'breakfast', 'nature'],
                keywords: ['morning', 'sunrise', 'breakfast', 'walk', 'hike', 'museum', 'temple', 'church', 'park'],
                exclude: ['nightclub', 'bar', 'casino', 'adult', 'pub', 'lounge']
            },
            'afternoon': {
                categories: ['restaurant', 'shopping_mall', 'tourist_attraction', 'cafe', 'art_gallery', 'zoo', 'aquarium', 'shopping'],
                keywords: ['lunch', 'shopping', 'tour', 'exhibition', 'cultural', 'mall', 'market'],
                exclude: ['breakfast', 'sunrise', 'nightclub']
            },
            'evening': {
                categories: ['restaurant', 'nightclub', 'bar', 'viewpoint', 'theater', 'nightlife', 'dinner'],
                keywords: ['dinner', 'sunset', 'night', 'show', 'concert', 'bar', 'pub', 'club'],
                exclude: ['breakfast', 'morning', 'hiking', 'zoo']
            }
        };

        const config = timeAppropriateness[timeSlot];

        // Filter places for time appropriateness
        const appropriatePlaces = places.filter(place => {
            // Skip if already used
            if (usedPlaceIds.has(place.id)) return false;

            // Check categories match
            // We check against our internal category AND Google types if available
            const categoryMatch = config.categories.includes(place.category);

            // Check keywords in name
            const keywordMatch = config.keywords.some((keyword: string) =>
                place.name.toLowerCase().includes(keyword)
            );

            // Check exclusions (strict)
            const exclusionMatch = config.exclude.some((exclude: string) =>
                place.category === exclude || place.name.toLowerCase().includes(exclude)
            );

            return (categoryMatch || keywordMatch) && !exclusionMatch;
        });

        // Sort by relevance (rating * reviews) and return top N
        return appropriatePlaces
            .sort((a, b) => (b.rating * (Math.log10(b.reviews || 1))) - (a.rating * (Math.log10(a.reviews || 1))))
            .slice(0, count);
    }

    private generate_voting_recommendation(place: Place, timeSlot: string): string {
        const reasons: Record<string, string[]> = {
            'morning': ['Perfect for a morning start', 'Great breakfast spot', 'Beautiful morning views', 'Peaceful morning atmosphere'],
            'afternoon': ['Ideal for afternoon exploration', 'Great lunch options nearby', 'Perfect for shopping', 'Cultural experience'],
            'evening': ['Amazing sunset views', 'Great dinner atmosphere', 'Vibrant nightlife', 'Perfect way to end the day']
        };
        const randomReason = reasons[timeSlot][Math.floor(Math.random() * reasons[timeSlot].length)];
        return `${randomReason}. Rated ${place.rating} stars.`;
    }

    private get_time_constraints(timeSlot: string): { preferred_slot: string } {
        return {
            preferred_slot: timeSlot
        };
    }

    private select_voting_winner(options: VotingOption[]): VotingOption | null {
        if (options.length === 0) return null;
        const scoredOptions = options.map(option => {
            const randomFactor = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
            return { option, score: option.quality_score * randomFactor };
        });
        return scoredOptions.sort((a, b) => b.score - a.score)[0].option;
    }

    private calculateRelevanceScore(place: Place, categories: string[]): number {
        let score = place.rating * 20;
        if (categories.includes(place.category)) score += 10;
        return Math.min(100, score);
    }
}
