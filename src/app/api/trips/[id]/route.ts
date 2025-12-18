import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Check the folder name (e.g. src/app/api/trips/[id] -> params.id)
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const tripId = params.id;

        if (!tripId) {
            return NextResponse.json({ error: 'Trip ID missing' }, { status: 400 });
        }

        // 1. ADMIN CLIENT: Bypass RLS to read the trip
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. FETCH THE TRIP
        // We select the trip and join related tables (days, activities) if needed
        const { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select('*, trip_days(*), activities(*)')
            .eq('id', tripId)
            .single();

        if (error) {
            console.error("Fetch Error:", error);
            // If not found, return 404
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(trip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
