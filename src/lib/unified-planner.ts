import { Place, ItineraryItem, VotingInterface, UserPreferences, VotingOption, TimeSlot } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export class UnifiedTravelPlanner {
    /**
     * FINAL MERGED SYSTEM: Voting → Places → Maps in perfect harmony
     */
    public unifiedPlanningWorkflow(userPreferences: UserPreferences, availablePlaces: Place[]): ItineraryItem[] {
        // PHASE 1: PLACE DISCOVERY & VOTING
        const votingInterface = this.discoverAndPrepareVoting(userPreferences, availablePlaces);

        // PHASE 2: WAIT FOR USER VOTING (External Process)
        // In your app, this is where users actually vote
        // For simulation, we'll auto-resolve votes

        // PHASE 3: POST-VOTING MAP OPTIMIZATION
        const votedPlan = this.simulateVotingResolution(votingInterface);
        const optimizedItinerary = this.optimizePostVotingRouting(votedPlan, userPreferences);

        return optimizedItinerary;
    }

    private discoverAndPrepareVoting(userPreferences: UserPreferences, availablePlaces: Place[]): VotingInterface {
        // STEP 1: Find places and prepare voting interface - NO ROUTING YET

        // Discover places without any routing bias
        // In a real app, we would filter availablePlaces based on destination and categories
        // For now, we assume availablePlaces are already relevant to the destination
        const rawPlaces = this.discoverPlacesIndependent(availablePlaces, userPreferences.categories, 20);

        const dailyVotingOptions: { [day: number]: { [key: string]: VotingOption[] } } = {};

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            const dayOptions: { [key: string]: VotingOption[] } = {};

            for (const timeSlot of ['morning', 'afternoon', 'evening'] as TimeSlot[]) {
                // Get 3 options per time slot, purely based on quality/relevance
                const slotOptions = this.getTimeAppropriatePlaces(rawPlaces, timeSlot, userPreferences.categories, 3);

                dayOptions[timeSlot] = slotOptions.map(place => ({
                    place: place,
                    category: place.category,
                    quality_score: place.rating * 20, // Simple conversion to 0-100 scale
                    why_recommended: this.generateVotingRecommendation(place, timeSlot),
                    travel_time: null,
                    estimated_arrival: null
                }));
            }
            dailyVotingOptions[day] = dayOptions;
        }

        return {
            voting_interface: dailyVotingOptions,
            metadata: {
                total_options: Object.values(dailyVotingOptions).reduce((acc, day) =>
                    acc + Object.values(day).reduce((dAcc, slot) => dAcc + slot.length, 0), 0),
                categories_covered: userPreferences.categories, // Simplified
                voting_deadline: new Date(Date.now() + 86400000).toISOString() // 24h from now
            }
        };
    }

    private discoverPlacesIndependent(places: Place[], categories: string[], count: number): Place[] {
        // Sort by rating (quality)
        return [...places]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, count);
    }

    private getTimeAppropriatePlaces(places: Place[], timeSlot: TimeSlot, categories: string[], count: number): Place[] {
        // Simple heuristic for time appropriateness
        // In a real app, this would use tags or opening hours
        // Here we just shuffle/select to simulate variety, as we don't have deep metadata

        // Filter by category if possible (simplified)
        const relevantPlaces = places;

        // Randomize slightly to give different options for different slots if we have enough places
        const shuffled = [...relevantPlaces].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    private generateVotingRecommendation(place: Place, timeSlot: TimeSlot): string {
        return `Great for a ${timeSlot} visit based on its high rating of ${place.rating}`;
    }

    private simulateVotingResolution(votingInterface: VotingInterface): { [day: number]: { [slot: string]: VotingOption } } {
        const votedPlan: { [day: number]: { [slot: string]: VotingOption } } = {};

        for (const [dayStr, timeSlots] of Object.entries(votingInterface.voting_interface)) {
            const day = parseInt(dayStr);
            const dayPlan: { [slot: string]: VotingOption } = {};

            for (const [timeSlot, options] of Object.entries(timeSlots)) {
                if (!options || options.length === 0) continue;

                // Simulate voting: pick the highest rated one
                const winner = options.reduce((prev, current) =>
                    (prev.quality_score > current.quality_score) ? prev : current
                );

                dayPlan[timeSlot] = winner;
            }
            votedPlan[day] = dayPlan;
        }
        return votedPlan;
    }

    private optimizePostVotingRouting(
        votedPlan: { [day: number]: { [slot: string]: VotingOption } },
        userPreferences: UserPreferences
    ): ItineraryItem[] {
        const finalItinerary: ItineraryItem[] = [];
        let currentLocation = userPreferences.start_location;

        for (let day = 1; day <= userPreferences.trip_duration; day++) {
            if (!votedPlan[day]) continue;

            const dayPlan = votedPlan[day];
            const slots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

            // Simple routing: just follow the time slots order
            // In a complex version, we might swap morning/afternoon if geographically better
            // but the prompt emphasizes respecting time slots.

            let currentTime = new Date(userPreferences.trip_dates.start);
            currentTime.setDate(currentTime.getDate() + (day - 1));
            currentTime.setHours(9, 0, 0, 0); // Start day at 9 AM

            for (const slot of slots) {
                if (dayPlan[slot]) {
                    const option = dayPlan[slot];
                    const place = option.place;

                    // Calculate travel time (mock)
                    const travelTime = this.getTravelTime(currentLocation, place);

                    // Arrival time
                    const arrivalTime = new Date(currentTime.getTime() + travelTime * 60000);

                    // Duration (assume 2 hours)
                    const duration = 120;
                    const departureTime = new Date(arrivalTime.getTime() + duration * 60000);

                    finalItinerary.push({
                        id: uuidv4(),
                        placeId: place.id,
                        startTime: arrivalTime.toISOString(),
                        endTime: departureTime.toISOString(),
                        notes: `Voted winner for ${slot}. Travel time: ${travelTime} mins.`,
                        type: 'activity'
                    });

                    currentLocation = { lat: place.lat, lng: place.lng };
                    currentTime = departureTime;
                }
            }
        }

        return finalItinerary;
    }

    private getTravelTime(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
        // Simple distance-based heuristic: 1 unit distance ~ 60 mins
        const dist = Math.sqrt(Math.pow(from.lat - to.lat, 2) + Math.pow(from.lng - to.lng, 2));
        return Math.ceil(dist * 1000) + 15; // Base 15 mins + distance factor
    }
}
