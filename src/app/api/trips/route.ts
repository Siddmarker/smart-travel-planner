
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user?.email || 'anonymous'; // Fallback / Hack for mismatching IDs if needed
        // Ideally: session.user.id if available and matches DB.
        // For now, let's try to get a real ID or just pass what we have.

        // Note: If 'profiles' table enforces FK to auth.users, and we are using NextAuth...
        // we might fail unless we insert into 'profiles' first or have matching IDs.
        // Given the constraints, I will proceed with a best-effort insertion.

        const body = await req.json();
        const {
            destination,
            startDate,
            endDate,
            budget,
            categories,
            name
        } = body;

        // Validate
        if (!destination || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert Trip Shell
        const { data: trip, error } = await supabase
            .from('trips')
            .insert({
                destination,
                start_date: startDate,
                end_date: endDate,
                budget_tier: budget, // Mapping 'budget' to 'budget_tier'
                categories: categories || [],
                name: name || `${destination} Trip`,
                status: 'DRAFT',
                // user_id: userId // If we can't guarantee FK, maybe omit or handle profile creation?
                // The SQL has 'created_by UUID REFERENCES profiles(id)'. 
                // We technically need a profile.
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
