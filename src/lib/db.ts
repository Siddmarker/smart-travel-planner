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
        if (cached.conn.connection.readyState === 1) {
            console.log('dbConnect: Using cached and active connection');
            return cached.conn;
        } else {
            console.log('dbConnect: Cached connection exists but is not ready (state: ' + cached.conn.connection.readyState + '). Reconnecting...');
            cached.promise = null; // Reset promise to force new connection
            // We don't nullify cached.conn yet, will be overwritten
        }
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
            }

            // Ensure database name is set
            if (uri.pathname === '/' || uri.pathname === '') {
                console.log('Sanitizing MONGODB_URI: Setting default database to "smart-travel"');
                uri.pathname = '/smart-travel';
            }

            validUri = uri.toString();

            // Log masked URI for debugging
            const maskedUri = validUri.replace(/:([^:@]+)@/, ':****@');
            console.log('dbConnect: Creating new connection with URI:', maskedUri);

        } catch (error) {
            console.error('Error validating MONGODB_URI format:', error);
            // Fallback to original if parsing fails
        }

        cached.promise = mongoose.connect(validUri, opts).then((mongoose) => {
            console.log('dbConnect: Connection established successfully');
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error('dbConnect: Connection promise failed:', e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
