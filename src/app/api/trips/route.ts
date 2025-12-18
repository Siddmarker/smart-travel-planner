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
    try {
        // 1. Look for the Header
        const authHeader = request.headers.get('Authorization');

        if (!authHeader) {
            console.error("Missing Authorization Header");
            return NextResponse.json({ error: 'Missing Auth Header' }, { status: 401 });
        }

        // 2. Validate the Token
        const token = authHeader.replace('Bearer ', '');
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            console.error("Auth Failed:", authError);
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 3. Insert Data
        const body = await request.json();
        const { tripName, destination, startDate, endDate, budget, tripType } = body;

        // Create client with user context for RLS
        const supabaseUser = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data, error } = await supabaseUser
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

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
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
