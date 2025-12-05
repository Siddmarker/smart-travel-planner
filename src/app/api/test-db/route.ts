import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import dbConnect from '@/lib/db';

const MONGODB_URI = process.env.MONGODB_URI;

export async function GET() {
    try {
        if (!MONGODB_URI) {
            return NextResponse.json({ success: false, error: 'MONGODB_URI is not defined' }, { status: 500 });
        }

        await dbConnect();

        const dbState = mongoose.connection.readyState;
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
            99: 'uninitialized',
        };

        if (!mongoose.connection.db) {
            return NextResponse.json({ success: false, error: 'Database connection established but db object is undefined' }, { status: 500 });
        }

        const collectionNames = await mongoose.connection.db.listCollections().toArray();

        // Safe env check (keys only)
        const envKeys = Object.keys(process.env).filter(key =>
            !key.toLowerCase().includes('secret') &&
            !key.toLowerCase().includes('key') &&
            !key.toLowerCase().includes('token') ||
            key.startsWith('NEXT_PUBLIC_')
        );

        const criticalEnvVars = {
            MONGODB_URI: !!process.env.MONGODB_URI,
            GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || !!process.env.GOOGLE_MAPS_API_KEY,
            GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        };

        return NextResponse.json({
            success: true,
            message: 'Database connected',
            state: stateMap[dbState] || dbState,
            collections: collectionNames.map(c => c.name),
            envCheck: criticalEnvVars,
            availableEnvKeys: envKeys
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
