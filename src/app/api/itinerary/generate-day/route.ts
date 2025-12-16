
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateDayItinerary } from '@/lib/trip-generation';

// Helper types if needed (can be imported from types/database)
import { Trip, TripDay } from '@/types/database';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { trip_id, day_index } = body;

        if (!trip_id || day_index === undefined) {
            return NextResponse.json({ error: 'Missing trip_id or day_index' }, { status: 400 });
        }

        // 1. Fetch Trip Details (for preferences and location)
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip_id)
            .single();

        if (tripError || !trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // 2. Fetch or Create Day
        // We need to know the start location for THIS day.
        // If Day 1: User's chosen destination/hotel.
        // If Day 2+: Could be same hotel or last night's end point.
        // For simplicity V1: Always start at 'City Center' or Trip Destination.

        // Check if day exists
        let { data: day, error: dayError } = await supabase
            .from('trip_days')
            .select('*')
            .eq('trip_id', trip_id)
            .eq('day_index', day_index)
            .single();

        if (!day) {
            // Create Day Record
            // Calc date
            const date = new Date(trip.start_date);
            date.setDate(date.getDate() + (day_index - 1));

            const { data: newDay, error: createError } = await supabase
                .from('trip_days')
                .insert({
                    trip_id,
                    day_index,
                    day_date: date.toISOString().split('T')[0],
                    status: 'PENDING'
                })
                .select()
                .single();

            if (createError) throw createError;
            day = newDay;
        }

        // 3. GENERATE ITINERARY (Cluster Logic)
        // We assume 'destination' is the start location constraint for now.
        const activities = await generateDayItinerary(
            day_index,
            trip.destination,
            null, // coords
            {
                budget: trip.budget_tier || 'Medium',
                categories: trip.categories || []
            }
        );

        // 4. Save Candidates to Supabase
        // We map 'activities' to 'place_candidates'
        const candidatesToInsert = activities.map(act => ({
            day_id: day.id,
            time_slot: act.time_slot,
            google_place_id: act.google_place_id,
            name: act.place_name,
            location: act.location,
            rating: act.rating,
            gemini_vibe_check: act.reasoning
            // is_jain_friendly, is_offroad_suitable defaults/logic?
        }));

        if (candidatesToInsert.length > 0) {
            const { error: insertError } = await supabase
                .from('place_candidates')
                .insert(candidatesToInsert);

            if (insertError) {
                console.error('Candidate Insert Error:', insertError);
                // We might continue and return JSON anyway, but warn
            }
        }

        return NextResponse.json({
            success: true,
            day_id: day.id,
            activities
        });

    } catch (error: any) {
        console.error('Generate Day Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
