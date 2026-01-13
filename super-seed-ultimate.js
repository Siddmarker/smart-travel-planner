// super-seed-ultimate.js
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

// 1. THE ULTIMATE INDIA LIST (North East + Tier 2 + Villages)
const TARGET_LOCATIONS = [
  // --- NORTH INDIA ---
  'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar',
  'Rishikesh', 'Haridwar', 'Mussoorie', 'Landour', 'Dehradun',
  'Varanasi', 'Prayagraj', 'Amritsar', 'Lucknow', 'Agra',
  'Manali', 'Kasol', 'Jibhi', 'Malana', 'Chitkul', 'Dharamshala', 'McLeod Ganj',
  'Leh', 'Diskit', 'Nubra Valley', 'Srinagar', 'Gulmarg',

  // --- NORTH EAST INDIA (The Unexplored Paradise) ---
  'Gangtok', 'Pelling', 'Lachung', 'Zuluk', // Sikkim
  'Shillong', 'Cherrapunji', 'Mawlynnong', 'Dawki', // Meghalaya
  'Tawang', 'Ziro Valley', 'Mechuka', 'Pasighat', // Arunachal
  'Majuli', 'Kaziranga', 'Guwahati', // Assam
  'Dzukou Valley', 'Khonoma', 'Kohima', // Nagaland
  'Loktak Lake', 'Imphal', // Manipur
  'Aizawl', 'Reiek', // Mizoram
  'Agartala', 'Unakoti', // Tripura

  // --- WEST & CENTRAL ---
  'Goa', 'Gokarna', 'Diu', 
  'Pune', 'Nashik', 'Aurangabad', 'Lonavala', 'Mahabaleshwar',
  'Ahmedabad', 'Kutch', 'Gir', 'Bhuj',
  'Indore', 'Bhopal', 'Ujjain', 'Khajuraho',

  // --- SOUTH INDIA ---
  'Hampi', 'Mysore', 'Coorg', 'Chikmagalur', 'Udupi', 'Dandeli',
  'Kochi', 'Munnar', 'Alleppey', 'Varkala', 'Wayanad', 'Thekkady', 'Kumarakom',
  'Pondicherry', 'Madurai', 'Ooty', 'Kodaikanal', 'Rameswaram', 'Kanyakumari',
  'Visakhapatnam', 'Araku Valley', 'Hyderabad'
];

// 2. COMPREHENSIVE SEARCH QUERIES
const SEARCH_QUERIES = [
  // ESSENTIALS
  { term: 'Top Tourist Attractions', type: 'ACTIVITY', tags: ['MORNING', 'SIGHTSEEING', 'MUST_VISIT'] },
  { term: 'Hidden Gems and Offbeat Spots', type: 'ACTIVITY', tags: ['AFTERNOON', 'HIDDEN_GEM', 'NATURE'] },
  
  // FOOD & NIGHTLIFE
  { term: 'Best Local Food and Thali', type: 'FOOD', tags: ['LUNCH', 'DINNER', 'AUTHENTIC'] },
  { term: 'Famous Street Food Spots', type: 'FOOD', tags: ['EVENING', 'SNACK', 'CHEAP_EATS'] },
  { term: 'Best Cafes and Chill Spots', type: 'FOOD', tags: ['EVENING', 'RELAX', 'CAFE', 'YOUNG'] },
  { term: 'Rooftop Restaurants and Bars', type: 'FOOD', tags: ['DINNER', 'NIGHTLIFE', 'VIEW'] },
  
  // NATURE & ADVENTURE
  { term: 'Scenic Viewpoints and Sunsets', type: 'ACTIVITY', tags: ['EVENING', 'NATURE', 'PHOTOGRAPHY'] },
  { term: 'Trekking and Nature Trails', type: 'ACTIVITY', tags: ['MORNING', 'ADVENTURE', 'TREK'] },
  { term: 'Waterfalls and Lakes', type: 'ACTIVITY', tags: ['MORNING', 'NATURE', 'WATER'] },
  
  // CULTURE
  { term: 'Historical Temples and Monasteries', type: 'ACTIVITY', tags: ['MORNING', 'CULTURE', 'SPIRITUAL'] },
  { term: 'Local Markets and Shopping', type: 'ACTIVITY', tags: ['AFTERNOON', 'SHOPPING', 'LOCAL_LIFE'] },
  
  // STAYS
  { term: 'Best Hostels and Backpacker Stays', type: 'STAY', tags: ['NIGHT', 'BUDGET', 'BACKPACKER'] },
  { term: 'Luxury Resorts and Boutique Stays', type: 'STAY', tags: ['NIGHT', 'LUXURY', 'COMFORT'] }
];

async function fetchAndInsert() {
  console.log(`\n🚀 STARTING MASSIVE DATA INJECTION...`);
  console.log(`📍 Targets: ${TARGET_LOCATIONS.length} Cities/Villages`);
  console.log(`🔍 Queries per Target: ${SEARCH_QUERIES.length}`);
  console.log(`📦 Est. Data Points: ~${TARGET_LOCATIONS.length * SEARCH_QUERIES.length * 20} places\n`);
  
  for (const location of TARGET_LOCATIONS) {
    console.log(`\n---------------------------------------------------------`);
    console.log(`📍 PROCESSING: ${location.toUpperCase()}`);
    console.log(`---------------------------------------------------------`);
    
    for (const query of SEARCH_QUERIES) {
      try {
        // Dynamic URL
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query.term}+in+${location}&key=${GOOGLE_KEY}`;
        const response = await axios.get(url);
        
        // 🔥 REMOVED THE LIMIT! Fetches up to 20 results per query.
        const results = response.data.results; 

        if (!results || results.length === 0) {
            console.log(`   ⚠️ No results for "${query.term}"`);
            continue;
        }

        const rowsToInsert = results.map(place => ({
          zone_id: location.toUpperCase(),
          city: location,
          name: place.name,
          description: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          type: query.type,
          // Merge location name into tags for easier filtering later
          best_time_tags: [...query.tags, location.toUpperCase().replace(' ', '_')], 
          rating: place.rating,
          user_ratings_total: place.user_ratings_total, // Added: To sort by popularity later
          image: place.photos 
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_KEY}`
            : `https://source.unsplash.com/random/800x600/?${query.term.split(' ')[0]},india`
        }));

        // Remove Duplicates (in case a place appears in multiple queries)
        const uniqueRows = Array.from(new Map(rowsToInsert.map(item => [item.name, item])).values());

        // Insert into Database
        const { error } = await supabase.from('places').upsert(uniqueRows, { onConflict: 'name' });
        
        if (error) console.error('      ❌ DB Error:', error.message);
        else console.log(`      ✅ +${uniqueRows.length} places found for "${query.term}"`);

      } catch (err) {
        console.error('   ❌ API Fail:', err.message);
      }
      
      // Throttle to respect API limits (important for large batches)
      await new Promise(r => setTimeout(r, 200));
    }
  }
  console.log("\n✨ ULTIMATE INDIA DB UPGRADE COMPLETE!");
}

fetchAndInsert();