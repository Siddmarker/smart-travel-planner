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
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
        }

        const trip = await Trip.findById(id);
        if (!trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // Check if admin
        if (trip.adminId !== userId) {
            return NextResponse.json({ error: 'Only admin can finalize trip' }, { status: 403 });
        }

        // Finalize logic: Select top voted place for each slot
        trip.days.forEach((day: any) => {
            ['morning', 'afternoon', 'evening'].forEach(slot => {
                const places = day[slot];
                if (places.length > 0) {
                    // Sort by net votes (up - down)
                    places.sort((a: any, b: any) => {
                        const scoreA = (a.votes?.up?.length || 0) - (a.votes?.down?.length || 0);
                        const scoreB = (b.votes?.up?.length || 0) - (b.votes?.down?.length || 0);
                        return scoreB - scoreA;
                    });

                    // Set winner
                    const winner = places[0];
                    // We might want to store this in a separate 'final' field or just mark it
                    if (slot === 'morning') day.finalMorning = winner;
                    if (slot === 'afternoon') day.finalAfternoon = winner;
                    if (slot === 'evening') day.finalEvening = winner;
                }
            });
            day.status = 'complete';
        });

        trip.votingStatus = 'finalized';
        await trip.save();

        return NextResponse.json({ success: true, trip });

    } catch (error: any) {
        console.error('Error finalizing trip:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
