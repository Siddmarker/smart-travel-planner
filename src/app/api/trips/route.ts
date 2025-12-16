
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
    try {
        // 0. Parse Body (FIXED: Added this back)
        const body = await req.json();
        const {
            destination,
            startDate,
            endDate,
            budget,
            categories,
            name: tripName
        } = body;

        // 1. Get Session
        const session = await getServerSession(authOptions);
        const email = session?.user?.email;
        const name = session?.user?.name || 'Traveler';

        if (!email) {
            console.warn("No session email found. Falling back to anonymous user logic.");
        }

        const userEmail = email || `anon_${Date.now()}@example.com`;

        // 2. Ensure Profile Exists (The "Auto-Heal" Logic)
        let { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

        let userId = profile?.id;

        if (!userId) {
            console.log(`Profile missing for ${userEmail}. Creating new profile...`);
            userId = crypto.randomUUID();

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
                status: 'DRAFT',
                created_by: userId
            })
            .select() // FIXED: Added .select() to return the object
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
