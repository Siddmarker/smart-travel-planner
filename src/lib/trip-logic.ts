
import Trip, { ITripDocument } from '@/models/Trip';
import Day, { IDayDocument } from '@/models/Day';
import { TripState, DayState } from '@/types';
import mongoose from 'mongoose';

/**
 * Service to handle Trip and Day state transitions ("Rolling State Machine").
 */
export class TripLogicService {

    /**
     * Starts a trip: DRAFT -> ACTIVE
     * Locks Day 1 if it is ready, or sets it to VOTING.
     * Day 2+ remain PENDING.
     */
    /**
     * Starts a trip: DRAFT -> ACTIVE
     * Locks Day 1 if it is ready, or sets it to VOTING.
     * Day 2+ remain PENDING.
     */
    static async startTrip(tripId: string): Promise<ITripDocument | null> {
        const trip = await Trip.findById(tripId).populate('days');
        if (!trip) return null;

        if (trip.tripState !== 'DRAFT') {
            throw new Error(`Cannot start trip in state ${trip.tripState}`);
        }

        trip.tripState = 'ACTIVE';
        await trip.save();

        // Check if days exist, if not create them
        let days = await Day.find({ tripId: trip._id }).sort({ dayIndex: 1 });
        if (days.length === 0) {
            // Create days based on trip duration
            const start = new Date(trip.dates.start);
            const end = new Date(trip.dates.end);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            for (let i = 0; i < diffDays; i++) {
                const date = new Date(start);
                date.setDate(date.getDate() + i);

                await Day.create({
                    tripId: trip._id,
                    dayIndex: i + 1,
                    date: date.toISOString(),
                    status: 'PENDING',
                    votingPool: { morning: [], afternoon: [], evening: [] }
                });
            }
            days = await Day.find({ tripId: trip._id }).sort({ dayIndex: 1 });
        }

        // Activate Day 1
        if (days.length > 0) {
            const day1 = days[0];
            if (day1.status === 'PENDING') {
                // Generate Candidates for Day 1
                await this.generateDayCandidates(day1, trip);

                day1.status = 'VOTING';
                await day1.save();
            }
        }

        return trip;
    }

    /**
     * Generates candidates for a day using Sequential Cluster Algorithm
     */
    static async generateDayCandidates(day: IDayDocument, trip: ITripDocument) {
        const { searchNearbyPlaces, calculateCentroid } = require('./googleMapsService');
        const { getPlaceVibeCheck } = require('./geminiService');

        const startNode = trip.destination.location; // Default to trip destination center

        // 1. Morning Cluster
        // TODO: Map trip.categories to Google API types. For now using generic checks.
        const morningPlaces = await searchNearbyPlaces(startNode, 5000, 'tourist_attraction'); // Simplified
        const morningCandidates = await Promise.all(morningPlaces.slice(0, 5).map(async (p: any) => {
            const vibe = await getPlaceVibeCheck(p.name, trip.destination.name);
            return {
                ...p,
                googlePlaceId: p.id, // Mapping local ID to googlePlaceId for consistency
                clusterSlot: 'morning',
                parentClusterId: null,
                aiVibeCheck: vibe || { summary: "No vibe check", tags: [], isTouristTrap: false },
                votes: []
            };
        }));

        day.votingPool.morning = morningCandidates;

        // 2. Afternoon Cluster (Centroid of Morning)
        const morningCentroid = calculateCentroid(morningCandidates.map((c: any) => c.location || { lat: c.lat, lng: c.lng }));
        const afternoonPlaces = await searchNearbyPlaces(morningCentroid, 5000, 'restaurant'); // Lunch/Afternoon
        const afternoonCandidates = await Promise.all(afternoonPlaces.slice(0, 5).map(async (p: any) => {
            const vibe = await getPlaceVibeCheck(p.name, trip.destination.name);
            return {
                ...p,
                googlePlaceId: p.id,
                clusterSlot: 'afternoon',
                parentClusterId: 'morning_centroid', // Simplified ID
                aiVibeCheck: vibe || { summary: "No vibe check", tags: [], isTouristTrap: false },
                votes: []
            };
        }));

        day.votingPool.afternoon = afternoonCandidates;

        // 3. Evening Cluster (Centroid of Afternoon)
        const afternoonCentroid = calculateCentroid(afternoonCandidates.map((c: any) => c.location || { lat: c.lat, lng: c.lng }));
        const eveningPlaces = await searchNearbyPlaces(afternoonCentroid, 5000, 'night_club'); // Dinner/Evening
        const eveningCandidates = await Promise.all(eveningPlaces.slice(0, 5).map(async (p: any) => {
            const vibe = await getPlaceVibeCheck(p.name, trip.destination.name);
            return {
                ...p,
                googlePlaceId: p.id,
                clusterSlot: 'evening',
                parentClusterId: 'afternoon_centroid',
                aiVibeCheck: vibe || { summary: "No vibe check", tags: [], isTouristTrap: false },
                votes: []
            };
        }));

        day.votingPool.evening = eveningCandidates;

        await day.save();
    }

    /**
     * Finalizes a Day: VOTING -> LOCKED
     * Selects winners for clusters and generates optimized route.
     */
    static async finalizeDay(dayId: string): Promise<IDayDocument | null> {
        const day = await Day.findById(dayId);
        if (!day) return null;

        if (day.status !== 'VOTING') {
            throw new Error(`Cannot finalize day in state ${day.status}`);
        }

        // Logic to select winners based on votes
        // New structure: votingPool.morning = [PlaceCandidate]

        day.finalRoute = { stops: [], transport: [] }; // Initialize finalRoute

        const periods: ('morning' | 'afternoon' | 'evening')[] = ['morning', 'afternoon', 'evening'];

        periods.forEach((period) => {
            const candidates = day.votingPool?.[period];
            if (candidates && candidates.length > 0) {
                // Find candidate with most 'up' votes
                // Using simple sort since votes is now { userId, vote }[]
                const winner = candidates.reduce((prev, current) => {
                    const prevVotes = prev.votes ? prev.votes.filter((v: any) => v.vote === 'up').length : 0;
                    const currVotes = current.votes ? current.votes.filter((v: any) => v.vote === 'up').length : 0;
                    return (prevVotes > currVotes) ? prev : current;
                });

                if (winner) {
                    day.finalRoute!.stops.push(winner);
                }
            }
        });

        // Basic mocking of transport for now as we don't have the routing solver yet
        // In real app, we would call Google Routes API here to connect stops
        if (day.finalRoute.stops.length > 1) {
            for (let i = 0; i < day.finalRoute.stops.length - 1; i++) {
                day.finalRoute.transport.push({
                    mode: 'driving',
                    duration: '15 mins', // Mock
                    polyline: 'EncodedPolylineString' // Mock
                });
            }
        }

        day.status = 'LOCKED';
        await day.save();

        return day;
    }

    /**
     * Moves a day to LIVE (Current Day)
     */
    static async setDayLive(dayId: string): Promise<IDayDocument | null> {
        const day = await Day.findById(dayId);
        if (!day) return null;

        day.status = 'LIVE';
        await day.save();
        return day;
    }
}
