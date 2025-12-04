import { GoogleGenerativeAI } from "@google/generative-ai";
import { Place } from '@/types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY!);

export const getDestinationSuggestions = async (
    preferences: any
): Promise<any[]> => {
    if (!API_KEY) {
        console.error("Gemini API key is missing");
        return [];
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Suggest 5 travel destinations based on these preferences:
    - Budget: ${preferences.budget}
    - Climate: ${preferences.climate}
    - Interests: ${preferences.interests?.join(", ") || 'general'}
    - Duration: ${preferences.duration} days
    
    Return ONLY a JSON array with objects containing:
    - name: string
    - description: string (2 sentences max)
    - estimatedCost: number (in USD)
    - bestTime: string
    - coordinates: { lat: number, lng: number }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating suggestions:", error);
        return [];
    }
};

export const generateMultiDayItinerary = async (
    destination: string,
    days: number,
    preferences: string[] = []
): Promise<any> => {
    if (!API_KEY) {
        console.error("Gemini API key is missing");
        return null;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
    Create a detailed ${days}-day itinerary for a trip to ${destination}.
    Preferences: ${preferences.join(", ")}.
    
    For EACH day, provide a structured plan with:
    - Theme/Title of the day
    - Morning activity (specific place name, description)
    - Afternoon activity (specific place name, description)
    - Evening activity (specific place name, description)
    - Dining suggestion (lunch/dinner)
    
    Return ONLY a valid JSON object with this structure:
    {
      "days": [
        {
          "day": 1,
          "theme": "string",
          "morning": { "place": "string", "description": "string" },
          "afternoon": { "place": "string", "description": "string" },
          "evening": { "place": "string", "description": "string" },
          "dining": { "place": "string", "description": "string" }
        }
      ]
    }
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating itinerary:", error);
        return null;
    }
};
