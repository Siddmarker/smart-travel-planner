
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { searchPlaces } from '@/lib/googleMapsService';
import { geminiAI } from '@/lib/gemini';
import { calculateEmpathyScore } from '@/lib/empathy-scorer';
import { Place } from '@/types';

// Helper to calculate distance (Haversine)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { trip_id, day_index } = body;

        if (!trip_id || day_index === undefined) {
            return NextResponse.json({ error: 'Missing trip_id or day_index' }, { status: 400 });
        }

        // 1. Fetch Trip Details
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', trip_id)
            .single();

        if (tripError || !trip) {
            return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
        }

        // 2. Determine Anchor Point (Rolling State)
        let anchorName = trip.destination.name;
        let anchorCoords = { lat: trip.destination.location.lat, lng: trip.destination.location.lng };

        if (day_index > 0) { // Assuming day_index 0 is DAY 1. If day_index 1 is Day 2...
            // Check previous day (day_index - 1)
            // Ideally we get the LAST stop of the previous day.
            // For now, checking if previous day exists and has a final route.
            const { data: prevDay } = await supabase
                .from('trip_days')
                .select('*')
                .eq('trip_id', trip_id)
                .eq('day_index', day_index - 1)
                .single();

            if (prevDay && prevDay.final_route && prevDay.final_route.stops && prevDay.final_route.stops.length > 0) {
                const lastStop = prevDay.final_route.stops[prevDay.final_route.stops.length - 1];
                anchorName = lastStop.name;
                anchorCoords = lastStop.location;
            }
        }

        // 3. Fetch Candidates (Wide Net)
        // Construct Smart Query
        // Combine user categories + trip type context
        const categories = trip.categories || ['attractions'];
        // Pick a random category or combine? "Best [Category] in [Anchor]"
        // To get a "Wide Net", we might search "Things to do in [Anchor]" first, then filter/score?
        // Or specific query: "Top rated places in [Anchor] for [TripType]"

        let smartSuffix = "";
        if (trip.tripType === 'Family') smartSuffix = "kid friendly";
        if (trip.tripType === 'Solo') smartSuffix = "safe for solo travelers";

        // We'll search for 2 main queries to get ~30-40 places
        // Query 1: Generic "Things to do" + Suffix
        // Query 2: Specific Priority Category

        const query1 = `Things to do in ${anchorName} ${smartSuffix}`;
        const query2 = `Best ${categories[0] || 'attractions'} in ${anchorName}`;

        const [results1, results2] = await Promise.all([
            searchPlaces(query1, anchorCoords, 10000),
            searchPlaces(query2, anchorCoords, 10000)
        ]);

        // Merge and Deduplicate
        const allCandidates = [...results1, ...results2];
        const uniqueCandidatesMap = new Map();
        allCandidates.forEach(p => uniqueCandidatesMap.set(p.id, p));
        let uniqueCandidates: Place[] = Array.from(uniqueCandidatesMap.values());

        // Cap at 30? Or allow more for better filtering? Keep top 30 by rating first?
        // Let's keep up to 40 to have enough for Vibe Check
        uniqueCandidates = uniqueCandidates.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 40);

        // 4. Gemini Vibe Check (The Curator)
        // Send top 20-30 to Gemini
        const vibeCheckedPlaces = await geminiAI.ratePlaces(uniqueCandidates.slice(0, 25), trip.categories?.join(', ') || 'General');

        // 5. Empathy Scorer
        // Augment places with distance from Anchor for scoring
        vibeCheckedPlaces.forEach(p => {
            // Basic distance calc
            const dist = getDistanceFromLatLonInKm(anchorCoords.lat, anchorCoords.lng, p.lat, p.lng);
            p.distance = { ...p.distance, value: dist * 1000, text: `${dist.toFixed(1)} km` };
            // Use dist in scorer (it handles raw value / 500)
        });

        const scoredPlaces = vibeCheckedPlaces.map(p => {
            const empathyScore = calculateEmpathyScore(p, { tripType: trip.tripType });
            return {
                ...p,
                empathyScore,
                finalScore: empathyScore + (p.vibeScore || 0) // Mix generic empathy + AI vibe? Or just empathy?
                // Prompt says: "Run calculateEmpathyScore... Sort by finalScore"
                // `calculateEmpathyScore` uses rating * 20 (base 100).
                // `vibeCheck` returns 0-100.
                // Let's average them or sum?
                // calculateEmpathyScore returns modified score (could be > 100 if bonus).
            };
        });

        // 6. Sort & Select
        scoredPlaces.sort((a, b) => b.empathyScore - a.empathyScore);

        // Pick Top 9 (3 Morning, 3 Afternoon, 3 Evening)
        // Check if we have enough
        const topPicks = scoredPlaces.slice(0, 9);

        // Assign to Slots based on Geographically Sequential (Centroids)
        // Simplified: Sort Top 9 by distance from Anchor?
        // Or sort by "Opening Hours" heuristic?
        // Let's use Distance Sequence:
        // Morning: Closest 3
        // Afternoon: Middle 3
        // Evening: Furthest 3? (Or reverse, start far and come back?)
        // Usually: Start far and come back (If ReturnToStart) OR Start close and go far.
        // Let's do: Start Close (Morning) -> Mid -> Far (Evening).

        topPicks.sort((a, b) => (a.distance?.value || 0) - (b.distance?.value || 0));

        const morning = topPicks.slice(0, 3).map(p => ({ ...p, time_slot: 'morning' }));
        const afternoon = topPicks.slice(3, 6).map(p => ({ ...p, time_slot: 'afternoon' }));
        const evening = topPicks.slice(6, 9).map(p => ({ ...p, time_slot: 'evening' }));

        const activities = [...morning, ...afternoon, ...evening];

        // 7. Save to DB (Supabase)
        // Get or Create Day
        let { data: day } = await supabase
            .from('trip_days')
            .select('*')
            .eq('trip_id', trip_id)
            .eq('day_index', day_index)
            .single();

        if (!day) {
            const { data: newDay, error: createError } = await supabase
                .from('trip_days')
                .insert({
                    trip_id,
                    day_index,
                    day_date: new Date().toISOString(), // Todo: calc real date
                    status: 'PENDING'
                })
                .select()
                .single();
            if (createError) throw createError;
            day = newDay;
        }

        const candidatesToInsert = activities.map(act => ({
            day_id: day.id,
            time_slot: act.time_slot,
            google_place_id: act.id, // searchPlaces uses 'id'
            name: act.name,
            location: { lat: act.lat, lng: act.lng },
            rating: act.rating,
            gemini_vibe_check: JSON.stringify({ // Store as JSON or string
                score: act.vibeScore,
                reason: act.geminiReasoning,
                empathy_score: act.empathyScore
            })
        }));

        if (candidatesToInsert.length > 0) {
            // Clear old candidates for this day?
            // await supabase.from('place_candidates').delete().eq('day_id', day.id);

            const { error: insertError } = await supabase
                .from('place_candidates')
                .insert(candidatesToInsert);

            if (insertError) console.error('Insert Error', insertError);
        }

        return NextResponse.json({
            success: true,
            day_id: day.id,
            activities: activities.map(a => ({
                place_name: a.name,
                time_slot: a.time_slot,
                rating: a.rating,
                reasoning: (a as any).geminiReasoning || 'Selected by Gen 3.1 Engine'
            }))
        });

    } catch (error: any) {
        console.error('Gen 3.1 Error:', error);
        return NextResponse.json({ error: error.message || 'Error' }, { status: 500 });
    }
}
