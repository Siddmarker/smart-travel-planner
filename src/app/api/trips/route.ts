import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, destination, startDate, endDate, budget, travelerType } = body;

        // 1. Setup Admin Client
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 2. Get User ID safely (checking headers or body)
        // In a real app we check session, but here we likely pass userId or rely on client
        // For now, let's assume the client might send it, or we decode it.
        // BETTER: If your app sends 'userId' in the body, map it.
        const userId = body.userId || body.user_id;

        if (!userId) {
            return NextResponse.json({ error: 'User ID missing' }, { status: 400 });
        }

        // 3. INSERT with CORRECT Column Name (created_by)
        const { data: newTrip, error } = await supabaseAdmin
            .from('trips')
            .insert({
                name,
                destination,
                start_date: startDate,
                end_date: endDate,
                budget_tier: budget ? budget.toString() : null, // Ensure string if DB expects text
                trip_type: travelerType,
                created_by: userId, // <--- CRITICAL FIX: Use 'created_by'
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error("Create Trip Error:", error);
            throw error;
        }

        return NextResponse.json(newTrip);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
