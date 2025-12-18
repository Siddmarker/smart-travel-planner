import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

// Helper to create a user-scoped client for RLS
const createUserClient = (token: string) => {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
};

export async function POST(request: Request) {
    // 1. Grab the Token from the Header
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader) {
        // Method A: Verify the Token directly
        const token = authHeader.replace('Bearer ', '');
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.auth.getUser(token);
        user = data.user;
    }

    // 2. Fail if no user found
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: No valid token' }, { status: 401 });
    }

    // 3. Parse Data & Insert
    const body = await request.json();
    const { tripName, destination, startDate, endDate, budget, tripType } = body;

    // Create a client scoped to this user for the Insert (RLS)
    // We can use the token from the header for the RLS client
    const token = authHeader?.replace('Bearer ', '')!;
    const supabase = createUserClient(token);

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
