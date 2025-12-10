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
    }
};
