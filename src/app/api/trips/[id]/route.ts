import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select('*') // We don't even need trip_days from DB since we are mocking it
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
            }
            throw error;
        }

        // --- FORCE DEMO DATA ---
        // We manually create a day so the UI has something to show
        const demoDays = [
            {
                id: 'demo-day-1',
                day_index: 0,
                date: trip.start_date || '2025-12-19', // Use the trip's start date
                status: 'generated',
                activities: [
                    {
                        id: 'demo-act-1',
                        name: 'Morning Coffee at Cubbon Park',
                        description: 'Start the day with a refreshing walk and coffee.',
                        time_slot: 'Morning',
                        location: { name: 'Cubbon Park, Bangalore', lat: 12.97, lng: 77.59 },
                        category: 'Relaxation'
                    },
                    {
                        id: 'demo-act-2',
                        name: 'Bangalore Palace Tour',
                        description: 'Explore the royal grounds and Tudor-style architecture.',
                        time_slot: 'Afternoon',
                        location: { name: 'Bangalore Palace', lat: 12.99, lng: 77.59 },
                        category: 'History'
                    }
                ]
            }
        ];

        const formattedTrip = {
            ...trip,
            categories: trip.categories || [],
            days: demoDays, // <--- DIRECTLY INJECT THE DEMO ARRAY
        };

        return NextResponse.json(formattedTrip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
