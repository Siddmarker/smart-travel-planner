import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Keeps Next.js 15 Fix
) {
    try {
        const { id } = await params; // Keeps Next.js 15 Fix

        if (!id) {
            return NextResponse.json({ error: 'Trip ID missing' }, { status: 400 });
        }

        // 1. ADMIN CLIENT
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. FETCH THE TRIP (Removed 'activities(*)' because table doesn't exist)
        const { data: trip, error } = await supabaseAdmin
            .from('trips')
            .select('*, trip_days(*)')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Fetch Error:", error);
            if (error.code === 'PGRST116') {
                return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(trip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
