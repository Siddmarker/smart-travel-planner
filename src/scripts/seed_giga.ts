
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER: Random Coordinate Generator ---
// Munnar Center: 10.0889, 77.0595
function getRandomLocation(baseLat = 10.0889, baseLng = 77.0595, radiusKm = 10) {
    const r = radiusKm / 111.32; // Convert km to degrees roughly
    const u = Math.random();
    const v = Math.random();
    const w = r * Math.sqrt(u);
    const t = 2 * Math.PI * v;
    const x = w * Math.cos(t);
    const y = w * Math.sin(t);

    // Adjust x (longitude) for the latitude shrinking
    const newLat = baseLat + y;
    const newLng = baseLng + (x / Math.cos(baseLat));

    // PostGIS Point Format: 'POINT(lng lat)'
    return `POINT(${newLng.toFixed(6)} ${newLat.toFixed(6)})`;
}

const PLACES = [
    // --- 10 ANCHORS ---
    {
        name: "Mattupetty Dam",
        place_type: "ANCHOR",
        description: "Famous storage concrete gravity dam offering boating and scenic views of the tea gardens.",
        vibes: ["NATURE", "ACTIVITY", "FAMILY"],
        vibe_tags: ["Boating", "Scenic", "Dam"],
        best_time_tags: ["Morning", "Afternoon"],
        price_tier: "LOW",
        authenticity_score: 85,
        location: getRandomLocation()
    },
    {
        name: "Tea Museum",
        place_type: "ANCHOR",
        description: "Showcasing the history of tea plantations in Munnar with machinery and artifacts.",
        vibes: ["CULTURAL", "INDOOR", "HISTORY"],
        vibe_tags: ["History", "Tea", "Learning"],
        best_time_tags: ["Morning", "Afternoon"],
        price_tier: "MODERATE",
        authenticity_score: 90,
        location: getRandomLocation()
    },
    {
        name: "Eravikulam National Park",
        place_type: "ANCHOR",
        description: "Home to the endangered Nilgiri Tahr and blooming Neelakurinji flowers.",
        vibes: ["NATURE", "ADVENTURE", "HIKING"],
        vibe_tags: ["Wildlife", "Trekking", "Views"],
        best_time_tags: ["Morning"],
        price_tier: "MODERATE",
        authenticity_score: 95,
        location: getRandomLocation()
    },
    {
        name: "Top Station",
        place_type: "ANCHOR",
        description: "Highest point in Munnar offering panoramic views of the Western Ghats.",
        vibes: ["SCENIC", "NATURE", "SUNSET"],
        vibe_tags: ["Viewpoint", "Clouds", "Sunset"],
        best_time_tags: ["Morning", "Sunset"],
        price_tier: "FREE",
        authenticity_score: 92,
        location: getRandomLocation()
    },
    {
        name: "Blossom International Park",
        place_type: "ANCHOR",
        description: "Beautiful park with rare flowers, boating, and adventure activities.",
        vibes: ["FAMILY", "RELAXED", "NATURE"],
        vibe_tags: ["Flowers", "Picnic", "Walk"],
        best_time_tags: ["Afternoon", "Evening"],
        price_tier: "LOW",
        authenticity_score: 80,
        location: getRandomLocation()
    },
    {
        name: "Pothamedu Viewpoint",
        place_type: "ANCHOR",
        description: "A vantage point with breathtaking views of tea, coffee, and cardamom plantations.",
        vibes: ["SCENIC", "NATURE", "PHOTOGRAPHY"],
        vibe_tags: ["Viewpoint", "Greenery"],
        best_time_tags: ["Sunset", "Morning"],
        price_tier: "FREE",
        authenticity_score: 88,
        location: getRandomLocation()
    },
    {
        name: "Attukad Waterfalls",
        place_type: "ANCHOR",
        description: "A scenic waterfall amidst rolling hills and jungles, majestic during monsoon.",
        vibes: ["NATURE", "ADVENTURE", "SCENIC"],
        vibe_tags: ["Waterfalls", "Hiking", "Nature"],
        best_time_tags: ["Morning", "Afternoon"],
        price_tier: "FREE",
        authenticity_score: 89,
        location: getRandomLocation()
    },
    {
        name: "Marayoor Dolmens",
        place_type: "ANCHOR",
        description: "Prehistoric megalithic burial chambers and enchanting sandalwood forests.",
        vibes: ["HISTORY", "CULTURAL", "MYSTIC"],
        vibe_tags: ["Ancient", "Archaeology", "Sandalwood"],
        best_time_tags: ["Morning", "Afternoon"],
        price_tier: "FREE",
        authenticity_score: 94,
        location: getRandomLocation()
    },
    {
        name: "Anamudi Peak",
        place_type: "ANCHOR",
        description: "The highest peak in South India, perfect for trekking enthusiasts.",
        vibes: ["ADVENTURE", "HIKING", "CHALLENGING"],
        vibe_tags: ["Trekking", "Mountain", "Wild"],
        best_time_tags: ["Morning"],
        price_tier: "LOW",
        authenticity_score: 96,
        location: getRandomLocation()
    },
    {
        name: "Wonder Valley Adventure Park",
        place_type: "ANCHOR",
        description: "Amusement park customized for adventure lovers with ziplines and varied rides.",
        vibes: ["ACTIVITY", "FAMILY", "THRILL"],
        vibe_tags: ["Fun", "Ride", "Adventure"],
        best_time_tags: ["Morning", "Afternoon"],
        price_tier: "HIGH",
        authenticity_score: 75,
        location: getRandomLocation()
    },

    // --- 15 SATELLITES ---
    {
        name: "Echo Point",
        place_type: "SATELLITE",
        description: "A scenic spot known for its natural echo phenomenon.",
        vibes: ["FUN", "NATURE"],
        vibe_tags: ["Echo", "Lake", "Quick Stop"],
        best_time_tags: ["Morning", "Afternoon"],
        location: getRandomLocation()
    },
    {
        name: "Photo Point",
        place_type: "SATELLITE",
        description: "Picturesque curve of tea gardens perfect for photos.",
        vibes: ["PHOTOGRAPHY", "QUICK"],
        vibe_tags: ["Photo", "Tea Garden"],
        best_time_tags: ["Any"],
        location: getRandomLocation()
    },
    {
        name: "Elephant Arrival Spot",
        place_type: "SATELLITE",
        description: "Chance to spot wild elephants and ride tame ones.",
        vibes: ["WILDLIFE", "FAMILY"],
        vibe_tags: ["Elephants", "Ride"],
        best_time_tags: ["Morning"],
        location: getRandomLocation()
    },
    {
        name: "Lockhart Gap",
        place_type: "SATELLITE",
        description: "A gap in the mountains offering a view of the valley below.",
        vibes: ["SCENIC", "VIEW"],
        vibe_tags: ["Valley", "Drive"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },
    {
        name: "Chokramudi Peak",
        place_type: "SATELLITE",
        description: "Isolated peak suitable for a short hike and sunset views.",
        vibes: ["ADVENTURE", "QUIET"],
        vibe_tags: ["Hike", "Solitude"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },
    {
        name: "Rose Garden",
        place_type: "SATELLITE",
        description: "A maintained garden with variety of roses and other flora.",
        vibes: ["RELAXED", "FAMILY"],
        vibe_tags: ["Flowers", "Garden"],
        best_time_tags: ["Afternoon"],
        location: getRandomLocation()
    },
    {
        name: "Honey Bee Tree",
        place_type: "SATELLITE",
        description: "A large tree housing multiple massive beehives.",
        vibes: ["NATURE", "QUICK"],
        vibe_tags: ["Curiosity"],
        best_time_tags: ["Any"],
        location: getRandomLocation()
    },
    {
        name: "Pallivasal Falls",
        place_type: "SATELLITE",
        description: "Small but beautiful waterfall near the hydro-electric project.",
        vibes: ["NATURE", "WATER"],
        vibe_tags: ["Waterfall", "Quick Stop"],
        best_time_tags: ["Afternoon"],
        location: getRandomLocation()
    },
    {
        name: "Nyayamakad Waterfalls",
        place_type: "SATELLITE",
        description: "A cascading waterfall visible from the road to Rajamala.",
        vibes: ["SCENIC", "DRIVE"],
        vibe_tags: ["Waterfall", "View"],
        best_time_tags: ["Morning"],
        location: getRandomLocation()
    },
    {
        name: "Gap Road Viewpoint",
        place_type: "SATELLITE",
        description: "Stunning stretch of road with steep drops and cloud views.",
        vibes: ["DRIVE", "SCENIC"],
        vibe_tags: ["Roadtrip", "Mist"],
        best_time_tags: ["Any"],
        location: getRandomLocation()
    },
    {
        name: "Devikulam Lake",
        place_type: "SATELLITE",
        description: "Legendary lake with pristine waters, good for a quiet stop.",
        vibes: ["QUIET", "MYTHOLOGY"],
        vibe_tags: ["Peaceful", "Lake"],
        best_time_tags: ["Morning"],
        location: getRandomLocation()
    },
    {
        name: "Power House Waterfalls",
        place_type: "SATELLITE",
        description: "Waterfalls originating from the Sita Devi Kulam lake.",
        vibes: ["NATURE", "POWERFUL"],
        vibe_tags: ["Waterfall"],
        best_time_tags: ["Afternoon"],
        location: getRandomLocation()
    },
    {
        name: "C.S.I Christ Church",
        place_type: "SATELLITE",
        description: "Old stone church with stained glass windows and history.",
        vibes: ["HISTORY", "QUIET"],
        vibe_tags: ["Architecture", "Church"],
        best_time_tags: ["Afternoon"],
        location: getRandomLocation()
    },
    {
        name: "Floriculture Centre",
        place_type: "SATELLITE",
        description: "Run by KTDC, housing rare herbal plants and flowers.",
        vibes: ["EDUCATIONAL", "NATURE"],
        vibe_tags: ["Plants", "Garden"],
        best_time_tags: ["Morning"],
        location: getRandomLocation()
    },
    {
        name: "High Range Club",
        place_type: "SATELLITE",
        description: "Colonial era club with old world charm.",
        vibes: ["HISTORY", "LUXURY"],
        vibe_tags: ["Colonial", "Club"],
        best_time_tags: ["Evening"],
        location: getRandomLocation()
    },

    // --- 15 FOOD SPOTS ---
    {
        name: "Saravana Bhavan",
        place_type: "FOOD",
        description: "Classic South Indian vegetarian cuisine.",
        vibes: ["VEG", "FAMILY", "BUSY"],
        amenities: ["Restrooms", "Veg"],
        price_tier: "LOW",
        authenticity_score: 90,
        best_time_tags: ["Lunch", "Dinner", "Morning"],
        location: getRandomLocation()
    },
    {
        name: "Guru's Restaurant",
        place_type: "FOOD",
        description: "Famous for local Kerala meals and fish curry.",
        vibes: ["AUTHENTIC", "SPICY", "LOCAL"],
        amenities: ["Non-Veg"],
        price_tier: "LOW",
        authenticity_score: 92,
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Tea County Restaurant",
        place_type: "FOOD",
        description: "Upscale dining with a mix of continental and local dishes.",
        vibes: ["LUXURY", "QUIET", "ROMANTIC"],
        amenities: ["Bar", "Service"],
        price_tier: "HIGH",
        authenticity_score: 85,
        best_time_tags: ["Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Butler's Creek",
        place_type: "FOOD",
        description: "Cozy cafe with nice ambiance and fusion food.",
        vibes: ["MODERN", "COZY", "YOUTH"],
        amenities: ["Wifi", "Coffee"],
        price_tier: "MODERATE",
        authenticity_score: 80,
        best_time_tags: ["Lunch", "Snacks"],
        location: getRandomLocation()
    },
    {
        name: "Rajan Thattukada",
        place_type: "FOOD",
        description: "Street food stall legendary for beef fry and parotta.",
        vibes: ["STREET", "LOCAL", "LIVELY"],
        amenities: ["Quick"],
        price_tier: "LOW",
        authenticity_score: 98,
        best_time_tags: ["Dinner", "Snacks"],
        location: getRandomLocation()
    },
    {
        name: "Rapsy Restaurant",
        place_type: "FOOD",
        description: "Known for its biriyani and Spanish omelette.",
        vibes: ["BUSY", "POPULAR"],
        price_tier: "LOW",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Sree Mahaveer Bhojanalaya",
        place_type: "FOOD",
        description: "Pure North Indian vegetarian food.",
        vibes: ["VEG", "NORTH_INDIAN"],
        price_tier: "LOW",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Rochas Restaurant",
        place_type: "FOOD",
        description: "Great spot for fried chicken and burgers.",
        vibes: ["CASUAL", "FAST_FOOD"],
        price_tier: "MODERATE",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Alibaba & 41 Dishes",
        place_type: "FOOD",
        description: "Extensive menu with Arabian and seafood specialties.",
        vibes: ["VARIETY", "FAMILY"],
        price_tier: "MODERATE",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Copper Castle",
        place_type: "FOOD",
        description: "Restaurant with a view of the valley.",
        vibes: ["SCENIC", "FINE_DINING"],
        price_tier: "HIGH",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Pizza Max",
        place_type: "FOOD",
        description: "Best pizza place in town.",
        vibes: ["MODERN", "PIZZA"],
        price_tier: "MODERATE",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },
    {
        name: "KTDC Tea County",
        place_type: "FOOD",
        description: "Buffet spreads and colonial ambiance.",
        vibes: ["BUFFET", "CLASSIC"],
        price_tier: "HIGH",
        best_time_tags: ["Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Mayabazar",
        place_type: "FOOD",
        description: "Themed restaurant with good vibes.",
        vibes: ["THEMED", "FUN"],
        price_tier: "MODERATE",
        best_time_tags: ["Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Silvertips Restaurant",
        place_type: "FOOD",
        description: "Movie themed luxury restaurant.",
        vibes: ["CINEMA", "LUXURY"],
        price_tier: "HIGH",
        best_time_tags: ["Dinner"],
        location: getRandomLocation()
    },
    {
        name: "Zeviya",
        place_type: "FOOD",
        description: "Local seafood delight.",
        vibes: ["LOCAL", "SEAFOOD"],
        price_tier: "MODERATE",
        best_time_tags: ["Lunch", "Dinner"],
        location: getRandomLocation()
    },

    // --- 5 SUNSET SPOTS ---
    {
        name: "Pothamedu Sunset Point",
        place_type: "SATELLITE", // Can be anchor too, but marked sat for variety
        description: "Specifically famous for the golden hour views.",
        vibes: ["SUNSET", "ROMANTIC", "SCENIC"],
        vibe_tags: ["Sunset", "Golden Hour"],
        best_time_tags: ["Sunset"],
        price_tier: "FREE",
        authenticity_score: 95,
        location: getRandomLocation()
    },
    {
        name: "Chithirapuram View Point",
        place_type: "SATELLITE",
        description: "Rustic charm and old cottages with a sunset backdrop.",
        vibes: ["SUNSET", "RUSTIC"],
        vibe_tags: ["Sunset", "Village"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },
    {
        name: "Karadipara View Point",
        place_type: "SATELLITE",
        description: "A lesser known spot for evening skies.",
        vibes: ["QUIET", "SUNSET"],
        vibe_tags: ["Sunset", "Peace"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },
    {
        name: "Pallivasal Tea Garden Sunset",
        place_type: "SATELLITE",
        description: "Watch the sun go down behind layers of tea leaves.",
        vibes: ["NATURE", "SUNSET", "GREEN"],
        vibe_tags: ["Sunset", "Tea"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },
    {
        name: "Vattavada Slope",
        place_type: "SATELLITE",
        description: "Open slopes perfect for watching the evening sky.",
        vibes: ["OPEN", "SUNSET"],
        vibe_tags: ["Sunset", "Hills"],
        best_time_tags: ["Sunset"],
        location: getRandomLocation()
    },

    // --- 5 EVENING SNACKS ---
    {
        name: "Munnar Tea Shop",
        place_type: "FOOD",
        description: "Fresh tea from the factory door.",
        vibes: ["TEA", "QUICK"],
        vibe_tags: ["Chai", "Snacks"],
        best_time_tags: ["Snacks"],
        price_tier: "LOW",
        authenticity_score: 90,
        location: getRandomLocation()
    },
    {
        name: "Post Office Junction Stalls",
        place_type: "FOOD",
        description: "Variety of fried snacks (Bajjis).",
        vibes: ["STREET", "SNACKS"],
        vibe_tags: ["Bajji", "Spicy"],
        best_time_tags: ["Snacks"],
        price_tier: "LOW",
        location: getRandomLocation()
    },
    {
        name: "Supreme Bakery",
        place_type: "FOOD",
        description: "Famous for cakes and puffs.",
        vibes: ["BAKERY", "SWEET"],
        vibe_tags: ["Cake", "Puff"],
        best_time_tags: ["Snacks"],
        price_tier: "LOW",
        location: getRandomLocation()
    },
    {
        name: "Sri Niwas Sweets",
        place_type: "FOOD",
        description: "Indian sweets and savory snacks.",
        vibes: ["SWEET", "TRADITIONAL"],
        vibe_tags: ["Mithai"],
        best_time_tags: ["Snacks"],
        location: getRandomLocation()
    },
    {
        name: "Old Munnar Cafe",
        place_type: "FOOD",
        description: "Nostalgic vibes with hot coffee.",
        vibes: ["NOSTALGIA", "COFFEE"],
        vibe_tags: ["Coffee", "Relax"],
        best_time_tags: ["Snacks"],
        location: getRandomLocation()
    }
];

async function seedGiga() {
    console.log(`🌱 Starting GIGA SEED (${PLACES.length} Items)...`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < PLACES.length; i++) {
        const place = PLACES[i];
        process.stdout.write(`   Processing ${i + 1}/${PLACES.length}: ${place.name}... `);

        // MAP DATA TO EXISTING SCHEMA (vibes, amenities) because vibe_tags/best_time_tags don't exist

        // 1. Vibes: Merge explicit vibes + best_time_tags (as uppercase)
        const baseVibes = place.vibes || [];
        const timeVibes = (place.best_time_tags || []).map(t => t.toUpperCase());
        const mergedVibes = Array.from(new Set([...baseVibes, ...timeVibes]));

        // 2. Amenities: Merge amenities + vibe_tags
        const baseAmenities = place.amenities || [];
        const extraAmenities = place.vibe_tags || [];
        const mergedAmenities = Array.from(new Set([...baseAmenities, ...extraAmenities]));

        // Create Payload
        const insertPayload: any = { ...place };
        insertPayload.vibes = mergedVibes;
        insertPayload.amenities = mergedAmenities;

        // Remove non-existent columns
        delete insertPayload.best_time_tags;
        delete insertPayload.vibe_tags;

        const { data: existing } = await supabase.from('places').select('id').eq('name', place.name).single();

        let error;
        if (existing) {
            // Update
            const { error: err } = await supabase.from('places').update(insertPayload).eq('id', existing.id);
            error = err;
        } else {
            // Insert
            const { error: err } = await supabase.from('places').insert(insertPayload);
            error = err;
        }

        if (error) {
            console.log(`❌ Error: ${error.message}`);
            errorCount++;
        } else {
            console.log(`✅`);
            successCount++;
        }
    }

    console.log(`\n🎉 GIGA SEED COMPLETE`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
}

seedGiga().catch(e => console.error("Fatal:", e));
