// super-seed-stays.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// --- CONFIGURATION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Must be Service Role Key for writing
);
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

// 1. TARGET LOCATIONS (Same list, ensuring coverage)
const TARGET_LOCATIONS = [
  // NORTH
  'Jaipur', 'Udaipur', 'Manali', 'Leh', 'Rishikesh', 'Varanasi', 'Agra',
  // NORTH EAST
  'Gangtok', 'Shillong', 'Guwahati', 'Darjeeling',
  // WEST
  'Goa', 'Mumbai', 'Pune', 'Lonavala', 'Mahabaleshwar',
  // SOUTH
  'Bangalore', 'Coorg', 'Ooty', 'Munnar', 'Varkala', 'Pondicherry', 'Kochi', 'Hampi', 'Gokarna'
];

// 2. TARGETED ACCOMMODATION QUERIES
// We use specific types (HOTEL, RESORT, etc.) so your frontend filters work perfectly.
const SEARCH_QUERIES = [
  // --- HOTELS (General & Luxury) ---
  { 
    term: 'Best Luxury Hotels 5 Star', 
    type: 'hotel', // Matches ACCOMMODATION_KEYWORDS
    price_level: 4,
    tags: ['LUXURY', 'COMFORT', 'SERVICE'] 
  },
  { 
    term: 'Top Rated City Hotels', 
    type: 'hotel', 
    price_level: 3,
    tags: ['CITY_CENTER', 'CONVENIENT', 'MODERN'] 
  },

  // --- RESORTS (Relaxing, Pools, Views) ---
  { 
    term: 'Best Resorts with Pool and View', 
    type: 'resort', 
    price_level: 4,
    tags: ['RELAX', 'POOL', 'VIEW', 'NATURE'] 
  },

  // --- HOSTELS (Budget, Backpacking) ---
  { 
    term: 'Best Backpacker Hostels', 
    type: 'hostel', 
    price_level: 1,
    tags: ['BUDGET', 'SOCIAL', 'BACKPACKER', 'YOUNG'] 
  },

  // --- HOMESTAYS (Vibe: Rustic, Cozy) ---
  { 
    term: 'Cozy Homestays and Guest Houses', 
    type: 'homestay', 
    price_level: 2,
    tags: ['COZY', 'LOCAL_EXPERIENCE', 'RUSTIC'] 
  },

  // --- VILLAS / APARTMENTS ---
  { 
    term: 'Private Villas and Service Apartments', 
    type: 'apartment', 
    price_level: 3,
    tags: ['PRIVACY', 'GROUP', 'LONG_STAY'] 
  }
];

async function fetchAndInsert() {
  console.log(`\n🏨 STARTING ACCOMMODATION INJECTION...`);
  console.log(`📍 Targets: ${TARGET_LOCATIONS.length} Cities`);
  console.log(`🔍 Categories: Hotels, Resorts, Hostels, Homestays`);
  
  for (const location of TARGET_LOCATIONS) {
    console.log(`\n---------------------------------------------------------`);
    console.log(`📍 PROCESSING: ${location.toUpperCase()}`);
    console.log(`---------------------------------------------------------`);
    
    for (const query of SEARCH_QUERIES) {
      try {
        // Dynamic URL
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query.term}+in+${location}&key=${GOOGLE_KEY}`;
        const response = await axios.get(url);
        
        const results = response.data.results; 

        if (!results || results.length === 0) {
            console.log(`   ⚠️ No results for "${query.term}"`);
            continue;
        }

        const rowsToInsert = results.map(place => ({
          zone_id: location.toUpperCase(), // Helpful for broad searching
          city: location,
          name: place.name,
          description: place.formatted_address, // Google doesn't give descriptions in search, so we use address
          
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          
          type: query.type, // 'hotel', 'resort', 'hostel' etc.
          price_level: place.price_level || query.price_level, // Use Google's price if avail, else our default
          
          best_time_tags: [...query.tags, location.toUpperCase()], 
          rating: place.rating || 4.0,
          user_ratings_total: place.user_ratings_total || 0,
          
          // Image Logic: Try to get a real photo, else fallback
          image: place.photos 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_KEY}`
            : `https://source.unsplash.com/random/800x600/?${query.type},hotel`
        }));

        // Remove Duplicates in this batch
        const uniqueRows = Array.from(new Map(rowsToInsert.map(item => [item.name, item])).values());

        // Insert into Database (Upsert prevents duplicates if they exist from previous seed)
        const { error } = await supabase.from('places').upsert(uniqueRows, { onConflict: 'name' });
        
        if (error) console.error('      ❌ DB Error:', error.message);
        else console.log(`      ✅ +${uniqueRows.length} ${query.type.toUpperCase()}s added`);

      } catch (err) {
        console.error('   ❌ API Fail:', err.message);
      }
      
      // Throttle to be nice to Google API
      await new Promise(r => setTimeout(r, 250));
    }
  }
  console.log("\n✨ ACCOMMODATION DATA UPDATE COMPLETE!");
}

fetchAndInsert();