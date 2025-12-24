import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// --- THE MASTER INDIA LIST (50+ Hubs) ---
const TARGET_CITIES = [
  // NORTH INDIA
  'Leh Ladakh', 'Srinagar', 'Manali', 'Shimla', 'Dharamshala', 'Dalhousie',
  'Rishikesh', 'Mussoorie', 'Nainital', 'Amritsar', 'Chandigarh',
  'Delhi', 'Agra', 'Varanasi', 'Lucknow', 'Ayodhya',

  // WEST INDIA
  'Jaipur', 'Udaipur', 'Jodhpur', 'Jaisalmer', 'Pushkar', 'Mount Abu',
  'Ahmedabad', 'Rann of Kutch', 'Mumbai', 'Pune', 'Lonavala', 'Mahabaleshwar',
  'Goa', 'Nashik',

  // SOUTH INDIA
  'Bengaluru', 'Mysore', 'Coorg', 'Chikmagalur', 'Hampi', 'Gokarna',
  'Udupi', 'Wayanad', 'Munnar', 'Thekkady', 'Alleppey', 'Varkala', 'Kochi',
  'Ooty', 'Kodaikanal', 'Chennai', 'Pondicherry', 'Mahabalipuram',
  'Madurai', 'Rameshwaram', 'Kanyakumari', 'Hyderabad',

  // EAST & NORTH EAST
  'Kolkata', 'Darjeeling', 'Gangtok', 'Pelling', 'Shillong', 'Cherrapunji',
  'Guwahati', 'Tawang', 'Puri', 'Konark',

  // ISLANDS
  'Andaman Nicobar', 'Lakshadweep'
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function createPersonaPrompt(city: string) {
  return `
    You are a hyper-local travel curator for "${city}", India.
    Generate a diverse list of 30 DISTINCT places/experiences categorized by Traveler Type.

    STRICT REQUIREMENTS:
    
    1. **COLLECTION A: SOLO & AUTHENTIC (10 Places)**
       - Focus: Safety, Social Hostels, Hidden Cafes, Art spaces, Quiet Sunset spots.
       - Vibe Tags: "SOLO", "QUIET", "WORK_FRIENDLY", "HIDDEN_GEM"
       
    2. **COLLECTION B: FAMILY & COMFORT (10 Places)**
       - Focus: Easy accessibility, Kids-friendly resorts, Safe swimming spots, Mild treks, Heritage sites.
       - Vibe Tags: "FAMILY", "SAFE", "RELAXED", "LUXURY", "KIDS_FRIENDLY"

    3. **COLLECTION C: FRIENDS & THRILL (10 Places)**
       - Focus: Adventure sports, Nightlife, Group treks, Instagram-famous spots, Street food clusters.
       - Vibe Tags: "FRIENDS", "PARTY", "ADVENTURE", "STREET_FOOD", "INSTAGRAMMABLE"

    *CRITICAL RULES:*
    - NO GENERIC NAMES.
    - "lat" and "lng" must be precise.
    
    Return ONLY a valid JSON array. Schema:
    [
      {
        "name": "String",
        "description": "String (Max 25 words)",
        "lat": Number,
        "lng": Number,
        "type": "Enum: 'STAY' | 'FOOD' | 'ACTIVITY' | 'HIDDEN_GEM'",
        "vibes": ["Array of strings"],
        "price_tier": "Enum: 'FREE' | 'BUDGET' | 'MODERATE' | 'LUXURY'",
        "best_time_tags": ["Array e.g. 'MORNING', 'SUNSET', 'NIGHT']",
        "safety_score": Number (80-100),
        "trend_score": Number (70-100),
        "authenticity_score": Number (1-100)  <-- NEW FIELD ADDED HERE
      }
    ]
  `;
}

async function seedPersonas() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  console.log(`🚀 Starting Full-Scale India Persona Seeder (${TARGET_CITIES.length} Cities)...`);

  for (const city of TARGET_CITIES) {
    console.log(`\n🎭 Processing: ${city}...`);
    // 4 Second Pause: Critical for heavy "Persona" prompts to avoid crashes
    await delay(4000); 

    try {
      const result = await model.generateContent(createPersonaPrompt(city));
      const response = await result.response;
      const text = response.text();
      
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const placesData = JSON.parse(cleanJson);

      console.log(`   ✅ Generated ${placesData.length} unique spots.`);

      const placesWithZone = placesData.map((p: any) => ({
        ...p,
        zone_id: city.toUpperCase()
      }));

      const { error } = await supabase
        .from('places')
        .upsert(placesWithZone, { onConflict: 'name' });

      if (error) console.error(`   ❌ DB Error:`, error.message);
      else console.log(`   💾 Saved to Database!`);

    } catch (err) {
      console.error(`   💀 Failed for ${city}. Skipping...`);
    }
  }

  console.log('\n🎉 INDIA PERSONA UPGRADE COMPLETE!');
}

seedPersonas();