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

export async function POST(request: Request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { code, userId, name } = body;

        if (!code || !userId || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find trip by join code
        const trip = await Trip.findOne({ joinCode: code });

        if (!trip) {
            return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
        }

        // Check if already joined
        const isParticipant = trip.participants.some((p: any) => p.userId === userId);
        if (isParticipant) {
            return NextResponse.json({ success: true, tripId: trip._id, message: 'Already joined' });
        }

        // Add participant
        trip.participants.push({
            userId,
            name,
            role: 'member',
            joinedAt: new Date()
        });

        await trip.save();

        return NextResponse.json({ success: true, tripId: trip._id });

    } catch (error: any) {
        console.error('Error joining trip:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
