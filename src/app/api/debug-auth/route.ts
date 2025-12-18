import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const cookieStore = await cookies();

    // Create the client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // Server Component read-only handling
                    }
                },
            },
        }
    );

    // Check the User
    const { data: { user }, error } = await supabase.auth.getUser();

    return NextResponse.json({
        status: user ? 'Authenticated' : 'Guest',
        userId: user?.id || null,
        email: user?.email || null,
        cookieCount: cookieStore.getAll().length,
        authError: error?.message || null
    });
}
