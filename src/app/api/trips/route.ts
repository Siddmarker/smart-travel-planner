import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper function that accepts the *awaited* cookie store
const createClient = (cookieStore: any) => {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Handle server component cookie setting restrictions
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Handle server component cookie setting restrictions
                    }
                },
            },
        }
    );
};

export async function POST(request: Request) {
    // FIX: Await the cookies() call
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Data
    const body = await request.json();
    const { tripName, destination, startDate, endDate, budget, tripType } = body;

    // 3. Insert Trip
    const { data, error } = await supabase
        .from('trips')
        .insert({
            name: tripName,
            destination,
            start_date: startDate,
            end_date: endDate,
            budget_tier: budget,
            trip_type: tripType || 'Friends',
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function GET(request: Request) {
    // FIX: Await the cookies() call
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(trips);
}
