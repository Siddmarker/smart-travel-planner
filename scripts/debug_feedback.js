require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFeedbackInsert() {
    console.log('🚀 Testing Feedback Insert with ANON KEY...');

    // 1. Check if we can select (optional, but good to know)
    const { data: selectData, error: selectError } = await supabase.from('feedback').select('count', { count: 'exact', head: true });
    if (selectError) console.log('⚠️ Select check failed:', selectError.message);
    else console.log('✅ Select check passed. Count:', selectData);

    // 2. Try Insert
    const { data, error } = await supabase
        .from('feedback')
        .insert([
            {
                message: 'Test message from debug script',
                page_url: '/debug-script',
                status: 'DEBUG'
            }
        ])
        .select();

    if (error) {
        console.error('❌ Insert Failed:', error);
        console.log('💡 TIP: If valid keys + "new row violates row-level security policy", you need to enable INSERT for anon role.');
    } else {
        console.log('✅ Insert Success:', data);
    }
}

testFeedbackInsert();
