import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';

// DB Connection Helper
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
    { params }: { params: Promise<{ id: string; day: string; slot: string }> }
) {
    try {
        await dbConnect();
        const { id, day, slot } = await params;
        const body = await request.json();
        const place = body.place;

        if (!place) {
            return NextResponse.json({ error: 'Missing place data' }, { status: 400 });
        }

        const dayNum = parseInt(day);
        if (isNaN(dayNum)) {
            return NextResponse.json({ error: 'Invalid day number' }, { status: 400 });
        }

        if (!['morning', 'afternoon', 'evening'].includes(slot)) {
            return NextResponse.json({ error: 'Invalid time slot' }, { status: 400 });
        }

        const trip = await Trip.findById(id);
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Find the correct day
        const dayPlan = trip.days.find((d: any) => d.dayNumber === dayNum);
        if (!dayPlan) {
            return NextResponse.json({ error: 'Day not found' }, { status: 404 });
        }

        // Add place to the slot
        // Check if already exists
        const exists = dayPlan[slot].some((p: any) => p.googlePlaceId === place.id || p.googlePlaceId === place.googlePlaceId);
        if (exists) {
            return NextResponse.json({ error: 'Place already added to this slot' }, { status: 400 });
        }

        dayPlan[slot].push({
            googlePlaceId: place.id || place.googlePlaceId,
            name: place.name,
            address: place.address || place.formatted_address,
            coordinates: place.coordinates || { lat: place.lat, lng: place.lng },
            rating: place.rating,
            reviewCount: place.reviewCount || place.user_ratings_total,
            photoUrl: place.photoUrl || place.image,
            timeSlot: slot,
            dayNumber: dayNum,
            addedAt: new Date()
        });

        // Update status if needed
        if (dayPlan.morning.length > 0 && dayPlan.afternoon.length > 0 && dayPlan.evening.length > 0) {
            dayPlan.status = 'complete';
        } else {
            dayPlan.status = 'partial';
        }

        await trip.save();

        return NextResponse.json({ success: true, trip });

    } catch (error: any) {
        console.error('Error adding place:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
