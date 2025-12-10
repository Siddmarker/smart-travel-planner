import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';
import { geminiAI } from '@/lib/gemini';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const trip = await Trip.findById(id).select('itinerary');
        if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        return NextResponse.json({ success: true, itinerary: trip.itinerary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Generate Itinerary
    try {
        const { id } = await params;
        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const trip = await Trip.findById(id);
        if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        const itinerary = await geminiAI.generateItinerary(trip.destination, trip.dates, trip.preferences);

        // Update trip
        trip.itinerary = {
            ...trip.itinerary,
            source: 'ai',
            generatedAt: new Date(),
            days: itinerary.days || []
        };
        await trip.save();

        return NextResponse.json({ success: true, itinerary: trip.itinerary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Update Itinerary manually
    try {
        const body = await req.json();
        const { id } = await params;
        if (!mongoose.connection.readyState) await mongoose.connect(process.env.MONGODB_URI!);

        const trip = await Trip.findByIdAndUpdate(
            id,
            { 'itinerary': body.itinerary },
            { new: true }
        );
        return NextResponse.json({ success: true, itinerary: trip?.itinerary });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
