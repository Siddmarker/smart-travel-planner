'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Trip, DayPlan, Place } from '@/types';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface TripContextType {
    currentTrip: Trip | null;
    loading: boolean;
    error: string | null;
    createTrip: (data: any) => Promise<Trip | null>;
    fetchTrip: (id: string) => Promise<void>;
    addPlaceToSlot: (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', place: Place) => Promise<void>;
    generateAIItinerary: () => Promise<void>;
    updateTripState: (trip: Trip) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: React.ReactNode }) {
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const updateTripState = useCallback((trip: Trip) => {
        setCurrentTrip(trip);
        // Also update in local storage to persist changes
        const existingTripsJson = localStorage.getItem('trips');
        if (existingTripsJson) {
            const trips = JSON.parse(existingTripsJson);
            const updatedTrips = trips.map((t: Trip) =>
                (t.id === trip.id || t._id === trip.id || t.id === trip._id) ? trip : t
            );
            localStorage.setItem('trips', JSON.stringify(updatedTrips));
        }
    }, []);

    const createTrip = useCallback(async (data: any) => {
        setLoading(true);
        setError(null);
        console.log('TripContext (Local): createTrip called with data:', data);

        try {
            // Simulate network delay for realism
            await new Promise(resolve => setTimeout(resolve, 500));

            const newTripId = uuidv4();
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const days = [];
            for (let i = 1; i <= totalDays; i++) {
                days.push({
                    dayNumber: i,
                    planningMode: data.planningMode || 'manual',
                    status: 'empty',
                    morning: [],
                    afternoon: [],
                    evening: []
                });
            }

            const newTrip: Trip = {
                id: newTripId,
                _id: newTripId, // Backwards compatibility for components checking _id
                name: data.name,
                description: data.description || '',
                startDate: data.startDate,
                endDate: data.endDate,
                totalDays,
                location: data.destination.name,
                coordinates: {
                    lat: data.destination.lat,
                    lng: data.destination.lng
                },
                preferences: data.preferences || {},
                includeDining: data.includeDining || false,
                adminId: data.adminId, // Keep this for now, even if local
                participants: [{
                    userId: data.adminId,
                    name: data.adminName || 'Admin',
                    role: 'admin',
                    joinedAt: new Date()
                }],
                days,
                planningMode: data.planningMode || 'manual',
                votingStatus: 'not_started',
                categoryPreferences: data.categoryPreferences,
            } as any; // Cast to any to avoid strict type checks on mismatching optional fields if any

            // Save to LocalStorage
            const existingTripsJson = localStorage.getItem('trips');
            const trips = existingTripsJson ? JSON.parse(existingTripsJson) : [];
            trips.push(newTrip);
            localStorage.setItem('trips', JSON.stringify(trips));

            console.log('TripContext (Local): Trip created:', newTrip);
            setCurrentTrip(newTrip);
            return newTrip;

        } catch (err: any) {
            console.error('TripContext (Local): createTrip error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTrip = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            console.log('TripContext (Local): Fetching trip', id);
            await new Promise(resolve => setTimeout(resolve, 300));

            const existingTripsJson = localStorage.getItem('trips');
            if (!existingTripsJson) {
                throw new Error('No trips found');
            }

            const trips = JSON.parse(existingTripsJson);
            const trip = trips.find((t: Trip) => t.id === id || t._id === id);

            if (!trip) {
                throw new Error('Trip not found');
            }

            setCurrentTrip(trip);
        } catch (err: any) {
            console.error('TripContext (Local): fetchTrip error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPlaceToSlot = useCallback(async (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', place: Place) => {
        if (!currentTrip) return;

        console.log('TripContext (Local): Adding place', place.name, 'to day', dayNumber, slot);

        // Update local state
        const updatedTrip = { ...currentTrip };
        const day = updatedTrip.days.find((d: any) => d.dayNumber === dayNumber);
        if (day) {
            // Check if exists to avoid duplicates
            if (!day[slot].some((p: any) => p.id === place.id)) {
                day[slot] = [...day[slot], { ...place, timeSlot: slot, dayNumber }];
                setCurrentTrip(updatedTrip); // Update state immediately

                // Persist to LocalStorage
                updateTripState(updatedTrip);
            }
        }
    }, [currentTrip, updateTripState]);

    const generateAIItinerary = useCallback(async () => {
        // AI generation usually requires a backend. 
        // For this "offline" mode, we'll mark this as not available or mock it.
        // If we want to keep it working, we'd need to call the Gemini API directly from client, 
        // but that exposes keys. 
        // For now, let's warn the user.
        setError("AI Itinerary generation requires backend connection (currently disabled in offline mode).");
    }, []);

    return (
        <TripContext.Provider value={{
            currentTrip,
            loading,
            error,
            createTrip,
            fetchTrip,
            addPlaceToSlot,
            generateAIItinerary,
            updateTripState
        }}>
            {children}
        </TripContext.Provider>
    );
}

export function useTrip() {
    const context = useContext(TripContext);
    if (context === undefined) {
        throw new Error('useTrip must be used within a TripProvider');
    }
    return context;
}
