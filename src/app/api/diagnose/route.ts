import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
    const checks: any = {
        timestamp: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            MONGODB_URI_DEFINED: !!process.env.MONGODB_URI,
        },
        db: {
            status: 'unknown',
            message: ''
        }
    };

    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        // Check connection state
        const state = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        checks.db.connectionState = states[state] || state;

        // Attempt fresh connection if not connected
        if (state !== 1) { // 1 = connected
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 5000
            });
        }

        // Perform a lightweight operation (ping)
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            checks.db.status = 'connected';
            checks.db.message = 'Successfully pinged database';
        } else {
            checks.db.status = 'error';
            checks.db.message = 'Connected but database object is missing';
        }

    } catch (error: any) {
        checks.db.status = 'error';
        checks.db.message = error.message;
        checks.db.stack = error.stack;
    }

    return NextResponse.json(checks, { status: checks.db.status === 'connected' ? 200 : 500 });
}
