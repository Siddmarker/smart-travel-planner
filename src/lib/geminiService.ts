import { UserProfile, Place } from '@/types';

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export async function getDestinationSuggestions(preferences: UserProfile['travelPreferences']): Promise<Place[]> {
    if (!GEMINI_API_KEY) {
        console.error('Gemini API key is missing');
        return [];
    }

    const prompt = `
    You are a travel destination expert. Suggest 5 TRAVEL DESTINATIONS (countries, cities, or regions) based on these preferences:
    - Activity Level: ${preferences.activityLevel}
    - Budget: ${preferences.budgetRange}
    - Interests: ${preferences.accommodationTypes.join(', ')}, ${preferences.transportModes.join(', ')}
    
    IMPORTANT RULES:
    1. Suggest only GEOGRAPHIC DESTINATIONS like countries, cities, or tourist regions
    2. DO NOT suggest specific hotels, restaurants, or local businesses
    3. Focus on places people would plan a trip to (e.g., "Paris, France", "Kyoto, Japan", "Swiss Alps")
    4. Each destination should be a place where tourists typically spend multiple days
    
    Return the response as a JSON array of objects with the following fields:
    - name: string (must be a city, country, or region name)
    - description: string (brief description of why this destination matches the preferences)
    - lat: number (approximate latitude of the destination)
    - lng: number (approximate longitude of the destination)
    - category: string (one of: 'nature', 'culture', 'adventure', 'food', 'attraction')
    - rating: number (4.0-5.0, general destination appeal)
    - priceLevel: number (1-4, typical cost level for visiting this destination)
    
    Ensure the response is valid JSON. Do not include markdown formatting or code blocks.
  `;

    try {
        const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            console.error('Invalid response from Gemini:', data);
            return [];
        }

        const text = data.candidates[0].content.parts[0].text;
        // Clean up markdown if present
        const jsonString = text.replace(/```json\n|\n```/g, '').replace(/```/g, '');

        const suggestions = JSON.parse(jsonString);

        // Add IDs and other missing fields to match Place interface
        return suggestions.map((s: any, index: number) => ({
            ...s,
            id: `gemini-suggestion-${index}-${Date.now()}`,
            reviews: 0,
            image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80' // Placeholder
        }));
    } catch (error) {
        console.error('Error fetching suggestions from Gemini:', error);
        return [];
    }
}
