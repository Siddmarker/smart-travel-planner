// seed-bangalore.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const CITY = 'Bengaluru';

const SEARCH_QUERIES = [
  { term: 'Famous Biryani Places', type: 'FOOD', tags: ['LUNCH', 'DINNER', 'NON_VEG'] },
  { term: 'Best Masala Dosa', type: 'FOOD', tags: ['MORNING', 'VEG', 'LUNCH'] },
  { term: 'Rooftop Cafes', type: 'FOOD', tags: ['EVENING', 'DINNER', 'COUPLE'] },
  { term: 'Authentic Kannada Restaurants', type: 'FOOD', tags: ['LUNCH', 'DINNER', 'FAMILY'] },
  { term: 'Bowling Alleys', type: 'ACTIVITY', tags: ['AFTERNOON', 'EVENING', 'FRIENDS'] },
  { term: 'Go Karting Tracks', type: 'ACTIVITY', tags: ['MORNING', 'AFTERNOON', 'FRIENDS'] },
  { term: 'Escape Rooms', type: 'ACTIVITY', tags: ['AFTERNOON', 'FRIENDS'] },
  { term: 'Art Galleries', type: 'ACTIVITY', tags: ['MORNING', 'AFTERNOON', 'SOLO'] },
  { term: 'Beautiful Parks', type: 'ACTIVITY', tags: ['MORNING', 'EVENING', 'FAMILY'] },
  { term: 'Lakes for boating', type: 'ACTIVITY', tags: ['EVENING', 'COUPLE'] }
];

async function fetchAndInsert() {
  console.log(`\n🚀 Starting SUPER-SEED for: ${CITY}...\n`);
  
  for (const query of SEARCH_QUERIES) {
    try {
      console.log(`   🔎 Searching for: "${query.term}"...`);
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query.term}+in+${CITY}&key=${GOOGLE_KEY}`;
      const response = await axios.get(url);
      const results = response.data.results.slice(0, 6); 

      if (results.length === 0) continue;

      // 1. Map Google Results to our Format
      const rowsToInsert = results.map(place => ({
        zone_id: CITY.toUpperCase(), 
        name: place.name,
        description: place.formatted_address,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
        type: query.type,
        best_time_tags: query.tags,
        rating: place.rating,
        image: place.photos 
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_KEY}`
          : `https://source.unsplash.com/random/800x600/?${query.term.split(' ')[0]}`
      }));

      // 2. REMOVE DUPLICATES (The Fix)
      // We use a Map to keep only unique names in this batch
      const uniqueRows = Array.from(new Map(rowsToInsert.map(item => [item.name, item])).values());

      // 3. Insert into Database
      const { error } = await supabase.from('places').upsert(uniqueRows, { onConflict: 'name' });
      
      if (error) console.error('      ❌ DB Error:', error.message);
      else console.log(`      ✅ Added ${uniqueRows.length} places.`);

    } catch (err) {
      console.error('   ❌ API Fail:', err.message);
    }
  }
  console.log("\n✨ BANGALORE UPGRADE COMPLETE!");
}

fetchAndInsert();