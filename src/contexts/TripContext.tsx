'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
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

    const updateTripState = useCallback((trip: Trip) => {
        setCurrentTrip(trip);
    }, []);

    const createTrip = useCallback(async (data: any) => {
        setLoading(true);
        setError(null);
        console.log('TripContext: createTrip called with data:', data);
        try {
            const response = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            console.log('TripContext: API response status:', response.status);
            const result = await response.json();
            console.log('TripContext: API response result:', result);

            if (!response.ok) {
                console.error('TripContext: API error:', result.error);
                // Include details if available to help debug production issues
                const errorMessage = result.details
                    ? `${result.error}: ${result.details}`
                    : (result.error || 'Failed to create trip');
                throw new Error(errorMessage);
            }

            setCurrentTrip(result.trip);
            return result.trip;
        } catch (err: any) {
            console.error('TripContext: createTrip error:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTrip = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            // We need a GET endpoint for fetching a single trip. 
            // Assuming /api/trips/[id] exists or we use a server action.
            // For now, let's assume we implement GET /api/trips/[id]
            const response = await fetch(`/api/trips/${id}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch trip');
            }

            setCurrentTrip(result.trip);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPlaceToSlot = useCallback(async (dayNumber: number, slot: 'morning' | 'afternoon' | 'evening', place: Place) => {
        if (!currentTrip) return;

        // Optimistic update
        const updatedTrip = { ...currentTrip };
        const day = updatedTrip.days.find(d => d.dayNumber === dayNumber);
        if (day) {
            // Check if exists to avoid duplicates in UI immediately
            if (!day[slot].some(p => p.id === place.id)) {
                day[slot] = [...day[slot], { ...place, timeSlot: slot, dayNumber }];
                setCurrentTrip(updatedTrip);
            }
        }

        try {
            const response = await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/days/${dayNumber}/${slot}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ place }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to add place');
            }

            // Update with server state to ensure consistency
            setCurrentTrip(result.trip);
        } catch (err: any) {
            setError(err.message);
            // Revert optimistic update if needed, or just let the error show
            // For now, fetching fresh state might be safer
            if (currentTrip.id || currentTrip._id) fetchTrip(currentTrip.id || currentTrip._id!);
        }
    }, [currentTrip, fetchTrip]);

    const generateAIItinerary = useCallback(async () => {
        if (!currentTrip) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/trips/${currentTrip.id || currentTrip._id}/generate-ai`, {
                method: 'POST'
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            setCurrentTrip(result.trip);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentTrip]);

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
