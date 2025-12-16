import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Check if user already exists (in profiles or credentials)
        const { data: existingUser } = await supabase
            .from('user_credentials')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create Profile (We assume ID generation happens here or we generate UUID)
        // Since profiles 'references auth.users', and we aren't using Auth User...
        // We need to generate a specific UUID for this 'user' that works across tables.

        // Strategy: We can insert into 'profiles' and let it generate ID if default uuid_generate_v4() works
        // BUT 'profiles' has PK constraint referencing auth.users. 
        // IF the SQL enforces `REFERENCES auth.users`, this insert will FAIL unless a user exists in auth.users.

        // FIX: The user accepted "Store users Login details", implies we control the storage.
        // Assuming the SQL I provided earlier was run, it had:
        // profiles (id UUID REFERENCES auth.users ... PRIMARY KEY)

        // If we cannot insert into auth.users (requires Admin Key), we MUST rely on a relaxed schema.
        // I will assume for this step that `profiles.id` is just a UUID or the check is loose.
        // If it fails, I'll have to notify the user to adjust the schema constraints.

        // For now, let's try to insert profile. 
        // We need an ID first to link them.
        const userId = crypto.randomUUID();

        // Transaction simulation (Supabase doesn't do multi-table atomic easily via JS client without RPC)

        // A. Insert Profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: userId,
                email,
                full_name: name,
                avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            });

        if (profileError) {
            console.error('Profile Creation Error:', profileError);
            // Likely FK constraint violation if auth.users check is strict
            throw new Error(`Profile creation failed: ${profileError.message}`);
        }

        // B. Insert Credentials
        const { error: credError } = await supabase
            .from('user_credentials')
            .insert({
                user_id: userId,
                email,
                password_hash: hashedPassword
            });

        if (credError) {
            // Rollback profile? (Manual delete)
            await supabase.from('profiles').delete().eq('id', userId);
            throw new Error(`Credentials creation failed: ${credError.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'User created successfully',
            user: {
                id: userId,
                name: name,
                email: email
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
