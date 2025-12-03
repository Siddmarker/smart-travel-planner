
// Standalone test for SmartItineraryPlanner logic

class MockPlanner {
    constructor() {
        this.trip = { destination: 'Paris' };
    }

    getFallbackSuggestions(slot) {
        return [{ name: `Fallback ${slot}`, category: 'Fallback' }];
    }

    // COPIED LOGIC FROM smart-planner.ts
    parseGeminiDayResponse(geminiResponse) {
        const suggestions = {
            morning: [],
            afternoon: [],
            evening: []
        };

        try {
            // Extract JSON from response
            const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('[SmartPlanner] No JSON found in response, using fallbacks');
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Process each slot
            ['morning', 'afternoon', 'evening'].forEach(slot => {
                if (parsed[slot] && Array.isArray(parsed[slot]) && parsed[slot].length > 0) {
                    suggestions[slot] = parsed[slot]
                        .slice(0, 3)
                        .map((suggestion, index) => ({
                            ...suggestion,
                            id: `smart-suggestion-${slot}-${Date.now()}-${index}`,
                            slot: slot,
                            distanceScore: 0.8, // Default for speed
                            categoryMatch: 0.9,
                            overallScore: 85 + Math.floor(Math.random() * 10), // Mock score for speed
                            rating: 4.5,
                            reviews: 100,
                            priceLevel: suggestion.cost_range?.length || 2,
                            image: '',
                            rawTypes: [suggestion.category],
                            vicinity: this.trip.destination,
                            tags: ['Smart Suggestion']
                        }));
                } else {
                    console.warn(`[SmartPlanner] Empty or invalid data for ${slot}, using fallback`);
                    suggestions[slot] = this.getFallbackSuggestions(slot);
                }
            });

        } catch (error) {
            console.error('Error parsing Gemini response:', error);
            // Return fallbacks for all slots
            suggestions.morning = this.getFallbackSuggestions('morning');
            suggestions.afternoon = this.getFallbackSuggestions('afternoon');
            suggestions.evening = this.getFallbackSuggestions('evening');
        }

        return suggestions;
    }
}

// TEST CASES
const planner = new MockPlanner();

console.log('--- Test 1: Valid Response ---');
const validResponse = JSON.stringify({
    morning: [{ name: 'A', category: 'A' }],
    afternoon: [{ name: 'B', category: 'B' }],
    evening: [{ name: 'C', category: 'C' }]
});
const result1 = planner.parseGeminiDayResponse(validResponse);
console.log('Morning length:', result1.morning.length);
if (result1.morning.length === 1 && result1.morning[0].name === 'A') console.log('PASS'); else console.error('FAIL');

console.log('\n--- Test 2: Empty Arrays (The Issue) ---');
const emptyResponse = JSON.stringify({
    morning: [],
    afternoon: [],
    evening: []
});
const result2 = planner.parseGeminiDayResponse(emptyResponse);
console.log('Morning length:', result2.morning.length);
console.log('Morning name:', result2.morning[0]?.name);
if (result2.morning.length === 1 && result2.morning[0].name === 'Fallback morning') console.log('PASS'); else console.error('FAIL');

console.log('\n--- Test 3: Invalid JSON ---');
const invalidResponse = "I am not JSON";
const result3 = planner.parseGeminiDayResponse(invalidResponse);
console.log('Morning length:', result3.morning.length);
if (result3.morning.length === 1 && result3.morning[0].name === 'Fallback morning') console.log('PASS'); else console.error('FAIL');
