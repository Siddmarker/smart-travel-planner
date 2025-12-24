
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('🔍 Inspecting `places` table...');
    const { data, error } = await supabase.from('places').select('*').limit(1);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        if (data.length === 0) {
            console.log('⚠️ Table is empty. Cannot inspect structure from data.');
        } else {
            console.log('✅ Row 1 Keys:', Object.keys(data[0]));
            console.log('✅ Row 1 Data:', JSON.stringify(data[0], null, 2));
        }
    }
}

inspect();
