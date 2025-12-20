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

        // 1. FETCH TRIP
        let { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select(`
        *,
        trip_days (
          id,
          day_index,
          day_date,
          status,
          activities (
            id,
            name,
            description,
            time_slot,
            location,
            category
          )
        )
      `)
            .eq('id', id)
            .single();

        // --- FIX: HANDLE ERRORS AND NULL TRIP GRACEFULLY ---
        if (error || !trip) {
            console.warn("Trip fetch failed:", error);
            return NextResponse.json({
                error: 'Trip not found',
                debug_db_error: error,  // <--- THIS IS WHAT WE NEED
                debug_tried_id: id,
                debug_message: "If debug_db_error is null, the ID just doesn't exist."
            }, { status: 404 });
        }

        // 2. AUTO-GENERATE IF EMPTY (Now Safe to Run)
        if (!trip.trip_days || trip.trip_days.length === 0) {
            console.log("Trip is empty. Auto-generating days...");

            const startDate = new Date(trip.start_date || '2025-12-19');
            const endDate = new Date(trip.end_date || '2025-12-21');

            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const daysToInsert = [];

            for (let i = 0; i < diffDays; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);

                daysToInsert.push({
                    trip_id: id,
                    day_index: i,
                    day_date: currentDate.toISOString().split('T')[0],
                    status: 'active'
                });
            }

            // Insert Days
            const { data: newDays, error: insertError } = await supabaseAdmin
                .from('trip_days')
                .insert(daysToInsert)
                .select();

            if (insertError) throw insertError;

            // Insert Default Activities
            const activitiesToInsert = [];
            for (const day of newDays) {
                activitiesToInsert.push({
                    day_id: day.id,
                    name: 'Morning Start',
                    description: 'Get ready for the day!',
                    time_slot: 'Morning',
                    category: 'General',
                    location: { name: 'Hotel' }
                });
                activitiesToInsert.push({
                    day_id: day.id,
                    name: 'Evening Relaxation',
                    description: 'Wind down and enjoy dinner.',
                    time_slot: 'Evening',
                    category: 'Food',
                    location: { name: 'City Center' }
                });
            }

            await supabaseAdmin.from('activities').insert(activitiesToInsert);

            // Refetch
            const { data: refreshedTrip } = await supabaseAdmin
                .from('trips')
                .select(`
          *,
          trip_days (
            id,
            day_index,
            day_date,
            status,
            activities (*)
          )
        `)
                .eq('id', id)
                .single();

            trip = refreshedTrip;
        }

        // 3. FORMAT FOR FRONTEND
        const formattedTrip = {
            ...trip,
            categories: trip.categories || [],
            days: (trip.trip_days || [])
                .map((day: any) => ({
                    ...day,
                    date: day.day_date,
                    activities: day.activities || [],
                }))
                .sort((a: any, b: any) => a.day_index - b.day_index),
        };

        return NextResponse.json(formattedTrip);

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}