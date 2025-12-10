'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Trip, DayPlan, Place } from '@/types';
import { useRouter } from 'next/navigation';

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

    const fetchTrip = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/trips/${id}`);
            if (!res.ok) {
                if (res.status === 404) throw new Error('Trip not found');
                throw new Error('Failed to fetch trip');
            }
            const data = await res.json();
            setCurrentTrip(data.trip);
        } catch (err: any) {
            console.error('TripContext: fetchTrip error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTrip = useCallback(async (data: any) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const responseData = await res.json();

            if (!res.ok) throw new Error(responseData.error || 'Failed to create trip');

            const newTrip = responseData.trip;
            setCurrentTrip(newTrip);
            return newTrip;
        } catch (err: any) {
            console.error('TripContext: createTrip error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addPlaceToSlot = useCallback(async (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', place: Place) => {
        if (!currentTrip) return;

        // Optimistic update
        const updatedTrip = { ...currentTrip };
        if (!updatedTrip.itinerary || !updatedTrip.itinerary.days) return;

        const day = updatedTrip.itinerary.days.find((d: any) => d.dayNumber === dayNumber);
        if (day) {
            if (!day[slot].some((p: any) => p.id === place.id)) {
                day[slot] = [...day[slot], { ...place, timeSlot: slot, dayNumber }];
                setCurrentTrip(updatedTrip);

                try {
                    // Start background update
                    // Since we don't have granular API, we update the whole itinerary
                    await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/itinerary`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ itinerary: updatedTrip.itinerary })
                    });
                } catch (err) {
                    console.error('Failed to sync addPlace:', err);
                    // Revert? For now just log.
                }
            }
        }
    }, [currentTrip]);

    const generateAIItinerary = useCallback(async () => {
        if (!currentTrip) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/itinerary`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                // Refresh trip
                await fetchTrip(currentTrip.id || currentTrip._id!);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentTrip, fetchTrip]);

    const updateTripState = useCallback((trip: Trip) => {
        setCurrentTrip(trip);
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
