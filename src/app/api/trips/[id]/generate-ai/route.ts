import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';
import { generateMultiDayItinerary } from '@/lib/geminiService';
import { searchPlaces } from '@/lib/googleMapsService';

// DB Connection Helper (should be in a shared lib/db.ts really)
const MONGODB_URI = process.env.MONGODB_URI;
let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

async function dbConnect() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => mongoose);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        const trip = await Trip.findById(id);
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Generate Itinerary
        const aiItinerary = await generateMultiDayItinerary(
            trip.location,
            trip.totalDays,
            trip.preferences
        );

        if (!aiItinerary || !aiItinerary.days) {
            return NextResponse.json({ error: 'Failed to generate itinerary' }, { status: 500 });
        }

        // Process each day
        // We need to convert the text-based AI suggestions into actual Google Places
        // This is resource intensive, so we limit to top suggestions

        const updatedDays = [...trip.days];

        for (const dayPlan of aiItinerary.days) {
            const dayIndex = dayPlan.day - 1;
            if (dayIndex >= updatedDays.length) continue;

            const currentDay = updatedDays[dayIndex];

            // Helper to search and add
            const resolvePlace = async (name: string, type: string) => {
                const results = await searchPlaces(name, trip.coordinates, 5000, type);
                return results.length > 0 ? results[0] : null;
            };

            // Morning
            if (dayPlan.morning?.place) {
                const place = await resolvePlace(dayPlan.morning.place, 'tourist_attraction');
                if (place) {
                    currentDay.morning.push({
                        ...place,
                        coordinates: { lat: place.lat, lng: place.lng },
                        googlePlaceId: place.id,
                        timeSlot: 'morning',
                        dayNumber: dayPlan.day,
                        addedAt: new Date()
                    } as any);
                }
            }

            // Afternoon
            if (dayPlan.afternoon?.place) {
                const place = await resolvePlace(dayPlan.afternoon.place, 'tourist_attraction');
                if (place) {
                    currentDay.afternoon.push({
                        ...place,
                        coordinates: { lat: place.lat, lng: place.lng },
                        googlePlaceId: place.id,
                        timeSlot: 'afternoon',
                        dayNumber: dayPlan.day,
                        addedAt: new Date()
                    } as any);
                }
            }

            // Evening
            if (dayPlan.evening?.place) {
                const place = await resolvePlace(dayPlan.evening.place, 'tourist_attraction');
                if (place) {
                    currentDay.evening.push({
                        ...place,
                        coordinates: { lat: place.lat, lng: place.lng },
                        googlePlaceId: place.id,
                        timeSlot: 'evening',
                        dayNumber: dayPlan.day,
                        addedAt: new Date()
                    } as any);
                }
            }

            currentDay.status = 'partial'; // Or complete if all slots filled
        }

        trip.days = updatedDays;
        trip.planningMode = 'ai';
        await trip.save();

        return NextResponse.json({ success: true, trip });

    } catch (error: any) {
        console.error('Error generating AI itinerary:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
