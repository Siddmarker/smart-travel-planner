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

        // 2. FETCH ONLY THE TRIP (Removed 'trip_days' to isolate the issue)
        const { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select('*') // <--- SIMPLEST POSSIBLE QUERY
            .eq('id', id)
            .single();

        if (error) {
            console.error("Fetch Error:", error);
            // Log the specific error to the Vercel/Local console
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        if (!trip) {
            return NextResponse.json({ error: 'Trip found but is empty' }, { status: 404 });
        }

        return NextResponse.json(trip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
