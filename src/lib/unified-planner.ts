import { Place, UserPreferences, TripCategory, ItineraryItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { calculateDistance, estimateTravelTime } from './route-optimizer/distance-matrix';
import { scoreAndRankPlaces } from './category-scorer';
import { calculateTrendingScore } from './trending-service';

/**
 * FINAL MERGED SYSTEM: Voting → Places → Maps in perfect harmony
 */
export class UnifiedTravelPlanner {

    /**
     * Complete workflow that respects the voting-first approach
     */
    public unified_planning_workflow(
        userPreferences: UserPreferences,
        availablePlaces: Place[],
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): { [day: number]: ItineraryItem[] } {
        // PHASE 1: PLACE DISCOVERY & VOTING
        const votingInterface = this.discover_and_prepare_voting(
            userPreferences,
            availablePlaces,
            categoryPreferences
        );

        // PHASE 2: WAIT FOR USER VOTING (External Process)
        // In your app, this is where users actually vote
        // For simulation, we'll auto-resolve votes
        const votedPlan = this.simulate_voting_resolution(votingInterface, userPreferences);

        // PHASE 3: POST-VOTING MAP OPTIMIZATION
        const optimizedItinerary = this.optimize_post_voting_routing(votedPlan, userPreferences);

        return optimizedItinerary;
    }

    /**
     * STEP 1: Find places and prepare voting interface - NO ROUTING YET
     */
    private discover_and_prepare_voting(
        userPreferences: UserPreferences,
        availablePlaces: Place[],
        categoryPreferences?: { categories: TripCategory[]; priorities?: { [key in TripCategory]?: number } }
    ): any {
        // Discover places without any routing bias
        const rawPlaces = this.discover_places_independent(
            availablePlaces,
            userPreferences,
            categoryPreferences,
            20 // More options for voting
        );

        // Group by days but DON'T optimize routes yet
        const dailyVotingOptions: any = {};

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            const dayOptions: any = {};

            for (const timeSlot of ['morning', 'afternoon', 'evening']) {
                // Get 3 options per time slot, purely based on quality/relevance
                const slotOptions = this.get_time_appropriate_places(
                    rawPlaces,
                    timeSlot,
                    userPreferences.categories,
                    3
                );

                dayOptions[timeSlot] = slotOptions.map(place => ({
                    place: place,
                    category: place.category,
                    quality_score: this.calculateRelevanceScore(place, userPreferences.categories), // simplified
                    why_recommended: this.generate_voting_recommendation(place, timeSlot),
                    // CRITICAL: No routing info at voting stage
                    travel_time: null, // Will calculate AFTER voting
                    estimated_arrival: null
                }));
            }
            dailyVotingOptions[day] = dayOptions;
        }

        return {
            voting_interface: dailyVotingOptions,
            metadata: {
                total_options: Object.values(dailyVotingOptions).reduce((acc: number, day: any) =>
                    acc + Object.values(day).reduce((dAcc: number, slot: any) => dAcc + slot.length, 0), 0),
                categories_covered: userPreferences.categories,
                voting_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Fake deadline
            }
        };
    }

    /**
     * STEP 2: Resolve voting (in real app, this comes from user votes)
     */
    private simulate_voting_resolution(votingInterface: any, userPreferences: UserPreferences): any {
        const votedPlan: any = {};

        for (const [day, timeSlots] of Object.entries(votingInterface.voting_interface)) {
            const dayPlan: any = {};
            // @ts-ignore
            for (const [timeSlot, options] of Object.entries(timeSlots)) {
                // @ts-ignore
                if (!options || options.length === 0) continue;

                // In real app: Use actual user votes
                // For simulation: Use quality score + diversity
                // @ts-ignore
                const winner = this.select_voting_winner(options, timeSlot);
                dayPlan[timeSlot] = winner;
            }
            votedPlan[day] = dayPlan;
        }
        return votedPlan;
    }

    /**
     * STEP 3: AFTER VOTING - Apply map routing optimization to voted places
     */
    private optimize_post_voting_routing(votedPlan: any, userPreferences: UserPreferences): { [day: number]: ItineraryItem[] } {
        const optimizedItinerary: { [day: number]: ItineraryItem[] } = {};
        let currentLocation = { ...userPreferences.start_location, id: 'start', name: 'Start' } as Place; // Mock start place

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            if (!votedPlan[day]) continue;

            // Extract voted places for this day
            const votedPlaces = [];
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
            const dayItinerary = this.optimize_day_routing_post_vote(
                currentLocation,
                votedPlaces,
                userPreferences,
                day
            );

            optimizedItinerary[day] = dayItinerary;

            // Update location for next day (last place visited)
            if (dayItinerary.length > 0) {
                const lastItem = dayItinerary[dayItinerary.length - 1];
                // Find the place object for the last item
                // This is a bit tricky since ItineraryItem only has placeId. 
                // But we have the place object in votedPlaces.
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
                // We need the place object again...
                // Let's just assume we can calculate from the last known location

                const returnDist = calculateDistance(currentLocation, userPreferences.start_location);
                const returnDuration = estimateTravelTime(returnDist, 'driving');

                // Calculate start time for return trip based on last item's end time
                const lastEndTime = new Date(lastItem.endTime);
                const returnStartTime = lastEndTime;
                const returnEndTime = new Date(returnStartTime.getTime() + returnDuration * 60000);

                optimizedItinerary[lastDay].push({
                    id: uuidv4(),
                    placeId: 'return_trip', // Special ID
                    startTime: returnStartTime.toISOString(),
                    endTime: returnEndTime.toISOString(),
                    notes: `Return to start: ${returnDist.toFixed(1)}km, ${returnDuration}min`,
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
    private optimize_day_routing_post_vote(
        startLocation: Place,
        votedPlaces: any[],
        userPreferences: UserPreferences,
        dayNumber: number
    ): ItineraryItem[] {
        if (!votedPlaces || votedPlaces.length === 0) return [];

        // Convert to routing format
        const placesToRoute = votedPlaces.map(vp => vp.place);
        const timeConstraints: any = {};
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
            // Calculate travel time
            const travelTime = estimateTravelTime(calculateDistance(currentLocation, place), 'driving');

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
                notes: `Travel: ${travelTime} min. Recommended for ${timeSlotConstraint.preferred_slot}`,
                type: 'activity'
            });

            // Update for next iteration
            currentTime = departureTime;
            currentLocation = place;
        }

        return finalItinerary;
    }

    private time_aware_traveling_salesman(startLocation: Place, places: Place[], timeConstraints: any): Place[] {
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

    private optimize_three_place_route(startLocation: Place, places: Place[], timeConstraints: any): Place[] {
        const morningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'morning');
        const afternoonPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'afternoon');
        const eveningPlaces = places.filter(p => timeConstraints[p.id]?.preferred_slot === 'evening');

        // Ideally we want M -> A -> E
        // Since we have exactly 3 places and we filtered them into slots, 
        // if each slot has 1 place, we just return them in order.
        // If there are conflicts (e.g. 2 morning, 1 evening), we might need to shift one.

        // Simple heuristic: Concatenate lists
        const ordered = [...morningPlaces, ...afternoonPlaces, ...eveningPlaces];

        // If any places were missed (e.g. no preferred slot?), add them
        const usedIds = new Set(ordered.map(p => p.id));
        const remaining = places.filter(p => !usedIds.has(p.id));

        return [...ordered, ...remaining];
    }

    private calculate_constrained_arrival(proposedArrival: Date, timeConstraints: any): Date {
        if (!timeConstraints) return proposedArrival;

        const preferredSlot = timeConstraints.preferred_slot;
        const dateStr = proposedArrival.toISOString().split('T')[0];

        const morningStart = new Date(`${dateStr}T09:00:00`);
        const afternoonStart = new Date(`${dateStr}T12:00:00`);
        const eveningStart = new Date(`${dateStr}T17:00:00`);
        const eveningEnd = new Date(`${dateStr}T21:00:00`);

        if (preferredSlot === 'morning') {
            // If too early, wait. If too late... well, we can't go back in time easily in this linear flow without backtracking.
            // Just ensure it's at least 9am
            if (proposedArrival < morningStart) return morningStart;
        } else if (preferredSlot === 'afternoon') {
            if (proposedArrival < afternoonStart) return afternoonStart;
        } else if (preferredSlot === 'evening') {
            if (proposedArrival < eveningStart) return eveningStart;
        }

        return proposedArrival;
    }

    private discover_places_independent(
        availablePlaces: Place[],
        userPreferences: UserPreferences,
        categoryPreferences: any,
        count: number
    ): Place[] {
        // Filter by categories
        let filtered = availablePlaces;
        if (userPreferences.categories && userPreferences.categories.length > 0) {
            filtered = availablePlaces.filter(p =>
                userPreferences.categories.some(cat => p.category === cat)
            );
        }

        // Score and rank
        const scored = scoreAndRankPlaces(filtered, userPreferences.categories as TripCategory[], categoryPreferences?.priorities);

        // Return top N
        return scored.map(s => s.place).slice(0, count);
    }

    private get_time_appropriate_places(places: Place[], timeSlot: string, categories: string[], count: number): Place[] {
        const appropriate = places.filter(p => this.is_time_appropriate(p, timeSlot));
        return appropriate.slice(0, count);
    }

    private is_time_appropriate(place: Place, timeSlot: string): boolean {
        const timeAppropriateness: any = {
            'morning': ['breakfast', 'hiking', 'nature', 'museum', 'park', 'religious'],
            'afternoon': ['lunch', 'shopping', 'cultural', 'adventure', 'historical'],
            'evening': ['dinner', 'nightlife', 'sunset', 'entertainment', 'bar']
        };

        // Check if place category matches time slot
        // This is a simple check. Real logic might be more complex.
        const appropriateCategories = timeAppropriateness[timeSlot] || [];
        // Also check place.category
        if (appropriateCategories.includes(place.category)) return true;

        // Fallback: if category not strictly mapped, maybe allow it?
        // Let's be strict for now to show the logic working
        return false;
    }

    private generate_voting_recommendation(place: Place, timeSlot: string): string {
        return `Great for ${timeSlot} because it is a ${place.category} spot.`;
    }

    private get_time_constraints(timeSlot: string): any {
        return {
            preferred_slot: timeSlot
        };
    }

    private select_voting_winner(options: any[], timeSlot: string): any {
        if (options.length === 0) return null;
        // Simulate voting: just pick the one with highest quality score
        // Add some random factor
        return options.sort((a, b) => b.quality_score - a.quality_score)[0];
    }

    private calculateRelevanceScore(place: Place, categories: string[]): number {
        // Simple score
        let score = place.rating * 20; // 0-100
        if (categories.includes(place.category)) score += 10;
        return Math.min(100, score);
    }
}
