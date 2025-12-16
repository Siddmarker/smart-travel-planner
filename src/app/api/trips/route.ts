
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: Request) {
    try {
        // 1. Get Session
        const session = await getServerSession(authOptions);
        const email = session?.user?.email;
        const name = session?.user?.name || 'Traveler'; // Fallback name

        if (!email) {
            // Allow anonymous trips? For now, enforcing at least an Email or "anonymous" placeholder if strictly needed
            // But typical flow requires login.
            console.warn("No session email found. Falling back to anonymous user logic.");
        }

        const userEmail = email || `anon_${Date.now()}@example.com`;

        // 2. Ensure Profile Exists (The "Auto-Heal" Logic)
        // Check if user exists
        let { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single();

        let userId = profile?.id;

        // If no profile, CREATE one
        if (!userId) {
            console.log(`Profile missing for ${userEmail}. Creating new profile...`);
            userId = crypto.randomUUID(); // Generate ID

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
        // Now we definitely have a valid userId (profile.id)
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
                created_by: userId // CORRECT FK LINK
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
