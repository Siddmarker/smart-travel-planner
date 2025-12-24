import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// 1. Setup Config
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// 2. The Target List (We will start with these 5 hubs)
const TARGET_CITIES = [
  'Goa',
  'Jaipur',
  'Varkala',
  'Manali',
  'Udaipur' 
];

// 3. The Master Prompt Generator
function createPrompt(city: string) {
  return `
    You are a travel data scientist. Generate 20 distinct travel locations for "${city}", India.
    
    Requirements:
    - 7 Anchors (Major landmarks)
    - 7 Satellites (Hidden gems, viewpoints, activities)
    - 6 Food Spots (Famous cafes, street food, fine dining)

    Return ONLY a valid JSON array. No markdown, no text. Schema:
    [
      {
        "name": "String (Official Name)",
        "description": "String (Short, punchy, focusing on vibe)",
        "lat": Number (Precise Decimal),
        "lng": Number (Precise Decimal),
        "type": "Enum: 'ANCHOR' | 'SATELLITE' | 'FOOD'",
        "vibes": ["Array of strings e.g. 'NATURE', 'HISTORY', 'PARTY', 'CALM', 'FAMILY']",
        "best_time_tags": ["Array e.g. 'MORNING', 'SUNSET', 'LATE_NIGHT']",
        "price_tier": "Enum: 'FREE' | 'LOW' | 'MODERATE' | 'HIGH'",
        "safety_score": Number (0-100),
        "trend_score": Number (0-100),
        "best_months": [Array of integers 1-12]
      }
    ]
  `;
}

// 4. The Processing Loop
async function seedIndia() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  console.log('🚀 Starting India Seeder Factory...');

  for (const city of TARGET_CITIES) {
    console.log(`\n📍 Processing Hub: ${city}...`);
    
    try {
      // A. Ask AI for Data
      const result = await model.generateContent(createPrompt(city));
      const response = await result.response;
      const text = response.text();
      
      // B. Clean & Parse JSON
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const placesData = JSON.parse(cleanJson);

      console.log(`   ✅ AI generated ${placesData.length} places for ${city}.`);

      // C. Insert into Supabase
      const placesWithZone = placesData.map((p: any) => ({
        ...p,
        zone_id: city.toUpperCase() // Grouping by City
      }));

      const { error } = await supabase
        .from('places')
        .upsert(placesWithZone, { onConflict: 'name' });

      if (error) {
        console.error(`   ❌ Supabase Error for ${city}:`, error.message);
      } else {
        console.log(`   💾 Saved to Database!`);
      }

    } catch (err) {
      console.error(`   💀 Failed to process ${city}:`, err);
    }
  }

  console.log('\n🎉 Mission Complete! India Database Updated.');
}

seedIndia();