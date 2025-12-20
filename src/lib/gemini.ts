import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateItinerary(destination: string, days: number, startDate: string) {
  try {
    // UPDATED: Using 'gemini-1.5-flash' for speed and cost efficiency
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" } // Force JSON response
    });

    const prompt = `
      I am planning a trip to ${destination} for ${days} days starting on ${startDate}.
      Create a detailed daily itinerary with 2 activities per day (Morning and Evening).
      
      The structure must be an ARRAY of objects, where each object represents a day and contains an 'activities' array.
      
      Example JSON format:
      [
        {
          "day_index": 0,
          "activities": [
            {
              "name": "Eiffel Tower Visit",
              "description": "Visit the iconic landmark and see the city views.",
              "time_slot": "Morning",
              "category": "Sightseeing",
              "location_name": "Champ de Mars, Paris"
            },
            {
              "name": "Seine River Cruise",
              "description": "Enjoy a relaxing dinner cruise.",
              "time_slot": "Evening",
              "category": "Food",
              "location_name": "Port de la Bourdonnais"
            }
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null; // Signals the API route to use the fallback data
  }
}