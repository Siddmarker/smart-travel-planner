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
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
            }
            throw error;
        }

        // 3. TRANSFORM & INJECT DUMMY DATA
        const formattedTrip = {
            ...trip,
            categories: trip.categories || [],
            days: (trip.trip_days || [])
                .map((day: any) => ({
                    ...day,
                    date: day.day_date,
                    // DEMO MODE: Inject fake activities to test the UI
                    activities: [
                        {
                            id: 'demo-1',
                            name: 'Morning Coffee at Cubbon Park',
                            description: 'Start the day with a refreshing walk and coffee.',
                            time_slot: 'Morning',
                            location: { name: 'Cubbon Park, Bangalore' },
                            category: 'Relaxation'
                        },
                        {
                            id: 'demo-2',
                            name: 'Visit Bangalore Palace',
                            description: 'Explore the historic architecture and gardens.',
                            time_slot: 'Afternoon',
                            location: { name: 'Bangalore Palace' },
                            category: 'History'
                        }
                    ],
                }))
                .sort((a: any, b: any) => a.day_index - b.day_index),
        };

        return NextResponse.json(formattedTrip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
