
import { searchPlaces } from './googleMapsService';
// import { getGeminiSuggestions } from './geminiService'; // Assuming this exists or I'll implement a stub

interface Location {
    lat: number;
    lng: number;
}

interface Activity {
    place_name: string;
    google_place_id: string;
    location: Location;
    rating: number;
    time_slot: 'morning' | 'afternoon' | 'evening';
    reasoning: string;
}

export async function generateDayItinerary(
    dayIndex: number,
    startLocationName: string | null,
    startLocationCoords: Location | null,
    preferences: { budget: string; categories: string[] }
): Promise<Activity[]> {

    const activities: Activity[] = [];
    let currentLocation = startLocationName || 'City Center';
    let currentCoords = startLocationCoords;

    const slots = ['morning', 'afternoon', 'evening'] as const;

    console.log(`[TripGen] Generating Day ${dayIndex} starting at ${currentLocation}`);

    for (const slot of slots) {
        // 1. CLUSTER SEARCH logic
        // Query: "[Category] near [Current Location]"
        // If Budget Low: "Cheap [Category] near [Current Location]"

        const category = preferences.categories[Math.floor(Math.random() * preferences.categories.length)] || 'tourist attraction';
        let query = `best ${category} near ${currentLocation}`;

        if (preferences.budget === 'Low') {
            query = `cheap ${category} near ${currentLocation}`;
        }

        console.log(`[TripGen] ${slot} Search: ${query}`);

        // Call Google Maps (Lazy Load Step 1)
        // We assume searchPlaces returns a list of Place objects
        const candidates = await searchPlaces(query, currentCoords || undefined, 5000); // 5km radius

        if (!candidates || candidates.length === 0) {
            console.warn(`[TripGen] No results for ${slot} in ${currentLocation}`);
            continue;
        }

        // 2. AI CURATION (Lazy Load Step 2)
        // Select the "best" one. 
        // Ideally we call Gemini here. For now, let's pick top rated that is NOT already used.
        // Simulating AI selection for robust "Step 1"

        const bestCandidate = candidates[0]; // Naive "Top 1" for now to prove flow
        // In real implementation: Call Gemini(candidates) -> Best Pick

        if (bestCandidate) {
            activities.push({
                place_name: bestCandidate.name,
                google_place_id: bestCandidate.id,
                location: { lat: bestCandidate.lat, lng: bestCandidate.lng },
                rating: bestCandidate.rating,
                time_slot: slot,
                reasoning: `Selected based on high rating (${bestCandidate.rating}) matching ${category}.`
            });

            // UPDATE CLUSTER CENTROID
            // Next slot searches near THIS place
            currentLocation = bestCandidate.name;
            currentCoords = { lat: bestCandidate.lat, lng: bestCandidate.lng };
        }
    }

    return activities;
}
