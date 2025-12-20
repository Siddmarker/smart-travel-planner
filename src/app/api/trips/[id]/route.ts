import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { generateItinerary } from '@/lib/gemini'; // <--- Imports your new AI Brain

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. SETUP SUPABASE CLIENT
        // Note: If this fails in Vercel, check your Environment Variables or use the hardcoded keys again.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. FETCH TRIP
        let { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select(`*, trip_days (id, day_index, day_date, status, activities (*))`)
            .eq('id', id)
            .single();

        if (error || !trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // 3. AUTO-GENERATE IF EMPTY (The AI Logic) 🧠
        if (!trip.trip_days || trip.trip_days.length === 0) {
            console.log(`Generating AI Itinerary for ${trip.destination}...`);

            const startDate = new Date(trip.start_date);
            const endDate = new Date(trip.end_date);
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // --- A. CREATE DAYS FIRST ---
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
            
            // Insert days and get their IDs back
            const { data: newDays, error: daysError } = await supabaseAdmin
                .from('trip_days')
                .insert(daysToInsert)
                .select();
                
            if (daysError) throw daysError;

            // --- B. CALL GEMINI AI ---
            // This calls your gemini.ts function!
            const aiItinerary = await generateItinerary(trip.destination, diffDays, trip.start_date);

            const activitiesToInsert = [];

            if (aiItinerary && Array.isArray(aiItinerary)) {
                console.log("AI Success! Parsing activities...");
                
                // Loop through our created days (newDays) and match them with AI's day_index
                newDays.forEach((dayRecord) => {
                    const aiDay = aiItinerary.find((d: any) => d.day_index === dayRecord.day_index);
                    
                    if (aiDay && aiDay.activities) {
                        aiDay.activities.forEach((act: any) => {
                            activitiesToInsert.push({
                                day_id: dayRecord.id, // Link to the correct Day ID
                                name: act.name,
                                description: act.description,
                                time_slot: act.time_slot,
                                category: act.category,
                                location: { name: act.location_name }
                            });
                        });
                    }
                });
            } else {
                // FALLBACK: If AI fails or returns bad data, use old "Morning Start" logic
                console.log("AI Failed. Using Fallback Data.");
                for (const day of newDays) {
                    activitiesToInsert.push({
                        day_id: day.id,
                        name: 'Morning Start',
                        description: 'Get ready for the day!',
                        time_slot: 'Morning',
                        category: 'General',
                        location: { name: 'Hotel' }
                    });
                }
            }

            // --- C. INSERT ACTIVITIES ---
            if (activitiesToInsert.length > 0) {
                await supabaseAdmin.from('activities').insert(activitiesToInsert);
            }

            // Refetch the full trip to return to frontend
            const { data: refreshedTrip } = await supabaseAdmin
                .from('trips')
                .select(`*, trip_days (id, day_index, day_date, status, activities (*))`)
                .eq('id', id)
                .single();

            trip = refreshedTrip;
        }

        // 4. FORMAT FOR FRONTEND
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