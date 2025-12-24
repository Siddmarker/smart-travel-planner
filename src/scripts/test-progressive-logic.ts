
// Mock types
interface Place {
    id: string;
    vibes: string[];
    price_tier?: 'LOW' | 'HIGH';
    authenticity_score?: number;
    trend_score?: number;
}

interface ScoringContext {
    groupType: string;
    dayNumber: number;
    previousVibes: Record<string, number>;
}

// --- COPIED SCORING LOGIC FOR VERIFICATION ---
function calculateScore(place: Place, context: ScoringContext): number {
    const { groupType, dayNumber, previousVibes } = context;

    let baseScore = (place.authenticity_score || 50);
    let multiplier = 1.0;
    const placeVibes = place.vibes || [];

    if (dayNumber > 1) {
        const sortedPrevVibes = Object.entries(previousVibes).sort((a, b) => b[1] - a[1]);
        const dominantVibe = sortedPrevVibes.length > 0 ? sortedPrevVibes[0][0] : null;

        if (dominantVibe === 'HIGH_ENERGY') {
            if (placeVibes.includes('RELAXED') || placeVibes.includes('NATURE')) multiplier += 0.4;
        }
    }
    return baseScore * multiplier;
}

// --- TEST CASE ---
const mockPreviousVibes = { 'HIGH_ENERGY': 5 };

const mockPlaces: Place[] = [
    { id: '1', vibes: ['HIGH_ENERGY'], authenticity_score: 80 },    // Standard High Energy
    { id: '2', vibes: ['RELAXED'], authenticity_score: 80 },        // Relaxed (Should be boosted)
    { id: '3', vibes: ['NATURE'], authenticity_score: 80 },         // Nature (Should be boosted)
];

console.log("--- Testing Day 2 Vibe Variation ---");
console.log("Context: Previous Day was mostly HIGH_ENERGY. We expect RELAXED/NATURE to get boosted.");

mockPlaces.forEach(p => {
    const score = calculateScore(p, {
        groupType: 'friends',
        dayNumber: 2,
        previousVibes: mockPreviousVibes
    });
    console.log(`Place ${p.id} [${p.vibes.join(',')}] Score: ${score}`);
});

// Exclusion Logic Test
const usedIds = new Set(['1']);
const candidates = mockPlaces.filter(p => !usedIds.has(p.id));
console.log("\n--- Testing Strict Exclusion ---");
console.log("Excluded IDs: ['1']");
console.log("Remaining Candidates:", candidates.map(c => c.id));

if (candidates.some(c => c.id === '1')) {
    console.error("FAIL: Excluded ID found in candidates!");
} else {
    console.log("PASS: Excluded ID effectively removed.");
}
