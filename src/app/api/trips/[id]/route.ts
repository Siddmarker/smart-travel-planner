import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';
import User from '@/models/User'; // Ensure User is registered to prevent Schema errors in population
import dbConnect from '@/lib/db';


export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();

        // Populate participants with user details
        const trip = await Trip.findById(id).populate('participants.userId', 'name email avatar');

        if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

        return NextResponse.json({ success: true, trip });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id } = await params;
        await dbConnect();

        const trip = await Trip.findByIdAndUpdate(id, body, { new: true, runValidators: true });

        return NextResponse.json({ success: true, trip });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await dbConnect();

        await Trip.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: 'Trip deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
