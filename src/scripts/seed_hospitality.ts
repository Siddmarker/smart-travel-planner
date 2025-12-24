import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- THE MASTER INDIA LIST (Top 50+ Hubs) ---
const TARGET_CITIES = [
  // NORTH INDIA (Mountains & Culture)
  'Leh Ladakh', 'Srinagar', 'Manali', 'Shimla', 'Dharamshala', 'Dalhousie',
  'Rishikesh', 'Mussoorie', 'Nainital', 'Amritsar', 'Chandigarh',
  'Delhi', 'Agra', 'Varanasi', 'Lucknow', 'Ayodhya',

  // WEST INDIA (Desert & Coast)
  'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Mount Abu',
  'Ahmedabad', 'Rann of Kutch', 'Mumbai', 'Pune', 'Lonavala', 'Mahabaleshwar',
  'Goa', 'Nashik',

  // SOUTH INDIA (Nature, Beaches & Temples)
  'Bengaluru', 'Mysore', 'Coorg', 'Chikmagalur', 'Hampi', 'Gokarna',
  'Udupi', 'Wayanad', 'Munnar', 'Thekkady', 'Alleppey', 'Varkala', 'Kochi',
  'Ooty', 'Kodaikanal', 'Chennai', 'Pondicherry', 'Mahabalipuram',
  'Madurai', 'Rameshwaram', 'Kanyakumari', 'Hyderabad',

  // EAST & NORTH EAST (Hills & Spiritual)
  'Kolkata', 'Darjeeling', 'Gangtok', 'Pelling', 'Shillong', 'Cherrapunji',
  'Guwahati', 'Tawang', 'Puri', 'Konark',

  // ISLANDS
  'Andaman Nicobar', 'Lakshadweep'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function createHospitalityPrompt(city: string) {
  return `
    You are a local travel expert for "${city}", India. 
    Generate 20 DISTINCT hospitality and food locations.
    
    Requirements:
    1. **STAY_LUXURY** (4 Places): Top-tier Resorts, Palaces, or 5-Star Hotels.
    2. **STAY_BOUTIQUE** (4 Places): Aesthetic mid-range stays, heritage homes, or glamping.
    3. **STAY_BUDGET** (4 Places): Best Hostels (Zostel, etc.) or clean Backpackers dorms.
    4. **FOOD_LEGENDARY** (4 Places): Iconic, decades-old restaurants serving authentic local dishes.
    5. **FOOD_STREET_VIBE** (4 Places): Famous street food spots or trendy aesthetic cafes.
    
    *Crucial:* - Real, specific names only.
    - For Food, mention the specific "Must Try" dish in the description.
    
    Return ONLY a valid JSON array with this schema:
    [
      {
        "name": "String (Official Name)",
        "description": "String (Max 20 words. Highlight amenities or must-try dish)",
        "lat": Number,
        "lng": Number,
        "type": "Enum: 'STAY' | 'FOOD'",
        "vibes": ["Array e.g. 'LUXURY', 'BACKPACKER', 'ROMANTIC', 'LOCAL_FLAVOR', 'STREET_FOOD', 'INSTAGRAMMABLE']",
        "price_tier": "Enum: 'BUDGET' | 'MODERATE' | 'LUXURY'",
        "amenities": ["Array e.g. 'POOL', 'WIFI', 'AC', 'VIEW', 'VEGAN_OPTS']",
        "best_time_tags": ["Array e.g. 'BREAKFAST', 'DINNER', 'SUNSET']",
        "safety_score": Number (80-100),
        "trend_score": Number (70-100)
      }
    ]
  `;
}

async function seedHospitality() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }); 

  console.log(`🚀 Starting Pan-India Hospitality Seeder for ${TARGET_CITIES.length} cities...`);

  for (const city of TARGET_CITIES) {
    console.log(`\n📍 Processing: ${city}...`);
    // 3 Second Pause to respect API Rate Limits
    await delay(3000); 

    try {
      const result = await model.generateContent(createHospitalityPrompt(city));
      const response = await result.response;
      const text = response.text();
      
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const placesData = JSON.parse(cleanJson);

      console.log(`   ✅ Found ${placesData.length} spots.`);

      const placesWithZone = placesData.map((p: any) => ({
        ...p,
        zone_id: city.toUpperCase() // Keeps data grouped by city
      }));

      const { error } = await supabase
        .from('places')
        .upsert(placesWithZone, { onConflict: 'name' });

      if (error) console.error(`   ❌ DB Error:`, error.message);
      else console.log(`   💾 Saved to Database!`);

    } catch (err) {
      console.error(`   💀 Failed for ${city}. Moving to next...`);
    }
  }

  console.log('\n🎉 INDIA DATABASE COMPLETE!');
}

seedHospitality();