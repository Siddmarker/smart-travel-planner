import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';
import { generateMultiDayItinerary } from '@/lib/geminiService';
import { SmartPlaceService } from '@/lib/smart-place-service';

import dbConnect from '@/lib/db';

// Ensure DB connection
// Removed local dbConnect implementation in favor of shared utility

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.destination || !body.startDate || !body.endDate || !body.adminId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const startDate = new Date(body.startDate);
        const endDate = new Date(body.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        // Initialize empty days
        const days = [];
        for (let i = 1; i <= totalDays; i++) {
            days.push({
                dayNumber: i,
                planningMode: body.planningMode || 'manual',
                status: 'empty',
                morning: [],
                afternoon: [],
                evening: []
            });
        }

        // Create Trip
        const newTrip = new Trip({
            name: body.name,
            description: body.description,
            startDate,
            endDate,
            totalDays,
            location: body.destination.name,
            coordinates: {
                lat: body.destination.lat,
                lng: body.destination.lng
            },
            preferences: body.preferences || {},
            includeDining: body.includeDining || false,
            adminId: body.adminId,
            participants: [{
                userId: body.adminId,
                name: body.adminName || 'Admin', // Should be fetched from user profile ideally
                role: 'admin',
                joinedAt: new Date()
            }],
            itinerary: {
                source: body.planningMode === 'ai' ? 'ai' : 'manual',
                days: days,
                generatedAt: new Date()
            },
            planningMode: body.planningMode || 'manual',
            votingStatus: 'not_started',
            categoryPreferences: body.categoryPreferences,
        });

        // If AI mode, generate itinerary
        if (body.planningMode === 'ai') {
            try {
                const aiItinerary = await generateMultiDayItinerary(
                    body.destination.name,
                    totalDays,
                    body.preferences
                );

                if (aiItinerary && aiItinerary.days) {
                    // Map AI results to our structure
                    // Note: This is a simplified mapping. Real implementation needs to search for Place IDs based on names provided by AI
                    // For now, we'll store the text descriptions as placeholders or try to find them

                    // Since we can't easily get Place IDs synchronously without many API calls, 
                    // we might just store the "theme" and let the frontend or a background job fetch details.
                    // OR, we iterate and try to fetch.

                    // For this MVP, we will just save the trip and let the user trigger "Generate" explicitly or handle it here if fast enough.
                    // Given 3-5 days, it might be slow. Let's stick to creating the trip first.
                }
            } catch (error) {
                console.error('AI Generation failed during create:', error);
                // Continue creating trip, just without AI data
            }
        }

        await newTrip.save();

        return NextResponse.json({ success: true, trip: newTrip }, { status: 201 });

    } catch (error: any) {
        console.error('CRITICAL ERROR creating trip:', error);
        console.error('Stack trace:', error.stack);

        // Check for common issues
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is missing!');
        }

        return NextResponse.json(
            {
                error: 'Failed to create trip',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}
