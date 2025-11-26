
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
        // In your app, this is where users actually vote
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
        // Discover places with advanced filtering
        const { places: rawPlaces, filtrationMetadata } = await this.discoverPlacesWithFilters(
            userPreferences,
            availablePlaces
        );

        // SMART DURATION ADJUSTMENT
        // We use the raw filtered places to determine if the duration is sustainable
        const durationAdjustment = adjustTripDurationBasedOnPlaces(
            rawPlaces,
            userPreferences.trip_duration,
            // Use actual destination name
            userPreferences.destination.name || "the destination",
            filtrationMetadata
        );

        // Update preferences with adjusted duration for the rest of the flow
        const adjustedPreferences = {
            ...userPreferences,
            trip_duration: durationAdjustment.adjustedDuration
        };

        // Enhance with real data (distance from start location)
        const enhancedPlaces = await enhancePlacesWithPhotosAndDistance(
            userPreferences.start_location,
            rawPlaces
        );

        // Group by days but DON'T optimize routes yet
        const dailyVotingOptions: { [day: number]: DailyVotingOptions } = {};
        const usedPlaceIds = new Set<string>();

        for (let day = 1; day <= adjustedPreferences.trip_duration; day++) {
            const dayOptions: DailyVotingOptions = {};

            for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                // Get 3 options per time slot, ensuring diversity and time appropriateness
                const slotOptions = this.getTimeAppropriatePlaces(
                    enhancedPlaces,
                    timeSlot,
                    3,
                    usedPlaceIds
                );

                // Mark selected places as used
                slotOptions.forEach(p => usedPlaceIds.add(p.id));

                dayOptions[timeSlot] = slotOptions.map(place => ({
                    place: place,
                    category: place.category,
                    quality_score: this.calculateRelevanceScore(place, userPreferences.categories),
                    why_recommended: this.generate_voting_recommendation(place, timeSlot),
                    // CRITICAL: No routing info at voting stage
                    travel_time: null,
                    distance_text: place.distance?.text || null,
                    estimated_arrival: null
                }));
            }
            dailyVotingOptions[day] = dayOptions;
        }

        return {
            voting_interface: dailyVotingOptions,
            duration_adjustment: durationAdjustment, // Pass this back to UI
            metadata: {
                total_options: (Object.values(dailyVotingOptions) as DailyVotingOptions[]).reduce((acc: number, day: DailyVotingOptions) =>
                    acc + Object.values(day).reduce((dAcc: number, slot: VotingOption[]) => dAcc + slot.length, 0), 0),
                categories_covered: userPreferences.categories,
                voting_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Fake deadline
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

        return { places: filteredPlaces, filtrationMetadata: metadata };
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

                // In real app: Use actual user votes
                // For simulation: Use quality score + diversity
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
        let currentLocation = { ...userPreferences.start_location, id: 'start', name: 'Start' } as Place; // Mock start place

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            if (!votedPlan[day]) continue;

            // Extract voted places for this day
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

            // NOW apply routing optimization to the VOTED places
            const dayItinerary = await this.optimize_day_routing_post_vote(
                currentLocation,
                votedPlaces,
                userPreferences,
                day
            );

            optimizedItinerary[day] = dayItinerary;

            // Update location for next day (last place visited)
            if (dayItinerary.length > 0) {
                const lastItem = dayItinerary[dayItinerary.length - 1];
                const lastPlace = votedPlaces.find(vp => vp.place.id === lastItem.placeId)?.place;
                if (lastPlace) {
                    currentLocation = lastPlace;
                }
            }
        }

        // Handle return trip if requested (append to last day)
        if (userPreferences.return_to_start && Object.keys(optimizedItinerary).length > 0) {
            const lastDay = userPreferences.trip_duration;
            if (optimizedItinerary[lastDay] && optimizedItinerary[lastDay].length > 0) {
                const lastItem = optimizedItinerary[lastDay][optimizedItinerary[lastDay].length - 1];

                // Calculate return trip using REAL distance
                const returnDistInfo = (await calculateRealDistances(currentLocation, [{ ...userPreferences.start_location, id: 'end', name: 'End' } as Place]))[0];
                const returnDuration = returnDistInfo.distance?.duration ? parseInt(returnDistInfo.distance.duration) : 30; // fallback

                // Calculate start time for return trip based on last item's end time
                const lastEndTime = new Date(lastItem.endTime);
                const returnStartTime = lastEndTime;
                const returnEndTime = new Date(returnStartTime.getTime() + returnDuration * 60000);

                optimizedItinerary[lastDay].push({
                    id: uuidv4(),
                    placeId: 'return_trip', // Special ID
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

        // Convert to routing format
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
        // Start time for the day
        const date = new Date(userPreferences.trip_dates.start);
        date.setDate(date.getDate() + (dayNumber - 1));

        let currentTime = new Date(date);
        currentTime.setHours(9, 0, 0, 0); // Default start 9 AM
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
            // Parse duration string "15 mins" -> 15
            let travelTime = 15; // default
            if (placeWithDist.distance?.duration) {
                travelTime = parseInt(placeWithDist.distance.duration);
            }

            // Apply time slot constraints
            const timeSlotConstraint = timeConstraints[place.id];

            // Add travel time to current time
            let arrivalTime = new Date(currentTime.getTime() + travelTime * 60000);

            // Adjust arrival based on constraints
            arrivalTime = this.calculate_constrained_arrival(arrivalTime, timeSlotConstraint);

            // Assume 1.5 hours visit duration
            const visitDuration = 90;
            const departureTime = new Date(arrivalTime.getTime() + visitDuration * 60000);

            finalItinerary.push({
                id: uuidv4(),
                placeId: place.id,
                startTime: arrivalTime.toISOString(),
                endTime: departureTime.toISOString(),
                notes: `Travel: ${placeWithDist.distance?.text || '...'}. Recommended for ${timeSlotConstraint.preferred_slot}`,
                type: 'activity'
            });

            // Update for next iteration
            currentTime = departureTime;
            currentLocation = place;
        }

        return finalItinerary;
    }

    private time_aware_traveling_salesman(startLocation: Place, places: Place[], timeConstraints: TimeConstraints): Place[] {
        // If only 1-2 places, order doesn't matter much (or just nearest neighbor)
        if (places.length <= 2) {
            // Simple sort by distance from start
            return places.sort((a, b) =>
                calculateDistance(startLocation, a) - calculateDistance(startLocation, b)
            );
        }

        // For 3 places, consider time slot preferences (Morning -> Afternoon -> Evening)
        if (places.length === 3) {
            return this.optimize_three_place_route(startLocation, places, timeConstraints);
        }

        // For more places, just return as is for now (or implement complex TSP)
        return places;
    }

    private optimize_three_place_route(startLocation: Place, places: Place[], timeConstraints: TimeConstraints): Place[] {
        const morningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'morning');
        const afternoonPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'afternoon');
        const eveningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'evening');

        // Ideally we want M -> A -> E
        const ordered = [...morningPlaces, ...afternoonPlaces, ...eveningPlaces];

        // If any places were missed (e.g. no preferred slot?), add them
        const usedIds = new Set(ordered.map(p => p.id));
        const remaining = places.filter(p => !usedIds.has(p.id));

        return [...ordered, ...remaining];
    }

    private calculate_constrained_arrival(proposedArrival: Date, timeConstraints: { preferred_slot: string }): Date {
        if (!timeConstraints) return proposedArrival;

        const preferredSlot = timeConstraints.preferred_slot;
        const dateStr = proposedArrival.toISOString().split('T')[0];

        const morningStart = new Date(`${dateStr}T09:00:00`);
        const afternoonStart = new Date(`${dateStr}T12:00:00`);
        const eveningStart = new Date(`${dateStr}T17:00:00`);

        if (preferredSlot === 'morning') {
            if (proposedArrival < morningStart) return morningStart;
        } else if (preferredSlot === 'afternoon') {
            if (proposedArrival < afternoonStart) return afternoonStart;
        } else if (preferredSlot === 'evening') {
            if (proposedArrival < eveningStart) return eveningStart;
        }

        return proposedArrival;
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
        // Simulate voting: just pick the one with highest quality score
        return options.sort((a, b) => b.quality_score - a.quality_score)[0];
    }

    private calculateRelevanceScore(place: Place, categories: string[]): number {
        let score = place.rating * 20; // 0-100
        if (categories.includes(place.category)) score += 10;
        return Math.min(100, score);
    }
}
