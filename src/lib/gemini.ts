import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiAI = {
    // Generate Itinerary
    generateItinerary: async (destination: any, dates: any, preferences: any) => {
        try {
            if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
        Create a detailed travel itinerary for a trip to ${destination.mainLocation.address} 
        from ${new Date(dates.start).toDateString()} to ${new Date(dates.end).toDateString()}.
        
        Preferences:
        - Budget: ${preferences.budget.range}
        - Group Type: ${preferences.groupType}
        - Interests: ${preferences?.categories?.join(', ') || 'General'}
        
        Please provide the response in a structured JSON format with the following schema:
        {
          "days": [
            {
              "dayNumber": 1,
              "date": "YYYY-MM-DD",
              "morning": { "activities": [], "notes": "" },
              "afternoon": { "activities": [], "notes": "" },
              "evening": { "activities": [], "notes": "" }
            }
          ],
          "highlights": [],
          "tips": []
        }
      `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Extract JSON from response (handling potential markdown code blocks)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return { error: "Failed to parse AI response" };

        } catch (error) {
            console.error('Gemini AI Error:', error);
            return {
                days: [],
                highlights: ["Error generating itinerary"],
                tips: ["Please check API key or try again later"]
            };
        }
    },

    // Suggest Places
    suggestPlaces: async (query: string, location: string) => {
        try {
            if (!apiKey) return [];
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const prompt = `Suggest 5 popular places for "${query}" near ${location}. Return as JSON array of objects with name, description, and type.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return [];
        } catch (error) {
            console.error('Gemini Suggest Error:', error);
            return [];
        }
    },

    // Empathy Engine: Vibe Check
    ratePlaces: async (places: any[], userVibe: string) => {
        try {
            if (!apiKey) return places.map(p => ({ ...p, vibeScore: 50, reason: "Default (No API Key)" }));

            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // Minimal payload to save tokens
            const placesPayload = places.map((p, index) => ({
                id: index,
                name: p.name,
                types: p.types || p.category,
                rating: p.rating,
                reviews: p.reviews
            }));

            const prompt = `
                Score these places 0-100 based on the user's vibe: [${userVibe}]. 
                Identify 'Hidden Gems' (High rating > 4.5, low reviews < 500).
                Return a JSON Object where keys are the place indices and values are objects with { "score": number, "reason": string }.
                
                Places: ${JSON.stringify(placesPayload)}
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const scores = JSON.parse(jsonMatch[0]);
                // Map scores back to places
                return places.map((p, index) => {
                    const scoreData = scores[index] || scores[String(index)];
                    return {
                        ...p,
                        vibeScore: scoreData?.score || 50,
                        geminiReasoning: scoreData?.reason || "AI Analysis"
                    };
                });
            }
            return places;
        } catch (error) {
            console.error('Gemini Rate Error:', error);
            return places; // Fallback to original
        }
    }
};
