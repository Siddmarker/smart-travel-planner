import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: true, // Enable buffering for serverless stability
        };

        // Sanitize URI: Remove appName if empty or if it contains placeholders causing issues
        let validUri = MONGODB_URI!;
        try {
            const uri = new URL(MONGODB_URI!);
            const appName = uri.searchParams.get('appName');
            if (appName === '' || appName === null || appName === undefined) {
                console.log('Sanitizing MONGODB_URI: Removing empty appName');
                uri.searchParams.delete('appName');
                validUri = uri.toString();
            }
        } catch (error) {
            console.error('Error validating MONGODB_URI format:', error);
            // Fallback to original if parsing fails
        }

        cached.promise = mongoose.connect(validUri, opts).then((mongoose) => {
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
