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
  preferences: any = {}
): Promise<any> => {
  if (!API_KEY) {
    console.error("Gemini API key is missing");
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  // Format preferences for the prompt
  let preferencesStr = "";
  if (Array.isArray(preferences)) {
    preferencesStr = preferences.join(", ");
  } else if (typeof preferences === 'object') {
    const parts = [];
    if (preferences.foodVariety) parts.push(`Food Variety: ${preferences.foodVariety}`);
    if (preferences.dietary?.length) parts.push(`Dietary: ${preferences.dietary.join(", ")}`);
    if (preferences.cuisines?.length) parts.push(`Cuisines: ${preferences.cuisines.join(", ")}`);
    if (preferences.startTime) parts.push(`Start Time: ${preferences.startTime}`);
    if (preferences.endTime) parts.push(`End Time: ${preferences.endTime}`);
    if (preferences.returnToStart) parts.push(`Return to Start: Yes`);
    preferencesStr = parts.join("; ");
  }

  const prompt = `
    Create a detailed ${days}-day itinerary for a trip to ${destination}.
    Preferences: ${preferencesStr}.
    
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
    return null;
  }
};

export async function getPlaceVibeCheck(
  placeName: string,
  locationContext?: string
): Promise<{ summary: string; tags: string[]; isTouristTrap: boolean } | null> {
  if (!API_KEY) return null;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Analyze the vibe of "${placeName}" ${locationContext ? `in ${locationContext}` : ''}.
    Return a STRICT JSON object with these keys:
    - summary: Max 15 words "Real Talk" description (e.g., "Chaotic but authentic.").
    - tags: Array of strings (e.g., ["#HiddenGem", "#TouristTrap"]).
    - isTouristTrap: Boolean (true if it's a known tourist trap).
    
    Do not use markdown formatting. Just raw JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error(`Error generating vibe check for ${placeName}:`, error);
    return null;
  }
}
