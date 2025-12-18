import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tripName, destination, startDate, endDate, budget, tripType, userId } = body;

        // VALIDATION: Ensure we have a User ID from the frontend
        if (!userId) {
            return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });
        }

        // ADMIN CLIENT: Bypasses RLS (Row Level Security)
        // This is required because NextAuth users are not "authenticated" in Supabase's eyes.
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY! // <--- The Master Key
        );

        // INSERT DATA
        const { data, error } = await supabaseAdmin
            .from('trips')
            .insert({
                name: tripName,
                destination,
                start_date: startDate,
                end_date: endDate,
                budget_tier: budget,
                trip_type: tripType || 'Friends',
                created_by: userId // Use the ID passed from NextAuth
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
