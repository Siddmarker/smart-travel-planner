import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. ADMIN CLIENT
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. FETCH TRIP + DAYS
        const { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select(`
        *,
        trip_days (
          id,
          day_index,
          day_date,
          status
        )
      `)
            .eq('id', id)
            .single();

        if (error) {
            console.error("Fetch Error:", error);
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
            }
            throw error;
        }

        // 3. TRANSFORM & SANITIZE (The Fix)
        // We force null fields to be empty arrays [] to prevent frontend crashes.
        const formattedTrip = {
            ...trip,
            categories: trip.categories || [], // <--- FIX: Never let this be null
            days: (trip.trip_days || [])
                .map((day: any) => ({
                    ...day,
                    date: day.day_date,            // Rename for Frontend
                    activities: [],                // Force empty activities list
                }))
                .sort((a: any, b: any) => a.day_index - b.day_index),
        };

        return NextResponse.json(formattedTrip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
