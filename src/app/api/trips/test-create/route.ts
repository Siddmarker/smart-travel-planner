import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Trip from '@/models/Trip';

import dbConnect from '@/lib/db';

const MONGODB_URI = process.env.MONGODB_URI;

export async function POST(request: Request) {
    try {
        await dbConnect();

        const body = await request.json();
        console.log('=== TEST CREATE TRIP ===');
        console.log('Body:', body);

        // Minimal test trip
        const testTrip = new Trip({
            name: body.name || 'Test Trip',
            description: 'Test from debug endpoint',
            destination: {
                mainLocation: {
                    address: 'Test Location',
                    coordinates: { lat: 0, lng: 0 }
                }
            },
            dates: {
                start: new Date(),
                end: new Date(Date.now() + 86400000), // Tomorrow
                totalDays: 2
            },
            participants: [{
                userId: body.adminId || 'test-admin-id',
                name: body.adminName || 'Test Admin',
                role: 'admin',
                joinedAt: new Date()
            }],
            itinerary: {
                source: 'manual',
                days: []
            },
            preferences: {
                groupType: 'friends'
            },
            metadata: {
                createdBy: body.adminId || 'test-admin-id'
            }
        });

        await testTrip.save();

        return NextResponse.json({
            success: true,
            message: 'Test trip created',
            tripId: testTrip._id,
            testData: testTrip
        });

    } catch (error: any) {
        console.error('Test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            validationErrors: error.errors
        }, { status: 500 });
    }
}
