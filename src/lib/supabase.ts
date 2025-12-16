
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    // Warn only, so build doesn't fail if envs are missing
    console.warn('Supabase URL or Key is missing. Trip features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
