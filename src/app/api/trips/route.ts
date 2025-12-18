
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        // 0. Parse Body
        const body = await req.json();
        const {
            destination,
            startDate,
            endDate,
            budget,
            categories,
            name: tripName,
            tripType
        } = body;

        // 1. Get Session from Supabase
        const { data: { user } } = await supabase.auth.getUser();
        let userId = user?.id;
        let userEmail = user?.email;
        let name = user?.user_metadata?.name || 'Traveler'; // fallback

        if (!userId) {
            // If we want to allow anonymous trips, handle it here. 
            // But usually for "My Trips", we want a user.
            // If legacy "anon" logic is needed, we'd need to trust the client which is valid for demo but not prod.
            // Given the instructions to remove NextAuth, we rely on Supabase Auth.
            // If no user, maybe we return 401 or proceed as anonymous?
            // Original logic had "anon_${Date.now()}" fallback.
            console.warn("No Supabase user found. Using anonymous fallback.");
            userEmail = `anon_${Date.now()}@example.com`;
        }

        // 2. Ensure Profile Exists
        // Note: With Supabase Auth, profiles trigger should handle this, but if we need manual check:
        // Or if we are using the "Missing Profile" logic from before.
        // If we have a userId from Auth, usually profile exists.

        let shouldCreateProfile = false;
        if (userId) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', userId)
                .single();
            if (!profile) shouldCreateProfile = true;
        } else {
            // For anonymous fallback, we don't have a real userId until we make one or find one by email?
            // The old logic looked up by email.
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', userEmail)
                .single();
            userId = profile?.id;
            if (!userId) shouldCreateProfile = true;
        }

        if (shouldCreateProfile) {
            if (!userId) userId = crypto.randomUUID(); // Generate ID for anon
            console.log(`Profile missing for ${userEmail}. Creating new profile...`);

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: userEmail,
                    full_name: name,
                    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
                });

            if (profileError) {
                console.error("Failed to auto-create profile:", profileError);
                // Continue? Or fail? The old code returned 500.
                return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 });
            }
        }

        // 3. Insert Trip
        if (!destination || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: trip, error } = await supabase
            .from('trips')
            .insert({
                destination,
                start_date: startDate,
                end_date: endDate,
                budget_tier: budget,
                categories: categories || [],
                name: tripName || `${destination} Trip`,
                tripType: tripType?.toLowerCase() || 'friends', // Map to lowercase enum
                status: 'DRAFT',
                created_by: userId
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            trip_id: trip.id,
            message: 'Trip Shell Created'
        });

    } catch (error) {
        console.error('Trip Creation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Trips
    const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching trips:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(trips);
}
