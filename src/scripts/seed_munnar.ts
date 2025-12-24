import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface PlaceData {
    name: string;
    location: string;
    description?: string;
    place_type: 'ANCHOR' | 'SATELLITE' | 'FOOD';
    zone_id?: string;
    authenticity_score?: number;
    amenities?: string[];
    parent_anchor_id?: string;
    // Persona Columns
    price_tier?: 'FREE' | 'LOW' | 'MODERATE' | 'HIGH' | 'LUXURY';
    safety_score?: number;
    trend_score?: number;
    vibes?: string[];
    capacity_tier?: 'SMALL' | 'MEDIUM' | 'LARGE';
}

interface StayData {
    name: string;
    location: string;
    zone_id: string;
    vibe_tags: string[];
    avg_price: number;
}

// Helper to seed a place
async function seedPlace(data: PlaceData) {
    console.log(`Processing: ${data.name}`);

    // Check if exists
    const { data: existing, error: fetchError } = await supabase
        .from('places')
        .select('*')
        .eq('name', data.name)
        .maybeSingle();

    if (fetchError) {
        console.error(`  -> Error checking ${data.name}:`, fetchError.message);
        return;
    }

    if (existing) {
        console.log(`  -> Updating existing: ${data.name}`);
        await supabase.from('places').update(data).eq('id', existing.id);
        return existing;
    }

    // Insert new
    const { data: newRecord, error: insertError } = await supabase
        .from('places')
        .insert(data)
        .select()
        .single();

    if (insertError) {
        console.error(`  -> Error creating ${data.name}:`, insertError.message);
        return null;
    }

    console.log(`  -> Created: ${data.name}`);
    return newRecord;
}

async function seedStay(data: StayData) {
    // Check if exists
    const { data: existing } = await supabase
        .from('stays')
        .select('*')
        .eq('name', data.name)
        .maybeSingle();

    if (existing) return existing;

    const { data: newRecord } = await supabase
        .from('stays')
        .insert(data)
        .select()
        .single();

    return newRecord;
}

// --- DATA LISTS ---

const PLACES: PlaceData[] = [
    // Anchors & Satellites
    {
        name: 'Tea Museum',
        location: 'POINT(77.0595 10.0805)', // Approx
        description: 'Explore the history of tea plantation in Munnar.',
        place_type: 'ANCHOR',
        zone_id: 'Town',
        vibes: ['INDOOR', 'HISTORY'],
        safety_score: 100,
        trend_score: 40,
        price_tier: 'LOW',
        amenities: ['Parking', 'Ticket Counter'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Wonder Valley Adventure Park',
        location: 'POINT(77.0450 10.0250)',
        description: 'Amusement park with adventure activities.',
        place_type: 'ANCHOR',
        zone_id: 'Chithirapuram',
        vibes: ['KID_FRIENDLY', 'ADVENTURE'],
        safety_score: 90,
        trend_score: 60,
        price_tier: 'MODERATE',
        amenities: ['Restrooms', 'Food Court'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Meesapulimala',
        location: 'POINT(77.2000 10.0900)',
        description: 'Second highest peak in the Western Ghats (Trekking).',
        place_type: 'ANCHOR', // Treat as anchor for trekkers
        zone_id: 'Suryanelli',
        vibes: ['TREKKING', 'WILD'],
        safety_score: 40,
        trend_score: 85,
        price_tier: 'FREE',
        amenities: ['Guide Required'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Pothamedu Viewpoint',
        location: 'POINT(77.0620 10.0600)',
        description: 'Sunset point offering panoramic views.',
        place_type: 'SATELLITE',
        zone_id: 'Town',
        vibes: ['SUNSET', 'ROMANTIC'],
        safety_score: 70,
        trend_score: 80,
        price_tier: 'FREE',
        amenities: ['Parking'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Carmelagiri Elephant Park',
        location: 'POINT(77.0900 10.1000)',
        description: 'Elephant rides and interactions.',
        place_type: 'ANCHOR',
        zone_id: 'Mattupetty',
        vibes: ['KID_FRIENDLY', 'ANIMALS'],
        safety_score: 85,
        trend_score: 50,
        price_tier: 'HIGH',
        amenities: ['Parking', 'Restrooms'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Mattupetty Dam',
        location: 'POINT(77.1200 10.1050)',
        description: 'Famous dam with boating facilities.',
        place_type: 'ANCHOR',
        zone_id: 'Mattupetty',
        vibes: ['BOATING', 'CROWDED'],
        safety_score: 90,
        trend_score: 70,
        price_tier: 'MODERATE',
        amenities: ['Boating', 'Shopping'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Kundala Lake',
        location: 'POINT(77.1800 10.1200)',
        description: 'Scenic lake on the way to Top Station.',
        place_type: 'SATELLITE',
        zone_id: 'TopStation',
        vibes: ['ROMANTIC', 'CALM'],
        safety_score: 80,
        trend_score: 60,
        price_tier: 'FREE',
        amenities: ['Boating'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Lockhart Gap',
        location: 'POINT(77.1500 10.0100)',
        description: 'Scenic winding road view.',
        place_type: 'SATELLITE',
        zone_id: 'Lockhart',
        vibes: ['DRIVE', 'VIEW'],
        safety_score: 60,
        trend_score: 75,
        price_tier: 'FREE',
        amenities: ['Viewpoint'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Gap Road View',
        location: 'POINT(77.1600 10.0150)',
        description: 'Trending instagram spot along the highway.',
        place_type: 'SATELLITE',
        zone_id: 'Lockhart',
        vibes: ['INSTAGRAMMABLE', 'DRIVE'],
        safety_score: 75,
        trend_score: 95,
        price_tier: 'FREE',
        amenities: ['Parking (Roadside)'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Attukad Waterfalls',
        location: 'POINT(77.0300 10.0400)',
        description: 'Beautiful waterfalls amidst tea estates.',
        place_type: 'SATELLITE',
        zone_id: 'Pallivasal',
        vibes: ['NATURE', 'WATER'],
        safety_score: 50,
        trend_score: 65,
        price_tier: 'FREE',
        amenities: ['Tea Stall'],
        capacity_tier: 'MEDIUM'
    },
    // Food Spots
    {
        name: 'Saravana Bhavan',
        location: 'POINT(77.0605 10.0815)',
        description: 'Reliable South Indian Vegetarian chain.',
        place_type: 'FOOD',
        zone_id: 'Town',
        vibes: ['FAMILY', 'NO_FRILLS'],
        safety_score: 100,
        trend_score: 50,
        price_tier: 'MODERATE',
        amenities: ['Vegetarian', 'Restrooms'],
        capacity_tier: 'LARGE'
    },
    {
        name: 'Guru\'s Restaurant',
        location: 'POINT(77.0610 10.0820)',
        description: 'Local favorite for non-veg meals.',
        place_type: 'FOOD',
        zone_id: 'Town',
        vibes: ['AUTHENTIC', 'BUSY'],
        safety_score: 80,
        trend_score: 60,
        price_tier: 'LOW',
        amenities: ['Non-Veg', 'Quick Bite'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Rapsy Restaurant',
        location: 'POINT(77.0650 10.0880)',
        description: 'Famous budget-friendly spot known for its biryani and parottas.',
        place_type: 'FOOD',
        zone_id: 'Town',
        vibes: ['CLASSIC', 'BUSY'],
        safety_score: 80,
        trend_score: 65,
        price_tier: 'LOW',
        amenities: ['Dine-in', 'Takeaway'],
        capacity_tier: 'MEDIUM'
    },
    {
        name: 'Tea County Restaurant',
        location: 'POINT(77.0700 10.0850)',
        description: 'Premium dining with excellent facilities.',
        place_type: 'FOOD',
        zone_id: 'Town',
        vibes: ['LUXURY', 'CORPORATE_READY'],
        safety_score: 100,
        trend_score: 50,
        price_tier: 'HIGH',
        amenities: ['Bar', 'Buffet'],
        capacity_tier: 'LARGE'
    }
];

const STAYS: StayData[] = [
    {
        name: 'Zostel Munnar',
        location: 'POINT(77.0400 10.0600)',
        zone_id: 'WEST',
        vibe_tags: ['SOCIAL', 'BACKPACKER', 'BUDGET'],
        avg_price: 1200,
    },
    {
        name: 'Blanket Hotel & Spa',
        location: 'POINT(77.0700 10.0700)',
        zone_id: 'CENTRAL',
        vibe_tags: ['LUXURY', 'COUPLE', 'VIEW'],
        avg_price: 8500,
    }
];


async function main() {
    console.log('--- Starting Mega Data Seed ---');

    console.log('\n--- Seeding Places ---');
    for (const place of PLACES) {
        await seedPlace(place);
    }

    console.log('\n--- Seeding Stays ---');
    for (const stay of STAYS) {
        await seedStay(stay);
    }

    console.log('\n--- Seed Complete ---');
}

main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
