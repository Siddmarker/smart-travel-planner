import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import wkx from 'wkx';
import { Buffer } from 'buffer';

// --- Types ---
interface Place {
    id: string;
    name: string;
    location: any;
    place_type: 'ANCHOR' | 'SATELLITE' | 'FOOD';
    parent_anchor_id?: string;
    vibe_tags?: string[];
    lat?: number;
    lng?: number;
    description?: string;
    amenities?: string[];
    // Persona Fields
    price_tier?: 'FREE' | 'LOW' | 'MODERATE' | 'HIGH' | 'LUXURY';
    safety_score?: number;
    trend_score?: number;
    vibes?: string[];
    capacity_tier?: 'SMALL' | 'MEDIUM' | 'LARGE';
    authenticity_score?: number;
    // Runtime Fields
    is_recycled?: boolean;
    best_time_tags?: string[]; // Assuming this exists or mapped from vibes
}

// --- Helpers ---
function parseLocation(loc: string | any): { lat: number, lng: number } | null {
    if (!loc) return null;
    try {
        if (typeof loc === 'string' && /^[0-9a-fA-F]+$/.test(loc) && loc.length > 20) {
            const buffer = Buffer.from(loc, 'hex');
            const geometry = wkx.Geometry.parse(buffer) as any;
            if (geometry.x !== undefined && geometry.y !== undefined) {
                return { lat: geometry.y, lng: geometry.x };
            }
        }
        if (typeof loc === 'object' && loc.coordinates) {
            return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
        }
        if (typeof loc === 'string' && loc.startsWith('POINT')) {
            const matches = loc.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (matches) {
                return { lng: parseFloat(matches[1]), lat: parseFloat(matches[2]) };
            }
        }
    } catch (e) {
        // console.error('Location Parse Error:', e);
    }
    return null;
}

// Haversine Distance (km)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

// --- Scoring Engine ---
interface ScoringContext {
    groupType: string;
    dayNumber: number;
    previousVibes: Record<string, number>; // e.g. { 'HIGH_ENERGY': 5, 'RELAXED': 2 }
}

function calculateScore(place: Place, context: ScoringContext): number {
    const { groupType, dayNumber, previousVibes } = context;

    // 1. Base Score
    let baseScore = (place.authenticity_score || 50);
    let multiplier = 1.0;
    const placeVibes = place.vibes || [];

    // 2. Persona Weights
    // SOLO Persona
    if (groupType === 'solo') {
        if (placeVibes.includes('COMMUNAL')) multiplier += 1.0;
        if (placeVibes.includes('HIDDEN_GEM')) multiplier += 0.5;
    }

    // FAMILY Persona
    if (groupType === 'family') {
        if (placeVibes.includes('KID_FRIENDLY')) multiplier += 1.0;
        if (place.amenities?.includes('Restrooms') || place.amenities?.includes('Parking')) multiplier += 0.2;
    }

    // FRIENDS Persona
    if (groupType === 'friends') {
        const trend = place.trend_score || 0;
        if (trend > 80) multiplier += (trend / 100);
        if (placeVibes.includes('LIVELY') || placeVibes.includes('INSTAGRAMMABLE')) multiplier += 0.5;
    }

    // 3. Progressive Context Awareness (Vibe Variation)
    if (dayNumber > 1) {
        // Find dominants from previous days
        const sortedPrevVibes = Object.entries(previousVibes).sort((a, b) => b[1] - a[1]);
        const dominantVibe = sortedPrevVibes.length > 0 ? sortedPrevVibes[0][0] : null;

        // Counter-balancing logic
        if (dominantVibe === 'HIGH_ENERGY') {
            // Boost contrasting vibes
            if (placeVibes.includes('RELAXED') || placeVibes.includes('NATURE')) multiplier += 0.4;
            // Dampen same vibe slightly to force variety? Optional.
            // if (placeVibes.includes('HIGH_ENERGY')) multiplier *= 0.9; 
        } else if (dominantVibe === 'RELAXED') {
            if (placeVibes.includes('LIVELY') || placeVibes.includes('CULTURAL')) multiplier += 0.4;
        }

        // Generic variety boost: If this place's vibe hasn't been seen much, boost it.
        // Sum up how many times this place's vibes have been seen
        let familiarityScore = 0;
        placeVibes.forEach(v => {
            familiarityScore += (previousVibes[v] || 0);
        });

        // If familiarity is low, small boost for freshness
        if (familiarityScore < 2) {
            multiplier += 0.2;
        }
    }

    let finalScore = baseScore * multiplier;

    // 4. Value Velocity (Hole-in-the-Wall)
    if (place.price_tier === 'LOW' && placeVibes.includes('AUTHENTIC')) {
        finalScore *= 1.5;
    }

    return finalScore;
}


// --- Main API Route ---
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            travel_mode,
            vibe,
            group_type = 'couple',
            diet = 'Any',
            day_number = 1,
            previous_selections = [] // Array of IDs confirmed in previous days
        } = body;

        // Mock "Stay" location (Munnar Center) if not provided
        // Real app would pass this in `trip_settings` or `user_preferences`.
        const STAY_LOCATION = { lat: 10.0889, lng: 77.0595 };

        // 1. Fetch Data
        // Optimization: We could exclude previous_selections directly in SQL, 
        // but fetching all allows us to calculate previous context if valid IDs.
        const { data: placesData, error: placesError } = await supabase.from('places').select('*');

        if (placesError) {
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
        }

        // Process Locations
        const allPlaces: Place[] = (placesData || []).map((p: any) => {
            const coords = parseLocation(p.location);
            return { ...p, lat: coords?.lat, lng: coords?.lng };
        });

        // 2. Context Analysis (Vibes of previous selections)
        const previousVibes: Record<string, number> = {};
        if (previous_selections.length > 0) {
            // Filter out the objects that match previous IDs
            const prevPlaceObjects = allPlaces.filter(p => previous_selections.includes(p.id));
            prevPlaceObjects.forEach(p => {
                if (p.vibes && Array.isArray(p.vibes)) {
                    p.vibes.forEach(v => {
                        previousVibes[v] = (previousVibes[v] || 0) + 1;
                    });
                }
            });
        }

        // 3. Data Segmentation & Strict Exclusion
        // Strict Exclusion: Filter candidates that are in previous_selections
        const usedIdsSet = new Set(previous_selections);
        const candidates = allPlaces.filter(p => !usedIdsSet.has(p.id));

        const anchors = candidates.filter(p => p.place_type === 'ANCHOR');
        const satellites = candidates.filter(p => p.place_type === 'SATELLITE');
        let foodSpots = candidates.filter(p => p.place_type === 'FOOD');

        // Initial Diet Filter
        if (diet && diet !== 'Any') {
            const dietLower = diet.toLowerCase();
            const filteredFood = foodSpots.filter(p =>
                p.amenities && Array.isArray(p.amenities) &&
                p.amenities.some((a: string) => a.toLowerCase().includes(dietLower))
            );
            // Relaxed Diet: If strict filtering returns empty, keep original but maybe downrank? 
            // For now, strict if results exist, else fallback.
            if (filteredFood.length > 0) foodSpots = filteredFood;
        }

        // Satellite Mapping (Needs access to ALL satellites potentially, even if anchor is fresh? 
        // Actually, if we exclude a satellite because it was visited, we just won't suggest it. Correct.)
        // But we need the LINKING. A fresh anchor might link to a used satellite. 
        // If the satellite was used, we probably shouldn't suggest it again even if the anchor is new?
        // Yes, Strict Exclusion applies to everything. 
        // However, we need to map the satellites that ARE available.
        const satellitesByAnchor: Record<string, Place[]> = {};
        satellites.forEach(sat => {
            if (sat.parent_anchor_id) {
                if (!satellitesByAnchor[sat.parent_anchor_id]) satellitesByAnchor[sat.parent_anchor_id] = [];
                satellitesByAnchor[sat.parent_anchor_id].push(sat);
            }
        });


        // 4. Generation Logic (Single Day)

        // Track *current day* selections to avoid duplicates within the day
        const currentDaySelectedIds = new Set<string>();

        // Reusable Ranker with Spatial Logic
        const getRankedCandidates = (
            pool: Place[],
            count: number,
            slotContext: string,
            spatialConfig?: { center: { lat: number, lng: number }, minRadius?: number, maxRadius: number, type: 'INCLUDE' | 'EXCLUDE' }
        ): Place[] => {

            // 1. Filter out things picked THIS day
            let available = pool.filter(p => !currentDaySelectedIds.has(p.id));

            // 2. Spatial Filter (Initial)
            if (spatialConfig && spatialConfig.type === 'INCLUDE') {
                let filteredByRadius = available.filter(p => {
                    if (!p.lat || !p.lng) return false;
                    const d = getDistanceFromLatLonInKm(spatialConfig.center.lat, spatialConfig.center.lng, p.lat, p.lng);
                    return d <= spatialConfig.maxRadius;
                });

                // --- RADIUS EXPANSION LOGIC ---
                // If we found NO fresh candidates in the tight radius (e.g. 5km), try expanding (e.g. to 15km)
                if (filteredByRadius.length < count && spatialConfig.maxRadius < 15) {
                    console.log(`[Radius Expansion - ${slotContext}] Found ${filteredByRadius.length} in ${spatialConfig.maxRadius}km. Expanding to 15km.`);
                    const expanded = available.filter(p => {
                        if (!p.lat || !p.lng) return false;
                        const d = getDistanceFromLatLonInKm(spatialConfig.center.lat, spatialConfig.center.lng, p.lat, p.lng);
                        return d <= 15; // Hardcoded expansion target
                    });
                    available = expanded; // Use the expanded set
                } else {
                    available = filteredByRadius; // Use the initially filtered set
                }
            }

            if (spatialConfig && spatialConfig.type === 'EXCLUDE') {
                // E.g. Afternoon != Morning Zone
                available = available.filter(p => {
                    if (!p.lat || !p.lng) return true; // keep if loc missing (safe fallback)
                    const d = getDistanceFromLatLonInKm(spatialConfig.center.lat, spatialConfig.center.lng, p.lat, p.lng);
                    return d > spatialConfig.maxRadius; // Must be outside radius
                });
            }

            // 3. User Filters
            if (group_type === 'family') {
                const familySafe = available.filter(c => (c.safety_score || 0) >= 80);
                if (familySafe.length > 0) available = familySafe; // Fallback if no family safe options?
            }

            // 4. Scoring
            const scoringContext: ScoringContext = {
                groupType: group_type,
                dayNumber: day_number,
                previousVibes: previousVibes
            };

            const scored = available.map(p => ({
                place: p,
                score: calculateScore(p, scoringContext)
            }));

            scored.sort((a, b) => b.score - a.score);
            const picked = scored.slice(0, count).map(s => s.place);

            // Mark selected
            picked.forEach(p => currentDaySelectedIds.add(p.id));

            return picked;
        };

        // --- Generate Slots ---

        // 1. Morning (General High Score)
        const morningPicks = getRankedCandidates(anchors, 3, 'morning');
        const morningCenter = morningPicks.length > 0 && morningPicks[0].lat && morningPicks[0].lng
            ? { lat: morningPicks[0].lat, lng: morningPicks[0].lng }
            : STAY_LOCATION; // Default logic

        const morningOptions = morningPicks.map(anchor => {
            const linkedSats = satellitesByAnchor[anchor.id] || [];
            const validSats = linkedSats.filter(s => !currentDaySelectedIds.has(s.id));
            const satellite = validSats.length > 0 ? validSats[0] : null;
            if (satellite) currentDaySelectedIds.add(satellite.id);
            return {
                id: anchor.id,
                type: 'ANCHOR_PLUS_SAT',
                anchor: { name: anchor.name, description: anchor.description },
                satellite: satellite ? { name: satellite.name } : null,
                votes: 0
            };
        });

        // 2. Lunch (Near Morning Pick if possible, else general)
        // Let's say Lunch should be within 10km of Morning Activity
        const lunchPicks = getRankedCandidates(foodSpots, 3, 'lunch', {
            center: morningCenter,
            maxRadius: 10,
            type: 'INCLUDE'
        });
        const lunchOptions = lunchPicks.map(f => ({
            id: f.id,
            type: 'FOOD',
            place_name: f.name,
            votes: 0
        }));

        // 3. Afternoon (Exclude Morning Zone)
        // Filter pool: Nature or Activity
        const afternoonPool = [...anchors, ...satellites].filter(p =>
            p.vibes?.includes('NATURE') ||
            p.vibes?.includes('ACTIVITY') ||
            p.vibe_tags?.includes('Adventure') ||
            p.vibe_tags?.includes('Nature')
        );

        const afternoonPicks = getRankedCandidates(afternoonPool, 3, 'afternoon', {
            center: morningCenter,
            maxRadius: 5,
            type: 'EXCLUDE' // Must be > 5km from Morning center to ensure variety/movement
        });

        const afternoonOptions = afternoonPicks.map(p => {
            const linkedSats = satellitesByAnchor[p.id] || [];
            const validSats = linkedSats.filter(s => !currentDaySelectedIds.has(s.id));
            const satellite = validSats.length > 0 ? validSats[0] : null;
            const isAnchor = p.place_type === 'ANCHOR';
            if (isAnchor && satellite) currentDaySelectedIds.add(satellite.id);

            return {
                id: p.id,
                type: isAnchor ? 'ANCHOR_PLUS_SAT' : 'SATELLITE',
                anchor: { name: p.name, description: p.description },
                satellite: isAnchor && satellite ? { name: satellite.name } : null,
                votes: 0
            };
        });

        // 4. Evening Snacks (Coffee/Tea)
        const snackPicks = getRankedCandidates(foodSpots, 3, 'snacks');
        const snackOptions = snackPicks.map(f => ({
            id: f.id,
            type: 'FOOD',
            place_name: f.name,
            description: 'Evening Tea & Snacks',
            votes: 0
        }));

        // 5. Sunset (Renamed from Evening Activity)
        const sunsetPool = candidates.filter(p => !currentDaySelectedIds.has(p.id) && (
            p.best_time_tags?.includes('Sunset') ||
            p.vibe_tags?.includes('Sunset') ||
            p.vibes?.includes('SUNSET') ||
            p.name.includes('View')
        ));
        // If Sunset pool empty, fallback to general satellites that are scenic
        const eveningSource = sunsetPool.length > 0 ? sunsetPool : satellites.filter(p => p.vibes?.includes('SCENIC'));
        const sunsetPicks = getRankedCandidates(eveningSource, 3, 'sunset');

        const sunsetOptions = sunsetPicks.map(p => ({
            id: p.id,
            type: 'SATELLITE',
            anchor: { name: p.name, description: "Sunset & Views" },
            satellite: null,
            votes: 0
        }));

        // 6. Dinner (Near Stay - Radius Expansion Logic built-in to helper)
        const dinnerPicks = getRankedCandidates(foodSpots, 3, 'dinner', {
            center: STAY_LOCATION,
            maxRadius: 5, // Start with 5km
            type: 'INCLUDE'
        });
        const dinnerOptions = dinnerPicks.map(f => ({
            id: f.id,
            type: 'FOOD',
            place_name: f.name,
            description: 'Dinner near your stay',
            votes: 0
        }));

        // Construct Response
        const dayObject = {
            day_number: day_number,
            slots: {
                morning: morningOptions,
                lunch: lunchOptions,
                afternoon: afternoonOptions,
                evening_snacks: snackOptions, // Ensure snake_case matches frontend expectation
                sunset: sunsetOptions, // Renamed from evening_activity
                dinner: dinnerOptions
            }
        };

        return NextResponse.json({
            trip_id: `trip_${Date.now()}`,
            trip_settings: { travel_mode, vibe, group_type, day_current: day_number },
            day: dayObject
        });

    } catch (error: any) {
        console.error('Trip Gen Critical Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
