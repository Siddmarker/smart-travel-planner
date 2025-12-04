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
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await request.json();
        const { userId, dayNumber, slot, placeId, voteType } = body; // voteType: 'up' | 'down'

        if (!userId || !dayNumber || !slot || !placeId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const trip = await Trip.findById(id);
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        const dayPlan = trip.days.find((d: any) => d.dayNumber === dayNumber);
        if (!dayPlan) {
            return NextResponse.json({ error: 'Day not found' }, { status: 404 });
        }

        // Find the place in the slot
        const place = dayPlan[slot].find((p: any) => p.googlePlaceId === placeId || p.id === placeId);
        if (!place) {
            return NextResponse.json({ error: 'Place not found in slot' }, { status: 404 });
        }

        // Initialize votes if missing
        if (!place.votes) {
            place.votes = { up: [], down: [] };
        }

        // Remove existing vote
        place.votes.up = place.votes.up.filter((uid: string) => uid !== userId);
        place.votes.down = place.votes.down.filter((uid: string) => uid !== userId);

        // Add new vote
        if (voteType === 'up') {
            place.votes.up.push(userId);
        } else if (voteType === 'down') {
            place.votes.down.push(userId);
        }

        await trip.save();

        return NextResponse.json({ success: true, trip });

    } catch (error: any) {
        console.error('Error voting:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
