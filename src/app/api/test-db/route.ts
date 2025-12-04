import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export async function GET() {
    try {
        if (!MONGODB_URI) {
            return NextResponse.json({ success: false, error: 'MONGODB_URI is not defined' }, { status: 500 });
        }

        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(MONGODB_URI);
        }

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

        return NextResponse.json({
            success: true,
            message: 'Database connected',
            state: stateMap[dbState] || dbState,
            collections: collectionNames.map(c => c.name),
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
